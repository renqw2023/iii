/**
 * veoService.js — Google Vertex AI Veo 3.1
 *
 * 官方定价 (2026-04, source: https://cloud.google.com/vertex-ai/generative-ai/pricing#veo):
 *   Veo 3.1         720p/1080p  no-audio: $0.20/s   with-audio: $0.40/s
 *   Veo 3.1         4K          no-audio: $0.40/s   with-audio: $0.60/s
 *   Veo 3.1 Fast    720p/1080p  no-audio: $0.10/s   with-audio: $0.15/s
 *   Veo 3.1 Fast    4K          no-audio: $0.30/s   with-audio: $0.35/s
 *   Veo 3.1 Lite    720p        no-audio: $0.03/s   with-audio: $0.05/s
 *   Veo 3.1 Lite    1080p       no-audio: $0.05/s   with-audio: $0.08/s
 *
 * 注意: Veo 3.1 / Fast 的 720p 与 1080p 在 Google 定价中相同；
 *       Veo 3.1 Lite 720p 与 1080p 不同。
 *
 * 积分定价 (1 cr = $0.00909, 目标 ~30% 利润率):
 *   Veo 3.1         no-audio: 30 cr/s   with-audio: 58 cr/s
 *   Veo 3.1 Fast    no-audio: 15 cr/s   with-audio: 22 cr/s
 *   Veo 3.1 Lite    720p no-audio: 5 cr/s   720p audio: 8 cr/s
 *   Veo 3.1 Lite    1080p no-audio: 8 cr/s  1080p audio: 13 cr/s
 *
 * 所需环境变量:
 *   VERTEX_AI_PROJECT_ID           — Google Cloud 项目 ID
 *   VERTEX_AI_LOCATION             — 区域 (default: us-central1)
 *   GOOGLE_SERVICE_ACCOUNT_JSON    — 服务账号 JSON 字符串（推荐生产环境）
 *   GOOGLE_APPLICATION_CREDENTIALS — 服务账号 JSON 文件路径（本地开发）
 *
 * API 流程 (v1 + :predictLongRunning):
 *   1. POST .../models/{model}:predictLongRunning → 返回 Long-Running Operation name
 *   2. GET  .../operations/{id} 轮询直到 done: true
 *   3. 从 response.generateVideoResponse.generatedSamples[0].video.uri 获取 GCS URI
 *   4. 通过 GCS JSON API 下载到本地 uploads/generated/ 目录
 */
const { GoogleAuth } = require('google-auth-library');
const fs            = require('fs');
const path          = require('path');
const { execFile }  = require('child_process');

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
  'veo-3-1-lite': {
    apiId:      'veo-3.1-lite-generate-001',
    name:       'Veo 3.1 Lite',
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

  // Vertex AI Veo uses v1 + :predictLongRunning (not v1beta1 + :generateVideo)
  const endpoint = [
    `https://${location}-aiplatform.googleapis.com/v1`,
    `projects/${projectId}/locations/${location}`,
    `publishers/google/models/${veoModel.apiId}:predictLongRunning`,
  ].join('/');

  const requestBody = {
    instances:  [instance],
    parameters: { ...parameters, sampleCount: 1 },
  };

  console.log(`[veoService] POST ${endpoint}`);

  const createRes = await fetch(endpoint, {
    method: 'POST',
    headers,
    body:   JSON.stringify(requestBody),
    signal: AbortSignal.timeout(60000),
  });

  if (!createRes.ok) {
    const rawText = await createRes.text().catch(() => '');
    const e = (() => { try { return JSON.parse(rawText); } catch { return {}; } })();
    console.error(`[veoService] create failed ${createRes.status}:`, rawText.slice(0, 500));
    throw new Error(`Veo create failed [${createRes.status}]: ${e.error?.message || rawText.slice(0, 200) || 'unknown'}`);
  }

  const operation = await createRes.json();
  const opName = operation.name;
  if (!opName) throw new Error('Veo API did not return an operation name');

  console.log(`[veoService] operation started: ${opName}`);

  // predictLongRunning returns a PredictLongRunningOperation (UUID-based).
  // It CANNOT be polled via the standard /operations/{Long} GET endpoint.
  // Must use the paired :fetchPredictOperation POST method on the same model endpoint.
  // Docs: https://cloud.google.com/vertex-ai/docs/reference/rest/v1/projects.locations.publishers.models/fetchPredictOperation
  const fetchEndpoint = [
    `https://${location}-aiplatform.googleapis.com/v1`,
    `projects/${projectId}/locations/${location}`,
    `publishers/google/models/${veoModel.apiId}:fetchPredictOperation`,
  ].join('/');
  console.log(`[veoService] polling via fetchPredictOperation: ${fetchEndpoint}`);
  const deadline   = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    // Refresh token before each poll (tokens expire in 1h, polling up to 10min)
    const freshToken = await getAccessToken();
    let pollRes;
    try {
      // fetchPredictOperation: POST with operationName in body
      pollRes = await fetch(fetchEndpoint, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${freshToken}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ operationName: opName }),
        signal:  AbortSignal.timeout(30000),
      });
    } catch (fetchErr) {
      console.warn(`[veoService] poll fetch error (will retry): ${fetchErr.message}`);
      continue;
    }

    const rawPoll = await pollRes.text().catch(() => '{}');
    const data = (() => { try { return JSON.parse(rawPoll); } catch { return {}; } })();
    if (!pollRes.ok) {
      console.warn(`[veoService] poll ${pollRes.status}: ${rawPoll.slice(0, 300)}`);
      continue;
    }
    console.log(`[veoService] poll status: done=${data.done}`);

    if (data.done) {
      if (data.error) throw new Error(`Veo operation failed: ${JSON.stringify(data.error)}`);

      // Response structure (fetchPredictOperation):
      // data.response.videos[0].bytesBase64Encoded — video is embedded as base64, no GCS URI
      const videoB64 = data.response?.videos?.[0]?.bytesBase64Encoded;
      if (!videoB64) {
        throw new Error(`Veo succeeded but no video data. Response keys: ${Object.keys(data.response ?? {}).join(', ')}`);
      }

      // Decode base64 and save to uploads/generated/
      const genDir   = path.join(__dirname, '../../uploads/generated');
      fs.mkdirSync(genDir, { recursive: true });
      const filename = `veo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp4`;
      const filePath = path.join(genDir, filename);
      fs.writeFileSync(filePath, Buffer.from(videoB64, 'base64'));

      console.log(`[veoService] saved ${filename} (${(videoB64.length * 0.75 / 1024 / 1024).toFixed(1)} MB)`);

      // Move moov atom to front (faststart) so browsers can show duration & seek
      // Without this, Veo base64 videos show 0:00 and can't be seeked
      const fastFile = filePath.replace('.mp4', '_fs.mp4');
      await new Promise((resolve) => {
        execFile('ffmpeg', ['-i', filePath, '-c', 'copy', '-movflags', '+faststart', '-y', fastFile],
          (err) => {
            if (err) {
              console.warn('[veoService] ffmpeg faststart failed, using raw file:', err.message);
            } else {
              fs.renameSync(fastFile, filePath); // replace with faststart version
              console.log('[veoService] faststart applied');
            }
            resolve();
          }
        );
      });

      const serverBase = (process.env.SERVER_PUBLIC_URL || 'http://localhost:5500').replace(/\/$/, '');
      return { videoUrl: `${serverBase}/uploads/generated/${filename}`, taskId: opName };
    }
    // not done → keep polling
  }

  throw new Error('Veo video generation timed out after 10 minutes');
}

module.exports = { generateVeoVideo, VEO_MODELS };
