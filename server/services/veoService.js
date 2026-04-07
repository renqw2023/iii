/**
 * veoService.js — Google Vertex AI Veo 3.1
 *
 * 官方定价 (2026-04):
 *   Veo 3.1         720p/1080p  no-audio: $0.20/s   with-audio: $0.40/s
 *   Veo 3.1 Fast    720p/1080p  no-audio: $0.10/s   with-audio: $0.15/s
 *
 * 积分定价 (1 cr = $0.00909, 目标 ~30% 利润率):
 *   Veo 3.1         no-audio: 30 cr/s   with-audio: 58 cr/s
 *   Veo 3.1 Fast    no-audio: 15 cr/s   with-audio: 22 cr/s
 *
 * 所需环境变量:
 *   VERTEX_AI_PROJECT_ID           — Google Cloud 项目 ID
 *   VERTEX_AI_LOCATION             — 区域 (default: us-central1)
 *   GOOGLE_APPLICATION_CREDENTIALS — service account JSON 文件路径
 *
 * API 流程:
 *   1. POST .../veo-3.1-generate-001:generateVideo → 返回 Long-Running Operation name
 *   2. GET  .../operations/{id} 轮询直到 done: true
 *   3. 从 response.generateVideoResponse.generatedSamples[0].video.uri 获取 GCS URI
 *   4. 通过 GCS JSON API 下载到本地 uploads/generated/ 目录
 *
 * 参考文档: https://cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate
 */
const { GoogleAuth } = require('google-auth-library');
const fs   = require('fs');
const path = require('path');

const VEO_MODELS = {
  'veo-3-1': {
    apiId:      'veo-3.1-generate-001',
    name:       'Veo 3.1',
    comingSoon: false,
  },
  'veo-3-1-fast': {
    apiId:      'veo-3.1-fast-generate-001',
    name:       'Veo 3.1 Fast',
    comingSoon: false,
  },
};

const POLL_INTERVAL_MS = 10000;  // 10s — Veo generation takes 1-3 min
const TIMEOUT_MS       = 600000; // 10 min total timeout

/**
 * Get a fresh Google Cloud OAuth2 access token.
 *
 * 支持两种认证方式（优先使用 JSON 字符串）：
 *   1. GOOGLE_SERVICE_ACCOUNT_JSON — 把服务账号 JSON 文件的内容粘贴为环境变量值（推荐生产环境）
 *   2. GOOGLE_APPLICATION_CREDENTIALS — 服务账号 JSON 文件的本地绝对路径（本地开发）
 */
