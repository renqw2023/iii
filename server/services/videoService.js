/**
 * videoService.js — ByteDance Volcano Ark / Seedance
 *
 * Official API (doubao-seedance-1-5-pro-251215):
 *   POST /api/v3/contents/generations/tasks
 *     Body: { model, content:[{type,text}], ratio, resolution, duration, generate_audio, watermark }
 *     → { id: "cgt-xxx", status: "queued" }
 *
 *   GET /api/v3/contents/generations/tasks/{id}
 *     → { id, status: "queued"|"running"|"succeeded"|"failed", content: { video_url } }
 *
 * Poll every 3s, timeout 120s
 *
 * Credit cost table (30% margin over API cost, base: 1080p/s = 15 credits):
 *   480p  5s  → 16 credits   (API cost: ¥0.80 → ¥1.04 w/ margin)
 *   480p  10s → 31 credits   (API cost: ¥1.60 → ¥2.08)
 *   720p  5s  → 34 credits   (API cost: ¥1.73 → ¥2.25)
 *   720p  10s → 67 credits   (API cost: ¥3.46 → ¥4.50)
 *   1080p 5s  → 75 credits   (API cost: ¥3.89 → ¥5.06)
 *   1080p 10s → 150 credits  (API cost: ¥7.78 → ¥10.11)
 *
 * Exchange rate: 1 credit ≈ ¥0.0674 CNY
 * Source: https://www.volcengine.com/docs/82379/1544106
 */
const config = require('../config');

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS       = 120000;

// ── Credit cost lookup ────────────────────────────────────────────────────────
// Key: `${resolution}-${duration}`
const CREDIT_COST_MAP = {
  '480p-5':   16,
  '480p-10':  31,
  '720p-5':   34,
  '720p-10':  67,
  '1080p-5':  75,
  '1080p-10': 150,
};

/**
 * Returns the credit cost for a given resolution + duration combination.
 * Falls back to 1080p-5 (75) if key not found.
 */
function getCreditCost(resolution, duration) {
  return CREDIT_COST_MAP[`${resolution}-${duration}`] ?? 75;
}

// ── Supported models ──────────────────────────────────────────────────────────
const MODELS = {
  // Seedance 1.5 Pro — currently active model
  'seedance-1-5-pro': {
    apiModelId: 'doubao-seedance-1-5-pro-251215',
    name:       'Seedance 1.5 Pro',
    comingSoon: false,
  },
  // Seedance 2.0 Pro — reserved placeholder (API not yet available)
  'seedance-2-0-pro': {
    apiModelId: 'doubao-seedance-2-0-pro',  // placeholder — not yet in API
    name:       'Seedance 2.0 Pro',
    comingSoon: true,
  },
};

/**
 * Generate a video using the Volcano Ark API.
 *
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} opts.modelKey    — internal key, e.g. 'seedance-1-5-pro'
 * @param {5|10}   opts.duration
 * @param {"480p"|"720p"|"1080p"} opts.resolution
 * @param {"16:9"|"9:16"|"1:1"}  opts.ratio
 * @returns {Promise<{ videoUrl: string, taskId: string }>}
 */
async function generateVideo({ prompt, modelKey = 'seedance-1-5-pro', duration = 5, resolution = '720p', ratio = '16:9' }) {
  const { apiKey, baseUrl } = config.services.seedance;

  if (!apiKey) throw new Error('SEEDANCE_API_KEY not configured');

  const model = MODELS[modelKey];
  if (!model) throw new Error(`Unknown video model key: ${modelKey}`);
  if (model.comingSoon) throw new Error(`${model.name} is not yet available via API`);

  const headers = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // ── Create task ────────────────────────────────────────────────────────────
  const body = {
    model:          model.apiModelId,
    content:        [{ type: 'text', text: prompt }],
    ratio,
    resolution,
    duration:       Number(duration),
    generate_audio: false,   // keep costs lower; upgrade to true if needed
    watermark:      false,
  };

  const createRes = await fetch(`${baseUrl}/contents/generations/tasks`, {
    method: 'POST',
    headers,
    body:   JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
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

    const pollRes = await fetch(`${baseUrl}/contents/generations/tasks/${taskId}`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!pollRes.ok) {
      const errBody = await pollRes.json().catch(() => ({}));
      throw new Error(
        `Seedance poll failed [${pollRes.status}]: ${errBody?.error?.message || JSON.stringify(errBody)}`
      );
    }

    const data   = await pollRes.json();
    const status = data.status; // queued | running | succeeded | failed

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

  throw new Error('Seedance video generation timed out after 120 seconds');
}

module.exports = { generateVideo, getCreditCost, MODELS, CREDIT_COST_MAP };
