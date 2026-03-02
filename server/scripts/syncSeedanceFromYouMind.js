/**
 * Seedance 2.0 自动同步脚本
 * 从 YouMind 网站下载最新 CSV 数据并同步到 MongoDB
 * 
 * 工作流程:
 *   1. 从 YouMind 下载 CSV 导出文件（含完整提示词、视频 URL）
 *   2. 解析 CSV，优先使用 Twitter 视频（有声音，通过后端代理播放）
 *   3. Upsert 到 MongoDB（按 sourceId 去重）
 * 
 * 用法:
 *   node scripts/syncSeedanceFromYouMind.js [--dry-run]
 *   node scripts/syncSeedanceFromYouMind.js --download-only
 * 
 * 定时任务示例 (cron):
 *   0 3 * * * cd /path/to/server && node scripts/syncSeedanceFromYouMind.js >> logs/sync-seedance.log 2>&1
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const config = require('../config');

// ==================== 配置 ====================
const YOUMIND_CSV_URL = 'https://youmind.com/api/export/csv?slug=seedance-2-0-prompts';
const YOUMIND_PAGE_URL = 'https://youmind.com/zh-CN/seedance-2-0-prompts';
const CSV_BACKUP_DIR = path.join(__dirname, '../../_data_sources/seedance/csv_backups');
const VIDEO_URLS_JSON = path.join(__dirname, '../../_data_sources/seedance/video-urls.json');

// 命令行参数
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isDownloadOnly = args.includes('--download-only');

// ==================== 分类猜测 ====================
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
    if (text.includes('paper-cut') || text.includes('ink') || text.includes('painting') || text.includes('calligraphy') || text.includes('gongbi') || text.includes('水墨') || text.includes('剪纸')) return 'fantasy';
    if (text.includes('travel') || text.includes('city') || text.includes('旅拍')) return 'other';
    return 'other';
}

// ==================== 标签提取 ====================
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
        'vlog', 'music-video', 'short-film', 'text-animation'
    ];
    for (const kw of keywords) {
        if (text.includes(kw)) tags.add(kw);
    }
    tags.add('seedance-2.0');
    return Array.from(tags).slice(0, 10);
}

// ==================== 视频信息提取 ====================
function extractVideoInfo(sourceVideosStr, promptId) {
    let twitterUrl = '';
    let twitterThumb = '';

    // 从 sourceVideos (Twitter) 提取
    if (sourceVideosStr && sourceVideosStr.trim().length > 5) {
        try {
            const videos = JSON.parse(sourceVideosStr);
            if (Array.isArray(videos) && videos.length > 0) {
                twitterUrl = videos[0].url || '';
                twitterThumb = videos[0].thumbnail || '';
            }
        } catch (e) { /* ignore JSON parse error */ }
    }

    // GitHub Releases 视频（备选）
    let githubUrl = '';
    if (fs.existsSync(VIDEO_URLS_JSON)) {
        try {
            const videoUrls = JSON.parse(fs.readFileSync(VIDEO_URLS_JSON, 'utf-8'));
            if (videoUrls.prompts && videoUrls.prompts[String(promptId)]) {
                githubUrl = videoUrls.prompts[String(promptId)];
            }
        } catch (e) { /* ignore */ }
    }

    return {
        // 优先 Twitter 视频（有声音，通过后端代理播放）
        videoUrl: twitterUrl || githubUrl,
        thumbnailUrl: twitterThumb
    };
}

