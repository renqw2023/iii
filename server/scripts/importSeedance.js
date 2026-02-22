/**
 * Seedance 2.0 数据导入脚本
 * 从 awesome-seedance-2-prompts 仓库导入视频提示词数据到 MongoDB
 * 
 * 用法: node scripts/importSeedance.js [--dry-run] [--data-dir <path>]
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
const dataDir = args.includes('--data-dir')
    ? args[args.indexOf('--data-dir') + 1]
    : DEFAULT_DATA_DIR;

/**
 * 从 README.md 中解析提示词数据
 */
function parseReadme(readmePath) {
    const content = fs.readFileSync(readmePath, 'utf-8');
    const prompts = [];

    // 匹配格式: ### Title\n\nDescription/Prompt content
    // Seedance README 中每个 prompt 以 ### 开头
    const sections = content.split(/^### /gm);

    let currentNumber = 0;

    for (const section of sections) {
        if (!section.trim()) continue;

        const lines = section.trim().split('\n');
        const title = lines[0].trim();

        // 跳过非提示词部分的标题
        if (title.startsWith('📖') || title.startsWith('🌐') || title.startsWith('🤔') ||
            title.startsWith('📊') || title.startsWith('🤝') || title.startsWith('📄') ||
            title.startsWith('🙏') || title.startsWith('⭐') || title.startsWith('🎬') ||
            title.startsWith('📚') || title.length < 5) {
            continue;
        }

        // 提取提示词内容
        const promptContent = [];
        let inCodeBlock = false;
        let foundPromptSection = false;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }

            if (inCodeBlock) {
                promptContent.push(line);
                foundPromptSection = true;
                continue;
            }

            // 跳过图片链接和空行
            if (line.startsWith('![') || line.startsWith('<img') || line.startsWith('---')) continue;

            // 收集描述文本
            if (line.trim() && !line.startsWith('#') && !line.startsWith('|') && !line.startsWith('>')) {
                promptContent.push(line.trim());
            }
        }

        if (promptContent.length === 0) continue;

        currentNumber++;

        // 分类猜测
        const category = guessCategory(title, promptContent.join(' '));
        const tags = extractTags(title, promptContent.join(' '));

        prompts.push({
            number: currentNumber,
            title: title.substring(0, 300),
            prompt: promptContent.join('\n').substring(0, 15000),
            description: promptContent.slice(0, 2).join(' ').substring(0, 500),
            category,
            tags
        });
    }

    return prompts;
}

/**
 * 根据标题和内容猜测分类
 */
function guessCategory(title, content) {
    const text = (title + ' ' + content).toLowerCase();

    if (text.includes('fight') || text.includes('battle') || text.includes('combat') || text.includes('warrior')) return 'fight';
    if (text.includes('anime') || text.includes('manga')) return 'anime';
    if (text.includes('dance') || text.includes('dancing')) return 'dance';
    if (text.includes('horror') || text.includes('scary') || text.includes('jump-scare')) return 'horror';
    if (text.includes('chase') || text.includes('pursuit')) return 'chase';
    if (text.includes('transform') || text.includes('morph')) return 'transformation';
    if (text.includes('commercial') || text.includes('ad ') || text.includes('product')) return 'commercial';
    if (text.includes('meme') || text.includes('comedy') || text.includes('funny')) return 'comedy';
    if (text.includes('sci-fi') || text.includes('robot') || text.includes('futuristic') || text.includes('cyberpunk')) return 'sci-fi';
    if (text.includes('fantasy') || text.includes('dragon') || text.includes('magic')) return 'fantasy';
    if (text.includes('cinematic') || text.includes('film') || text.includes('movie')) return 'cinematic';
    if (text.includes('vlog') || text.includes('selfie')) return 'vlog';
    if (text.includes('music') || text.includes('mv ')) return 'music-video';
    if (text.includes('action')) return 'action';

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
        'romance', 'dramatic', 'emotional', 'epic', 'thriller'
    ];

    for (const keyword of keywords) {
        if (text.includes(keyword)) {
            tags.add(keyword);
        }
    }

    return Array.from(tags).slice(0, 10);
}

/**
 * 主导入函数
 */
async function importSeedance() {
    console.log('🎬 Seedance 2.0 数据导入脚本');
    console.log(`📁 数据目录: ${dataDir}`);
    console.log(`${isDryRun ? '🧪 干跑模式（不写入数据库）' : '💾 正式导入模式'}`);
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

    // 2. 解析 README.md
    const readmePath = path.join(dataDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
        console.error('❌ README.md 未找到:', readmePath);
        process.exit(1);
    }

    const parsedPrompts = parseReadme(readmePath);
    console.log(`📝 从 README 中解析出 ${parsedPrompts.length} 个提示词`);

    // 3. 合并：为每个有视频URL的提示词创建完整记录
    const records = [];

    for (const [promptId, videoUrl] of Object.entries(videoUrls)) {
        // 尝试从解析的提示词中匹配
        const matchedPrompt = parsedPrompts.find(p => p.number === parseInt(promptId));

        const record = {
            title: matchedPrompt ? matchedPrompt.title : `Seedance Prompt #${promptId}`,
            prompt: matchedPrompt ? matchedPrompt.prompt : `Video generation prompt #${promptId}`,
            description: matchedPrompt ? matchedPrompt.description : '',
            videoUrl: videoUrl,
            category: matchedPrompt ? matchedPrompt.category : 'other',
            tags: matchedPrompt ? matchedPrompt.tags : ['seedance-2.0'],
            sourceUrl: `https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts`,
            sourceId: `seedance-${promptId}`,
            isFeatured: parseInt(promptId) <= 50 // 前50个标记为精选
        };

        records.push(record);
    }

    console.log(`📊 生成 ${records.length} 条待导入记录`);

    if (isDryRun) {
        console.log('\n🧪 干跑模式 - 打印前5条记录:');
        records.slice(0, 5).forEach((r, i) => {
            console.log(`  [${i + 1}] ${r.title.substring(0, 60)}...`);
            console.log(`      分类: ${r.category}, 标签: ${r.tags.join(', ')}`);
            console.log(`      视频: ${r.videoUrl}`);
        });
        console.log('\n✅ 干跑完成，未写入数据库');
        return;
    }

    // 4. 连接数据库并导入
    const SeedancePrompt = require('../models/SeedancePrompt');

    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ MongoDB 连接成功');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
        try {
            // 使用 upsert 避免重复导入
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
    console.log(`  ⏭️ 跳过(已存在): ${skipped}`);
    console.log(`  ❌ 错误: ${errors}`);

    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
}

// 运行
importSeedance().catch(err => {
    console.error('💥 导入失败:', err);
    process.exit(1);
});
