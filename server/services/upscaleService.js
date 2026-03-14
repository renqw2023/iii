const fs = require('fs');
const config = require('../config');

/**
 * Upscale an image using Replicate Real-ESRGAN 2x
 * Reads the local file as a Blob so Replicate can receive it directly.
 *
 * @param {string} localFilePath - Absolute path to the image on disk
 * @param {number} scale - Upscale factor (default: 2)
 * @returns {Promise<string>} - Public CDN URL of the upscaled image
 */
async function upscaleImage(localFilePath, scale = 2) {
  const apiKey = config.services.replicate.apiKey;
  if (!apiKey) throw new Error('REPLICATE_API_KEY not configured');

  const Replicate = require('replicate');
  const replicate = new Replicate({ auth: apiKey });

  const fileBuffer = fs.readFileSync(localFilePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const output = await replicate.run(
    'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
    { input: { image: blob, scale, face_enhance: false } }
  );

  console.log('[upscaleService] raw output type:', typeof output, Array.isArray(output) ? `array[${output.length}]` : '', output);

  // Replicate SDK v1.x may return: string, URL object, array of strings/URLs, or ReadableStream
  let url;
  if (typeof output === 'string') {
    url = output;
  } else if (output instanceof URL) {
    url = output.href;
  } else if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    url = first instanceof URL ? first.href : String(first);
  } else if (output && typeof output.href === 'string') {
    // URL-like object
    url = output.href;
  } else if (output && typeof output.toString === 'function') {
    url = output.toString();
  }

  if (!url || url === '[object Object]') {
    throw new Error(`Unexpected output from Replicate: ${JSON.stringify(output)}`);
  }

  console.log('[upscaleService] upscaled URL:', url);
  return url;
}

module.exports = { upscaleImage };