// ==================== 下载 CSV ====================
async function downloadCSV() {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const csvFileName = `seedance-2-0-prompts-${timestamp}.csv`;
    const csvPath = path.join(CSV_BACKUP_DIR, csvFileName);

    // 确保备份目录存在
    if (!fs.existsSync(CSV_BACKUP_DIR)) {
        fs.mkdirSync(CSV_BACKUP_DIR, { recursive: true });
    }

    console.log(`📥 正在从 YouMind 下载 CSV...`);
    console.log(`   URL: ${YOUMIND_CSV_URL}`);

    try {
        const response = await fetch(YOUMIND_CSV_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': YOUMIND_PAGE_URL
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            // 如果 API 下载失败，尝试使用本地最新 CSV
            console.warn(`⚠️ CSV 下载失败 (HTTP ${response.status})，尝试使用本地文件...`);
            return findLatestLocalCSV();
        }

        const csvContent = await response.text();
        if (csvContent.length < 100 || !csvContent.includes('id,')) {
            console.warn('⚠️ 下载的 CSV 内容异常，尝试使用本地文件...');
            return findLatestLocalCSV();
        }

        fs.writeFileSync(csvPath, csvContent, 'utf-8');
        console.log(`✅ CSV 已保存: ${csvPath} (${(csvContent.length / 1024).toFixed(1)}KB)`);
        return csvPath;
    } catch (error) {
        console.warn(`⚠️ 下载失败: ${error.message}，尝试使用本地文件...`);
        return findLatestLocalCSV();
    }
}

// ==================== 查找本地最新 CSV ====================
function findLatestLocalCSV() {
    // 先检查备份目录
    if (fs.existsSync(CSV_BACKUP_DIR)) {
        const files = fs.readdirSync(CSV_BACKUP_DIR)
            .filter(f => f.endsWith('.csv'))
            .sort()
            .reverse();
        if (files.length > 0) {
            const p = path.join(CSV_BACKUP_DIR, files[0]);
            console.log(`📁 使用备份 CSV: ${p}`);
            return p;
        }
    }

    // 检查项目根目录
    const rootCSV = path.join(__dirname, '../../seedance-2-0-prompts-20260302.csv');
    if (fs.existsSync(rootCSV)) {
        console.log(`📁 使用根目录 CSV: ${rootCSV}`);
        return rootCSV;
    }

    return null;
}

// ==================== 解析并生成记录 ====================
function parseCSVToRecords(csvPath) {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvRecords = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true
    });

    const records = [];
    let withContent = 0;
    let withVideo = 0;
    let withTwitterVideo = 0;

    for (const row of csvRecords) {
        const id = row.id?.trim();
        if (!id || isNaN(parseInt(id))) continue;

        const title = row.title?.trim() || `Seedance Prompt #${id}`;
        const content = row.content?.trim() || '';
        const description = row.description?.trim() || '';

        const videoInfo = extractVideoInfo(row.sourceVideos, id);

        if (content.length > 10) withContent++;
        if (videoInfo.videoUrl) {
            withVideo++;
            if (videoInfo.videoUrl.includes('twimg.com')) withTwitterVideo++;
        }

        // 提取作者
        let authorName = '';
        let authorLink = '';
        try {
            if (row.author) {
                const authorObj = JSON.parse(row.author);
                authorName = authorObj.name || '';
                authorLink = authorObj.link || '';
            }
        } catch (e) { /* ignore */ }

        const category = guessCategory(title, content + ' ' + description);
        const tags = extractTags(title, content + ' ' + description);

        records.push({
            title: title.substring(0, 300),
            prompt: content.length > 10 ? content.substring(0, 15000) : description.substring(0, 15000),
            description: description.substring(0, 3000),
            videoUrl: videoInfo.videoUrl,
            thumbnailUrl: videoInfo.thumbnailUrl,
            category,
            tags,
            sourceUrl: row.sourceLink || `https://youmind.com/en-US/seedance-2-0-prompts?id=${id}`,
            sourceId: `seedance-${id}`,
            isFeatured: content.length > 100,
            isActive: true,
            isPublic: true
        });
    }

    return { records, stats: { total: records.length, withContent, withVideo, withTwitterVideo } };
}

