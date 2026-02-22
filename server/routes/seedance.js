const express = require('express');
const router = express.Router();
const SeedancePrompt = require('../models/SeedancePrompt');

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
            category, tags, search,
            sort = 'newest', page = 1, limit = 12, featured
        } = req.query;

        const filter = { isActive: true, isPublic: true };

        if (category && category !== 'all') filter.category = category;
        if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
        if (featured === 'true') filter.isFeatured = true;
        if (search) filter.$text = { $search: search };

        let sortOption = {};
        switch (sort) {
            case 'popular': sortOption = { views: -1 }; break;
            case 'most-copied': sortOption = { copyCount: -1 }; break;
            case 'oldest': sortOption = { createdAt: 1 }; break;
            default: sortOption = { createdAt: -1 };
        }

        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * pageSize;

        const [prompts, total] = await Promise.all([
            SeedancePrompt.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(pageSize)
                .select('-__v')
                .lean(),
            SeedancePrompt.countDocuments(filter)
        ]);

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
        });

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
 * GET /api/seedance/:id
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const prompt = await SeedancePrompt.findOneAndUpdate(
            { _id: req.params.id, isActive: true },
            { $inc: { views: 1 } },
            { new: true }
        ).select('-__v').lean();

        if (!prompt) {
            return res.status(404).json({ message: '未找到' });
        }

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
