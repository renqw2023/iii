/**
 * videoService.js — ByteDance Volcano Ark / Seedance
 *
 * Official API (doubao-seedance-1-5-pro-251215):
 *   POST /api/v3/contents/generations/tasks
 *     Body: { model, content, ratio, resolution, duration, generate_audio, watermark }
 *     → { id: "cgt-xxx", status: "queued" }
 *
 *   GET /api/v3/contents/generations/tasks/{id}
 *     → { id, status: "queued"|"running"|"succeeded"|"failed", content: { video_url } }
 *
 * Input modes (content array):
 *   Text-to-video:         [{ type:'text', text:prompt }]
 *   First-frame i2v:       [{ type:'text', text:prompt }, { type:'image_url', image_url:{ url } }]
 *   First+Last-frame i2v:  [{ type:'text', text:prompt }, { type:'image_url',...first }, { type:'image_url',...last }]
 *
 * Credit pricing (30% margin, 1 credit ≈ ¥0.0674 CNY):
 *   Per-second rates:  480p = 3.15 cr/s,  720p = 6.75 cr/s,  1080p = 15 cr/s
 *   Audio surcharge:   +30%
 *   Formula: Math.round(rate * duration * (audio ? 1.3 : 1))
 *
 * Source: https://www.volcengine.com/docs/82379/1366799
 */
const config = require('../config');

const POLL_INTERVAL_MS   = 3000;
const TIMEOUT_MS         = 360000;  // 6 min total
const POLL_FETCH_TIMEOUT  = 60000;  // 60s per poll
const CREATE_FETCH_TIMEOUT = 60000; // 60s for create task

// ── Credit pricing (per-second, with 30% margin) ──────────────────────────────
const PER_SEC_RATES = { '480p': 3.15, '720p': 6.75, '1080p': 15 };

// Wan2.7 video per-second rates (DashScope official price + ~35% margin, 1cr=$0.00909=¥0.066)
// 720p: ¥0.6/s → 9.1cr/s cost → 13cr/s charged
// 1080p: ¥1/s → 15.2cr/s cost → 22cr/s charged
const WAN_VIDEO_RATES = {
  '480p': 13,   // No 480p pricing listed; use 720p rate as fallback
  '720p': 13,
  '1080p': 22,
};

// Veo 3.1 per-second rates (Google official price + ~30% margin, 1cr=$0.00909)
// Veo 3.1/Fast: 720p = 1080p (Google charges the same for both)
// Veo 3.1 Lite: 720p ≠ 1080p (different Google pricing tiers)
// Source: https://cloud.google.com/vertex-ai/generative-ai/pricing#veo
const VEO_RATES = {
  'veo-3-1':      { noAudio: 30, audio: 58 },          // $0.20/s → 30cr | $0.40/s → 58cr
  'veo-3-1-fast': { noAudio: 15, audio: 22 },          // $0.10/s → 15cr | $0.15/s → 22cr
  'veo-3-1-lite': {                                     // 720p/1080p differ:
    '720p':  { noAudio: 5,  audio: 8  },               //   $0.03/s → 5cr | $0.05/s → 8cr
    '1080p': { noAudio: 8,  audio: 13 },               //   $0.05/s → 8cr | $0.08/s → 13cr
  },
};

/**
 * Dynamic credit cost.
 * - Wan2.7 models: fixed flat cost per generation (model.creditFlat)
 * - Veo 3.1 models: per-second with optional audio surcharge
 * - Seedance models: per-second (PER_SEC_RATES), +30% for audio
 */
