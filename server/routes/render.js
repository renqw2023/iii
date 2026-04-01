/**
 * Dynamic rendering route — Bot-only meta SSR
 *
 * When a search engine crawler hits /gallery/:id, /explore/:id, or /seedance/:id,
 * this middleware queries MongoDB and returns a fully-formed HTML page with:
 *   - <title>, <meta description>, <link rel="canonical">
 *   - Open Graph + Twitter Card tags
 *   - JSON-LD structured data (ImageObject or VideoObject)
 *   - BreadcrumbList JSON-LD
 *   - Basic visible text content for crawlers
 *
 * Regular browsers receive next() → React SPA is served as normal.
 *
 * Results are cached in-process with a 1-hour TTL.
 */

const express = require('express');
const router = express.Router();
const GalleryPrompt = require('../models/GalleryPrompt');
const SrefStyle = require('../models/SrefStyle');
const SeedancePrompt = require('../models/SeedancePrompt');

const BASE_URL = 'https://iii.pics';

// ─── In-process LRU-like TTL cache ──────────────────────────────────────────
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const _cache = new Map(); // key → { html, ts }

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.html;
}

function cacheSet(key, html) {
  // Evict oldest entries if cache grows too large
  if (_cache.size > 2000) {
    const oldest = [..._cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) _cache.delete(oldest[0]);
  }
  _cache.set(key, { html, ts: Date.now() });
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml({ type, id, title, description, image, canonicalUrl, jsonLd, breadcrumbLd, extraMeta = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — III.PICS</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonicalUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonicalUrl)}">
<meta property="og:site_name" content="III.PICS">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}
${extraMeta}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
</head>
<body>
<nav><a href="${BASE_URL}">III.PICS</a> &rsaquo; <a href="${BASE_URL}/${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</a></nav>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
${image ? `<img src="${esc(image)}" alt="${esc(title)}" style="max-width:600px">` : ''}
<p><a href="${esc(canonicalUrl)}">View on III.PICS &rarr;</a></p>
</body>
</html>`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/gallery/:id', async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `gallery:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.set('Content-Type', 'text/html').send(cached);

  try {
    const item = await GalleryPrompt.findOne({ _id: id, isActive: true })
      .select('title prompt description previewImage tags sourceAuthor createdAt')
      .lean();
    if (!item) return next();

    const title = item.title || item.prompt?.substring(0, 60) || 'AI Image Prompt';
    const description = item.description || item.prompt?.substring(0, 155) || 'AI-generated image prompt on III.PICS Gallery.';
    const canonicalUrl = `${BASE_URL}/gallery/${id}`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: title,
      description,
      contentUrl: item.previewImage || '',
      url: canonicalUrl,
      keywords: item.tags?.join(', ') || '',
      creator: { '@type': 'Organization', name: 'III.PICS' },
    };

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Gallery', item: `${BASE_URL}/gallery` },
        { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
      ],
    };

    const html = buildHtml({
      type: 'gallery', id, title, description,
      image: item.previewImage,
      canonicalUrl, jsonLd, breadcrumbLd,
      extraMeta: '<meta property="og:type" content="article">',
    });

    cacheSet(cacheKey, html);
    res.set('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('[render] gallery error:', err.message);
    next();
  }
});

router.get('/explore/:id', async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `explore:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.set('Content-Type', 'text/html').send(cached);

  try {
    const item = await SrefStyle.findOne({ _id: id, isActive: true })
      .select('srefCode title description previewImage tags images createdAt')
      .lean();
    if (!item) return next();

    const title = `--sref ${item.srefCode}${item.title ? ' — ' + item.title : ''}`;
    const description = item.description || `Midjourney --sref ${item.srefCode} style reference. Explore visual previews and discover your perfect AI art style.`;
    const canonicalUrl = `${BASE_URL}/explore/${id}`;
    const image = item.previewImage ? (item.previewImage.startsWith('http') ? item.previewImage : `${BASE_URL}${item.previewImage}`) : '';

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: title,
      description,
      contentUrl: image,
      url: canonicalUrl,
      keywords: item.tags?.join(', ') || '',
      creator: { '@type': 'Organization', name: 'III.PICS' },
    };

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Explore', item: `${BASE_URL}/explore` },
        { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
      ],
    };

    const html = buildHtml({
      type: 'explore', id, title, description,
      image,
      canonicalUrl, jsonLd, breadcrumbLd,
      extraMeta: '<meta property="og:type" content="article">',
    });

    cacheSet(cacheKey, html);
    res.set('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('[render] explore error:', err.message);
    next();
  }
});

router.get('/seedance/:id', async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `seedance:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.set('Content-Type', 'text/html').send(cached);

  try {
    const item = await SeedancePrompt.findOne({ _id: id, isActive: true })
      .select('title prompt description videoUrl localVideoPath storageType thumbnailUrl previewImage tags category createdAt')
      .lean();
    if (!item) return next();

    const title = item.title || item.prompt?.substring(0, 60) || 'AI Video';
    const description = item.description || item.prompt?.substring(0, 155) || 'AI-generated video on III.PICS Seedance.';
    const canonicalUrl = `${BASE_URL}/seedance/${id}`;
    const image = item.thumbnailUrl || item.previewImage || '';

    // 优先使用本地存储 URL（对 Google 爬虫公开可访问）
    // Twitter/X video URLs (twimg.com) 需要 Cookie，Google 爬虫无法访问
    let publicVideoUrl = '';
    if (item.storageType === 'local' && item.localVideoPath) {
      publicVideoUrl = `https://iii.pics/v/${item.localVideoPath}`;
    } else if (item.storageType === 'r2' && item.videoUrl && item.videoUrl.startsWith('http')) {
      publicVideoUrl = item.videoUrl;
    } else if (item.videoUrl && !item.videoUrl.includes('twimg.com')) {
      publicVideoUrl = item.videoUrl;
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: title,
      description,
      thumbnailUrl: image,
      uploadDate: item.createdAt,
      ...(publicVideoUrl ? { contentUrl: publicVideoUrl } : {}),
      embedUrl: canonicalUrl,
      url: canonicalUrl,
    };

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Seedance', item: `${BASE_URL}/seedance` },
        { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
      ],
    };

    const html = buildHtml({
      type: 'seedance', id, title, description,
      image,
      canonicalUrl, jsonLd, breadcrumbLd,
      extraMeta: '<meta property="og:type" content="video.other">',
    });

    cacheSet(cacheKey, html);
    res.set('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('[render] seedance error:', err.message);
    next();
  }
});

module.exports = router;
