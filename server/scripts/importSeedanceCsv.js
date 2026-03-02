/**
 * 从 CSV 数据导入 Seedance 2.0 提示词
 * CSV 数据源包含完整的提示词文本、作者信息、视频URL等
 * 
 * 用法: node scripts/importSeedanceCsv.js [--dry-run] [--clear] [--csv <path>]
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// 默认 CSV 路径
const DEFAULT_CSV = path.join(__dirname, '../../seedance-2-0-prompts-20260302.csv');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldClear = args.includes('--clear');
const csvPath = args.includes('--csv')
    ? args[args.indexOf('--csv') + 1]
    : DEFAULT_CSV;

/**
 * 简易 CSV 解析器（支持多行字段和引号转义）
 */
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const ch = content[i];
        if (ch === '"') {
            if (inQuotes && i + 1 < content.length && content[i + 1] === '"') {
                current += '"';
                i++; // 跳过转义的双引号
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === '\n' && !inQuotes) {
            if (current.trim()) rows.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) rows.push(current);

    // 解析 header
    const header = parseRow(rows[0]);
    const records = [];

    for (let i = 1; i < rows.length; i++) {
        const fields = parseRow(rows[i]);
        if (fields.length < header.length) continue;
        const obj = {};
        for (let j = 0; j < header.length; j++) {
            obj[header[j]] = fields[j] || '';
        }
        records.push(obj);
    }

    return records;
}

function parseRow(row) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
            if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current);
    return fields;
}

/**
 * 根据标题和内容猜测分类
 */
