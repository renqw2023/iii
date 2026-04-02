const express = require('express');
const NodeCache = require('node-cache');
const router = express.Router();
const SeedancePrompt = require('../models/SeedancePrompt');
const viewsBuffer = require('../services/viewsBuffer');

// 默认首页 60 秒缓存
const listCache = new NodeCache({ stdTTL: 60 });

// 可选认证中间件
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (e) { }
    }
    next();
};

// 必须登录中间件
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: '请先登录' });
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: '登录已过期' });
    }
};

/**
 * GET /api/seedance
 * Seedance 视频列表（支持分类/标签过滤 + 分页 + 排序）
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            category, tags, search, authorName,
            sort = 'newest', page = 1, limit = 12, featured
        } = req.query;

        // 默认首页缓存（未登录 + 无过滤参数 + page=1 + sort=newest）
        const pageNum = Math.max(1, parseInt(page));
        const isDefaultPage = !req.user && !category && !tags && !search && !authorName && !featured && sort === 'newest' && pageNum === 1;
        if (isDefaultPage) {
            const cached = listCache.get('seedance:default:p1');
            if (cached) return res.json(cached);
        }

        const filter = { isActive: true, isPublic: true, videoUrl: { $ne: '' } };

        if (category && category !== 'all') filter.category = category;
        if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
        if (featured === 'true') filter.isFeatured = true;
        if (search) filter.$text = { $search: search };
        // authorName: direct regex match (case-insensitive), bypasses text index limitation
        if (authorName) filter.authorName = { $regex: authorName.trim(), $options: 'i' };

        const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * pageSize;

        let prompts, total;

        if (sort === 'likes' || sort === 'random') {
            // Aggregation pipeline for likes-weighted and random sorts
            const basePipeline = [
                { $match: filter },
                { $addFields: { _likesCount: { $size: { $ifNull: ['$likes', []] } } } },
            ];

            if (sort === 'random') {
                // True random sampling — different order every request
                basePipeline.push({ $sample: { size: pageSize + skip } });
                basePipeline.push({ $skip: skip });
            } else {
                // sort=likes: highest likes first, then by recency
                basePipeline.push({ $sort: { _likesCount: -1, createdAt: -1 } });
                basePipeline.push({ $skip: skip });
                basePipeline.push({ $limit: pageSize });
            }

            [prompts, total] = await Promise.all([
                SeedancePrompt.aggregate(basePipeline),
                SeedancePrompt.countDocuments(filter),
            ]);
        } else {
            let sortOption = {};
            switch (sort) {
                case 'popular':    sortOption = { views: -1, createdAt: -1 }; break;
                case 'most-copied': sortOption = { copyCount: -1 }; break;
                case 'oldest':     sortOption = { createdAt: 1 }; break;
                default:           sortOption = { createdAt: -1 };
            }

            [prompts, total] = await Promise.all([
                SeedancePrompt.find(filter)
                    .sort(sortOption)
                    .skip(skip)
                    .limit(pageSize)
                    .select('-__v')
                    .lean(),
                SeedancePrompt.countDocuments(filter),
            ]);
        }

        // 处理用户交互状态
        prompts.forEach(p => {
            if (req.user) {
                p.isLiked = p.likes?.some(l => l.user?.toString() === req.user.id);
                p.isFavorited = p.favorites?.some(f => f.user?.toString() === req.user.id);
            }
            p.likesCount = p.likes?.length || 0;
            p.favoritesCount = p.favorites?.length || 0;
            delete p.likes;
            delete p.favorites;
            delete p._likesCount; // remove temp aggregation field
        });

        const responseData = {
            prompts,
            pagination: {
                total,
                page: pageNum,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        };

        if (isDefaultPage) listCache.set('seedance:default:p1', responseData);

        res.json(responseData);
    } catch (error) {
        console.error('Seedance列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/seedance/featured
 */
