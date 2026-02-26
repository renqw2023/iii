/**
 * NanoBanana Pro 数据导入脚本
 * 从 awesome-nano-banana-pro-prompts 仓库解析 README.md 并导入到 MongoDB
 * 
 * 用法: node scripts/importNanoBanana.js [--dry-run] [--data-dir <path>] [--limit <n>]
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// 默认数据目录
const DEFAULT_DATA_DIR = path.join(__dirname, '../../_data_sources/nanobanana');

// 解析命令行参数
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : Infinity;
const dataDir = args.includes('--data-dir')
    ? args[args.indexOf('--data-dir') + 1]
    : DEFAULT_DATA_DIR;

/**
 * 用途分类映射
 */
const USE_CASE_MAP = {
    'profile / avatar': 'profile-avatar',
    'profile/avatar': 'profile-avatar',
    'social media post': 'social-media-post',
    'social media': 'social-media-post',
    'infographic / edu visual': 'infographic-edu-visual',
    'infographic/edu visual': 'infographic-edu-visual',
    'infographic': 'infographic-edu-visual',
    'youtube thumbnail': 'youtube-thumbnail',
    'comic / storyboard': 'comic-storyboard',
    'comic/storyboard': 'comic-storyboard',
    'product marketing': 'product-marketing',
    'e-commerce main image': 'ecommerce-main-image',
    'ecommerce main image': 'ecommerce-main-image',
    'e-commerce': 'ecommerce-main-image',
    'game asset': 'game-asset',
    'poster / flyer': 'poster-flyer',
    'poster/flyer': 'poster-flyer',
    'app / web design': 'app-web-design',
    'app/web design': 'app-web-design',
};

/**
 * 从提示词标题中提取用途分类
 */
function extractUseCase(title) {
    const lower = title.toLowerCase();
    for (const [key, value] of Object.entries(USE_CASE_MAP)) {
        if (lower.includes(key)) return value;
    }
    return 'other';
}

/**
 * 从标题和提示词内容中猜测风格分类
 */
function extractStyle(title, prompt) {
    const text = (title + ' ' + prompt).toLowerCase();

    if (text.includes('photograph') || text.includes('photo ') || text.includes('selfie') || text.includes('photoreal')) return 'photography';
    if (text.includes('cinematic') || text.includes('film still')) return 'cinematic-film-still';
    if (text.includes('anime') || text.includes('manga')) return 'anime-manga';
    if (text.includes('illustration') || text.includes('illustrated')) return 'illustration';
    if (text.includes('sketch') || text.includes('line art') || text.includes('line-art')) return 'sketch-line-art';
    if (text.includes('comic') || text.includes('graphic novel')) return 'comic-graphic-novel';
    if (text.includes('3d render') || text.includes('3d ') || text.includes('pixar')) return '3d-render';
    if (text.includes('chibi') || text.includes('q-style')) return 'chibi-q-style';
    if (text.includes('isometric')) return 'isometric';
    if (text.includes('pixel art') || text.includes('pixel-art')) return 'pixel-art';
    if (text.includes('oil painting')) return 'oil-painting';
    if (text.includes('watercolor')) return 'watercolor';
    if (text.includes('ink') || text.includes('chinese style') || text.includes('ukiyo-e')) return 'ink-chinese-style';
    if (text.includes('retro') || text.includes('vintage')) return 'retro-vintage';
    if (text.includes('cyberpunk') || text.includes('sci-fi') || text.includes('futuristic')) return 'cyberpunk-sci-fi';
    if (text.includes('minimalis')) return 'minimalism';

    return 'other';
}

/**
 * 从标题和提示词内容中猜测主题分类
 */
function extractSubject(title, prompt) {
    const text = (title + ' ' + prompt).toLowerCase();

    if (text.includes('portrait') || text.includes('selfie') || text.includes('headshot')) return 'portrait-selfie';
    if (text.includes('influencer') || text.includes('model ') || text.includes('fashion shoot')) return 'influencer-model';
    if (text.includes('character') || text.includes('mascot')) return 'character';
    if (text.includes('group') || text.includes('couple') || text.includes('family')) return 'group-couple';
    if (text.includes('product') && !text.includes('product marketing')) return 'product';
    if (text.includes('food') || text.includes('drink') || text.includes('cake') || text.includes('cuisine')) return 'food-drink';
    if (text.includes('fashion') || text.includes('outfit') || text.includes('clothing')) return 'fashion-item';
    if (text.includes('animal') || text.includes('creature') || text.includes('dog') || text.includes('cat')) return 'animal-creature';
    if (text.includes('vehicle') || text.includes('car ') || text.includes('truck')) return 'vehicle';
    if (text.includes('architecture') || text.includes('interior') || text.includes('building')) return 'architecture-interior';
    if (text.includes('landscape') || text.includes('nature') || text.includes('mountain')) return 'landscape-nature';
    if (text.includes('cityscape') || text.includes('street') || text.includes('urban')) return 'cityscape-street';
    if (text.includes('diagram') || text.includes('chart') || text.includes('infographic')) return 'diagram-chart';
    if (text.includes('text') || text.includes('typography') || text.includes('calligraphy')) return 'text-typography';
    if (text.includes('abstract') || text.includes('background') || text.includes('pattern')) return 'abstract-background';

    return 'other';
}

