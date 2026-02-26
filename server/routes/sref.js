const express = require('express');
const router = express.Router();
const SrefStyle = require('../models/SrefStyle');

const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) { /* ignore invalid token */ }
    }
    next();
};

const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: '请先登录' });
    try {
        const jwt = require('jsonwebtoken');
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ message: '登录已过期' });
    }
};

/**
 * GET /api/sref
 * Sref 列表（标签过滤 + 搜索 + 分页 + 排序）
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { tags, search, sort = 'newest', page = 1, limit = 24 } = req.query;

        const filter = { isActive: true };
        if (tags && tags !== 'all') {
            filter.tags = { $in: tags.split(',').map(t => t.trim()) };
        }
        if (search) {
            const re = new RegExp(search.trim(), 'i');
            filter.$or = [{ title: re }, { srefCode: re }, { tags: re }];
        }

        let sortOption = {};
        switch (sort) {
            case 'views':
            case 'popular': sortOption = { views: -1 }; break;
            case 'likes': sortOption = { likesCount: -1 }; break;
            case 'oldest': sortOption = { createdAt: 1 }; break;
            default: sortOption = { createdAt: -1 };
        }

        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * pageSize;

        const [srefs, total] = await Promise.all([
            SrefStyle.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(pageSize)
                .select('-likes -__v')
                .lean({ virtuals: true }),
            SrefStyle.countDocuments(filter),
        ]);

        // 标记已点赞
        if (req.user) {
            const fullDocs = await SrefStyle.find({ _id: { $in: srefs.map(s => s._id) } }, { likes: 1 }).lean();
            const likedSet = new Set(
                fullDocs.filter(d => d.likes?.some(l => l.user?.toString() === req.user.id)).map(d => d._id.toString())
            );
            srefs.forEach(s => { s.isLiked = likedSet.has(s._id.toString()); });
        }

        // 手动补充虚拟字段（lean() 不保证虚拟字段）
        srefs.forEach(s => {
            if (!s.previewImage && s.images && s.images.length > 0) {
                s.previewImage = `/output/sref_${s.srefCode}/images/${s.images[0]}`;
            }
            if (s.likesCount === undefined) s.likesCount = 0;
        });

        res.json({
            posts: srefs,
            pagination: { total, page: pageNum, limit: pageSize, pages: Math.ceil(total / pageSize) },
        });
    } catch (error) {
        console.error('Sref 列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/sref/tags/popular
 * 热门标签
 */
router.get('/tags/popular', async (req, res) => {
    try {
        const { limit = 30 } = req.query;
        const tags = await SrefStyle.aggregate([
            { $match: { isActive: true } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) },
        ]);
        res.json({ tags: tags.map(t => ({ name: t._id, count: t.count })) });
    } catch (error) {
        console.error('热门标签错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * GET /api/sref/:id
 * Sref 详情 + 浏览计数
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const sref = await SrefStyle.findOneAndUpdate(
            { _id: req.params.id, isActive: true },
            { $inc: { views: 1 } },
            { new: true }
        ).lean({ virtuals: true });

        if (!sref) return res.status(404).json({ message: 'Sref 未找到' });

        const base = `/output/sref_${sref.srefCode}`;
        sref.imageUrls = (sref.images || []).map(f => `${base}/images/${f}`);
        sref.videoUrls = (sref.videos || []).map(f => `${base}/videos/${f}`);
        if (req.user) {
            sref.isLiked = sref.likes?.some(l => l.user?.toString() === req.user.id);
        }
        sref.likesCount = sref.likes?.length || 0;
        delete sref.likes;

        // 相关推荐
        const related = await SrefStyle.find({
            _id: { $ne: sref._id },
            isActive: true,
            tags: { $in: sref.tags?.slice(0, 3) || [] },
        })
            .sort({ views: -1 })
            .limit(8)
            .select('-likes -__v')
            .lean({ virtuals: true });

        res.json({ post: sref, related });
    } catch (error) {
        console.error('Sref 详情错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * POST /api/sref/:id/like
 * 点赞/取消（需登录）
 */
router.post('/:id/like', requireAuth, async (req, res) => {
    try {
        const sref = await SrefStyle.findById(req.params.id);
        if (!sref) return res.status(404).json({ message: '未找到' });

        const idx = sref.likes.findIndex(l => l.user?.toString() === req.user.id);
        if (idx > -1) sref.likes.splice(idx, 1);
        else sref.likes.push({ user: req.user.id });
        await sref.save();

        res.json({ liked: idx === -1, likesCount: sref.likes.length });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;
