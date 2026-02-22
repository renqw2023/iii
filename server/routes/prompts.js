const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const PromptPost = require('../models/PromptPost');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const config = require('../config');

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath);

// 生成视频缩略图
const generateVideoThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '300x300'
      })
      .on('end', () => {
        console.log('缩略图生成成功:', thumbnailPath);
        resolve(thumbnailPath);
      })
      .on('error', (err) => {
        console.error('缩略图生成失败:', err);
        reject(err);
      });
  });
};

// 处理视频缩略图
const processVideoThumbnail = async (videoPath, userId) => {
  try {
    const videoFileName = path.basename(videoPath);
    const thumbnailFileName = videoFileName.replace(/\.[^/.]+$/, '.jpg');
    const thumbnailDir = path.join(__dirname, '../../uploads/thumbnails', userId.toString());
    
    // 确保缩略图目录存在
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }
    
    const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);
    const fullVideoPath = path.join(__dirname, '../..', videoPath);
    
    await generateVideoThumbnail(fullVideoPath, thumbnailPath);
    
    // 返回相对于uploads目录的路径
    return `/uploads/thumbnails/${userId}/${thumbnailFileName}`;
  } catch (error) {
    console.error('处理视频缩略图失败:', error);
    return null;
  }
};

// 文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.userId ? req.userId.toString() : 'anonymous';
    let uploadPath;
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(config.upload.path, 'prompts', 'images', userId);
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(config.upload.path, 'prompts', 'videos', userId);
    } else {
      uploadPath = path.join(config.upload.path, 'prompts', userId);
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prompt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 9 // 最多9个示例图片
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片和视频文件'));
    }
  }
});

// 获取提示词列表
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('category').optional().isIn(['character', 'landscape', 'architecture', 'abstract', 'fantasy', 'scifi', 'portrait', 'animal', 'object', 'style', 'other']).withMessage('无效的分类'),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('无效的难度等级'),
  query('sortBy').optional().isIn(['latest', 'oldest', 'trending', 'mostLiked', 'mostCopied']).withMessage('无效的排序方式'),
  query('search').optional().isLength({ max: 100 }).withMessage('搜索关键词不能超过100个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '请求参数错误',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, difficulty, sortBy = 'latest', search, tags } = req.query;

    // 构建查询条件
    const query = { isPublic: true, status: 'approved' };
    
    if (category) {
      query.category = category;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { prompt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }

    // 构建排序条件
    let sortCondition = {};
    switch (sortBy) {
      case 'oldest':
        sortCondition = { createdAt: 1 };
        break;
      case 'trending':
        sortCondition = { 'analytics.hotScore': -1, createdAt: -1 };
        break;
      case 'mostLiked':
        sortCondition = { 'likes.length': -1, createdAt: -1 };
        break;
      case 'mostCopied':
        sortCondition = { copyCount: -1, createdAt: -1 };
        break;
      case 'latest':
      default:
        sortCondition = { createdAt: -1 };
        break;
    }

    const prompts = await PromptPost.find(query)
      .populate('author', 'username avatar')
      .sort(sortCondition)
      .skip(skip)
      .limit(limit);

    const total = await PromptPost.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // 添加用户交互状态
    if (req.userId) {
      for (let prompt of prompts) {
        prompt.isLiked = prompt.likes.some(like => like.user.toString() === req.userId);
        prompt.isFavorited = prompt.favorites.some(fav => fav.user.toString() === req.userId);
      }
    }

    res.json({
      prompts,
      pagination: {
        current: page,
        pages: totalPages,
        total: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('获取提示词列表错误:', error);
    res.status(500).json({ message: '获取提示词列表失败' });
  }
});

// 获取精选提示词
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const prompts = await PromptPost.find({
      isPublic: true,
      isFeatured: true,
      status: 'approved'
    })
      .populate('author', 'username avatar')
      .sort({ 'analytics.hotScore': -1, createdAt: -1 })
      .limit(limit);

    // 添加用户交互状态
    if (req.userId) {
      for (let prompt of prompts) {
        prompt.isLiked = prompt.likes.some(like => like.user.toString() === req.userId);
        prompt.isFavorited = prompt.favorites.some(fav => fav.user.toString() === req.userId);
      }
    }

    res.json({ prompts });
  } catch (error) {
    console.error('获取精选提示词错误:', error);
    res.status(500).json({ message: '获取精选提示词失败' });
  }
});