router.get('/featured', async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        const prompts = await SeedancePrompt.find({
            isActive: true, isPublic: true, isFeatured: true
        })
            .sort({ views: -1 })
            .limit(Math.min(50, parseInt(limit)))
            .select('-likes -favorites -__v')
            .lean();

        res.json({ prompts });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/seedance/categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await SeedancePrompt.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({ categories: categories.map(c => ({ name: c._id, count: c.count })) });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/seedance/search
 */
router.get('/search', optionalAuth, async (req, res) => {
    try {
        const { q, page = 1, limit = 12 } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ message: '搜索词至少2个字符' });
        }

        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.min(50, parseInt(limit));
        const skip = (pageNum - 1) * pageSize;

        const filter = {
            isActive: true, isPublic: true,
            $text: { $search: q }
        };

        const [prompts, total] = await Promise.all([
            SeedancePrompt.find(filter, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .skip(skip)
                .limit(pageSize)
                .select('-likes -favorites -__v')
                .lean(),
            SeedancePrompt.countDocuments(filter)
        ]);

        res.json({
            prompts,
            pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) }
        });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/seedance/proxy-video
 * 视频代理 — 绕过 Twitter/X CORS 限制，服务器端 fetch 并 stream 转发
 * 注意：必须在 /:id 路由之前定义，否则 Express 会把 'proxy-video' 当作 id
 */
router.get('/proxy-video', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ message: '缺少 url 参数' });
        }

        // 白名单验证：只允许代理已知的视频源
        const allowedHosts = [
            'video.twimg.com',
            'pbs.twimg.com',
            'github.com',
            'objects.githubusercontent.com'
        ];
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(400).json({ message: '无效的 URL' });
        }
        if (!allowedHosts.some(h => parsedUrl.hostname.endsWith(h))) {
            return res.status(403).json({ message: '不允许代理该域名' });
        }

        // 转发 Range 请求头（支持 seek / 进度条）
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://x.com/'
        };
        if (req.headers.range) {
            headers['Range'] = req.headers.range;
        }

        const response = await fetch(url, { headers, redirect: 'follow' });

        if (!response.ok && response.status !== 206) {
            return res.status(response.status).json({ message: '视频获取失败' });
        }

        // 转发响应头
        res.status(response.status);
        const contentType = response.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        const contentLength = response.headers.get('content-length');
        if (contentLength) res.setHeader('Content-Length', contentLength);
        const contentRange = response.headers.get('content-range');
        if (contentRange) res.setHeader('Content-Range', contentRange);
        const acceptRanges = response.headers.get('accept-ranges');
        if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

        // 允许跨域嵌入（限定 iii.pics 域名，开发环境允许 localhost）
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        const allowedOrigin = process.env.CLIENT_URL || 'https://iii.pics';
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);

        // 缓存 1 小时
        res.setHeader('Cache-Control', 'public, max-age=3600');

        // Stream 转发
        const { Readable } = require('stream');
        const readable = Readable.fromWeb(response.body);
        readable.pipe(res);
    } catch (error) {
        console.error('视频代理错误:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: '代理服务器错误' });
        }
    }
});

/**
 * GET /api/seedance/proxy-thumbnail
 * 缩略图代理 — 代理 Twitter 缩略图，缓存 24 小时
 */
router.get('/proxy-thumbnail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ message: '缺少 url 参数' });
        }

        const allowedHosts = ['pbs.twimg.com', 'video.twimg.com'];
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(400).json({ message: '无效的 URL' });
        }
        if (!allowedHosts.some(h => parsedUrl.hostname.endsWith(h))) {
            return res.status(403).json({ message: '不允许代理该域名' });
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://x.com/'
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            return res.status(response.status).json({ message: '缩略图获取失败' });
        }

        const contentType = response.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        const contentLength = response.headers.get('content-length');
        if (contentLength) res.setHeader('Content-Length', contentLength);

        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
        // 缩略图缓存 24 小时
        res.setHeader('Cache-Control', 'public, max-age=86400');

        const { Readable } = require('stream');
        const readable = Readable.fromWeb(response.body);
        readable.pipe(res);
    } catch (error) {
        console.error('缩略图代理错误:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: '代理服务器错误' });
        }
    }
});

/**
 * POST /api/seedance/:id/translate
 * 翻译提示词（Google Translate 免费 API + 缓存）
 */