function getCreditCost(resolution, duration, audio = false, modelKey = null) {
  if (modelKey) {
    const m = MODELS[modelKey];
    // Wan2.7: per-second billing (720p ¥0.6/s → 13cr/s, 1080p ¥1/s → 22cr/s)
    if (m?.provider === 'dashscope') {
      const rate = WAN_VIDEO_RATES[resolution] ?? WAN_VIDEO_RATES['720p'];
      return Math.round(rate * Number(duration));
    }
    // Veo 3.1 / Fast: flat rate regardless of resolution (Google charges same for 720p & 1080p)
    // Veo 3.1 Lite: per-resolution pricing (different Google tiers)
    if (VEO_RATES[modelKey]) {
      const rates = VEO_RATES[modelKey];
      const tier = rates['720p'] ? (rates[resolution] ?? rates['720p']) : rates; // Lite has sub-keys
      const rate = audio ? tier.audio : tier.noAudio;
      return Math.round(rate * Number(duration));
    }
  }
  // Default: Seedance per-second with 30% audio surcharge
  const rate = PER_SEC_RATES[resolution] ?? 15;
  const base = Math.round(rate * Number(duration));
  return audio ? Math.round(base * 1.3) : base;
}

// Keep CREDIT_COST_MAP for backward compat (existing imports)
const CREDIT_COST_MAP = {
  '480p-5':   getCreditCost('480p',  5),
  '480p-10':  getCreditCost('480p',  10),
  '720p-5':   getCreditCost('720p',  5),
  '720p-10':  getCreditCost('720p',  10),
  '1080p-5':  getCreditCost('1080p', 5),
  '1080p-10': getCreditCost('1080p', 10),
};

// ── Supported models ──────────────────────────────────────────────────────────
const MODELS = {
  // ── ByteDance Seedance (Volcano Ark) ──────────────────────────────────────
  'seedance-1-5-pro': {
    apiModelId:  'doubao-seedance-1-5-pro-251215',
    name:        'Seedance 1.5 Pro',
    provider:    'seedance',
    comingSoon:  false,
    minDuration: 4, maxDuration: 12,
  },
  'seedance-2-0-pro': {
    apiModelId:  'doubao-seedance-2-0-pro',
    name:        'Seedance 2.0 Pro',
    provider:    'seedance',
    comingSoon:  true,
    minDuration: 4, maxDuration: 12,
  },
  // ── Alibaba DashScope Wan2.7 Video ────────────────────────────────────────
  // creditFlat: fixed credits per generation (regardless of duration)
  // Pricing est: t2v ~$0.069, i2v ~$0.093, r2v/edit ~$0.138 (per generation ~5s)
  // Wan2.7 video: per-second billing (720p ¥0.6/s → 13cr/s, 1080p ¥1/s → 22cr/s)
  'wan2-7-t2v': {
    apiModelId:  'wan2.7-t2v',
    name:        'Wan 2.7 · Text to Video',
    provider:    'dashscope',
    comingSoon:  false,
    minDuration: 3, maxDuration: 8,
  },
  'wan2-7-i2v': {
    apiModelId:  'wan2.7-i2v',
    name:        'Wan 2.7 · Image to Video',
    provider:    'dashscope',
    comingSoon:  false,
    minDuration: 3, maxDuration: 8,
  },
  'wan2-7-r2v': {
    apiModelId:  'wan2.7-r2v',
    name:        'Wan 2.7 · Reference Video',
    provider:    'dashscope',
    comingSoon:  false,
    minDuration: 3, maxDuration: 8,
  },
  'wan2-7-videoedit': {
    apiModelId:  'wan2.7-videoedit',
    name:        'Wan 2.7 · Video Edit',
    provider:    'dashscope',
    comingSoon:  false,
    minDuration: 3, maxDuration: 8,
  },
  // ── Google Vertex AI Veo 3.1 ──────────────────────────────────────────────
  // Per-second pricing. Veo 3.1: $0.20/s no-audio, $0.40/s audio (720p/1080p)
  // Veo 3.1 Fast: $0.10/s no-audio, $0.15/s audio
  'veo-3-1': {
    apiModelId:  'veo-3.1-generate-001',
    name:        'Veo 3.1',
    provider:    'vertexai',
    comingSoon:  false,
    minDuration: 4, maxDuration: 8,
  },
  'veo-3-1-fast': {
    apiModelId:  'veo-3.1-fast-generate-001',
    name:        'Veo 3.1 Fast',
    provider:    'vertexai',
    comingSoon:  false,
    minDuration: 4, maxDuration: 8,
  },
  // Veo 3.1 Lite: cheapest Veo option, 720p/1080p have different Google pricing
  'veo-3-1-lite': {
    apiModelId:  'veo-3.1-lite-generate-001',
    name:        'Veo 3.1 Lite',
    provider:    'vertexai',
    comingSoon:  false,
    minDuration: 4, maxDuration: 8,
  },
};