// 获取热门标签
router.get('/tags/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const tags = await PromptPost.aggregate([
      { $match: { isPublic: true, status: 'approved' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({ tags });
  } catch (error) {
    console.error('获取热门标签错误:', error);
    res.status(500).json({ message: '获取热门标签失败' });
  }
});

// 获取用户收藏的提示词
router.get('/favorites', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    // 查找用户收藏的提示词
    const favoritePrompts = await PromptPost.find({
      'favorites.user': req.userId,
      isPublic: true
    })
    .populate('author', 'username avatar')
    .sort({ 'favorites.createdAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // 获取总数
    const total = await PromptPost.countDocuments({
      'favorites.user': req.userId,
      isPublic: true
    });

    // 为每个提示词添加用户相关信息
    const promptsWithUserInfo = favoritePrompts.map(prompt => {
      const promptObj = prompt.toObject();
      if (req.userId) {
        promptObj.isLiked = prompt.likes.some(like => like.user.toString() === req.userId);
        promptObj.isFavorited = prompt.favorites.some(fav => fav.user.toString() === req.userId);
      }
      return promptObj;
    });

    res.json({
      prompts: promptsWithUserInfo,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('获取收藏提示词错误:', error);
    res.status(500).json({ message: '获取收藏提示词失败' });
  }
});

// 创建新提示词
router.post('/', auth, upload.array('media', 9), [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('标题长度必须在1-100个字符之间'),
  body('prompt').trim().isLength({ min: 10, max: 5000 }).withMessage('提示词长度必须在10-5000个字符之间'),
  body('description').optional().isLength({ max: 2000 }).withMessage('描述不能超过2000个字符'),
  body('category').optional().isIn(['character', 'landscape', 'architecture', 'abstract', 'fantasy', 'scifi', 'portrait', 'animal', 'object', 'style', 'other']).withMessage('无效的分类'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('无效的难度等级'),
  body('expectedResult').optional().isLength({ max: 1000 }).withMessage('预期效果描述不能超过1000个字符'),
  body('tips').optional().isLength({ max: 1000 }).withMessage('使用技巧不能超过1000个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 删除已上传的文件
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(400).json({
        message: '输入数据有误',
        errors: errors.array()
      });
    }

    const {
      title,
      prompt,
      description,
      category = 'other',
      difficulty = 'beginner',
      expectedResult,
      tips,
      tags,
      styleParams,
      altTexts
    } = req.body;

    // 处理ATL文本数据
    let processedAltTexts = [];
    if (altTexts) {
      try {
        processedAltTexts = typeof altTexts === 'string' ? JSON.parse(altTexts) : altTexts;
      } catch (error) {
        processedAltTexts = [];
      }
    }

    // 处理媒体文件
    const media = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const userId = req.userId.toString();
        const fileType = file.mimetype.startsWith('image/') ? 'images' : 'videos';
        const altText = processedAltTexts[i] || '';
        const mediaItem = {
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url: `/uploads/prompts/${fileType}/${userId}/${file.filename}`,
          size: file.size,
          altText: altText.trim(),
          hasAltText: altText.trim().length > 0
        };
        
        // 如果是视频文件，生成缩略图
        if (file.mimetype.startsWith('video/')) {
          try {
            const thumbnailUrl = await processVideoThumbnail(mediaItem.url, userId);
            if (thumbnailUrl) {
              mediaItem.thumbnail = thumbnailUrl;
            }
          } catch (error) {
            console.error('生成视频缩略图失败:', error);
          }
        }
        
        media.push(mediaItem);
      }
    }

    // 处理标签
    let processedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        processedTags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag);
      }
    }

    // 处理风格参数
    let processedStyleParams = {};
    if (styleParams) {
      try {
        processedStyleParams = typeof styleParams === 'string' ? JSON.parse(styleParams) : styleParams;
      } catch (error) {
        processedStyleParams = {};
      }
    }

    const promptPost = new PromptPost({
      title,
      prompt,
      description,
      category,
      difficulty,
      expectedResult,
      tips,
      media,
      author: req.userId,
      tags: processedTags,
      styleParams: processedStyleParams
    });

    await promptPost.save();
    await promptPost.populate('author', 'username avatar');

    res.status(201).json({
      message: '提示词创建成功',
      prompt: promptPost
    });
  } catch (error) {
    console.error('创建提示词错误:', error);
    
    // 删除已上传的文件
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: '创建提示词失败' });
  }
});

