/**
 * YouMind Sync Service
 *
 * Downloads CSV from YouMind and syncs Seedance 2.0 prompts to MongoDB.
 * Extracted from syncSeedanceFromYouMind.js (CLI script → service function).
 */

const fs = require('fs');
const path = require('path');
const SeedancePrompt = require('../models/SeedancePrompt');
const DataSyncLog = require('../models/DataSyncLog');

const YOUMIND_CSV_URL = 'https://youmind.com/api/export/csv?slug=seedance-2-0-prompts';
const YOUMIND_PAGE_URL = 'https://youmind.com/zh-CN/seedance-2-0-prompts';
const CSV_BACKUP_DIR = path.join(__dirname, '../../../_data_sources/seedance/csv_backups');

// ─── Category / tag helpers (same as syncSeedanceFromYouMind.js) ─

function guessCategory(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('fight') || text.includes('battle') || text.includes('combat') || text.includes('warrior') || text.includes('duel') || text.includes('martial')) return 'fight';
  if (text.includes('anime') || text.includes('manga') || text.includes('guoman') || text.includes('动漫')) return 'anime';
  if (text.includes('dance') || text.includes('dancing') || text.includes('k-pop') || text.includes('hip-hop') || text.includes('choreograph') || text.includes('舞')) return 'dance';
  if (text.includes('horror') || text.includes('scary') || text.includes('zombie') || text.includes('hostage')) return 'horror';
  if (text.includes('chase') || text.includes('drift') || text.includes('racing') || text.includes('need for speed') || text.includes('赛车') || text.includes('漂移')) return 'chase';
  if (text.includes('transform') || text.includes('morph') || text.includes('mecha') || text.includes('robot') || text.includes('变形') || text.includes('机甲')) return 'transformation';
  if (text.includes('commercial') || text.includes('ad ') || text.includes('product') || text.includes('promotional') || text.includes('brand') || text.includes('广告')) return 'commercial';
  if (text.includes('meme') || text.includes('comedy') || text.includes('funny') || text.includes('humorous')) return 'comedy';
  if (text.includes('sci-fi') || text.includes('futuristic') || text.includes('cyberpunk') || text.includes('alien') || text.includes('赛博朋克')) return 'sci-fi';
  if (text.includes('fantasy') || text.includes('dragon') || text.includes('magic') || text.includes('wuxia') || text.includes('mythology') || text.includes('仙') || text.includes('武侠')) return 'fantasy';
  if (text.includes('cinematic') || text.includes('film') || text.includes('movie') || text.includes('noir') || text.includes('电影')) return 'cinematic';
  if (text.includes('vlog') || text.includes('selfie') || text.includes('pov') || text.includes('girlfriend') || text.includes('男友视角')) return 'vlog';
  if (text.includes('music') || text.includes('mv ') || text.includes('ktv')) return 'music-video';
  if (text.includes('action') || text.includes('ronin') || text.includes('samurai')) return 'action';
  return 'other';
}

function extractTags(title, content) {
  const tags = new Set();
  const text = (title + ' ' + content).toLowerCase();
  const keywords = [
    'cinematic', 'anime', 'action', 'fight', 'dance', 'horror', 'sci-fi',
    'fantasy', 'comedy', 'transformation', 'chase', 'commercial',
    'realistic', 'cgi', 'vfx', '3d', 'live-action', 'martial-arts',
    'romance', 'dramatic', 'emotional', 'epic', 'thriller',
    'fpv', 'drone', 'pov', 'ink-wash', 'paper-cut', 'cyberpunk',
    'superhero', 'samurai', 'wuxia', 'mecha', 'car', 'travel',
    'vlog', 'music-video', 'short-film', 'text-animation',
  ];
  for (const kw of keywords) { if (text.includes(kw)) tags.add(kw); }
  tags.add('seedance-2.0');
  return Array.from(tags).slice(0, 10);
}

function extractVideoInfo(sourceVideosStr) {
  let twitterUrl = '';
  let twitterThumb = '';
  if (sourceVideosStr && sourceVideosStr.trim().length > 5) {
    try {
      const videos = JSON.parse(sourceVideosStr);
      if (Array.isArray(videos) && videos.length > 0) {
        twitterUrl = videos[0].url || '';
        twitterThumb = videos[0].thumbnail || '';
      }
    } catch (_) {}
  }
  return { videoUrl: twitterUrl, thumbnailUrl: twitterThumb };
}

// ─── CSV parsing (inline, no csv-parse dependency needed) ──────

function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const header = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;
    const row = {};
    header.forEach((h, idx) => { row[h.trim()] = values[idx] || ''; });
    records.push(row);
  }
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── CSV download ──────────────────────────────────────────────

async function downloadCSV() {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const csvPath = path.join(CSV_BACKUP_DIR, `seedance-2-0-prompts-${timestamp}.csv`);
  fs.mkdirSync(CSV_BACKUP_DIR, { recursive: true });

  try {
    const resp = await fetch(YOUMIND_CSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': YOUMIND_PAGE_URL,
      },
      redirect: 'follow',
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvContent = await resp.text();
    if (csvContent.length < 100 || !csvContent.includes('id,')) throw new Error('invalid CSV content');

    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`[youmind-sync] CSV saved: ${csvPath} (${(csvContent.length / 1024).toFixed(1)}KB)`);
    return { csvPath, csvContent };
  } catch (err) {
    console.warn(`[youmind-sync] CSV download failed: ${err.message}, trying local fallback...`);
    return findLatestLocalCSV();
  }
}

