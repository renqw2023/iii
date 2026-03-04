/**
 * GPT Image (Image 1.5) 数据导入脚本
 * 从 meigen.ai API 抓取全部 GPT Image 提示词，下载图片到本地，导入 MongoDB
 *
 * 用法:
 *   node scripts/importGptImage.js [--dry-run] [--skip-download] [--limit <n>]
 *
 * 参数:
 *   --dry-run        仅打印抓取结果，不写入数据库也不下载图片
 *   --skip-download  跳过图片下载，仅导入数据到数据库
 *   --limit <n>      限制导入条数
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('../config');

// ─── 命令行参数 ────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipDownload = args.includes('--skip-download');
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : Infinity;

// ─── 常量 ──────────────────────────────────────────────────
const API_BASE = 'https://www.meigen.ai/api/images';
const PAGE_SIZE = 50;
const IMAGE_DIR = path.join(__dirname, '../../client/public/ImageFlow/gptimage');
const TARGET_MODEL = 'GPT Image';   // meigen.ai API 中的模型名称
const DELAY_MS = 500;               // 请求间隔，避免被限流

// ─── 风格分类（复用 importNanoBanana 中的逻辑） ──────────────
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

function extractUseCase(title, prompt) {
    const text = (title + ' ' + prompt).toLowerCase();
    if (text.includes('profile') || text.includes('avatar')) return 'profile-avatar';
    if (text.includes('social media')) return 'social-media-post';
    if (text.includes('infographic') || text.includes('edu visual')) return 'infographic-edu-visual';
    if (text.includes('youtube') || text.includes('thumbnail')) return 'youtube-thumbnail';
    if (text.includes('comic') || text.includes('storyboard')) return 'comic-storyboard';
    if (text.includes('product marketing') || text.includes('advertisement') || text.includes('commercial')) return 'product-marketing';
    if (text.includes('e-commerce') || text.includes('ecommerce')) return 'ecommerce-main-image';
    if (text.includes('game asset') || text.includes('game ')) return 'game-asset';
    if (text.includes('poster') || text.includes('flyer')) return 'poster-flyer';
    if (text.includes('app') || text.includes('web design') || text.includes('ui ') || text.includes('dashboard')) return 'app-web-design';
    return 'other';
}

// ─── 工具函数 ──────────────────────────────────────────────

/** 简易 sleep */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** 使用 Node.js 原生 https 模块发起 GET 请求，返回 JSON */
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchJson(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
            });
        }).on('error', reject);
    });
}

/** 下载文件到本地 */
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        // 如果文件已存在则跳过
        if (fs.existsSync(dest)) {
            return resolve('skipped');
        }
        const client = url.startsWith('https') ? https : http;
        client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }
        }, (res) => {
            // 跟随重定向
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve('downloaded'); });
            file.on('error', (err) => { fs.unlink(dest, () => { }); reject(err); });
        }).on('error', reject);
    });
}

// ─── 第1步：从 meigen.ai API 抓取全部 GPT Image 数据 ──────────

async function fetchAllGptImages() {
    console.log('🔍 正在从 meigen.ai API 抓取全部 GPT Image 数据...');
    const allItems = [];
    let offset = 0;
    let hasMore = true;
    let pageNum = 0;

    while (hasMore) {
        const url = `${API_BASE}?offset=${offset}&limit=${PAGE_SIZE}&sort=newest`;
        pageNum++;

        try {
            const data = await fetchJson(url);
            const images = data.images || [];

            // 筛选 GPT Image 模型
            const gptImages = images.filter(img => img.model === TARGET_MODEL);
            allItems.push(...gptImages);

            console.log(`  📄 第 ${pageNum} 页: 获取 ${images.length} 条，其中 GPT Image ${gptImages.length} 条 (累计 ${allItems.length})`);

            hasMore = data.hasMore === true && images.length > 0;
            offset += PAGE_SIZE;

            // 如果已达到限制则停止
            if (allItems.length >= limit) {
                allItems.length = limit;
                break;
            }

            // 间隔请求
            if (hasMore) await sleep(DELAY_MS);
        } catch (err) {
            console.error(`  ❌ 第 ${pageNum} 页请求失败:`, err.message);
            // 出错后继续尝试下一页
            offset += PAGE_SIZE;
            if (pageNum > 100) break; // 安全上限
        }
    }

    console.log(`\n📊 共抓取 ${allItems.length} 条 GPT Image 数据`);
    return allItems;
}

// ─── 第2步：下载图片到本地 ─────────────────────────────────

async function downloadImages(items) {
    console.log(`\n📥 开始下载图片到: ${IMAGE_DIR}`);

    // 确保目录存在
    fs.mkdirSync(IMAGE_DIR, { recursive: true });

    let downloaded = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const tweetId = item.id;

        // 收集所有图片 URL
        const imageUrls = item.images && item.images.length > 0
            ? item.images
            : (item.image ? [item.image] : []);

        for (let j = 0; j < imageUrls.length; j++) {
            const imageUrl = imageUrls[j];
            // 从 URL 中提取扩展名，默认 jpg
            const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
            const filename = `${tweetId}_${j}${ext}`;
            const destPath = path.join(IMAGE_DIR, filename);

            try {
                const result = await downloadFile(imageUrl, destPath);
                if (result === 'skipped') {
                    skipped++;
                } else {
                    downloaded++;
                }
            } catch (err) {
                errors++;
                if (errors <= 10) {
                    console.error(`  ❌ 下载失败 [${filename}]:`, err.message);
                }
            }

            // 下载间隔
            if (j < imageUrls.length - 1) await sleep(100);
        }

        if ((i + 1) % 10 === 0 || i === items.length - 1) {
            console.log(`  📦 进度: ${i + 1}/${items.length} (下载 ${downloaded}, 跳过 ${skipped}, 失败 ${errors})`);
        }

        await sleep(200);
    }

    console.log(`\n📊 图片下载结果:`);
    console.log(`  ✅ 新下载: ${downloaded}`);
    console.log(`  ⏭️ 已存在跳过: ${skipped}`);
    console.log(`  ❌ 失败: ${errors}`);
}