// 获取单个提示词详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const prompt = await PromptPost.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar');

    if (!prompt) {
      return res.status(404).json({ message: '提示词不存在' });
    }

    // 检查访问权限
    if (!prompt.isPublic && (!req.userId || prompt.author._id.toString() !== req.userId)) {
      return res.status(403).json({ message: '无权访问此提示词' });
    }

    // 增加浏览量（避免作者自己浏览计数）
    if (!req.userId || prompt.author._id.toString() !== req.userId) {
      prompt.views += 1;
      await prompt.save();
    }

    // 添加用户交互状态
    if (req.userId) {
      prompt.isLiked = prompt.likes.some(like => like.user.toString() === req.userId);
      prompt.isFavorited = prompt.favorites.some(fav => fav.user.toString() === req.userId);
    }

    res.json({ prompt });
  } catch (error) {
    console.error('获取提示词详情错误:', error);
    res.status(500).json({ message: '获取提示词详情失败' });
  }
});

// 点赞/取消点赞提示词
router.post('/:id/like', auth, async (req, res) => {
  try {
    const prompt = await PromptPost.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ message: '提示词不存在' });
    }

    const existingLike = prompt.likes.find(like => like.user.toString() === req.userId);
    
    if (existingLike) {
      // 取消点赞
      prompt.likes = prompt.likes.filter(like => like.user.toString() !== req.userId);
    } else {
      // 添加点赞
      prompt.likes.push({ user: req.userId });
    }

    // 更新热度分数
    prompt.updateHotScore();
    await prompt.save();

    res.json({
      message: existingLike ? '取消点赞成功' : '点赞成功',
      isLiked: !existingLike,
      likesCount: prompt.likes.length
    });
  } catch (error) {
    console.error('点赞操作错误:', error);
    res.status(500).json({ message: '点赞操作失败' });
  }
});

// 收藏/取消收藏提示词
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const prompt = await PromptPost.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ message: '提示词不存在' });
    }

    const existingFavorite = prompt.favorites.find(fav => fav.user.toString() === req.userId);
    
    if (existingFavorite) {
      // 取消收藏
      prompt.favorites = prompt.favorites.filter(fav => fav.user.toString() !== req.userId);
    } else {
      // 添加收藏
      prompt.favorites.push({ user: req.userId });
    }

    await prompt.save();

    res.json({
      message: existingFavorite ? '取消收藏成功' : '收藏成功',
      isFavorited: !existingFavorite,
      favoritesCount: prompt.favorites.length
    });
  } catch (error) {
    console.error('收藏操作错误:', error);
    res.status(500).json({ message: '收藏操作失败' });
  }
});

// 复制提示词（记录复制次数）
router.post('/:id/copy', optionalAuth, async (req, res) => {
  try {
    const prompt = await PromptPost.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ message: '提示词不存在' });
    }

    // 增加复制次数
    prompt.copyCount += 1;
    
    // 记录复制历史
    if (req.userId) {
      prompt.analytics.copyHistory.push({
        user: req.userId,
        ipAddress: req.ip
      });
    }

    // 更新热度分数
    prompt.updateHotScore();
    await prompt.save();

    res.json({
      message: '复制成功',
      fullPrompt: prompt.getFullPrompt(),
      copyCount: prompt.copyCount
    });
  } catch (error) {
    console.error('复制提示词错误:', error);
    res.status(500).json({ message: '复制提示词失败' });
  }
});

