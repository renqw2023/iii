/**
 * GPT Image (Image 1.5) 自动同步服务
 * 
 * 随服务器启动自动运行，定期从 meigen.ai 抓取最新 GPT Image 内容
 * - 启动后延迟 30 秒执行首次同步（避免阻塞服务器启动）
 * - 之后每 24 小时自动同步一次
 * - 支持增量更新（已有记录自动跳过下载）
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ─── 常量 ──────────────────────────────────────────────────
const API_BASE = 'https://www.meigen.ai/api/images';
const PAGE_SIZE = 50;
const IMAGE_DIR = path.join(__dirname, '../../client/public/ImageFlow/gptimage');
const TARGET_MODEL = 'GPT Image';
const DELAY_MS = 500;

// 同步间隔：24 小时
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
// 启动延迟：30 秒（让服务器完成启动）
const STARTUP_DELAY_MS = 30 * 1000;

// ─── 分类函数 ──────────────────────────────────────────────

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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) return resolve('skipped');
        const client = url.startsWith('https') ? https : http;
        client.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        }, (res) => {
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

// ─── 转换函数 ──────────────────────────────────────────────

function transformToGalleryPrompt(item) {
    const tweetId = item.id;
    const title = (item.title || '').trim().substring(0, 200);
    const prompt = (item.prompt || '').trim().substring(0, 10000);
    const description = prompt.substring(0, 300);
    const previewImage = `/ImageFlow/gptimage/${tweetId}_0.jpg`;
    const style = extractStyle(title, prompt);
    const subject = extractSubject(title, prompt);
    const useCase = extractUseCase(title, prompt);
    const tags = new Set(['gpt-image', 'image-1.5']);
    if (style !== 'other') tags.add(style);
    if (subject !== 'other') tags.add(subject);
    if (useCase !== 'other') tags.add(useCase);

    return {
        title, prompt, description,
        model: 'gptimage',
        useCase, style, subject,
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

// ─── 核心同步逻辑 ──────────────────────────────────────────

async function syncGptImages() {
    const startTime = Date.now();
    console.log('[GPT-Image-Sync] 🔄 开始同步 meigen.ai GPT Image 数据...');

    try {
        // 1. 抓取 API 数据
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
                const gptImages = images.filter(img => img.model === TARGET_MODEL);
                allItems.push(...gptImages);
                hasMore = data.hasMore === true && images.length > 0;
                offset += PAGE_SIZE;
                if (hasMore) await sleep(DELAY_MS);
            } catch (err) {
                console.error(`[GPT-Image-Sync]   ❌ 第 ${pageNum} 页请求失败:`, err.message);
                offset += PAGE_SIZE;
                if (pageNum > 100) break;
            }
        }

        console.log(`[GPT-Image-Sync]   📊 共抓取 ${allItems.length} 条 GPT Image 数据 (${pageNum} 页)`);

        if (allItems.length === 0) {
            console.log('[GPT-Image-Sync]   ⚠️ 未抓取到数据，跳过本次同步');
            return;
        }

        // 2. 下载新图片
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
        let downloaded = 0, skipped = 0, dlErrors = 0;

        for (const item of allItems) {
            const imageUrls = item.images?.length > 0 ? item.images : (item.image ? [item.image] : []);
            for (let j = 0; j < imageUrls.length; j++) {
                const ext = path.extname(new URL(imageUrls[j]).pathname) || '.jpg';
                const filename = `${item.id}_${j}${ext}`;
                const destPath = path.join(IMAGE_DIR, filename);
                try {
                    const result = await downloadFile(imageUrls[j], destPath);
                    if (result === 'skipped') skipped++;
                    else downloaded++;
                } catch (err) {
                    dlErrors++;
                }
                if (j < imageUrls.length - 1) await sleep(100);
            }
            await sleep(100);
        }

        // 3. 导入数据库
        const GalleryPrompt = require('../models/GalleryPrompt');
        const records = allItems.map(transformToGalleryPrompt);
        let imported = 0, updated = 0, dbErrors = 0;

        for (const record of records) {
            try {
                const result = await GalleryPrompt.findOneAndUpdate(
                    { sourceId: record.sourceId },
                    { $set: record },
                    { upsert: true, new: true, rawResult: true }
                );
                if (result.lastErrorObject?.updatedExisting) updated++;
                else imported++;
            } catch (error) {
                dbErrors++;
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[GPT-Image-Sync] ✅ 同步完成 (${duration}s) | 图片: +${downloaded} ⏭${skipped} ❌${dlErrors} | 数据: +${imported} 🔄${updated} ❌${dbErrors}`);

    } catch (error) {
        console.error('[GPT-Image-Sync] ❌ 同步异常:', error.message);
    }
}

// ─── 启动调度 ──────────────────────────────────────────────

let syncTimer = null;

function startAutoSync() {
    console.log(`[GPT-Image-Sync] 📅 自动同步已启用 | 首次: ${STARTUP_DELAY_MS / 1000}s 后 | 周期: ${SYNC_INTERVAL_MS / 1000 / 3600}h`);

    // 延迟首次同步
    setTimeout(async () => {
        await syncGptImages();

        // 设置周期性同步
        syncTimer = setInterval(syncGptImages, SYNC_INTERVAL_MS);
    }, STARTUP_DELAY_MS);
}

function stopAutoSync() {
    if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
        console.log('[GPT-Image-Sync] ⏹ 自动同步已停止');
    }
}

module.exports = { startAutoSync, stopAutoSync, syncGptImages };
