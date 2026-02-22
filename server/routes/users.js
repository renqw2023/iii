const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 获取用户收藏的帖子 - 必须放在 /:id 路由之前
router.get('/favorites', auth, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    
    const user = await User.findById(req.userId).select('favorites');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const total = user.favorites.length;
    const skip = (page - 1) * limit;
    
    const favorites = await Post.find({
      _id: { $in: user.favorites }
    })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({
      favorites,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({ message: '获取收藏列表失败' });
  }
});

// 搜索用户 - 必须放在 /:id 路由之前
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({
        users: [],
        pagination: {
          current: 1,
          pages: 0,
          total: 0
        }
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const skip = (page - 1) * limit;

    const users = await User.find({
      $or: [
        { username: searchRegex },
        { bio: searchRegex }
      ],
      'settings.profileVisibility': 'public'
    })
    .select('username avatar bio')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

    const total = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { bio: searchRegex }
      ],
      'settings.profileVisibility': 'public'
    });

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({ message: '搜索用户失败' });
  }
});

// 获取用户资料
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar')
      .select('-password -email');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查是否为当前用户或用户资料是否公开
    const isOwnProfile = req.userId && req.userId.toString() === user._id.toString();
    const isPublic = user.settings.profileVisibility === 'public';

    if (!isOwnProfile && !isPublic) {
      return res.status(403).json({ message: '该用户资料为私密状态' });
    }

    // 获取用户的帖子
    const posts = await Post.find({ 
      author: user._id, 
      isPublic: true 
    })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(12);

    // 检查当前用户是否关注了该用户
    const isFollowing = req.userId ? 
      user.followers.some(follower => follower._id.toString() === req.userId.toString()) : 
      false;

    res.json({
      user: {
        ...user.toObject(),
        isFollowing,
        postsCount: posts.length
      },
      posts
    });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({ message: '获取用户资料失败' });
  }
});

// 更新用户资料
router.put('/profile', auth, [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('个人简介不能超过200个字符'),
  // 隐私设置验证
  body('settings.profileVisibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('资料可见性设置无效'),
  body('settings.showEmail')
    .optional()
    .isBoolean()
    .withMessage('邮箱显示设置必须为布尔值'),
  body('settings.showLocation')
    .optional()
    .isBoolean()
    .withMessage('位置显示设置必须为布尔值'),
  body('settings.allowFollow')
    .optional()
    .isBoolean()
    .withMessage('允许关注设置必须为布尔值'),
  body('settings.allowComments')
    .optional()
    .isBoolean()
    .withMessage('允许评论设置必须为布尔值'),
  body('settings.allowMessages')
    .optional()
    .isBoolean()
    .withMessage('允许私信设置必须为布尔值'),
  // 通知设置验证
  body('settings.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('邮件通知设置必须为布尔值'),
  body('settings.pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('推送通知设置必须为布尔值'),
  body('settings.likeNotifications')
    .optional()
    .isBoolean()
    .withMessage('点赞通知设置必须为布尔值'),
  body('settings.commentNotifications')
    .optional()
    .isBoolean()
    .withMessage('评论通知设置必须为布尔值'),
  body('settings.followNotifications')
    .optional()
    .isBoolean()
    .withMessage('关注通知设置必须为布尔值'),
  body('settings.weeklyDigest')
    .optional()
    .isBoolean()
    .withMessage('每周摘要设置必须为布尔值'),
  // 外观设置验证
  body('settings.theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('主题设置无效'),
  body('settings.language')
    .optional()
    .isIn(['zh-CN', 'zh-TW', 'en', 'ja'])
    .withMessage('语言设置无效'),
  body('settings.timezone')
    .optional()
    .isString()
    .withMessage('时区设置必须为字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { username, bio, avatar, location, website, settings } = req.body;
    const updateData = {};

    if (username) {
      // 检查用户名是否已被使用
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ message: '用户名已被使用' });
      }
      updateData.username = username;
    }

    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (settings) {
      // 获取当前用户的settings
      const currentUser = await User.findById(req.userId).select('settings');
      updateData.settings = { 
        ...currentUser.settings.toObject(), 
        ...settings 
      };
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: '资料更新成功',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({ message: '更新资料失败' });
  }
});

// 更新密码
router.put('/password', auth, [
  body('currentPassword').notEmpty().withMessage('请输入当前密码'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码长度至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证当前密码
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: '当前密码错误' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({ message: '密码更新成功' });
  } catch (error) {
    console.error('更新密码错误:', error);
    res.status(500).json({ message: '更新密码失败' });
  }
});

// 关注/取消关注用户
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: '不能关注自己' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // 取消关注
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // 关注
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      
      // 创建关注通知（异步，不阻塞响应）
      Notification.createNotification({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow'
      }).catch(err => console.error('创建关注通知失败:', err));
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      message: isFollowing ? '取消关注成功' : '关注成功',
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length
    });
  } catch (error) {
    console.error('关注操作错误:', error);
    res.status(500).json({ message: '操作失败' });
  }
});

