#!/usr/bin/env node
/**
 * Seedance 视频批量下载脚本
 *
 * 将 MongoDB 中所有 storageType='twitter' 的 Seedance 视频
 * 下载到 server/uploads/videos/seedance/{id}.mp4
 *
 * 特性：
 *   - 断点续传：已存在的文件自动跳过
 *   - 并发控制：同时最多 2 个下载任务
 *   - 限速：每个任务完成后等待 300ms
 *   - 下载完成后更新 DB: localVideoPath + storageType='local'
 *
 * 用法：
 *   node server/scripts/downloadSeedanceVideos.js
 *
 * R2 迁移说明：
 *   未来将 uploads/videos/seedance/ 上传到 R2，然后：
 *   1. 将 videoUrl 更新为 R2 URL
 *   2. 将 storageType 更新为 'r2'
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SeedancePrompt = require('../models/SeedancePrompt');
const config = require('../config');

const VIDEO_DIR = path.join(__dirname, '../uploads/videos/seedance');
const CONCURRENCY = 1;          // 串行：避免 twimg.com 并发限速
const DELAY_MS = 1500;          // 基础间隔 1.5s
const JITTER_MS = 1000;         // 额外随机抖动 0-1s，防规律性检测
const TIMEOUT_MS = 60000;       // 60s per video

// ─── helpers ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    let resolved = false;

    const req = proto.get(url, { timeout: TIMEOUT_MS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(dest, () => {});
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        const hint = res.statusCode === 403 ? '(URL 可能已过期)' :
                     res.statusCode === 429 ? '(触发限速，可降低并发或增大延迟)' : '';
        return reject(new Error(`HTTP ${res.statusCode} ${hint}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          resolved = true;
          resolve();
        });
      });
    });

    req.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      if (!resolved) reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      file.close();
      fs.unlink(dest, () => {});
      if (!resolved) reject(new Error('Timeout'));
    });
  });
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(config.database.uri || process.env.MONGODB_URI);
  console.log('[download] Connected to MongoDB');

  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  // 查询所有含 twimg.com 的记录（兼容旧数据：storageType 字段在加入前的记录值为 undefined）
  const items = await SeedancePrompt.find({
    videoUrl: { $regex: 'twimg\\.com', $options: 'i' },
    isActive: true,
  }).select('_id videoUrl').lean();

  console.log(`[download] Found ${items.length} twitter videos to download`);

  let done = 0, skipped = 0, failed = 0;
  const total = items.length;

  async function processOne(item) {
    const id = item._id.toString();
    const dest = path.join(VIDEO_DIR, `${id}.mp4`);
    const localPath = `seedance/${id}.mp4`;
    const publicUrl = `/v/seedance/${id}.mp4`;

    // 断点续传：已存在则跳过下载，但仍更新 DB（防止上次中断只下载未更新 DB）
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
      try {
        await SeedancePrompt.updateOne({ _id: item._id }, {
          $set: {
            localVideoPath: localPath,
            storageType: 'local',
            videoUrl: publicUrl,
          }
        });
        skipped++;
        process.stdout.write(`\r[download] ${done + skipped + failed}/${total} (skip:${skipped} fail:${failed})`);
      } catch (_) {}
      return;
    }

    try {
      await downloadFile(item.videoUrl, dest);
      const size = fs.statSync(dest).size;
      if (size < 5000) {
        fs.unlinkSync(dest);
        throw new Error(`File too small (${size} bytes)`);
      }

      await SeedancePrompt.updateOne({ _id: item._id }, {
        $set: {
          localVideoPath: localPath,
          storageType: 'local',
          videoUrl: publicUrl,
        }
      });
      done++;
      process.stdout.write(`\r[download] ${done + skipped + failed}/${total} done:${done} skip:${skipped} fail:${failed}`);
    } catch (err) {
      failed++;
      console.error(`\n[download] FAIL ${id}: ${err.message}`);
    }

    await sleep(DELAY_MS + Math.random() * JITTER_MS);
  }

  // 并发池
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      await processOne(item);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`\n[download] Complete — done:${done} skipped:${skipped} failed:${failed}`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[download] Fatal:', err.message);
  process.exit(1);
});
