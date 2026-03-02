/**
 * Seedance 2.0 数据导入脚本
 * 从 awesome-seedance-2-prompts 仓库导入视频提示词数据到 MongoDB
 * 
 * 修复: 使用 YouMind ID 匹配提示词，而非顺序编号
 * 
 * 用法: node scripts/importSeedance.js [--dry-run] [--clear] [--data-dir <path>]
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// 数据目录（默认值）
const DEFAULT_DATA_DIR = path.join(__dirname, '../../_data_sources/seedance');

// 解析命令行参数
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldClear = args.includes('--clear');
const dataDir = args.includes('--data-dir')
    ? args[args.indexOf('--data-dir') + 1]
    : DEFAULT_DATA_DIR;

/**
 * 从 README.md 中解析提示词数据
 * 关键改进: 提取每个 section 中的 YouMind ID (youmind.com/...?id=XXX)
 */
function parseReadme(readmePath) {
    const content = fs.readFileSync(readmePath, 'utf-8');
    const promptMap = {}; // key = youmind id, value = parsed prompt

    // 按 ### 分割
    const sections = content.split(/^### /gm);

    for (const section of sections) {
        if (!section.trim()) continue;

        const lines = section.trim().split('\n');
        const title = lines[0].trim();

        // 跳过非提示词部分
        if (title.startsWith('📖') || title.startsWith('🌐') || title.startsWith('🤔') ||
            title.startsWith('📊') || title.startsWith('🤝') || title.startsWith('📄') ||
            title.startsWith('🙏') || title.startsWith('⭐') || title.startsWith('🎬') ||
            title.startsWith('📚') || title.length < 5) {
            continue;
        }

        // 提取 YouMind ID: youmind.com/...?id=XXX
        const idMatch = section.match(/youmind\.com[^\)]*[?&]id=(\d+)/);
        if (!idMatch) continue; // 没有 ID 的跳过
        const youmindId = idMatch[1];

        // 提取描述文本（非代码块内的文字）
        const descriptionLines = [];
        let inCodeBlock = false;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
            if (inCodeBlock) continue;
            if (line.startsWith('![') || line.startsWith('<img') || line.startsWith('---')) continue;
            if (line.startsWith('####')) continue;
            if (line.includes('youmind.com')) continue;
            if (line.includes('Click image to download')) continue;
            if (line.startsWith('Author:') || line.startsWith('Source:') || line.startsWith('Published:')) continue;
            if (line.trim() && !line.startsWith('#') && !line.startsWith('|') && !line.startsWith('>')) {
                descriptionLines.push(line.trim());
            }
        }

        // 提取提示词内容（代码块内的文字）
        const promptContent = [];
        inCodeBlock = false;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
            if (inCodeBlock) {
                promptContent.push(line);
            }
        }

        // 提取作者信息
        const authorMatch = section.match(/Author:\s*\[([^\]]+)\]/);
        const sourceMatch = section.match(/Source:\s*\[Link\]\(([^\)]+)\)/);
        const publishedMatch = section.match(/Published:\s*(.+?)$/m);

        // 分类猜测
        const fullText = title + ' ' + promptContent.join(' ') + ' ' + descriptionLines.join(' ');
        const category = guessCategory(title, fullText);
        const tags = extractTags(title, fullText);

        // 去重：相同 prompt 内容可能出现多次（README 格式问题），取第一个代码块
        const uniquePrompt = [...new Set(promptContent)].join('\n');

        promptMap[youmindId] = {
            youmindId,
            title: title.substring(0, 300),
            prompt: uniquePrompt.substring(0, 15000) || descriptionLines.join('\n').substring(0, 15000),
            description: descriptionLines.slice(0, 3).join(' ').substring(0, 3000),
            category,
            tags,
            author: authorMatch ? authorMatch[1] : '',
            sourceUrl: sourceMatch ? sourceMatch[1] : '',
            publishedDate: publishedMatch ? publishedMatch[1].trim() : ''
        };
    }

    return promptMap;
}

/**
 * 根据标题和内容猜测分类
 */
function guessCategory(title, content) {
    const text = (title + ' ' + content).toLowerCase();

    if (text.includes('fight') || text.includes('battle') || text.includes('combat') || text.includes('warrior') || text.includes('duel')) return 'fight';
    if (text.includes('anime') || text.includes('manga') || text.includes('guoman')) return 'anime';
    if (text.includes('dance') || text.includes('dancing') || text.includes('k-pop') || text.includes('hip-hop')) return 'dance';
    if (text.includes('horror') || text.includes('scary') || text.includes('zombie') || text.includes('jump-scare')) return 'horror';
    if (text.includes('chase') || text.includes('pursuit') || text.includes('speeder')) return 'chase';
    if (text.includes('transform') || text.includes('morph') || text.includes('optimus')) return 'transformation';
    if (text.includes('commercial') || text.includes('ad ') || text.includes('product') || text.includes('promotional')) return 'commercial';
    if (text.includes('meme') || text.includes('comedy') || text.includes('funny') || text.includes('humorous')) return 'comedy';
    if (text.includes('sci-fi') || text.includes('robot') || text.includes('futuristic') || text.includes('cyberpunk') || text.includes('mecha')) return 'sci-fi';
    if (text.includes('fantasy') || text.includes('dragon') || text.includes('magic') || text.includes('wuxia') || text.includes('mythology')) return 'fantasy';
    if (text.includes('cinematic') || text.includes('film') || text.includes('movie') || text.includes('noir')) return 'cinematic';
    if (text.includes('vlog') || text.includes('selfie') || text.includes('pov') || text.includes('girlfriend')) return 'vlog';
    if (text.includes('music') || text.includes('mv ') || text.includes('ktv')) return 'music-video';
    if (text.includes('action') || text.includes('ronin') || text.includes('samurai')) return 'action';
    if (text.includes('paper-cut') || text.includes('ink') || text.includes('painting') || text.includes('calligraphy')) return 'fantasy';

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
        'fantasy', 'comedy', 'meme', 'transformation', 'chase', 'commercial',
        'realistic', 'cgi', 'vfx', '3d', 'live-action', 'martial-arts',
        'romance', 'dramatic', 'emotional', 'epic', 'thriller',
        'fpv', 'drone', 'pov', 'ink-wash', 'paper-cut', 'cyberpunk',
        'superhero', 'samurai', 'wuxia', 'mecha', 'car', 'travel'
    ];

    for (const keyword of keywords) {
        if (text.includes(keyword)) {
            tags.add(keyword);
        }
    }

    // 始终添加 seedance-2.0 标签
    tags.add('seedance-2.0');

    return Array.from(tags).slice(0, 10);
}