router.post('/:id/translate', async (req, res) => {
    try {
        const { targetLang = 'zh-CN' } = req.body;
        const prompt = await SeedancePrompt.findById(req.params.id);
        if (!prompt) return res.status(404).json({ message: '未找到' });

        // 检查缓存
        const cached = prompt.translations?.get(targetLang);
        if (cached) {
            return res.json({ translated: cached, fromCache: true });
        }

        // 调用 Google Translate 免费 API
        const textToTranslate = prompt.prompt || prompt.description || prompt.title;
        if (!textToTranslate) {
            return res.status(400).json({ message: '没有可翻译的内容' });
        }

        const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(textToTranslate.substring(0, 5000))}`;

        const translateRes = await fetch(translateUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        if (!translateRes.ok) {
            return res.status(502).json({ message: '翻译服务不可用' });
        }

        const data = await translateRes.json();
        // Google Translate 返回格式: [[["翻译结果", "原文", ...], ...], ...]
        const translatedText = data[0]?.map(item => item[0]).join('') || '';

        if (translatedText) {
            // 缓存翻译结果
            if (!prompt.translations) prompt.translations = new Map();
            prompt.translations.set(targetLang, translatedText);
            await prompt.save();
        }

        res.json({ translated: translatedText, fromCache: false });
    } catch (error) {
        console.error('翻译错误:', error.message);
        res.status(500).json({ message: '翻译失败' });
    }
});

/**
 * GET /api/seedance/:id
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const prompt = await SeedancePrompt.findOne(
            { _id: req.params.id, isActive: true }
        ).select('-__v').lean();

        if (!prompt) {
            return res.status(404).json({ message: '未找到' });
        }

        // buffer 写入，30s 后批量刷新到 DB
        viewsBuffer.increment('seedance', req.params.id);

        if (req.user) {
            prompt.isLiked = prompt.likes?.some(l => l.user?.toString() === req.user.id);
            prompt.isFavorited = prompt.favorites?.some(f => f.user?.toString() === req.user.id);
        }
        prompt.likesCount = prompt.likes?.length || 0;
        prompt.favoritesCount = prompt.favorites?.length || 0;
        delete prompt.likes;
        delete prompt.favorites;

        // 相关推荐
        const related = await SeedancePrompt.find({
            _id: { $ne: prompt._id },
            isActive: true,
            $or: [
                { category: prompt.category },
                { tags: { $in: prompt.tags?.slice(0, 3) || [] } }
            ]
        })
            .sort({ views: -1 })
            .limit(4)
            .select('title videoUrl thumbnailUrl category tags views')
            .lean();

        res.json({ prompt, related });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * POST /api/seedance/:id/copy
 */
router.post('/:id/copy', async (req, res) => {
    try {
        const prompt = await SeedancePrompt.findByIdAndUpdate(
            req.params.id,
            { $inc: { copyCount: 1 } },
            { new: true }
        );
        if (!prompt) return res.status(404).json({ message: '未找到' });
        res.json({ copyCount: prompt.copyCount });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * POST /api/seedance/:id/like
 */
router.post('/:id/like', requireAuth, async (req, res) => {
    try {
        const prompt = await SeedancePrompt.findById(req.params.id);
        if (!prompt) return res.status(404).json({ message: '未找到' });

        const existingIndex = prompt.likes.findIndex(l => l.user?.toString() === req.user.id);
        if (existingIndex > -1) {
            prompt.likes.splice(existingIndex, 1);
        } else {
            prompt.likes.push({ user: req.user.id });
        }
        await prompt.save();
        res.json({ liked: existingIndex === -1, likesCount: prompt.likes.length });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * POST /api/seedance/:id/favorite
 */
router.post('/:id/favorite', requireAuth, async (req, res) => {
    try {
        const prompt = await SeedancePrompt.findById(req.params.id);
        if (!prompt) return res.status(404).json({ message: '未找到' });

        const existingIndex = prompt.favorites.findIndex(f => f.user?.toString() === req.user.id);
        if (existingIndex > -1) {
            prompt.favorites.splice(existingIndex, 1);
        } else {
            prompt.favorites.push({ user: req.user.id });
        }
        await prompt.save();
        res.json({ favorited: existingIndex === -1, favoritesCount: prompt.favorites.length });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});


module.exports = router;
