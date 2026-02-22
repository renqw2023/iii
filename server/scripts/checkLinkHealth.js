/**
 * 外部链接健康检查脚本
 * 定期检查 GalleryPrompt 和 SeedancePrompt 中的外部链接是否有效
 * 失效的链接将被标记，连续失败 3 次的记录将被标记为不活跃
 * 
 * 用法: node scripts/checkLinkHealth.js [--fix] [--limit <n>]
 * --fix: 自动将连续失败3次的记录标记为 isActive: false
 * --limit: 限制检查数量（默认检查所有）
 */

const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const config = require('../config');

const args = process.argv.slice(2);
const autoFix = args.includes('--fix');
const checkLimit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : Infinity;
const MAX_FAIL_COUNT = 3; // 连续失败3次后标记为不活跃

/**
 * 检查 URL 是否可访问（HEAD 请求）
 */
function checkUrl(url, timeout = 10000) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.request(url, { method: 'HEAD', timeout }, (res) => {
            resolve({
                ok: res.statusCode >= 200 && res.statusCode < 400,
                statusCode: res.statusCode
            });
        });

        req.on('error', () => resolve({ ok: false, statusCode: 0 }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ ok: false, statusCode: 0 });
        });

        req.end();
    });
}

async function main() {
    console.log('🔗 外部链接健康检查');
    console.log(`${autoFix ? '🔧 自动修复模式（将标记失效记录为不活跃）' : '🔍 仅检查模式'}`);
    console.log('---');

    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ MongoDB 连接成功');

    const GalleryPrompt = require('../models/GalleryPrompt');
    const SeedancePrompt = require('../models/SeedancePrompt');

    // 检查 GalleryPrompt 的 previewImage
    console.log('\n📸 检查画廊预览图链接...');
    const galleryPrompts = await GalleryPrompt.find({
        isActive: true,
        previewImage: { $exists: true, $ne: '' }
    }).limit(checkLimit).select('_id previewImage linkHealth sourceId');

    let galleryOk = 0, galleryFail = 0, galleryFixed = 0;

    for (const prompt of galleryPrompts) {
        const result = await checkUrl(prompt.previewImage);

        if (result.ok) {
            galleryOk++;
            await GalleryPrompt.findByIdAndUpdate(prompt._id, {
                'linkHealth.lastChecked': new Date(),
                'linkHealth.isHealthy': true,
                'linkHealth.failCount': 0
            });
        } else {
            galleryFail++;
            const newFailCount = (prompt.linkHealth?.failCount || 0) + 1;
            const update = {
                'linkHealth.lastChecked': new Date(),
                'linkHealth.isHealthy': false,
                'linkHealth.failCount': newFailCount
            };

            if (autoFix && newFailCount >= MAX_FAIL_COUNT) {
                update.isActive = false;
                galleryFixed++;
                console.log(`  ❌ [${prompt.sourceId}] 连续失败 ${newFailCount} 次，已标记为不活跃`);
            } else if (newFailCount >= MAX_FAIL_COUNT) {
                console.log(`  ⚠️ [${prompt.sourceId}] 连续失败 ${newFailCount} 次（使用 --fix 自动处理）`);
            }

            await GalleryPrompt.findByIdAndUpdate(prompt._id, update);
        }
    }

    console.log(`  ✅ 正常: ${galleryOk}, ❌ 失效: ${galleryFail}, 🔧 已修复: ${galleryFixed}`);

    // 检查 SeedancePrompt 的 videoUrl
    console.log('\n🎬 检查 Seedance 视频链接...');
    const seedancePrompts = await SeedancePrompt.find({
        isActive: true,
        videoUrl: { $exists: true, $ne: '' }
    }).limit(checkLimit).select('_id videoUrl linkHealth sourceId');

    let seedanceOk = 0, seedanceFail = 0, seedanceFixed = 0;

    for (const prompt of seedancePrompts) {
        const result = await checkUrl(prompt.videoUrl);

        if (result.ok) {
            seedanceOk++;
            await SeedancePrompt.findByIdAndUpdate(prompt._id, {
                'linkHealth.lastChecked': new Date(),
                'linkHealth.isHealthy': true,
                'linkHealth.failCount': 0
            });
        } else {
            seedanceFail++;
            const newFailCount = (prompt.linkHealth?.failCount || 0) + 1;
            const update = {
                'linkHealth.lastChecked': new Date(),
                'linkHealth.isHealthy': false,
                'linkHealth.failCount': newFailCount
            };

            if (autoFix && newFailCount >= MAX_FAIL_COUNT) {
                update.isActive = false;
                seedanceFixed++;
                console.log(`  ❌ [${prompt.sourceId}] 连续失败 ${newFailCount} 次，已标记为不活跃`);
            }

            await SeedancePrompt.findByIdAndUpdate(prompt._id, update);
        }
    }

    console.log(`  ✅ 正常: ${seedanceOk}, ❌ 失效: ${seedanceFail}, 🔧 已修复: ${seedanceFixed}`);

    console.log('\n📊 总计:');
    console.log(`  画廊: ${galleryPrompts.length} 条检查完毕`);
    console.log(`  Seedance: ${seedancePrompts.length} 条检查完毕`);

    await mongoose.disconnect();
    console.log('🔌 完成');
}

main().catch(err => {
    console.error('💥 错误:', err);
    process.exit(1);
});