function guessCategory(title, content) {
    const text = (title + ' ' + content).toLowerCase();
    if (text.includes('fight') || text.includes('battle') || text.includes('combat') || text.includes('warrior') || text.includes('duel')) return 'fight';
    if (text.includes('anime') || text.includes('manga') || text.includes('guoman')) return 'anime';
    if (text.includes('dance') || text.includes('dancing') || text.includes('k-pop') || text.includes('hip-hop') || text.includes('choreograph')) return 'dance';
    if (text.includes('horror') || text.includes('scary') || text.includes('zombie') || text.includes('hostage')) return 'horror';
    if (text.includes('chase') || text.includes('drift') || text.includes('racing') || text.includes('need for speed')) return 'chase';
    if (text.includes('transform') || text.includes('morph') || text.includes('mecha') || text.includes('robot')) return 'transformation';
    if (text.includes('commercial') || text.includes('ad ') || text.includes('product') || text.includes('promotional') || text.includes('brand')) return 'commercial';
    if (text.includes('meme') || text.includes('comedy') || text.includes('funny') || text.includes('humorous')) return 'comedy';
    if (text.includes('sci-fi') || text.includes('futuristic') || text.includes('cyberpunk') || text.includes('alien')) return 'sci-fi';
    if (text.includes('fantasy') || text.includes('dragon') || text.includes('magic') || text.includes('wuxia') || text.includes('mythology') || text.includes('lord of the rings')) return 'fantasy';
    if (text.includes('cinematic') || text.includes('film') || text.includes('movie') || text.includes('noir')) return 'cinematic';
    if (text.includes('vlog') || text.includes('selfie') || text.includes('pov') || text.includes('girlfriend')) return 'vlog';
    if (text.includes('music') || text.includes('mv ') || text.includes('ktv')) return 'music-video';
    if (text.includes('action') || text.includes('ronin') || text.includes('samurai')) return 'action';
    if (text.includes('paper-cut') || text.includes('ink') || text.includes('painting') || text.includes('calligraphy') || text.includes('gongbi')) return 'art';
    if (text.includes('travel') || text.includes('city') || text.includes('promotional video')) return 'travel';
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
 * 从 sourceVideos JSON 中提取视频 URL
 */
function extractVideoUrl(sourceVideosStr, promptId) {
    // 优先: GitHub Releases 视频（来自 video-urls.json）
    const videoUrlsJsonPath = path.join(__dirname, '../../_data_sources/seedance/video-urls.json');
    if (fs.existsSync(videoUrlsJsonPath)) {
        try {
            const videoUrls = JSON.parse(fs.readFileSync(videoUrlsJsonPath, 'utf-8'));
            if (videoUrls.prompts && videoUrls.prompts[String(promptId)]) {
                return videoUrls.prompts[String(promptId)];
            }
        } catch (e) { /* ignore */ }
    }

    // 备选: Twitter 视频
    if (sourceVideosStr) {
        try {
            const videos = JSON.parse(sourceVideosStr.replace(/""/g, '"'));
            if (Array.isArray(videos) && videos.length > 0) {
                return videos[0].url || '';
            }
        } catch (e) { /* ignore */ }
    }
    return '';
}

/**
 * 提取缩略图
 */
function extractThumbnail(sourceVideosStr) {
    if (!sourceVideosStr) return '';
    try {
        const videos = JSON.parse(sourceVideosStr.replace(/""/g, '"'));
        if (Array.isArray(videos) && videos.length > 0) {
            return videos[0].thumbnail || '';
        }
    } catch (e) { /* ignore */ }
    return '';
}

/**
 * 主导入函数
 */
async function importFromCSV() {
    console.log('🎬 Seedance 2.0 CSV 数据导入脚本');
    console.log(`📁 CSV: ${csvPath}`);
    console.log(`${isDryRun ? '🧪 干跑模式' : '💾 正式导入'}`);
    if (shouldClear) console.log('⚠️ 将先清空现有数据');
    console.log('---');

    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV 文件未找到:', csvPath);
        process.exit(1);
    }

    // 解析 CSV
    const csvRecords = parseCSV(csvPath);
    console.log(`📝 CSV 解析完成: ${csvRecords.length} 条记录`);

    // 统计
    let withContent = 0;
    let withVideo = 0;
    const records = [];

    for (const row of csvRecords) {
        const id = row.id?.trim();
        if (!id || isNaN(parseInt(id))) continue; // 跳过非数据行

        const title = row.title?.trim() || `Seedance Prompt #${id}`;
        const content = row.content?.trim() || '';
        const description = row.description?.trim() || '';
        const videoUrl = extractVideoUrl(row.sourceVideos, id);
        const thumbnail = extractThumbnail(row.sourceVideos);

        if (content.length > 5) withContent++;
        if (videoUrl) withVideo++;

        // 提取作者
        let authorName = '';
        let authorLink = '';
        try {
            const authorObj = JSON.parse((row.author || '{}').replace(/""/g, '"'));
            authorName = authorObj.name || '';
            authorLink = authorObj.link || '';
        } catch (e) { /* ignore */ }

        const category = guessCategory(title, content + ' ' + description);
        const tags = extractTags(title, content + ' ' + description);

        records.push({
            title: title.substring(0, 300),
            prompt: content.substring(0, 15000) || description.substring(0, 15000),
            description: description.substring(0, 3000),
            videoUrl: videoUrl,
            thumbnailUrl: thumbnail,
            category,
            tags,
            sourceUrl: row.sourceLink || `https://youmind.com/en-US/seedance-2-0-prompts?id=${id}`,
            sourceId: `seedance-${id}`,
            author: authorName,
            authorLink: authorLink,
            publishedAt: row.sourcePublishedAt || null,
            isFeatured: content.length > 100, // 长提示词标记为精选
            isActive: true,
            isPublic: true
        });
    }

    console.log(`📊 统计:`);
    console.log(`  有提示词内容: ${withContent}/${records.length}`);
    console.log(`  有视频 URL: ${withVideo}/${records.length}`);

    if (isDryRun) {
        console.log('\n🧪 干跑 — 示例记录:');
        records.slice(0, 5).forEach((r, i) => {
            console.log(`  [${i + 1}] ${r.title.substring(0, 60)}`);
            console.log(`      分类: ${r.category}, 作者: ${r.author}`);
            console.log(`      提示词: ${r.prompt.substring(0, 80)}...`);
            console.log(`      视频: ${r.videoUrl ? r.videoUrl.substring(0, 60) + '...' : '无'}`);
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
