const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, optionalAuth } = require('../middleware/auth');
const { updateActivityAnalytics } = require('../middleware/analytics');
const config = require('../config');

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath);

// 确保上传目录存在
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

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
        console.log('视频缩略图生成成功:', thumbnailPath);
        resolve(thumbnailPath);
      })
      .on('error', (err) => {
        console.error('视频缩略图生成失败:', err);
        reject(err);
      });
  });
};

// 异步处理视频缩略图
const processVideoThumbnail = async (videoFilePath, videoFileName, userId) => {
  try {
    const userThumbnailDir = path.join(config.upload.path, 'thumbnails', userId);
    ensureDirectoryExists(userThumbnailDir);
    
    const thumbnailFileName = videoFileName.replace(/\.[^/.]+$/, '.jpg');
    const thumbnailPath = path.join(userThumbnailDir, thumbnailFileName);
    
    await generateVideoThumbnail(videoFilePath, thumbnailPath);
    
    return {
      thumbnailPath,
      thumbnailUrl: `/uploads/thumbnails/${userId}/${thumbnailFileName}`
    };
  } catch (error) {
    console.error('处理视频缩略图失败:', error);
    return null;
  }
};

const router = express.Router();

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 获取用户ID并转换为字符串
    const userId = req.userId.toString();
    let uploadPath;
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(config.upload.path, 'images', userId);
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(config.upload.path, 'videos', userId);
    } else {
      uploadPath = path.join(config.upload.path, userId);
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB
  },
  fileFilter: (req, file, cb) => {
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

// 创建帖子
router.post('/', auth, upload.array('media', 9), [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('description').optional().isLength({ max: 2000 }).withMessage('描述不能超过2000个字符'),
  body('styleParams.sref').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { title, description, styleParams, tags } = req.body;
    
    // 处理上传的文件
    const media = await Promise.all((req.files || []).map(async (file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const fileType = isVideo ? 'videos' : 'images';
      const userId = req.userId;
      const mediaInfo = {
        type: isVideo ? 'video' : 'image',
        url: `/uploads/${fileType}/${userId}/${file.filename}`,
        size: file.size
      };

      // 如果是视频文件，生成缩略图
      if (isVideo) {
        const thumbnailResult = await processVideoThumbnail(file.path, file.filename, userId.toString());
        if (thumbnailResult) {
          mediaInfo.thumbnail = thumbnailResult.thumbnailUrl;
        }
      }

      return mediaInfo;
    }));

    // 处理标签
    const processedTags = tags ? 
      (Array.isArray(tags) ? tags : tags.split(','))
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0) : [];

    const post = new Post({
      title,
      description,
      styleParams: JSON.parse(styleParams || '{}'),
      media,
      tags: processedTags,
      author: req.userId
    });

    await post.save();
    
    // 更新用户统计
    await User.findByIdAndUpdate(req.userId, {
      $push: { posts: post._id },
      $inc: { 'stats.totalPosts': 1 }
    });

    await post.populate('author', 'username avatar');

    res.status(201).json({
      message: '帖子创建成功',
      post
    });
  } catch (error) {
    console.error('创建帖子错误:', error);
    res.status(500).json({ message: '创建帖子失败' });
  }
});

// 获取精选帖子 - 必须在 /:id 路由之前
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const posts = await Post.find({ 
      isPublic: true, 
      featured: true 
    })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    res.json({ 
      message: '获取精选帖子成功',
      data: { posts }
    });
  } catch (error) {
    console.error('获取精选帖子错误:', error);
    res.status(500).json({ message: '获取精选帖子失败' });
  }
});

// 搜索帖子 - 必须在 /:id 路由之前
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: '搜索关键词不能为空' });
    }

    const query = {
      isPublic: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('搜索帖子错误:', error);
    res.status(500).json({ message: '搜索失败' });
  }
});

// 根据标签获取帖子 - 必须在 /:id 路由之前
router.get('/tag/:tag', optionalAuth, async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const query = {
      isPublic: true,
      tags: { $in: [tag.toLowerCase()] }
    };

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('获取标签帖子错误:', error);
    res.status(500).json({ message: '获取帖子失败' });
  }
});

// 获取热门标签 - 必须在 /:id 路由之前
router.get('/tags/popular', async (req, res) => {
  try {
    const tags = await Post.aggregate([
      { $match: { isPublic: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({ tags });
  } catch (error) {
    console.error('获取热门标签错误:', error);
    res.status(500).json({ message: '获取标签失败' });
  }
});

// 获取帖子列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      sort = 'createdAt', 
      order = 'desc',
      tag,
      author,
      search,
      exclude
    } = req.query;

    const query = { isPublic: true };
    
    // 标签筛选
    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }
    
    // 作者筛选
    if (author) {
      query.author = author;
    }
    
    // 排除特定帖子
    if (exclude) {
      query._id = { $ne: exclude };
    }
    
    // 搜索
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({ message: '获取帖子列表失败' });
  }
});

