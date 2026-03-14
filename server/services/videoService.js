/**
 * videoService.js — ByteDance Volcano Ark / Seedance 2.0
 *
 * API flow:
 *   POST /api/v3/contents/generations/tasks  → { id: "task_xxx" }
 *   GET  /api/v3/contents/generations/tasks/{id} → { status, content: [{ url }] }
 *   Poll every 3 s, timeout 120 s
 */
const config = require('../config');

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 120000;

/**
 * Generate a video using ByteDance Seedance 2.0 API.
 *
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {5|10}   opts.duration     – seconds (default 5)
 * @param {"720p"|"1080p"} opts.resolution (default "720p")
 * @param {"16:9"|"9:16"|"1:1"} opts.aspectRatio (default "16:9")
 * @returns {Promise<{ videoUrl: string, taskId: string }>}
 */
async function generateVideo({ prompt, duration = 5, resolution = '720p', aspectRatio = '16:9' }) {
  const { apiKey, baseUrl, modelId } = config.services.seedance;

  if (!apiKey) {
    throw new Error('SEEDANCE_API_KEY not configured');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // ── Create task ──────────────────────────────────────────
  const createRes = await fetch(`${baseUrl}/contents/generations/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelId,
      content: [{ type: 'text', text: prompt }],
      parameters: {
        duration: Number(duration),
        resolution,
        aspect_ratio: aspectRatio,
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!createRes.ok) {
    const body = await createRes.json().catch(() => ({}));
    throw new Error(`Seedance create task failed [${createRes.status}]: ${body?.error?.message || JSON.stringify(body)}`);
  }

  const { id: taskId } = await createRes.json();
  if (!taskId) throw new Error('Seedance did not return task ID');

  // ── Poll until done ──────────────────────────────────────
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    const pollRes = await fetch(`${baseUrl}/contents/generations/tasks/${taskId}`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!pollRes.ok) {
      const body = await pollRes.json().catch(() => ({}));
      throw new Error(`Seedance poll failed [${pollRes.status}]: ${body?.error?.message || JSON.stringify(body)}`);
    }

    const data = await pollRes.json();
    const status = data.status;   // 'queued' | 'running' | 'succeeded' | 'failed'

    if (status === 'succeeded') {
      // content array: [{ type: 'video', url: '...' }]
      const videoContent = data.content?.find(c => c.type === 'video' || c.url);
      const videoUrl = videoContent?.url || data.video_url;
      if (!videoUrl) throw new Error('Seedance succeeded but no video URL in response');
      return { videoUrl, taskId };
    }

    if (status === 'failed') {
      const msg = data.error?.message || data.message || 'Unknown error';
      throw new Error(`Seedance video generation failed: ${msg}`);
    }

    // still queued / running — keep polling
  }

  throw new Error('Seedance video generation timed out after 120 seconds');
}

module.exports = { generateVideo };
