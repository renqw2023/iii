/**
 * generateSitemaps.js
 * 独立的 sitemap 生成脚本，在 `npm run build` 之前自动执行（prebuild 钩子）。
 *
 * 用法：
 *   node server/scripts/generateSitemaps.js          # 直接运行
 *   npm run generate-sitemaps  (server 目录下)        # 通过 npm script
 *
 * 行为：
 *   - 连接 MongoDB → 生成所有 sitemap 文件到 client/public/ → 断开退出
 *   - 失败时打印警告并以 exit(0) 退出，不阻断 npm run build
 */

'use strict';

const path = require('path');

// 加载 server/.env（脚本可能从 client/ 目录被调用）
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

async function main() {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/midjourney-gallery-dev';

  console.log('[generateSitemaps] Connecting to MongoDB…');

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log('[generateSitemaps] Connected. Generating sitemaps…');

  const SitemapGenerator = require('../utils/sitemapGenerator');
  const generator = new SitemapGenerator();
  await generator.generateAllSitemaps();

  console.log('[generateSitemaps] All sitemaps written to client/public/');
}

main()
  .then(() => {
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.warn('[generateSitemaps] WARNING: sitemap generation failed —', err.message);
    console.warn('[generateSitemaps] Build will continue without fresh sitemaps.');
    try { mongoose.connection.close(); } catch (_) {}
    // 以 0 退出，不阻断 npm run build
    process.exit(0);
  });