function findLatestLocalCSV() {
  if (fs.existsSync(CSV_BACKUP_DIR)) {
    const files = fs.readdirSync(CSV_BACKUP_DIR).filter(f => f.endsWith('.csv')).sort().reverse();
    if (files.length > 0) {
      const csvPath = path.join(CSV_BACKUP_DIR, files[0]);
      return { csvPath, csvContent: fs.readFileSync(csvPath, 'utf-8') };
    }
  }
  // Check project root
  const rootCSV = path.join(__dirname, '../../../seedance-2-0-prompts-20260302.csv');
  if (fs.existsSync(rootCSV)) {
    return { csvPath: rootCSV, csvContent: fs.readFileSync(rootCSV, 'utf-8') };
  }
  return null;
}

// ─── Main sync function ────────────────────────────────────────

async function syncSeedanceYouMind() {
  const log = await DataSyncLog.create({ source: 'seedance-youmind', status: 'running', startedAt: new Date() });
  const errors = [];
  let newCount = 0, updatedCount = 0, skippedCount = 0, errorCount = 0;

  try {
    const csvResult = await downloadCSV();
    if (!csvResult) throw new Error('No CSV data source available');

    const csvRecords = parseCSV(csvResult.csvContent);
    console.log(`[youmind-sync] Parsed ${csvRecords.length} CSV rows`);

    if (csvRecords.length === 0) throw new Error('CSV parsed to 0 records');

    const beforeCount = await SeedancePrompt.countDocuments({ isActive: true });

    for (const row of csvRecords) {
      const id = row.id?.trim();
      if (!id || isNaN(parseInt(id))) continue;

      const title = row.title?.trim() || `Seedance Prompt #${id}`;
      const content = row.content?.trim() || '';
      const description = row.description?.trim() || '';
      const videoInfo = extractVideoInfo(row.sourceVideos);

      let authorName = '';
      let authorLink = '';
      try {
        if (row.author) {
          const authorObj = JSON.parse(row.author);
          authorName = authorObj.name || '';
          authorLink = authorObj.link || '';
        }
      } catch (_) {}

      const category = guessCategory(title, content + ' ' + description);
      const tags = extractTags(title, content + ' ' + description);

      const record = {
        title: title.substring(0, 300),
        prompt: content.length > 10 ? content.substring(0, 15000) : description.substring(0, 15000),
        description: description.substring(0, 3000),
        videoUrl: videoInfo.videoUrl,
        thumbnailUrl: videoInfo.thumbnailUrl,
        category, tags,
        sourceUrl: row.sourceLink || `https://youmind.com/en-US/seedance-2-0-prompts?id=${id}`,
        sourceId: `seedance-${id}`,
        authorName, authorLink,
        isFeatured: content.length > 100,
        isActive: true, isPublic: true,
      };

      try {
        const existing = await SeedancePrompt.findOne({ sourceId: record.sourceId });
        if (existing) {
          const updateFields = {};
          if (record.prompt && record.prompt.length > (existing.prompt?.length || 0)) updateFields.prompt = record.prompt;
          if (record.title !== existing.title) updateFields.title = record.title;
          if (record.videoUrl && record.videoUrl !== existing.videoUrl) updateFields.videoUrl = record.videoUrl;
          if (record.thumbnailUrl && !existing.thumbnailUrl) updateFields.thumbnailUrl = record.thumbnailUrl;
          if (record.description && !existing.description) updateFields.description = record.description;
          if (record.authorName && !existing.authorName) updateFields.authorName = record.authorName;
          if (record.authorLink && !existing.authorLink) updateFields.authorLink = record.authorLink;

          if (Object.keys(updateFields).length > 0) {
            await SeedancePrompt.updateOne({ sourceId: record.sourceId }, { $set: updateFields });
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          await SeedancePrompt.create(record);
          newCount++;
        }
      } catch (err) {
        errorCount++;
        errors.push(`[${id}]: ${err.message.substring(0, 150)}`);
      }
    }

    const totalAfter = await SeedancePrompt.countDocuments({ isActive: true });
    await DataSyncLog.findByIdAndUpdate(log._id, {
      status: errorCount > 0 ? 'partial' : 'success',
      completedAt: new Date(), newCount, updatedCount, skippedCount, errorCount, totalAfter, errorMessages: errors,
      meta: { csvUrl: YOUMIND_CSV_URL, csvPath: csvResult.csvPath, beforeCount },
    });
    console.log(`[youmind-sync] done: +${newCount} ~${updatedCount} skip${skippedCount} err${errorCount}`);
    return { newCount, updatedCount, skippedCount, errorCount };
  } catch (err) {
    errors.push(err.message.substring(0, 500));
    await DataSyncLog.findByIdAndUpdate(log._id, {
      status: 'error', completedAt: new Date(), errorCount: 1, errorMessages: errors,
    });
    throw err;
  }
}

module.exports = { syncSeedanceYouMind };
