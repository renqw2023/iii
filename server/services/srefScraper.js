/**
 * Sref Scraper Service — Node.js port of scraper.py
 *
 * Crawls promptsref.com/discover pages, downloads media,
 * and upserts to SrefStyle collection.
 *
 * Usage: startCrawl(opts) / stopCrawl() / getCrawlStatus()
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const DataSyncLog = require('../models/DataSyncLog');
const SrefStyle = require('../models/SrefStyle');

const BASE_URL = 'https://promptsref.com';
const DISCOVER_URL = BASE_URL + '/discover?page={page}';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// Default min delay between page requests (ms)
const DEFAULT_DELAY_MS = 21000;
const DEFAULT_JITTER_MS = 3000;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 4;

// ─── Module-level crawl state ────────────────────────────────
let _crawlRunning = false;
let _stopFlag = false;
let _currentLogId = null;
let _currentProgress = {
  phase: 'idle',    // idle | discover | details | done | stopped | error
  currentPage: 0,
  totalPages: 0,
  processedDetails: 0,
  totalDetails: 0,
  newCount: 0,
  updatedCount: 0,
  errorCount: 0,
  lastDetailUrl: '',
  startedAt: null,
};

// ─── Helpers ─────────────────────────────────────────────────

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function jitter(baseMs, jitterMs) {
  return baseMs + Math.random() * jitterMs;
}

function sanitizeFolderName(name) {
  return name.replace(/[^0-9A-Za-z_\-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'unknown_sref';
}

function dedupe(arr) {
  return [...new Set(arr)];
}

// ─── Rate-limited Axios wrapper ───────────────────────────────

async function fetchWithRetry(url, opts = {}) {
  const { delayMs = DEFAULT_DELAY_MS, jitterMs = DEFAULT_JITTER_MS, timeout = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_MAX_RETRIES, cookie } = opts;
  const headers = {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  if (cookie) headers['Cookie'] = cookie;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (_stopFlag) throw new Error('stopped');
    try {
      const resp = await axios.get(url, { headers, timeout, responseType: opts.stream ? 'stream' : 'text' });
      // Rate-limit after successful fetch
      if (!opts.stream) await sleep(jitter(delayMs, jitterMs));
      return resp;
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 503) {
        const wait = Math.min(20 * attempt, 120) * 1000;
        await sleep(wait);
        continue;
      }
      if (attempt === maxRetries) throw err;
      await sleep(jitter(Math.min(8000 * attempt, 40000), 3000));
    }
  }
}

// ─── Parsing helpers ──────────────────────────────────────────

function parseDiscoverDetailUrls(html) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const result = [];
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (!href.startsWith('/srefcodedetail/')) return;
    const full = BASE_URL + href;
    if (seen.has(full)) return;
    seen.add(full);
    result.push(full);
  });
  return result;
}

function srefCodesFromUrl(detailUrl) {
  const raw = decodeURIComponent(detailUrl.split('/srefcodedetail/')[1] || '');
  return (raw.match(/\d+/g) || []);
}

function srefPhraseFromUrl(detailUrl) {
  const raw = decodeURIComponent(detailUrl.split('/srefcodedetail/')[1] || '');
  return raw.replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractLdjsonMedia(html) {
  const $ = cheerio.load(html);
  const images = [];
  const videos = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        if (typeof item.contentUrl === 'string' && item.contentUrl.includes('explore.promptsref.com')) {
          videos.push(item.contentUrl);
        }
        if (typeof item.thumbnailUrl === 'string' && item.thumbnailUrl.includes('explore.promptsref.com')) {
          images.push(item.thumbnailUrl);
        }
      }
    } catch (_) {}
  });
  return { images: dedupe(images), videos: dedupe(videos) };
}

function extractMainMedia(html, srefCodes, srefPhrase) {
  const $ = cheerio.load(html);
  const codePrefixes = srefCodes.map(c => `${c}-`);
  const phraseCompact = srefPhrase.replace(/\s/g, '');
  const imgs = [];
  const vids = [];

  $('img, source, video').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (!src || !src.includes('explore.promptsref.com/')) return;

    // Normalize CDN proxy URLs
    let normalized = src;
    if (src.includes('https://promptsref.com/cdn-cgi/image') && src.includes('/https://explore.promptsref.com/')) {
      normalized = 'https://explore.promptsref.com/' + src.split('/https://explore.promptsref.com/')[1];
    }

    const basename = normalized.split('/').pop();
    const name = decodeURIComponent(basename).toLowerCase();
    const nameCompact = name.replace(/\s/g, '');

    let matched = codePrefixes.some(p => basename.startsWith(p));
    if (!matched && srefPhrase && srefPhrase.length > 2 && name.includes(srefPhrase)) matched = true;
    if (!matched && phraseCompact.length > 2 && nameCompact.includes(phraseCompact)) matched = true;
    if (!matched && srefCodes.some(c => name.includes(c))) matched = true;

    if (!matched) return;

    if (name.includes('-video-') || el.name === 'video' || el.name === 'source') {
      vids.push(normalized);
    } else {
      imgs.push(normalized);
    }
  });

  return { images: dedupe(imgs), videos: dedupe(vids) };
}

function extractTags(html) {
  const $ = cheerio.load(html);
  const tags = [];
  const seen = new Set();
  const h1 = $('h1').first();
  const scope = h1.length ? h1.parent() : $('body');

  scope.find('a[href^="/style/"]').each((_, el) => {
    const text = $(el).text().replace(/^\s*#/, '').trim();
    if (text && !seen.has(text)) {
      seen.add(text);
      tags.push(text);
    }
  });
  return tags;
}

function parseDetailPage(detailUrl, html) {
  const $ = cheerio.load(html);
  const srefCodes = srefCodesFromUrl(detailUrl);
  const srefPhrase = srefPhraseFromUrl(detailUrl);

  const { images: ldImages, videos: ldVideos } = extractLdjsonMedia(html);
  const { images: pageImages, videos: pageVideos } = extractMainMedia(html, srefCodes, srefPhrase);

  const images = dedupe([...ldImages, ...pageImages]);
  const videos = dedupe([...ldVideos, ...pageVideos]);
  const tags = extractTags(html);

  const title = $('title').text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim() || '';

  return { detailUrl, srefCodes, srefPhrase, title, description, tags, images, videos };
}

// ─── Media download ───────────────────────────────────────────

function pickExtension(url, contentType) {
  const ext = path.extname(url.split('?')[0]).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov'].includes(ext)) return ext;
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('webm')) return '.webm';
  if (ct.includes('quicktime')) return '.mov';
  if (ct.includes('mp4') || ct.includes('video')) return '.mp4';
  if (ct.includes('png')) return '.png';
  if (ct.includes('webp')) return '.webp';
  if (ct.includes('gif')) return '.gif';
  return '.jpg';
}

async function downloadMedia(url, destBase, cookie) {
  if (_stopFlag) throw new Error('stopped');
  try {
    const headers = { 'User-Agent': USER_AGENT };
    if (cookie) headers['Cookie'] = cookie;
    const resp = await axios.get(url, { headers, timeout: DEFAULT_TIMEOUT_MS, responseType: 'stream' });
    const ext = pickExtension(url, resp.headers['content-type']);
    const dest = destBase + ext;
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return path.basename(dest);
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(dest);
      resp.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
      resp.data.on('error', reject);
    });
    return path.basename(dest);
  } catch (err) {
    console.warn(`[sref-scraper] download warn: ${url}: ${err.message}`);
    return null;
  }
}

// ─── DB upsert ────────────────────────────────────────────────

async function upsertSrefStyle(entry) {
  const { srefCodes, title, description, tags, savedImages, savedVideos } = entry;
  if (!srefCodes || srefCodes.length === 0) return null;

  const srefCode = srefCodes[0];
  const sourceId = srefCode;

  const doc = {
    srefCode,
    title: title.substring(0, 300),
    description: description.substring(0, 1000),
    tags,
    images: savedImages,
    videos: savedVideos,
    sourceId,
    isActive: true,
  };

  const result = await SrefStyle.findOneAndUpdate(
    { sourceId },
    { $set: doc },
    { upsert: true, new: true, rawResult: true }
  );
  return result.lastErrorObject?.updatedExisting ? 'updated' : 'new';
}

// ─── Main crawl function ──────────────────────────────────────

async function startCrawl(opts = {}) {
  if (_crawlRunning) {
    return { ok: false, message: 'Crawl already running' };
  }
  _crawlRunning = true;
  _stopFlag = false;

  const {
    startPage = 1,
    endPage = 34,
    delayMs = DEFAULT_DELAY_MS,
    jitterMs = DEFAULT_JITTER_MS,
    cookie = process.env.PROMPTSREF_COOKIE || '',
    noDownload = false,
    maxDetails = null,
    // Incremental mode: start from page 1, stop when a full page has no new codes
    incrementalMode = true,
    // How many consecutive all-known pages before stopping (default 1)
    stopAfterPages = 1,
  } = opts;

  const outputDir = process.env.SREF_OUTPUT_DIR
    || path.join(__dirname, '../../../output');

  // Create log entry
  const log = await DataSyncLog.create({
    source: 'sref',
    status: 'running',
    startedAt: new Date(),
    meta: { startPage, endPage, currentPage: startPage, totalPages: endPage - startPage + 1, incrementalMode },
  });
  _currentLogId = log._id;

  _currentProgress = {
    phase: 'discover',
    currentPage: startPage,
    totalPages: endPage - startPage + 1,
    processedDetails: 0,
    totalDetails: 0,
    newCount: 0,
    updatedCount: 0,
    errorCount: 0,
    lastDetailUrl: '',
    startedAt: new Date(),
    incrementalMode,
  };

  // Run in background
  _runCrawl({ startPage, endPage, delayMs, jitterMs, cookie, noDownload, maxDetails, outputDir, logId: log._id, incrementalMode, stopAfterPages })
    .catch(err => console.error('[sref-scraper] fatal:', err.message));

  return { ok: true, logId: log._id };
}

async function _runCrawl({ startPage, endPage, delayMs, jitterMs, cookie, noDownload, maxDetails, outputDir, logId, incrementalMode, stopAfterPages }) {
  const requestOpts = { delayMs, jitterMs, timeout: DEFAULT_TIMEOUT_MS, cookie };

  try {
    fs.mkdirSync(outputDir, { recursive: true });

    // ── Load known codes for incremental mode ──
    let knownCodes = new Set();
    if (incrementalMode) {
      const existingDocs = await SrefStyle.find({}).select('sourceId').lean();
      existingDocs.forEach(d => knownCodes.add(String(d.sourceId)));
      console.log(`[sref-scraper] incremental mode ON — ${knownCodes.size} known codes loaded`);
    }

    // ── Phase 1: Discover ──
    const detailUrls = [];
    const seen = new Set();
    let consecutiveAllKnownPages = 0;

    for (let page = startPage; page <= endPage; page++) {
      if (_stopFlag) { await _finalize(logId, 'stopped'); return; }
      _currentProgress.currentPage = page;

      const url = DISCOVER_URL.replace('{page}', page);
      console.log(`[sref-scraper] [discover] page=${page}/${endPage} ${url}`);
      try {
        const resp = await fetchWithRetry(url, requestOpts);
        const urls = parseDiscoverDetailUrls(resp.data);

        if (incrementalMode && urls.length > 0) {
          // Split into new vs already-known
          const newUrls = [];
          for (const u of urls) {
            const code = srefCodesFromUrl(u)[0];
            if (code && !knownCodes.has(code) && !seen.has(u)) {
              newUrls.push(u);
            }
          }
          const knownCount = urls.length - newUrls.length;
          console.log(`[sref-scraper] [discover] page=${page}: ${newUrls.length} new / ${knownCount} known`);

          for (const u of newUrls) {
            seen.add(u);
            detailUrls.push(u);
          }

          if (newUrls.length === 0) {
            consecutiveAllKnownPages++;
            if (consecutiveAllKnownPages >= stopAfterPages) {
              console.log(`[sref-scraper] [discover] incremental stop after ${consecutiveAllKnownPages} all-known page(s) at page ${page}`);
              break;
            }
          } else {
            consecutiveAllKnownPages = 0; // reset streak
          }
        } else {
          // Full mode: add all URLs
          console.log(`[sref-scraper] [discover] page=${page} found ${urls.length} detail links`);
          for (const u of urls) {
            if (!seen.has(u)) { seen.add(u); detailUrls.push(u); }
          }
        }
      } catch (err) {
        if (err.message === 'stopped') { await _finalize(logId, 'stopped'); return; }
        console.warn(`[sref-scraper] [discover] page=${page} failed: ${err.message}`);
      }

      await DataSyncLog.updateOne({ _id: logId }, { $set: { 'meta.currentPage': page, 'meta.discoverCount': detailUrls.length } });
    }

    const limitedUrls = maxDetails ? detailUrls.slice(0, maxDetails) : detailUrls;
    _currentProgress.phase = 'details';
    _currentProgress.totalDetails = limitedUrls.length;
    await DataSyncLog.updateOne({ _id: logId }, { $set: { 'meta.totalDetails': limitedUrls.length, 'meta.phase': 'details' } });
    console.log(`[sref-scraper] total unique detail URLs: ${limitedUrls.length}`);

    // Load previously processed URLs from meta
    const prevLog = await DataSyncLog.findOne({ source: 'sref', status: { $in: ['success', 'partial', 'stopped'] } })
      .sort({ completedAt: -1 }).lean();
    const processed = new Set(prevLog?.meta?.processedUrls || []);
    const processedUrls = new Set(processed);

    // ── Phase 2: Detail crawl ──
    let newCount = 0, updatedCount = 0, errorCount = 0;

    for (let i = 0; i < limitedUrls.length; i++) {
      if (_stopFlag) { await _finalize(logId, 'stopped', { newCount, updatedCount, errorCount, processedUrls }); return; }

      const detailUrl = limitedUrls[i];
      _currentProgress.processedDetails = i + 1;
      _currentProgress.lastDetailUrl = detailUrl;

      if (processedUrls.has(detailUrl)) {
        console.log(`[sref-scraper] [detail] skip (${i + 1}/${limitedUrls.length}) ${detailUrl}`);
        _currentProgress.skippedCount = (_currentProgress.skippedCount || 0) + 1;
        continue;
      }

      console.log(`[sref-scraper] [detail] (${i + 1}/${limitedUrls.length}) ${detailUrl}`);
      try {
        const resp = await fetchWithRetry(detailUrl, requestOpts);
        const entry = parseDetailPage(detailUrl, resp.data);

        // Download media
        const savedImages = [];
        const savedVideos = [];

        if (!noDownload && entry.srefCodes.length > 0) {
          const srefCode = entry.srefCodes[0];
          const folderName = sanitizeFolderName(`sref_${srefCode}`);
          const imagesDir = path.join(outputDir, folderName, 'images');
          const videosDir = path.join(outputDir, folderName, 'videos');
          fs.mkdirSync(imagesDir, { recursive: true });
          fs.mkdirSync(videosDir, { recursive: true });

          for (let j = 0; j < entry.images.length; j++) {
            const imgUrl = entry.images[j];
            const basename = decodeURIComponent(imgUrl.split('/').pop().split('?')[0]);
            const destBase = path.join(imagesDir, `${String(j + 1).padStart(2, '0')}_${sanitizeFolderName(basename)}`);
            const saved = await downloadMedia(imgUrl, destBase, cookie);
            if (saved) savedImages.push(saved);
          }
          for (let j = 0; j < entry.videos.length; j++) {
            const vidUrl = entry.videos[j];
            const basename = decodeURIComponent(vidUrl.split('/').pop().split('?')[0]);
            const destBase = path.join(videosDir, `${String(j + 1).padStart(2, '0')}_${sanitizeFolderName(basename)}`);
            const saved = await downloadMedia(vidUrl, destBase, cookie);
            if (saved) savedVideos.push(saved);
          }
        }

        // Upsert to DB
        const upsertResult = await upsertSrefStyle({ ...entry, savedImages, savedVideos });
        if (upsertResult === 'new') newCount++;
        else if (upsertResult === 'updated') updatedCount++;

        processedUrls.add(detailUrl);
      } catch (err) {
        if (err.message === 'stopped') { await _finalize(logId, 'stopped', { newCount, updatedCount, errorCount, processedUrls }); return; }
        errorCount++;
        console.warn(`[sref-scraper] [detail] failed ${detailUrl}: ${err.message}`);
        if (errorCount > 20) {
          console.error('[sref-scraper] too many errors, stopping');
          break;
        }
      }

      _currentProgress.newCount = newCount;
      _currentProgress.updatedCount = updatedCount;
      _currentProgress.errorCount = errorCount;

      // Periodic checkpoint
      if ((i + 1) % 10 === 0) {
        await DataSyncLog.updateOne({ _id: logId }, {
          $set: {
            newCount, updatedCount, errorCount,
            'meta.processedDetails': i + 1,
            'meta.lastDetailUrl': detailUrl,
            'meta.processedUrls': [...processedUrls].slice(-500), // keep last 500 to avoid huge doc
          }
        });
      }
    }

    const totalAfter = await SrefStyle.countDocuments({ isActive: true });
    await DataSyncLog.findByIdAndUpdate(logId, {
      status: errorCount > 0 ? 'partial' : 'success',
      completedAt: new Date(),
      newCount, updatedCount, errorCount, totalAfter,
      'meta.phase': 'done',
    });

    _currentProgress.phase = 'done';
    console.log(`[sref-scraper] done: +${newCount} updated:${updatedCount} errors:${errorCount}`);

  } catch (err) {
    console.error('[sref-scraper] crawl error:', err.message);
    await DataSyncLog.findByIdAndUpdate(logId, {
      status: 'error', completedAt: new Date(),
      $push: { errorMessages: err.message.substring(0, 500) },
    });
    _currentProgress.phase = 'error';
  } finally {
    _crawlRunning = false;
    _currentLogId = null;
  }
}

async function _finalize(logId, status, counts = {}) {
  const { newCount = 0, updatedCount = 0, errorCount = 0 } = counts;
  const totalAfter = await SrefStyle.countDocuments({ isActive: true }).catch(() => 0);
  await DataSyncLog.findByIdAndUpdate(logId, {
    status, completedAt: new Date(), newCount, updatedCount, errorCount, totalAfter,
  });
  _currentProgress.phase = status;
  _crawlRunning = false;
  _currentLogId = null;
}

function stopCrawl() {
  if (!_crawlRunning) return { ok: false, message: 'No crawl running' };
  _stopFlag = true;
  return { ok: true, message: 'Stop signal sent' };
}

function getCrawlStatus() {
  return {
    running: _crawlRunning,
    logId: _currentLogId,
    ..._currentProgress,
  };
}

module.exports = { startCrawl, stopCrawl, getCrawlStatus };