/**
 * 主导入函数
 */
async function importSeedance() {
    console.log('🎬 Seedance 2.0 数据导入脚本 (v2 - YouMind ID 匹配)');
    console.log(`📁 数据目录: ${dataDir}`);
    console.log(`${isDryRun ? '🧪 干跑模式（不写入数据库）' : '💾 正式导入模式'}`);
    if (shouldClear) console.log('⚠️ 将先清空现有数据');
    console.log('---');

    // 1. 读取 video-urls.json
    const videoUrlsPath = path.join(dataDir, 'video-urls.json');
    if (!fs.existsSync(videoUrlsPath)) {
        console.error('❌ video-urls.json 未找到:', videoUrlsPath);
        process.exit(1);
    }

    const videoUrlsData = JSON.parse(fs.readFileSync(videoUrlsPath, 'utf-8'));
    const videoUrls = videoUrlsData.prompts || {};
    console.log(`📹 找到 ${Object.keys(videoUrls).length} 个视频 URL`);

    // 2. 解析 README.md（用 YouMind ID 索引）
    const readmePath = path.join(dataDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
        console.error('❌ README.md 未找到:', readmePath);
        process.exit(1);
    }

    const promptMap = parseReadme(readmePath);
    console.log(`📝 从 README 中解析出 ${Object.keys(promptMap).length} 个有效提示词（含 YouMind ID）`);

    // 3. 合并：为每个视频URL创建记录，优先使用 README 中的完整提示词
    const records = [];
    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const [promptId, videoUrl] of Object.entries(videoUrls)) {
        const matched = promptMap[promptId];

        const record = {
            title: matched ? matched.title : `Seedance Prompt #${promptId}`,
            prompt: matched ? matched.prompt : `Video generation prompt #${promptId}`,
            description: matched ? matched.description : '',
            videoUrl: videoUrl,
            category: matched ? matched.category : 'other',
            tags: matched ? matched.tags : ['seedance-2.0'],
            sourceUrl: matched?.sourceUrl || `https://youmind.com/en-US/seedance-2-0-prompts?id=${promptId}`,
            sourceId: `seedance-${promptId}`,
            isFeatured: matched ? true : false, // 有完整提示词的标记为精选
            isActive: true,
            isPublic: true
        };

        if (matched) matchedCount++;
        else unmatchedCount++;

        records.push(record);
    }

    console.log(`📊 匹配结果: ${matchedCount} 个有完整提示词，${unmatchedCount} 个仅有视频`);
    console.log(`📊 生成 ${records.length} 条待导入记录`);

    if (isDryRun) {
        console.log('\n🧪 干跑模式 — 匹配成功的示例:');
        records.filter(r => r.prompt.length > 50).slice(0, 3).forEach((r, i) => {
            console.log(`  [${i + 1}] ${r.title.substring(0, 70)}`);
            console.log(`      分类: ${r.category}, 标签: ${r.tags.join(', ')}`);
            console.log(`      提示词: ${r.prompt.substring(0, 80)}...`);
            console.log(`      视频: ${r.videoUrl.substring(0, 60)}...`);
        });
        console.log('\n🧪 干跑模式 — 未匹配的示例:');
        records.filter(r => r.prompt.length <= 50).slice(0, 3).forEach((r, i) => {
            console.log(`  [${i + 1}] ${r.title} → ${r.videoUrl.substring(0, 60)}...`);
        });
        console.log('\n✅ 干跑完成，未写入数据库');
        return;
    }

    // 4. 连接数据库并导入
    const SeedancePrompt = require('../models/SeedancePrompt');

    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ MongoDB 连接成功');

    // 可选：清空集合
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
            if (error.code === 11000) {
                skipped++;
            } else {
                errors++;
                console.error(`❌ 导入失败 [${record.sourceId}]:`, error.message);
            }
        }
    }

    console.log('\n📊 导入结果:');
    console.log(`  ✅ 成功导入/更新: ${imported}`);
    console.log(`  ⏭️ 跳过(重复): ${skipped}`);
    console.log(`  ❌ 错误: ${errors}`);
    console.log(`  📝 有完整提示词: ${matchedCount}/${records.length}`);

    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
}

// 运行
importSeedance().catch(err => {
    console.error('💥 导入失败:', err);
    process.exit(1);
});