// 获取用户的关注者列表
router.get('/:id/followers', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(req.params.id).select('followers');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const total = user.followers.length;
    const skip = (page - 1) * limit;
    
    const followers = await User.find({
      _id: { $in: user.followers }
    })
    .select('username avatar bio createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({
      followers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('获取关注者列表错误:', error);
    res.status(500).json({ message: '获取关注者列表失败' });
  }
});

// 获取用户的关注列表
router.get('/:id/following', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(req.params.id).select('following');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const total = user.following.length;
    const skip = (page - 1) * limit;
    
    const following = await User.find({
      _id: { $in: user.following }
    })
    .select('username avatar bio createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({
      following,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('获取关注列表错误:', error);
    res.status(500).json({ message: '获取关注列表失败' });
  }
});



// 收藏/取消收藏帖子
router.post('/favorites/:postId', auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const user = await User.findById(req.userId);
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const isFavorited = user.favorites.includes(postId);

    if (isFavorited) {
      // 取消收藏
      user.favorites.pull(postId);
    } else {
      // 收藏
      user.favorites.push(postId);
    }

    await user.save();

    res.json({
      message: isFavorited ? '取消收藏成功' : '收藏成功',
      isFavorited: !isFavorited
    });
  } catch (error) {
    console.error('收藏操作错误:', error);
    res.status(500).json({ message: '操作失败' });
  }
});

// 获取用户统计信息
router.get('/:id/stats', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password -email');
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查是否为当前用户或用户资料是否公开
    const isOwnProfile = req.userId && req.userId.toString() === userId;
    const isPublic = user.settings.profileVisibility === 'public';

    if (!isOwnProfile && !isPublic) {
      return res.status(403).json({ message: '该用户资料为私密状态' });
    }

    // 获取格式参考(Post)统计数据
    const [postsCount, postLikes, postViews] = await Promise.all([
      Post.countDocuments({ author: user._id, isPublic: true }),
      Post.aggregate([
        { $match: { author: user._id, isPublic: true } },
        { $project: { likesCount: { $size: '$likes' } } },
        { $group: { _id: null, total: { $sum: '$likesCount' } } }
      ]),
      Post.aggregate([
        { $match: { author: user._id, isPublic: true } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ])
    ]);

    // 获取提示词(PromptPost)统计数据
    const PromptPost = require('../models/PromptPost');
    const [promptsCount, promptLikes, promptViews] = await Promise.all([
      PromptPost.countDocuments({ author: user._id, isPublic: true }),
      PromptPost.aggregate([
        { $match: { author: user._id, isPublic: true } },
        { $project: { likesCount: { $size: '$likes' } } },
        { $group: { _id: null, total: { $sum: '$likesCount' } } }
      ]),
      PromptPost.aggregate([
        { $match: { author: user._id, isPublic: true } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ])
    ]);

    const stats = {
      // 分别统计格式参考和提示词数据
      formatReference: {
        posts: postsCount,
        likes: postLikes[0]?.total || 0,
        views: postViews[0]?.total || 0
      },
      prompts: {
        posts: promptsCount,
        likes: promptLikes[0]?.total || 0,
        views: promptViews[0]?.total || 0
      },
      // 总计数据
      totalPosts: postsCount + promptsCount,
      totalLikes: (postLikes[0]?.total || 0) + (promptLikes[0]?.total || 0),
      totalViews: (postViews[0]?.total || 0) + (promptViews[0]?.total || 0),
      totalFollowers: user.followers.length,
      totalFollowing: user.following.length,
      totalFavorites: user.favorites.length,
      // 保持向后兼容
      posts: postsCount + promptsCount,
      likes: (postLikes[0]?.total || 0) + (promptLikes[0]?.total || 0),
      views: (postViews[0]?.total || 0) + (promptViews[0]?.total || 0),
      followers: user.followers.length,
      following: user.following.length,
      favorites: user.favorites.length
    };

    res.json({ stats });
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({ message: '获取用户统计失败' });
  }
});

// 删除账户
router.delete('/account', auth, [
  body('password').notEmpty().withMessage('请输入密码确认删除')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { password } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '密码错误' });
    }

    // 删除用户相关数据
    await Promise.all([
      // 删除用户的帖子
      Post.deleteMany({ author: req.userId }),
      // 删除用户的通知
      Notification.deleteMany({ 
        $or: [
          { recipient: req.userId },
          { sender: req.userId }
        ]
      }),
      // 从其他用户的关注列表中移除
      User.updateMany(
        { following: req.userId },
        { $pull: { following: req.userId } }
      ),
      // 从其他用户的粉丝列表中移除
      User.updateMany(
        { followers: req.userId },
        { $pull: { followers: req.userId } }
      ),
      // 从其他用户的收藏中移除该用户的帖子
      User.updateMany(
        {},
        { $pull: { favorites: { $in: await Post.find({ author: req.userId }).distinct('_id') } } }
      )
    ]);

    // 最后删除用户
    await User.findByIdAndDelete(req.userId);

    res.json({ message: '账户删除成功' });
  } catch (error) {
    console.error('删除账户错误:', error);
    res.status(500).json({ message: '删除账户失败' });
  }
});

module.exports = router;