/**
 * 解析 README.md 中的提示词
 *
 * README 有两种条目结构：
 *   Featured 区:  ### No. 1: Wide quote card with portrait...
 *   All Prompts:  ### No. 1: Profile / Avatar - Ultra-Realistic...
 *
 * 图片使用 HTML <img src="..."> 格式，不是 Markdown ![](url)
 * 作者信息格式: - **Author:** [Name](url)
 */
function parseNanoBananaReadme(readmePath) {
    console.log('📖 正在解析 README.md...');
    const content = fs.readFileSync(readmePath, 'utf-8');
    const prompts = [];

    // 匹配所有 ### No. X: ... 级别的标题（同时支持 Featured 和 All Prompts 两种区块）
    const promptRegex = /^#{2,4}\s*No\.\s*(\d+):\s*(.+)$/gm;

    let match;
    const positions = [];
    let globalIdx = 0;

    while ((match = promptRegex.exec(content)) !== null) {
        const fullTitle = match[2].trim();
        // 判断是否带分类前缀格式: "Category - Title"
        // 分类前缀由已知用途关键词组成，用 " - " 分隔
        const separatorIdx = fullTitle.indexOf(' - ');
        let categoryRaw = '';
        let title = fullTitle;
        if (separatorIdx !== -1) {
            categoryRaw = fullTitle.substring(0, separatorIdx).trim();
            title = fullTitle.substring(separatorIdx + 3).trim();
        }

        globalIdx++;
        positions.push({
            index: match.index,
            globalIdx,           // 全局序号，用于生成唯一 sourceId
            number: parseInt(match[1]),
            categoryRaw,
            title,
            fullTitle,
            rawLine: match[0]
        });
    }

    console.log(`📋 找到 ${positions.length} 个提示词标题`);

    for (let i = 0; i < positions.length && i < limit; i++) {
        const pos = positions[i];
        const nextPos = positions[i + 1];

        // 提取该提示词和下一个提示词之间的内容
        const endIndex = nextPos ? nextPos.index : content.length;
        const sectionContent = content.substring(pos.index, endIndex);

        // --- 提取提示词正文 ---
        let promptText = '';

        // 优先：代码块 ```...```
        const codeBlockMatch = sectionContent.match(/```(?:\w+)?\n([\s\S]*?)```/);
        if (codeBlockMatch) {
            promptText = codeBlockMatch[1].trim();
        }

        // 退路：从 #### 📝 Prompt 小节后的普通段落提取
        if (!promptText) {
            const promptSectionMatch = sectionContent.match(/####\s*📝\s*Prompt\s*\n([\s\S]*?)(?=\n####|\n###|$)/);
            if (promptSectionMatch) {
                promptText = promptSectionMatch[1]
                    .split('\n')
                    .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('![') && !l.startsWith('<') && !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('---'))
                    .map(l => l.trim())
                    .join('\n')
                    .trim();
            }
        }

        if (!promptText || promptText.length < 10) continue;

        // --- 提取预览图 URL ---
        // README 使用 HTML <img src="..."> 格式
        let imageUrl = '';
        const htmlImgMatch = sectionContent.match(/<img\s+src="(https?:\/\/[^"]+)"/i);
        if (htmlImgMatch) {
            imageUrl = htmlImgMatch[1];
        }
        // 兼容：也匹配 Markdown ![](url) 格式（排除 badge shields.io）
        if (!imageUrl) {
            const mdImgMatch = sectionContent.match(/!\[(?!Language|Featured|Raycast)[^\]]*\]\((https?:\/\/(?!img\.shields)[^\s)]+)\)/);
            if (mdImgMatch) {
                imageUrl = mdImgMatch[1];
            }
        }

        // --- 提取作者信息 ---
        let sourceAuthor = '';
        let sourceUrl = 'https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts';
        const authorMatch = sectionContent.match(/\*\*Author:\*\*\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i);
        if (authorMatch) {
            sourceAuthor = authorMatch[1].trim();
            sourceUrl = authorMatch[2].trim();
        }

        // --- 提取描述 ---
        let description = '';
        const descMatch = sectionContent.match(/####\s*📖\s*Description\s*\n([\s\S]*?)(?=\n####|\n###|$)/);
        if (descMatch) {
            description = descMatch[1]
                .split('\n')
                .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('![') && !l.startsWith('<') && !l.startsWith('>') && !l.startsWith('|'))
                .map(l => l.trim())
                .join(' ')
                .trim()
                .substring(0, 500);
        }
        if (!description) description = promptText.substring(0, 300);

        // --- 检测 Featured 标记 ---
        const isFeaturedByBadge = sectionContent.includes('⭐-Featured') || sectionContent.includes('Featured-gold');

        // --- 分类提取 ---
        const useCase = extractUseCase(pos.categoryRaw || pos.fullTitle);
        const style = extractStyle(pos.title, promptText);
        const subject = extractSubject(pos.title, promptText);

        // --- 标签 ---
        const tags = new Set(['nanobanana-pro']);
        if (useCase !== 'other') tags.add(useCase);
        if (style !== 'other') tags.add(style);
        if (subject !== 'other') tags.add(subject);

        // sourceId 使用全局序号保证唯一，避免 Featured 和 All Prompts 两个区都有 No.1 冲突
        const sourceId = `nanobanana-g${pos.globalIdx}`;

        const displayTitle = pos.categoryRaw
            ? `${pos.categoryRaw} - ${pos.title}`
            : pos.title;

        prompts.push({
            title: displayTitle.substring(0, 200),
            prompt: promptText.substring(0, 10000),
            description,
            model: 'nanobanana',
            useCase,
            style,
            subject,
            tags: Array.from(tags),
            previewImage: imageUrl,
            sourceAuthor,
            sourceUrl,
            sourcePlatform: sourceAuthor ? 'twitter' : 'github',
            dataSource: 'nano-banana-pro',
            sourceId,
            isFeatured: isFeaturedByBadge,
        });
    }

    return prompts;
}