/**
 * Generate a video using the DashScope Wan2.7 API.
 * Async task: POST (create) → GET poll until SUCCEEDED.
 */
async function generateWanVideo({ prompt, modelKey, duration, resolution, imgUrl, videoUrl }) {
  const DSKEY = process.env.DASHSCOPE_API_KEY;
  if (!DSKEY) throw new Error('DASHSCOPE_API_KEY not configured');

  const model = MODELS[modelKey];
  const sizeMap = { '720p': '720P', '1080p': '1080P', '480p': '480P' };

  // videoedit does not use duration (editing existing video length)
  const isEdit = modelKey === 'wan2-7-videoedit';

  const body = {
    model: model.apiModelId,
    input: {
      prompt,
      ...(imgUrl    ? { img_url:   imgUrl   } : {}),
      ...(videoUrl  ? { video_url: videoUrl } : {}),
    },
    parameters: {
      resolution: sizeMap[resolution] || '1280*720',
      ...(!isEdit ? { duration: Number(duration) } : {}),
    },
  };

  const createRes = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DSKEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    }
  );
  if (!createRes.ok) {
    const e = await createRes.json().catch(() => ({}));
    throw new Error(`Wan2.7 video create failed [${createRes.status}]: ${e.message || JSON.stringify(e)}`);
  }
  const createData = await createRes.json();
  const taskId = createData.output?.task_id;
  if (!taskId) throw new Error('Wan2.7 video API did not return task_id');

  // Poll until SUCCEEDED (6min timeout, 4s interval)
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4000));
    const pollRes = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      { headers: { 'Authorization': `Bearer ${DSKEY}` }, signal: AbortSignal.timeout(POLL_FETCH_TIMEOUT) }
    );
    const data   = await pollRes.json();
    const status = data.output?.task_status;
    if (status === 'SUCCEEDED') {
      const videoUrl = data.output?.video_url;
      if (!videoUrl) throw new Error('Wan2.7 succeeded but no video_url in response');
      return { videoUrl, taskId };
    }
    if (status === 'FAILED') {
      throw new Error(`Wan2.7 video generation failed: ${data.output?.message || 'unknown error'}`);
    }
    // PENDING / RUNNING → keep polling
  }
  throw new Error('Wan2.7 video generation timed out after 6 minutes');
}

/**
 * Generate a video. Dispatches to the correct provider based on model.provider.
 *
 * @param {object}  opts
 * @param {string}  opts.prompt
 * @param {string}  opts.modelKey       — e.g. 'seedance-1-5-pro' | 'wan2-7-t2v' | 'veo-3-1'
 * @param {number}  opts.duration       — seconds
 * @param {string}  opts.resolution     — '480p' | '720p' | '1080p'
 * @param {string}  opts.ratio          — '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | 'adaptive'
 * @param {boolean} opts.generateAudio
 * @param {string}  [opts.firstFrameUrl]
 * @param {string}  [opts.lastFrameUrl]
 * @returns {Promise<{ videoUrl: string, taskId: string }>}
 */
