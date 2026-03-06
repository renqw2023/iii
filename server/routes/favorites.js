const express = require('express');
const { body, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const SrefStyle = require('../models/SrefStyle');
const GalleryPrompt = require('../models/GalleryPrompt');
const SeedancePrompt = require('../models/SeedancePrompt');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 根据类型获取内容详情（用于列表展示）
const getTargetDetails = async (type, ids) => {
  if (!ids.length) return {};
  const map = {};
  let docs = [];
  if (type === 'sref') {
    docs = await SrefStyle.find({ _id: { $in: ids } })
      .select('srefCode previewImage title').lean();
  } else if (type === 'gallery') {
    docs = await GalleryPrompt.find({ _id: { $in: ids } })
      .select('title previewImage prompt').lean();
  } else if (type === 'seedance') {
    docs = await SeedancePrompt.find({ _id: { $in: ids } })
      .select('title previewImage videoUrl').lean();
  }
  docs.forEach(d => { map[d._id.toString()] = d; });
  return map;
};

// GET /api/favorites — 获取收藏列表
router.get('/', auth, [
  query('type').optional().isIn(['sref', 'gallery', 'seedance']).withMessage('type 参数无效'),
  query('page').optional().isInt({ min: 1 }).withMessage('page 必须为正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: '参数错误', errors: errors.array() });
    }

    const { type, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.userId };
    if (type) filter.targetType = type;

    const total = await Favorite.countDocuments(filter);
    const favorites = await Favorite.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // 按类型分组，批量获取内容详情
    const grouped = {};
    favorites.forEach(f => {
      if (!grouped[f.targetType]) grouped[f.targetType] = [];
      grouped[f.targetType].push(f.targetId);
    });

    const detailMaps = {};
    for (const t of Object.keys(grouped)) {
      detailMaps[t] = await getTargetDetails(t, grouped[t]);
    }

    // 合并详情
    const result = favorites.map(f => ({
      _id: f._id,
      targetType: f.targetType,
      targetId: f.targetId,
      createdAt: f.createdAt,
      target: detailMaps[f.targetType]?.[f.targetId.toString()] || null,
    }));

    res.json({
      data: {
        favorites: result,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ message: '获取收藏列表失败' });
  }
});

// POST /api/favorites — 添加收藏
router.post('/', auth, [
  body('targetType').isIn(['sref', 'gallery', 'seedance']).withMessage('targetType 无效'),
  body('targetId').notEmpty().withMessage('targetId 不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: '参数错误', errors: errors.array() });
    }

    const { targetType, targetId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'targetId 格式无效' });
    }

    const favorite = new Favorite({
      userId: req.userId,
      targetType,
      targetId,
    });

    await favorite.save();

    res.status(201).json({
      message: '收藏成功',
      data: { favoriteId: favorite._id }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '已经收藏过了' });
    }
    console.error('添加收藏失败:', error);
    res.status(500).json({ message: '收藏失败，请稍后重试' });
  }
});

// DELETE /api/favorites/:targetType/:targetId — 取消收藏
router.delete('/:targetType/:targetId', auth, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (!['sref', 'gallery', 'seedance'].includes(targetType)) {
      return res.status(400).json({ message: 'targetType 无效' });
    }
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'targetId 格式无效' });
    }

    const result = await Favorite.findOneAndDelete({
      userId: req.userId,
      targetType,
      targetId,
    });

    if (!result) {
      return res.status(404).json({ message: '收藏记录不存在' });
    }

    res.json({ message: '已取消收藏' });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({ message: '取消收藏失败，请稍后重试' });
  }
});

// GET /api/favorites/check — 批量检查收藏状态
// Query: targetType=sref&targetIds=id1,id2,id3
router.get('/check', auth, async (req, res) => {
  try {
    const { targetType, targetIds } = req.query;

    if (!targetType || !['sref', 'gallery', 'seedance'].includes(targetType)) {
      return res.status(400).json({ message: 'targetType 无效' });
    }
    if (!targetIds) {
      return res.json({ data: {} });
    }

    const ids = targetIds.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
    if (!ids.length) return res.json({ data: {} });

    const favorites = await Favorite.find({
      userId: req.userId,
      targetType,
      targetId: { $in: ids },
    }).select('targetId').lean();

    const result = {};
    ids.forEach(id => { result[id] = false; });
    favorites.forEach(f => { result[f.targetId.toString()] = true; });

    res.json({ data: result });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({ message: '检查失败' });
  }
});

module.exports = router;