// ─── 第3步：转换为 GalleryPrompt 格式 ───────────────────────

function transformToGalleryPrompt(item) {
    const tweetId = item.id;
    const title = (item.title || '').trim().substring(0, 200);
    const prompt = (item.prompt || '').trim().substring(0, 10000);
    const description = prompt.substring(0, 300);

    // 使用第一张图片作为预览图（本地路径）
    const previewImage = `/ImageFlow/gptimage/${tweetId}_0.jpg`;

    const style = extractStyle(title, prompt);
    const subject = extractSubject(title, prompt);
    const useCase = extractUseCase(title, prompt);

    // 标签
    const tags = new Set(['gpt-image', 'image-1.5']);
    if (style !== 'other') tags.add(style);
    if (subject !== 'other') tags.add(subject);
    if (useCase !== 'other') tags.add(useCase);

    return {
        title,
        prompt,
        description,
        model: 'gptimage',
        useCase,
        style,
        subject,
        tags: Array.from(tags),
        previewImage,
        sourceAuthor: item.author?.username ? `@${item.author.username}` : (item.author?.name || ''),
        sourceUrl: item.author?.profileUrl || '',
        sourcePlatform: 'meigen',
        dataSource: 'meigen',
        sourceId: `meigen-gptimage-${tweetId}`,
        isFeatured: (item.stats?.likes || 0) > 500,
        views: item.stats?.views || 0,
    };
}

// ─── 第4步：导入到 MongoDB ─────────────────────────────────

async function importToDatabase(records) {
    console.log(`\n💾 开始导入 ${records.length} 条记录到 MongoDB...`);

    const GalleryPrompt = require('../models/GalleryPrompt');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ MongoDB 连接成功');

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
            const result = await GalleryPrompt.findOneAndUpdate(
                { sourceId: record.sourceId },
                { $set: record },
                { upsert: true, new: true, rawResult: true }
            );
            if (result.lastErrorObject?.updatedExisting) {
                updated++;
            } else {
                imported++;
            }
        } catch (error) {
            errors++;
            if (errors <= 5) {
                console.error(`  ❌ 导入失败 [${record.sourceId}]:`, error.message);
            }
        }

        if ((i + 1) % 20 === 0 || i === records.length - 1) {
            console.log(`  进度: ${i + 1}/${records.length}`);
        }
    }

    console.log(`\n📊 导入结果:`);
    console.log(`  ✅ 新增: ${imported}`);
    console.log(`  🔄 更新: ${updated}`);
    console.log(`  ❌ 错误: ${errors}`);

    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
}

// ─── 主流程 ───────────────────────────────────────────────

async function main() {
    console.log('🤖 GPT Image (Image 1.5) 数据导入脚本');
    console.log(`${isDryRun ? '🧪 干跑模式（不写入数据库，不下载图片）' : '💾 正式导入模式'}`);
    if (skipDownload) console.log('⏭️ 跳过图片下载');
    if (limit < Infinity) console.log(`📏 限制导入: ${limit} 条`);
    console.log('---');

    // Step 1: 抓取数据
    const items = await fetchAllGptImages();
    if (items.length === 0) {
        console.log('⚠️ 未找到任何 GPT Image 数据，退出');
        return;
    }

    // 打印统计
    const authors = {};
    items.forEach(item => {
        const a = item.author?.username || 'unknown';
        authors[a] = (authors[a] || 0) + 1;
    });
    console.log('\n👤 作者分布 (Top 10):');
    Object.entries(authors).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
        console.log(`  @${k}: ${v}`);
    });

    // 转换为 GalleryPrompt 格式
    const records = items.map(transformToGalleryPrompt);

    // 打印分类统计
    const styleStats = {};
    const subjectStats = {};
    records.forEach(r => {
        styleStats[r.style] = (styleStats[r.style] || 0) + 1;
        subjectStats[r.subject] = (subjectStats[r.subject] || 0) + 1;
    });
    console.log('\n🎨 风格分类分布:');
    Object.entries(styleStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    console.log('\n📋 主题分类分布:');
    Object.entries(subjectStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

    if (isDryRun) {
        console.log('\n🧪 干跑模式 - 打印前3条记录:');
        records.slice(0, 3).forEach((r, i) => {
            console.log(`\n  [${i + 1}] ${r.title.substring(0, 80)}...`);
            console.log(`      sourceId: ${r.sourceId}`);
            console.log(`      风格: ${r.style}, 主题: ${r.subject}, 用途: ${r.useCase}`);
            console.log(`      标签: ${r.tags.join(', ')}`);
            console.log(`      作者: ${r.sourceAuthor}`);
            console.log(`      预览图: ${r.previewImage}`);
            console.log(`      提示词前100字: ${r.prompt.substring(0, 100)}...`);
        });
        console.log('\n✅ 干跑完成，未写入数据库');
        return;
    }

    // Step 2: 下载图片
    if (!skipDownload) {
        await downloadImages(items);
    }

    // Step 3: 导入数据库
    await importToDatabase(records);

    console.log('\n🎉 GPT Image 数据导入完成！');
}

// ─── 运行 ─────────────────────────────────────────────────
main().catch(err => {
    console.error('💥 导入失败:', err);
    process.exit(1);
});
