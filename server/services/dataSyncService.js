/**
 * Data Sync Service — Unified orchestration facade
 *
 * Central hub for all data source synchronizations.
 * Manages running state and provides status/log queries.
 */

const DataSyncLog = require('../models/DataSyncLog');
const { syncNanoBanana, syncSeedanceGithub, syncGithubTrending } = require('./githubSync');
const { syncSeedanceYouMind } = require('./youmindSync');
const { startCrawl, stopCrawl, getCrawlStatus } = require('./srefScraper');

// Track async runs (non-sref sources) to prevent double-trigger
const _running = {
  nanobanana: false,
  'seedance-github': false,
  'seedance-youmind': false,
  'github-trending': false,
};

const SOURCES = {
  nanobanana: {
    label: 'Gallery · NanaBanana Pro',
    description: 'YouMind API → GalleryPrompt · model:nanobanana · 增量 upsert · 每日自动',
    fn: syncNanoBanana,
    manual: false,
  },
  'seedance-github': {
    label: 'Seedance · GitHub README',
    description: 'jau123 仓库 README 解析 → SeedancePrompt · 增量 upsert · 每日自动',
    fn: syncSeedanceGithub,
    manual: false,
  },
  'seedance-youmind': {
    label: 'Seedance · YouMind CSV',
    description: 'YouMind CSV 导出 → SeedancePrompt · 字段级别合并（保留更长 prompt）· 每日自动',
    fn: syncSeedanceYouMind,
    manual: false,
  },
  'github-trending': {
    label: 'Gallery · GitHub Trending',
    description: 'jau123/nanobanana-trending-prompts → GalleryPrompt · model:nanobanana/gptimage 按 JSON 自动区分 · 每图仅存首张预览 · 增量 upsert · 每日自动',
    fn: syncGithubTrending,
    manual: false,
  },
  sref: {
    label: 'Explore · Sref (MJ)',
    description: 'promptsref.com 爬虫 → SrefStyle · Midjourney --sref 风格码 · 手动触发 · 增量模式遇连续已知页自动停止',
    manual: true,
  },
};

// ─── Trigger a sync ───────────────────────────────────────────

async function runSync(source, opts = {}) {
  if (!(source in SOURCES)) {
    throw new Error(`Unknown source: ${source}`);
  }

  if (source === 'sref') {
    return startCrawl(opts);
  }

  if (_running[source]) {
    return { ok: false, message: `${source} sync already running` };
  }

  _running[source] = true;
  // Fire and forget — caller gets immediate response
  SOURCES[source].fn(opts)
    .catch(err => console.error(`[data-sync] ${source} error:`, err.message))
    .finally(() => { _running[source] = false; });

  return { ok: true, message: `${SOURCES[source].label} sync started` };
}

// ─── Status ───────────────────────────────────────────────────

async function getStatus() {
  const sources = Object.keys(SOURCES);
  const latestLogs = await Promise.all(
    sources.map(src =>
      DataSyncLog.findOne({ source: src })
        .sort({ startedAt: -1 })
        .lean()
        .then(log => ({ source: src, label: SOURCES[src].label, log }))
    )
  );

  const srefStatus = getCrawlStatus();

  return latestLogs.map(({ source, label, log }) => ({
    source,
    label,
    description: SOURCES[source].description || '',
    manual: SOURCES[source].manual || false,
    running: source === 'sref' ? srefStatus.running : (_running[source] || false),
    lastLog: log ? {
      id: log._id,
      status: log.status,
      startedAt: log.startedAt,
      completedAt: log.completedAt,
      newCount: log.newCount,
      updatedCount: log.updatedCount,
      skippedCount: log.skippedCount,
      errorCount: log.errorCount,
      totalAfter: log.totalAfter,
      errors: (log.errorMessages || []).slice(0, 3),
      meta: log.meta,
    } : null,
  }));
}

// ─── Paginated log history ────────────────────────────────────

async function getLogs(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    DataSyncLog.find()
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DataSyncLog.countDocuments(),
  ]);
  return { logs, total, page, totalPages: Math.ceil(total / limit) };
}

// ─── Stop sref crawl ──────────────────────────────────────────

function stopSync(source) {
  if (source !== 'sref') return { ok: false, message: 'Only sref crawl can be stopped' };
  return stopCrawl();
}

// ─── Sref real-time progress ──────────────────────────────────

function getSrefProgress() {
  return getCrawlStatus();
}

module.exports = { runSync, getStatus, getLogs, stopSync, getSrefProgress, SOURCES };