// 添加评论
router.post('/:id/comment', auth, [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('评论内容长度必须在1-500个字符之间'),
  body('parentComment').optional().isMongoId().withMessage('无效的父评论ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入数据有误',
        errors: errors.array()
      });
    }

    const { content, parentComment } = req.body;
    const prompt = await PromptPost.findById(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ message: '提示词不存在' });
    }

    if (parentComment) {
      // 回复评论
      const parentCommentObj = prompt.comments.id(parentComment);
      if (!parentCommentObj) {
        return res.status(404).json({ message: '父评论不存在' });
      }
      
      parentCommentObj.replies.push({
        user: req.userId,
        content
      });
    } else {
      // 新评论
      prompt.comments.push({
        user: req.userId,
        content
      });
    }

    // 更新热度分数
    prompt.updateHotScore();
    await prompt.save();
    await prompt.populate('comments.user', 'username avatar');
    await prompt.populate('comments.replies.user', 'username avatar');

    res.json({
      message: '评论添加成功',
      comments: prompt.comments
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({ message: '添加评论失败' });
  }
});

// 获取相关提示词
router.get('/:id/related', optionalAuth, [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('每页数量必须在1-20之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '请求参数错误',
        errors: errors.array()
      });
    }

    const limit = parseInt(req.query.limit) || 6;
    const currentPrompt = await PromptPost.findById(req.params.id);
    
    if (!currentPrompt) {
      return res.status(404).json({ message: '提示词不存在' });
    }

    // 构建查询条件：相同分类或标签的公开提示词，排除当前提示词
    const query = {
      _id: { $ne: req.params.id },
      isPublic: true,
      status: 'approved',
      $or: [
        { category: currentPrompt.category },
        { tags: { $in: currentPrompt.tags } }
      ]
    };

    const relatedPrompts = await PromptPost.find(query)
      .populate('author', 'username avatar')
      .sort({ 'analytics.hotScore': -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // 添加用户交互状态
    if (req.userId) {
      for (let prompt of relatedPrompts) {
        prompt.isLiked = prompt.likes.some(like => like.user.toString() === req.userId);
        prompt.isFavorited = prompt.favorites.some(fav => fav.user.toString() === req.userId);
      }
    }

    res.json({ prompts: relatedPrompts });
  } catch (error) {
    console.error('获取相关提示词错误:', error);
    res.status(500).json({ message: '获取相关提示词失败' });
  }
});