/**
 * 主导入函数
 */
async function importNanoBanana() {
    console.log('🍌 NanoBanana Pro 数据导入脚本');
    console.log(`📁 数据目录: ${dataDir}`);
    console.log(`${isDryRun ? '🧪 干跑模式（不写入数据库）' : '💾 正式导入模式'}`);
    if (limit < Infinity) console.log(`📏 限制导入: ${limit} 条`);
    console.log('---');

    const readmePath = path.join(dataDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
        console.error('❌ README.md 未找到:', readmePath);
        process.exit(1);
    }

    const prompts = parseNanoBananaReadme(readmePath);
    console.log(`📊 解析出 ${prompts.length} 条有效提示词`);

    // 统计分类分布
    const useCaseStats = {};
    const styleStats = {};
    prompts.forEach(p => {
        useCaseStats[p.useCase] = (useCaseStats[p.useCase] || 0) + 1;
        styleStats[p.style] = (styleStats[p.style] || 0) + 1;
    });

    console.log('\n📊 用途分类分布:');
    Object.entries(useCaseStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        console.log(`  ${k}: ${v}`);
    });

    console.log('\n🎨 风格分类分布:');
    Object.entries(styleStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        console.log(`  ${k}: ${v}`);
    });

    if (isDryRun) {
        console.log('\n🧪 干跑模式 - 打印前3条记录:');
        prompts.slice(0, 3).forEach((r, i) => {
            console.log(`\n  [${i + 1}] ${r.title}`);
            console.log(`      用途: ${r.useCase}, 风格: ${r.style}, 主题: ${r.subject}`);
            console.log(`      标签: ${r.tags.join(', ')}`);
            console.log(`      提示词前100字: ${r.prompt.substring(0, 100)}...`);
            if (r.previewImage) console.log(`      预览图: ${r.previewImage}`);
        });
        console.log('\n✅ 干跑完成，未写入数据库');
        return;
    }

    // 连接数据库
    const GalleryPrompt = require('../models/GalleryPrompt');

    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ MongoDB 连接成功');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // 批量导入（每批100条）
    const batchSize = 100;
    for (let i = 0; i < prompts.length; i += batchSize) {
        const batch = prompts.slice(i, i + batchSize);

        for (const record of batch) {
            try {
                await GalleryPrompt.findOneAndUpdate(
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
                    if (errors <= 5) {
                        console.error(`❌ 导入失败 [${record.sourceId}]:`, error.message);
                    }
                }
            }
        }

        console.log(`  进度: ${Math.min(i + batchSize, prompts.length)}/${prompts.length}`);
    }

    console.log('\n📊 导入结果:');
    console.log(`  ✅ 成功导入/更新: ${imported}`);
    console.log(`  ⏭️ 跳过(已存在): ${skipped}`);
    console.log(`  ❌ 错误: ${errors}`);

    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
}

// 运行
importNanoBanana().catch(err => {
    console.error('💥 导入失败:', err);
    process.exit(1);
});