async function generateVideo({
  prompt,
  modelKey      = 'seedance-1-5-pro',
  duration      = 5,
  resolution    = '720p',
  ratio         = '16:9',
  generateAudio = false,
  firstFrameUrl = null,
  lastFrameUrl  = null,
  videoUrl      = null,
}) {
  const model = MODELS[modelKey];
  if (!model) throw new Error(`Unknown video model key: ${modelKey}`);
  if (model.comingSoon) throw new Error(`${model.name} is not yet available via API`);

  // ── DashScope (Wan2.7) ──
  if (model.provider === 'dashscope') {
    return generateWanVideo({ prompt, modelKey, duration, resolution, imgUrl: firstFrameUrl, videoUrl });
  }

  // ── Vertex AI (Veo 3.1) ──
  if (model.provider === 'vertexai') {
    const { generateVeoVideo } = require('./veoService');
    return generateVeoVideo({ prompt, modelKey, duration, resolution, generateAudio, firstFrameUrl });
  }

  // ── ByteDance Seedance (Volcano Ark) — default ──
  const { apiKey, baseUrl } = config.services.seedance;
  if (!apiKey) throw new Error('SEEDANCE_API_KEY not configured');

  const headers = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // ── Build content array based on mode ────────────────────────────────────
  const content = [{ type: 'text', text: prompt }];
  if (firstFrameUrl) {
    content.push({ type: 'image_url', image_url: { url: firstFrameUrl } });
  }
  if (lastFrameUrl) {
    content.push({ type: 'image_url', image_url: { url: lastFrameUrl } });
  }

  // adaptive ratio is only valid for image-to-video modes
  const effectiveRatio = (ratio === 'adaptive' && !firstFrameUrl) ? '16:9' : ratio;

  // generate_audio is only supported in image-to-video modes (firstFrameUrl present).
  // Text-to-video silently ignores the parameter per Volcengine docs.
  const isI2V = !!firstFrameUrl;
  const body = {
    model:     model.apiModelId,
    content,
    ratio:     effectiveRatio,
    resolution,
    duration:  Number(duration),
    watermark: false,
    ...(isI2V ? { generate_audio: Boolean(generateAudio) } : {}),
  };

  // ── Create task ────────────────────────────────────────────────────────────
  const createRes = await fetch(`${baseUrl}/contents/generations/tasks`, {
    method: 'POST',
    headers,
    body:   JSON.stringify(body),
    signal: AbortSignal.timeout(CREATE_FETCH_TIMEOUT),
  });

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    throw new Error(
      `Seedance create task failed [${createRes.status}]: ${errBody?.error?.message || JSON.stringify(errBody)}`
    );
  }

  const { id: taskId } = await createRes.json();
  if (!taskId) throw new Error('Seedance API did not return a task ID');

  // ── Poll until done ────────────────────────────────────────────────────────
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    let pollRes;
    try {
      pollRes = await fetch(`${baseUrl}/contents/generations/tasks/${taskId}`, {
        headers,
        signal: AbortSignal.timeout(POLL_FETCH_TIMEOUT),
      });
    } catch (fetchErr) {
      console.warn(`[videoService] poll fetch error (will retry): ${fetchErr.message}`);
      continue;
    }

    if (!pollRes.ok) {
      const errBody = await pollRes.json().catch(() => ({}));
      throw new Error(
        `Seedance poll failed [${pollRes.status}]: ${errBody?.error?.message || JSON.stringify(errBody)}`
      );
    }

    const data   = await pollRes.json();
    const status = data.status;

    if (status === 'succeeded') {
      const videoUrl = data.content?.video_url;
      if (!videoUrl) throw new Error('Seedance succeeded but no video_url in response');
      return { videoUrl, taskId };
    }

    if (status === 'failed') {
      const msg = data.error?.message || data.message || 'Generation failed';
      throw new Error(`Seedance video generation failed: ${msg}`);
    }
    // queued / running → keep polling
  }

  throw new Error('Seedance video generation timed out after 6 minutes');
}

module.exports = { generateVideo, getCreditCost, MODELS, CREDIT_COST_MAP };