// 更新提示词
router.put('/:id', auth, upload.array('media', 9), [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('标题长度必须在1-100个字符之间'),
  body('prompt').trim().isLength({ min: 10, max: 5000 }).withMessage('提示词长度必须在10-5000个字符之间'),
  body('description').optional().isLength({ max: 2000 }).withMessage('描述不能超过2000个字符'),
  body('category').optional().isIn(['character', 'landscape', 'architecture', 'abstract', 'fantasy', 'scifi', 'portrait', 'animal', 'object', 'style', 'other']).withMessage('无效的分类'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('无效的难度等级'),
  body('expectedResult').optional().isLength({ max: 1000 }).withMessage('预期效果描述不能超过1000个字符'),
  body('tips').optional().isLength({ max: 1000 }).withMessage('使用技巧不能超过1000个字符'),
  body('isPublic').optional().custom((value) => {
    if (typeof value === 'boolean') return true;
    if (value === 'true' || value === 'false') return true;
    throw new Error('公开状态必须为布尔类型或布尔字符串');
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 删除已上传的文件
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(400).json({
        message: '输入数据有误',
        errors: errors.array()
      });
    }

    // 查找提示词并验证权限
    const prompt = await PromptPost.findById(req.params.id);
    if (!prompt) {
      // 删除已上传的文件
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(404).json({ message: '提示词不存在' });
    }

    // 检查权限：只有作者可以修改
    // console.log('权限验证调试信息:', {
    //   promptId: req.params.id,
    //   promptAuthor: prompt.author,
    //   promptAuthorString: prompt.author.toString(),
    //   reqUserId: req.userId,
    //   reqUserIdString: req.userId.toString(),
    //   isEqual: prompt.author.toString() === req.userId.toString(),
    //   authorType: typeof prompt.author,
    //   userIdType: typeof req.userId
    // });
    
    if (prompt.author.toString() !== req.userId.toString()) {
      // 删除已上传的文件
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(403).json({ message: '无权修改此提示词' });
    }

    const {
      title,
      prompt: promptContent,
      description,
      category,
      difficulty,
      expectedResult,
      tips,
      isPublic,
      tags,
      mjParams,
      altTexts
    } = req.body;

    // 处理ALT文本数据
    let processedAltTexts = [];
    if (altTexts) {
      try {
        processedAltTexts = typeof altTexts === 'string' ? JSON.parse(altTexts) : altTexts;
      } catch (error) {
        processedAltTexts = [];
      }
    }

    // 处理标签
    let processedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => tag && tag.trim().length > 0);
      }
    }

    // 处理MJ参数
    let processedMjParams = {};
    if (mjParams) {
      if (typeof mjParams === 'string') {
        try {
          processedMjParams = JSON.parse(mjParams);
        } catch (e) {
          processedMjParams = {};
        }
      } else if (typeof mjParams === 'object') {
        processedMjParams = mjParams;
      }
    }

    // 处理新上传的媒体文件
    let newMediaFiles = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const userId = req.userId.toString();
          const fileType = file.mimetype.startsWith('image/') ? 'images' : 'videos';
          const altText = processedAltTexts[i] || '';
          const mediaFile = {
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            url: `/uploads/prompts/${fileType}/${userId}/${file.filename}`,
            size: file.size,
            altText: altText.trim(),
            hasAltText: altText.trim().length > 0
          };

          // 如果是视频文件，生成缩略图
          if (file.mimetype.startsWith('video/')) {
            try {
              const thumbnailUrl = await processVideoThumbnail(mediaFile.url, userId);
              if (thumbnailUrl) {
                mediaFile.thumbnail = thumbnailUrl;
              }
            } catch (error) {
              console.error('生成视频缩略图失败:', error);
            }
          }

          newMediaFiles.push(mediaFile);
        } catch (error) {
          console.error('处理媒体文件错误:', error);
          // 删除出错的文件
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }

    // 更新提示词数据
    const updateData = {
      title,
      prompt: promptContent,
      description: description || '',
      category: category || 'other',
      difficulty: difficulty || 'beginner',
      expectedResult: expectedResult || '',
      tips: tips || '',
      tags: processedTags,
      mjParams: processedMjParams,
      updatedAt: new Date()
    };

    // 如果提供了isPublic参数，则更新
    if (isPublic !== undefined) {
      if (typeof isPublic === 'boolean') {
        updateData.isPublic = isPublic;
      } else if (isPublic === 'true' || isPublic === 'false') {
        updateData.isPublic = isPublic === 'true';
      }
    }

    // 如果有新的媒体文件，添加到现有媒体文件中
    if (newMediaFiles.length > 0) {
      updateData.media = [...(prompt.media || []), ...newMediaFiles];
    }

    // 更新提示词
    const updatedPrompt = await PromptPost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('author', 'username avatar bio');

    res.json({
      message: '提示词更新成功',
      prompt: updatedPrompt
    });

  } catch (error) {
    console.error('更新提示词错误:', error);
    
    // 删除已上传的文件
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: '更新提示词失败' });
  }
});

// 获取用户的提示词
router.get('/user/:userId', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '请求参数错误',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { userId } = req.params;

    // 构建查询条件
    const query = { author: userId, status: 'approved' };
    
    // 如果不是作者本人，只显示公开的提示词
    if (!req.userId || req.userId !== userId) {
      query.isPublic = true;
    }

    const prompts = await PromptPost.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PromptPost.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // 添加用户交互状态
    if (req.userId) {
      for (let prompt of prompts) {
        prompt.isLiked = prompt.likes.some(like => like.user.toString() === req.userId);
        prompt.isFavorited = prompt.favorites.some(fav => fav.user.toString() === req.userId);
      }
    }

    res.json({
      prompts,
      pagination: {
        current: page,
        pages: totalPages,
        total: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('获取用户提示词错误:', error);
    res.status(500).json({ message: '获取用户提示词失败' });
  }
});



// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超过限制，单个文件最大20MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: '文件数量超过限制，最多上传9个文件' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: '上传的文件字段不正确' });
    }
  }
  
  if (error.message === '只支持图片和视频文件') {
    return res.status(400).json({ message: '不支持的文件格式，请选择图片或视频文件' });
  }
  
  // 传递给下一个错误处理中间件
  next(error);
});

module.exports = router;