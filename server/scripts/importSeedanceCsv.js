/**
 * 从 CSV 数据导入 Seedance 2.0 提示词 (v2)
 * 
 * 修复:
 * 1. 使用 csv-parse 正确处理多行引号字段
 * 2. 优先使用 Twitter 源视频(有声音)，而非 GitHub Releases(无声音)
 * 3. content 字段映射到 prompt（完整提示词），description 字段映射到 description
 * 
 * 用法: node scripts/importSeedanceCsv.js [--dry-run] [--clear] [--csv <path>]
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const config = require('../config');

const DEFAULT_CSV = path.join(__dirname, '../../seedance-2-0-prompts-20260302.csv');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldClear = args.includes('--clear');
const csvPath = args.includes('--csv')
    ? args[args.indexOf('--csv') + 1]
    : DEFAULT_CSV;

/**
 * 根据标题和内容猜测分类
 */
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
    if (text.includes('paper-cut') || text.includes('ink') || text.includes('painting') || text.includes('calligraphy') || text.includes('gongbi') || text.includes('水墨') || text.includes('剪纸')) return 'art';
    if (text.includes('travel') || text.includes('city') || text.includes('旅拍')) return 'travel';
    return 'other';
}

/**
 * 从标题和内容中提取标签
 */
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

/**
 * 从 sourceVideos JSON 中提取视频 URL 和缩略图
 * 优先使用 Twitter 源视频（有声音），而非 GitHub Releases（无声音）
 */
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

    // GitHub Releases 视频（无声音，仅供备选）
    let githubUrl = '';
    const videoUrlsJsonPath = path.join(__dirname, '../../_data_sources/seedance/video-urls.json');
    if (fs.existsSync(videoUrlsJsonPath)) {
        try {
            const videoUrls = JSON.parse(fs.readFileSync(videoUrlsJsonPath, 'utf-8'));
            if (videoUrls.prompts && videoUrls.prompts[String(promptId)]) {
                githubUrl = videoUrls.prompts[String(promptId)];
            }
        } catch (e) { /* ignore */ }
    }

    return {
        // 优先 Twitter 视频（有声音），备选 GitHub Releases（无声音）
        videoUrl: twitterUrl || githubUrl,
        thumbnailUrl: twitterThumb,
        // 同时保留 GitHub URL 作为备用
        githubVideoUrl: githubUrl
    };
}

/**
 * 主导入函数
 */
async function importFromCSV() {
    console.log('🎬 Seedance 2.0 CSV 数据导入脚本 (v2 - 修复内容解析 & 视频声音)');
    console.log(`📁 CSV: ${csvPath}`);
    console.log(`${isDryRun ? '🧪 干跑模式' : '💾 正式导入'}`);
    if (shouldClear) console.log('⚠️ 将先清空现有数据');
    console.log('---');

    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV 文件未找到:', csvPath);
        process.exit(1);
    }

    // 使用 csv-parse 正确解析（处理多行引号字段）
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvRecords = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true
    });
    console.log(`📝 CSV 解析完成: ${csvRecords.length} 条记录`);

    // 统计
    let withContent = 0;
    let withVideo = 0;
    let withTwitterVideo = 0;
    let withGithubVideo = 0;
    const records = [];

    for (const row of csvRecords) {
        const id = row.id?.trim();
        if (!id || isNaN(parseInt(id))) continue;

        const title = row.title?.trim() || `Seedance Prompt #${id}`;
        const content = row.content?.trim() || '';
        const description = row.description?.trim() || '';

        // 视频信息（优先 Twitter 有声视频）
        const videoInfo = extractVideoInfo(row.sourceVideos, id);

        if (content.length > 10) withContent++;
        if (videoInfo.videoUrl) {
            withVideo++;
            if (videoInfo.videoUrl.includes('twimg.com')) withTwitterVideo++;
            else if (videoInfo.videoUrl.includes('github.com')) withGithubVideo++;
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
            // prompt 使用 content（完整提示词），fallback 到 description
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

    console.log(`📊 统计:`);
    console.log(`  有完整提示词内容: ${withContent}/${records.length}`);
    console.log(`  有视频 URL: ${withVideo}/${records.length}`);
    console.log(`    Twitter 视频(有声): ${withTwitterVideo}`);
    console.log(`    GitHub 视频(无声): ${withGithubVideo}`);

    if (isDryRun) {
        console.log('\n🧪 干跑 — 示例记录:');
        records.slice(0, 5).forEach((r, i) => {
            console.log(`\n  [${i + 1}] ${r.title.substring(0, 60)}`);
            console.log(`      分类: ${r.category}`);
            console.log(`      提示词长度: ${r.prompt.length}`);
            console.log(`      提示词预览: ${r.prompt.substring(0, 120)}...`);
            console.log(`      视频: ${r.videoUrl ? r.videoUrl.substring(0, 80) + '...' : '无'}`);
        });
        console.log('\n✅ 干跑完成');
        return;
    }

    // 连接数据库
    const SeedancePrompt = require('../models/SeedancePrompt');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ MongoDB 连接成功');

    if (shouldClear) {
        const deleted = await SeedancePrompt.deleteMany({});
        console.log(`🗑️ 已清空 ${deleted.deletedCount} 条旧记录`);
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
        try {
            await SeedancePrompt.findOneAndUpdate(
                { sourceId: record.sourceId },
                { $set: record },
                { upsert: true, new: true }
            );
            imported++;
        } catch (error) {
            if (error.code === 11000) skipped++;
            else { errors++; console.error(`❌ [${record.sourceId}]:`, error.message); }
        }
    }

    console.log('\n📊 导入结果:');
    console.log(`  ✅ 成功: ${imported}`);
    console.log(`  ⏭️ 跳过: ${skipped}`);
    console.log(`  ❌ 错误: ${errors}`);

    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
}

importFromCSV().catch(err => {
    console.error('💥 导入失败:', err);
    process.exit(1);
});