// ==================== 主函数 ====================
async function syncSeedance() {
    const startTime = Date.now();
    console.log('═══════════════════════════════════════════════════');
    console.log('🔄 Seedance 2.0 自动同步脚本');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`模式: ${isDryRun ? '🧪 干跑（不写入）' : '💾 正式同步'}`);
    console.log('═══════════════════════════════════════════════════');

    // 1. 下载/获取 CSV
    const csvPath = await downloadCSV();
    if (!csvPath) {
        console.error('❌ 未找到任何可用的 CSV 数据源');
        process.exit(1);
    }

    if (isDownloadOnly) {
        console.log('✅ 仅下载模式，CSV 已保存');
        return;
    }

    // 2. 解析 CSV
    const { records, stats } = parseCSVToRecords(csvPath);
    console.log(`\n📊 数据统计:`);
    console.log(`   总记录: ${stats.total}`);
    console.log(`   有完整提示词: ${stats.withContent}`);
    console.log(`   有视频: ${stats.withVideo}`);
    console.log(`   Twitter 视频(有声): ${stats.withTwitterVideo}`);

    if (records.length === 0) {
        console.error('❌ 未解析出任何有效记录');
        process.exit(1);
    }

    // 3. 干跑模式
    if (isDryRun) {
        console.log('\n🧪 干跑 — 前 3 条示例:');
        records.slice(0, 3).forEach((r, i) => {
            console.log(`\n  [${i + 1}] ${r.title.substring(0, 60)}`);
            console.log(`      分类: ${r.category}`);
            console.log(`      提示词长度: ${r.prompt.length}`);
            console.log(`      提示词预览: ${r.prompt.substring(0, 100)}...`);
            console.log(`      视频: ${r.videoUrl ? r.videoUrl.substring(0, 70) + '...' : '无'}`);
        });
        console.log('\n✅ 干跑完成');
        return;
    }

    // 4. 连接数据库并同步
    const SeedancePrompt = require('../models/SeedancePrompt');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('\n✅ MongoDB 连接成功');

    // 获取当前数据库记录数
    const beforeCount = await SeedancePrompt.countDocuments({ isActive: true });
    console.log(`📦 数据库现有 ${beforeCount} 条记录`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
        try {
            const existing = await SeedancePrompt.findOne({ sourceId: record.sourceId });
            if (existing) {
                // 只更新有变化的字段（保留用户交互数据）
                const updateFields = {};
                if (record.prompt && record.prompt.length > existing.prompt?.length) {
                    updateFields.prompt = record.prompt;
                }
                if (record.title !== existing.title) updateFields.title = record.title;
                if (record.videoUrl && record.videoUrl !== existing.videoUrl) updateFields.videoUrl = record.videoUrl;
                if (record.thumbnailUrl && !existing.thumbnailUrl) updateFields.thumbnailUrl = record.thumbnailUrl;
                if (record.description && !existing.description) updateFields.description = record.description;

                if (Object.keys(updateFields).length > 0) {
                    await SeedancePrompt.updateOne({ sourceId: record.sourceId }, { $set: updateFields });
                    updated++;
                } else {
                    skipped++;
                }
            } else {
                await SeedancePrompt.create(record);
                imported++;
            }
        } catch (error) {
            errors++;
            if (errors <= 5) {
                console.error(`❌ [${record.sourceId}]: ${error.message}`);
            }
        }
    }

    const afterCount = await SeedancePrompt.countDocuments({ isActive: true });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 同步结果:');
    console.log(`   ✅ 新增: ${imported}`);
    console.log(`   🔄 更新: ${updated}`);
    console.log(`   ⏭️ 跳过(无变化): ${skipped}`);
    console.log(`   ❌ 错误: ${errors}`);
    console.log(`   📦 数据库总数: ${beforeCount} → ${afterCount}`);
    console.log(`   ⏱️ 耗时: ${elapsed}s`);
    console.log('═══════════════════════════════════════════════════');

    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
}

// 运行
syncSeedance().catch(err => {
    console.error('💥 同步失败:', err);
    process.exit(1);
});