// 更新帖子（用户只能更新自己的帖子）
router.put('/:id', auth, [
  body('title').optional().isLength({ min: 1 }).withMessage('标题不能为空'),
  body('description').optional().isLength({ max: 2000 }).withMessage('描述不能超过2000个字符'),
  body('styleParams').optional().isObject(),
  body('tags').optional().isArray(),
  body('isPublic').optional().isBoolean().withMessage('公开状态必须是布尔值')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 检查是否是帖子作者
    if (post.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: '只能编辑自己的帖子' });
    }

    const updateData = {};
    const { title, description, styleParams, tags, isPublic } = req.body;
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (styleParams !== undefined) updateData.styleParams = styleParams;
    if (tags !== undefined) updateData.tags = tags;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('author', 'username avatar');

    res.json({
      message: '帖子更新成功',
      post: updatedPost
    });
  } catch (error) {
    console.error('更新帖子错误:', error);
    res.status(500).json({ message: '更新帖子失败' });
  }
});

// 获取单个帖子详情 - 必须在最后，因为它会匹配任何路径
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar')
      .populate('likes.user', 'username avatar');

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 增加浏览量
    post.views += 1;
    await post.save();

    res.json({ post });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({ message: '获取帖子详情失败' });
  }
});

// 点赞/取消点赞
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === req.userId
    );

    const isLiking = likeIndex === -1;

    if (likeIndex > -1) {
      // 取消点赞
      post.likes.splice(likeIndex, 1);
    } else {
      // 点赞
      post.likes.push({ user: req.userId });
      
      // 创建点赞通知（异步，不阻塞响应）
      if (post.author.toString() !== req.userId) {
        Notification.createNotification({
          recipient: post.author,
          sender: req.userId,
          type: 'like',
          post: post._id
        }).catch(err => console.error('创建点赞通知失败:', err));
      }
    }

    await post.save();

    // 更新用户活动分析数据
    if (isLiking) {
      updateActivityAnalytics(req.userId, 'like').catch(err => 
        console.error('更新点赞分析数据失败:', err)
      );
    }

    res.json({
      message: isLiking ? '点赞成功' : '取消点赞成功',
      likesCount: post.likes.length,
      isLiked: isLiking
    });
  } catch (error) {
    console.error('点赞操作错误:', error);
    res.status(500).json({ message: '操作失败' });
  }
});

// 添加评论
router.post('/:id/comment', auth, [
  body('content').notEmpty().withMessage('评论内容不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const comment = {
      user: req.userId,
      content: req.body.content,
      parentComment: req.body.parentComment || null,
      replies: []
    };

    post.comments.push(comment);
    await post.save();

    // 创建评论通知（异步，不阻塞响应）
    if (post.author.toString() !== req.userId) {
      Notification.createNotification({
        recipient: post.author,
        sender: req.userId,
        type: 'comment',
        post: post._id,
        comment: post.comments[post.comments.length - 1]._id
      }).catch(err => console.error('创建评论通知失败:', err));
    }

    await post.populate('comments.user', 'username avatar');

    // 更新用户活动分析数据
    updateActivityAnalytics(req.userId, 'comment').catch(err => 
      console.error('更新评论分析数据失败:', err)
    );

    res.status(201).json({
      message: '评论添加成功',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({ message: '添加评论失败' });
  }
});

// 回复评论
router.post('/:id/comment/:commentId/reply', auth, [
  body('content').notEmpty().withMessage('回复内容不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const reply = {
      user: req.userId,
      content: req.body.content
    };

    comment.replies.push(reply);
    await post.save();

    // 创建回复通知（异步，不阻塞响应）
    if (comment.user.toString() !== req.userId) {
      Notification.createNotification({
        recipient: comment.user,
        sender: req.userId,
        type: 'reply',
        post: post._id,
        comment: comment._id
      }).catch(err => console.error('创建回复通知失败:', err));
    }

    await post.populate([
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.replies.user', select: 'username avatar' }
    ]);

    const updatedComment = post.comments.id(req.params.commentId);
    const newReply = updatedComment.replies[updatedComment.replies.length - 1];

    res.status(201).json({
      message: '回复添加成功',
      reply: newReply,
      commentId: req.params.commentId
    });
  } catch (error) {
    console.error('添加回复错误:', error);
    res.status(500).json({ message: '添加回复失败' });
  }
});

// 删除评论回复
router.delete('/:id/comment/:commentId/reply/:replyId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: '回复不存在' });
    }

    // 检查权限：只有回复作者或管理员可以删除
    if (reply.user.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: '没有权限删除此回复' });
    }

    reply.remove();
    await post.save();

    res.json({ message: '回复删除成功' });
  } catch (error) {
    console.error('删除回复错误:', error);
    res.status(500).json({ message: '删除回复失败' });
  }
});

module.exports = router;