async function getAccessToken() {
  const jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const auth = new GoogleAuth({
    ...(jsonStr ? { credentials: JSON.parse(jsonStr) } : {}),
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenData = await client.getAccessToken();
  return tokenData.token;
}

/**
 * Generate a video using Vertex AI Veo 3.1.
 *
 * @param {object}  opts
 * @param {string}  opts.prompt
 * @param {string}  opts.modelKey         — 'veo-3-1' | 'veo-3-1-fast'
 * @param {number}  opts.duration         — 4–8 seconds
 * @param {string}  opts.resolution       — '720p' | '1080p'
 * @param {boolean} opts.generateAudio
 * @param {string}  [opts.firstFrameUrl]  — image URL for i2v (optional)
 * @returns {Promise<{ videoUrl: string, taskId: string }>}
 */
async function generateVeoVideo({ prompt, modelKey, duration, resolution, generateAudio, firstFrameUrl }) {
  const veoModel = VEO_MODELS[modelKey];
  if (!veoModel) throw new Error(`Unknown Veo model: ${modelKey}`);
  if (veoModel.comingSoon) throw new Error(`${veoModel.name} is not yet available`);

  const projectId = process.env.VERTEX_AI_PROJECT_ID;
  const location  = process.env.VERTEX_AI_LOCATION || 'us-central1';
  if (!projectId) throw new Error('VERTEX_AI_PROJECT_ID not configured');

  // Veo supports 4, 5, 6, 7, 8 seconds
  const validDuration = Math.min(8, Math.max(4, Math.round(Number(duration))));
  const validResolution = resolution === '1080p' ? '1080p' : '720p';

  const token = await getAccessToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
  };

  // Build request body
  const instance = {
    prompt,
    // For image-to-video: pass the image URL (Vertex AI fetches it)
    ...(firstFrameUrl ? { image: { uri: firstFrameUrl } } : {}),
  };
  const parameters = {
    aspectRatio:     '16:9',
    durationSeconds: validDuration,
    addWatermark:    false,
    generateAudio:   Boolean(generateAudio),
    resolution:      validResolution,
  };

  const endpoint = [
    `https://${location}-aiplatform.googleapis.com/v1beta1`,
    `projects/${projectId}/locations/${location}`,
    `publishers/google/models/${veoModel.apiId}:generateVideo`,
  ].join('/');

  const createRes = await fetch(endpoint, {
    method: 'POST',
    headers,
    body:   JSON.stringify({ instances: [instance], parameters }),
    signal: AbortSignal.timeout(60000),
  });

  if (!createRes.ok) {
    const e = await createRes.json().catch(() => ({}));
    throw new Error(`Veo create failed [${createRes.status}]: ${e.error?.message || JSON.stringify(e)}`);
  }

  const operation = await createRes.json();
  const opName = operation.name;
  if (!opName) throw new Error('Veo API did not return an operation name');

  // Poll long-running operation
  const opEndpoint = `https://${location}-aiplatform.googleapis.com/v1beta1/${opName}`;
  const deadline   = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    // Refresh token before each poll (tokens expire in 1h, polling up to 10min)
    const freshToken = await getAccessToken();
    let pollRes;
    try {
      pollRes = await fetch(opEndpoint, {
        headers: { 'Authorization': `Bearer ${freshToken}` },
        signal:  AbortSignal.timeout(30000),
      });
    } catch (fetchErr) {
      console.warn(`[veoService] poll fetch error (will retry): ${fetchErr.message}`);
      continue;
    }

    const data = await pollRes.json();

    if (data.done) {
      if (data.error) throw new Error(`Veo operation failed: ${data.error.message}`);

      // Extract GCS URI from response
      const samples = data.response?.generateVideoResponse?.generatedSamples
                   || data.response?.generatedSamples
                   || [];
      const gcsUri = samples[0]?.video?.uri;
      if (!gcsUri) throw new Error('Veo succeeded but no video URI in response');

      // Download video from GCS via JSON API
      // gs://bucket/path/to/video.mp4 → storage.googleapis.com REST API
      const gcsPath = gcsUri.replace(/^gs:\/\//, '');
      const slashIdx = gcsPath.indexOf('/');
      const bucket = gcsPath.slice(0, slashIdx);
      const obj    = gcsPath.slice(slashIdx + 1);

      const dlToken = await getAccessToken();
      const gcsRes  = await fetch(
        `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(obj)}?alt=media`,
        { headers: { 'Authorization': `Bearer ${dlToken}` }, signal: AbortSignal.timeout(120000) }
      );
      if (!gcsRes.ok) throw new Error(`GCS download failed [${gcsRes.status}]: ${gcsUri}`);

      // Save to uploads/generated/
      const genDir   = path.join(__dirname, '../../uploads/generated');
      fs.mkdirSync(genDir, { recursive: true });
      const filename = `veo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp4`;
      const filePath = path.join(genDir, filename);
      fs.writeFileSync(filePath, Buffer.from(await gcsRes.arrayBuffer()));

      const serverBase = (process.env.SERVER_PUBLIC_URL || 'http://localhost:5500').replace(/\/$/, '');
      return { videoUrl: `${serverBase}/uploads/generated/${filename}`, taskId: opName };
    }
    // not done → keep polling
  }

  throw new Error('Veo video generation timed out after 10 minutes');
}

module.exports = { generateVeoVideo, VEO_MODELS };
