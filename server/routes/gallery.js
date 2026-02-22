const express = require('express');
const router = express.Router();
const GalleryPrompt = require('../models/GalleryPrompt');

// 可选认证中间件 - 未登录也可浏览，登录后可收藏/点赞
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (e) {
            // token无效但不阻止请求
        }
    }
    next();
};

// 认证中间件 - 必须登录
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
 * GET /api/gallery
 * 画廊列表（支持模型/分类/标签过滤 + 分页 + 排序）
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            model, useCase, style, subject, tags, search,
            sort = 'newest', page = 1, limit = 20, featured
        } = req.query;

        const filter = { isActive: true, isPublic: true };

        // 过滤条件
        if (model && model !== 'all') filter.model = model;
        if (useCase && useCase !== 'all') filter.useCase = useCase;
        if (style && style !== 'all') filter.style = style;
        if (subject && subject !== 'all') filter.subject = subject;
        if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
        if (featured === 'true') filter.isFeatured = true;

        // 全文搜索
        if (search) {
            filter.$text = { $search: search };
        }

        // 排序
        let sortOption = {};
        switch (sort) {
            case 'popular': sortOption = { views: -1 }; break;
            case 'most-copied': sortOption = { copyCount: -1 }; break;
            case 'oldest': sortOption = { createdAt: 1 }; break;
            default: sortOption = { createdAt: -1 }; // newest
        }
        if (search) sortOption = { score: { $meta: 'textScore' }, ...sortOption };

        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * pageSize;

        const [prompts, total] = await Promise.all([
            GalleryPrompt.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(pageSize)
                .select('-__v')
                .lean(),
            GalleryPrompt.countDocuments(filter)
        ]);

        // 如果用户已登录，标记是否已收藏/点赞
        if (req.user) {
            prompts.forEach(p => {
                p.isLiked = p.likes?.some(l => l.user?.toString() === req.user.id);
                p.isFavorited = p.favorites?.some(f => f.user?.toString() === req.user.id);
                p.likesCount = p.likes?.length || 0;
                p.favoritesCount = p.favorites?.length || 0;
                // 不返回完整 likes/favorites 数组
                delete p.likes;
                delete p.favorites;
            });
        } else {
            prompts.forEach(p => {
                p.likesCount = p.likes?.length || 0;
                p.favoritesCount = p.favorites?.length || 0;
                delete p.likes;
                delete p.favorites;
            });
        }

        res.json({
            prompts,
            pagination: {
                total,
                page: pageNum,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('画廊列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/gallery/featured
 * 精选提示词
 */
router.get('/featured', async (req, res) => {
    try {
        const { limit = 12 } = req.query;
        const prompts = await GalleryPrompt.find({
            isActive: true, isPublic: true, isFeatured: true
        })
            .sort({ views: -1 })
            .limit(Math.min(50, parseInt(limit)))
            .select('-likes -favorites -__v')
            .lean();

        prompts.forEach(p => {
            p.likesCount = 0;
            p.favoritesCount = 0;
        });

        res.json({ prompts });
    } catch (error) {
        console.error('精选列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/gallery/tags/popular
 * 热门标签
 */
router.get('/tags/popular', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const tags = await GalleryPrompt.aggregate([
            { $match: { isActive: true, isPublic: true } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.json({ tags: tags.map(t => ({ name: t._id, count: t.count })) });
    } catch (error) {
        console.error('热门标签错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/gallery/stats
 * 分类统计
 */
router.get('/stats', async (req, res) => {
    try {
        const [modelStats, useCaseStats, styleStats] = await Promise.all([
            GalleryPrompt.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$model', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            GalleryPrompt.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$useCase', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            GalleryPrompt.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$style', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        const total = await GalleryPrompt.countDocuments({ isActive: true });

        res.json({
            total,
            models: modelStats.map(s => ({ name: s._id, count: s.count })),
            useCases: useCaseStats.map(s => ({ name: s._id, count: s.count })),
            styles: styleStats.map(s => ({ name: s._id, count: s.count }))
        });
    } catch (error) {
        console.error('统计错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/gallery/search
 * 全文搜索
 */
router.get('/search', optionalAuth, async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;
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
            GalleryPrompt.find(filter, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .skip(skip)
                .limit(pageSize)
                .select('-likes -favorites -__v')
                .lean(),
            GalleryPrompt.countDocuments(filter)
        ]);

        res.json({
            prompts,
            pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) }
        });
    } catch (error) {
        console.error('搜索错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/gallery/:id
 * 画廊详情 + 浏览计数
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const prompt = await GalleryPrompt.findOneAndUpdate(
            { _id: req.params.id, isActive: true },
            { $inc: { views: 1 } },
            { new: true }
        ).select('-__v').lean();

        if (!prompt) {
            return res.status(404).json({ message: '提示词未找到' });
        }

        // 标记用户交互状态
        if (req.user) {
            prompt.isLiked = prompt.likes?.some(l => l.user?.toString() === req.user.id);
            prompt.isFavorited = prompt.favorites?.some(f => f.user?.toString() === req.user.id);
        }
        prompt.likesCount = prompt.likes?.length || 0;
        prompt.favoritesCount = prompt.favorites?.length || 0;
        delete prompt.likes;
        delete prompt.favorites;

        // 获取相关推荐
        const related = await GalleryPrompt.find({
            _id: { $ne: prompt._id },
            isActive: true,
            $or: [
                { model: prompt.model, useCase: prompt.useCase },
                { tags: { $in: prompt.tags?.slice(0, 3) || [] } }
            ]
        })
            .sort({ views: -1 })
            .limit(6)
            .select('title previewImage model tags views copyCount')
            .lean();

        res.json({ prompt, related });
    } catch (error) {
        console.error('详情错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * POST /api/gallery/:id/copy
 * 记录复制次数（无需登录）
 */
router.post('/:id/copy', async (req, res) => {
    try {
        const prompt = await GalleryPrompt.findByIdAndUpdate(
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
 * POST /api/gallery/:id/like
 * 点赞/取消点赞（需登录）
 */
router.post('/:id/like', requireAuth, async (req, res) => {
    try {
        const prompt = await GalleryPrompt.findById(req.params.id);
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
 * POST /api/gallery/:id/favorite
 * 收藏/取消收藏（需登录）
 */
router.post('/:id/favorite', requireAuth, async (req, res) => {
    try {
        const prompt = await GalleryPrompt.findById(req.params.id);
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
