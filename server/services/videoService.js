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
const POLL_FETCH_TIMEOUT  = 30000;  // 30s per poll
const CREATE_FETCH_TIMEOUT = 60000; // 60s for create task

// ── Credit pricing (per-second, with 30% margin) ──────────────────────────────
const PER_SEC_RATES = { '480p': 3.15, '720p': 6.75, '1080p': 15 };

/**
 * Dynamic credit cost for any resolution × duration × audio combination.
 * @param {string}  resolution  '480p' | '720p' | '1080p'
 * @param {number}  duration    4–12 seconds
 * @param {boolean} audio       whether generate_audio is enabled
 */
function getCreditCost(resolution, duration, audio = false) {
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
  'seedance-1-5-pro': {
    apiModelId:   'doubao-seedance-1-5-pro-251215',
    name:         'Seedance 1.5 Pro',
    comingSoon:   false,
    minDuration:  4,
    maxDuration:  12,
  },
  'seedance-2-0-pro': {
    apiModelId:   'doubao-seedance-2-0-pro',  // placeholder
    name:         'Seedance 2.0 Pro',
    comingSoon:   true,
    minDuration:  4,
    maxDuration:  12,
  },
};

/**
 * Generate a video using the Volcano Ark API.
 *
 * @param {object}  opts
 * @param {string}  opts.prompt
 * @param {string}  opts.modelKey       — 'seedance-1-5-pro'
 * @param {number}  opts.duration       — 4–12 seconds
 * @param {string}  opts.resolution     — '480p' | '720p' | '1080p'
 * @param {string}  opts.ratio          — '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | 'adaptive'
 * @param {boolean} opts.generateAudio  — whether to generate audio
 * @param {string}  [opts.firstFrameUrl]  — public URL of first-frame reference image
 * @param {string}  [opts.lastFrameUrl]   — public URL of last-frame reference image
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
}) {
  const { apiKey, baseUrl } = config.services.seedance;

  if (!apiKey) throw new Error('SEEDANCE_API_KEY not configured');

  const model = MODELS[modelKey];
  if (!model) throw new Error(`Unknown video model key: ${modelKey}`);
  if (model.comingSoon) throw new Error(`${model.name} is not yet available via API`);

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

  const body = {
    model:          model.apiModelId,
    content,
    ratio:          effectiveRatio,
    resolution,
    duration:       Number(duration),
    generate_audio: Boolean(generateAudio),
    watermark:      false,
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
