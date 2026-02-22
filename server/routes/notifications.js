const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// 获取用户通知列表
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('unreadOnly').optional().isBoolean().withMessage('未读筛选必须是布尔值'),
  query('type').optional().isIn(['like', 'comment', 'follow', 'unfollow', 'post_featured', 'system']).withMessage('通知类型无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '请求参数错误', 
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = config.pagination.defaultLimit,
      unreadOnly = false,
      type = null
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), config.pagination.maxLimit),
      unreadOnly: unreadOnly === 'true',
      type
    };

    const result = await Notification.getUserNotifications(req.userId, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取通知列表错误:', error);
    res.status(500).json({ message: '获取通知列表失败' });
  }
});

// 获取未读通知数量
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.userId);
    
    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('获取未读通知数量错误:', error);
    res.status(500).json({ message: '获取未读通知数量失败' });
  }
});

// 标记通知为已读
router.put('/mark-read', auth, [
  body('notificationIds').optional().isArray().withMessage('通知ID列表必须是数组'),
  body('notificationIds.*').optional().isMongoId().withMessage('通知ID格式无效'),
  body('markAll').optional().isBoolean().withMessage('全部标记必须是布尔值')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '请求参数错误', 
        errors: errors.array() 
      });
    }

    const { notificationIds, markAll = false } = req.body;

    let result;
    if (markAll) {
      // 标记所有未读通知为已读
      result = await Notification.markAsRead(req.userId);
    } else if (notificationIds && notificationIds.length > 0) {
      // 标记指定通知为已读
      result = await Notification.markAsRead(req.userId, notificationIds);
    } else {
      return res.status(400).json({ message: '请提供要标记的通知ID或设置markAll为true' });
    }

    res.json({
      success: true,
      message: '通知已标记为已读',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('标记通知已读错误:', error);
    res.status(500).json({ message: '标记通知已读失败' });
  }
});

// 删除通知
router.delete('/', auth, [
  body('notificationIds').isArray({ min: 1 }).withMessage('通知ID列表必须是非空数组'),
  body('notificationIds.*').isMongoId().withMessage('通知ID格式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '请求参数错误', 
        errors: errors.array() 
      });
    }

    const { notificationIds } = req.body;

    const result = await Notification.deleteNotifications(req.userId, notificationIds);

    res.json({
      success: true,
      message: '通知已删除',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('删除通知错误:', error);
    res.status(500).json({ message: '删除通知失败' });
  }
});

// 清空所有已读通知
router.delete('/clear-read', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.userId,
      read: true,
      isDeleted: false
    });

    res.json({
      success: true,
      message: '已清空所有已读通知',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('清空已读通知错误:', error);
    res.status(500).json({ message: '清空已读通知失败' });
  }
});

// 获取通知设置（预留接口）
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('settings');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const settings = {
      emailNotifications: user.settings.emailNotifications,
      pushNotifications: user.settings.pushNotifications,
      notificationTypes: {
        likes: user.settings.likeNotifications,
        comments: user.settings.commentNotifications,
        follows: user.settings.followNotifications,
        featured: true, // 暂时硬编码，可以后续添加到模型中
        system: true // 暂时硬编码，可以后续添加到模型中
      },
      weeklyDigest: user.settings.weeklyDigest
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取通知设置错误:', error);
    res.status(500).json({ message: '获取通知设置失败' });
  }
});

// 更新通知设置
router.put('/settings', auth, [
  body('emailNotifications').optional().isBoolean().withMessage('邮件通知设置必须是布尔值'),
  body('pushNotifications').optional().isBoolean().withMessage('推送通知设置必须是布尔值'),
  body('notificationTypes').optional().isObject().withMessage('通知类型设置必须是对象'),
  body('notificationTypes.likes').optional().isBoolean().withMessage('点赞通知设置必须是布尔值'),
  body('notificationTypes.comments').optional().isBoolean().withMessage('评论通知设置必须是布尔值'),
  body('notificationTypes.follows').optional().isBoolean().withMessage('关注通知设置必须是布尔值'),
  body('notificationTypes.featured').optional().isBoolean().withMessage('精选通知设置必须是布尔值'),
  body('notificationTypes.system').optional().isBoolean().withMessage('系统通知设置必须是布尔值'),
  body('weeklyDigest').optional().isBoolean().withMessage('每周摘要设置必须是布尔值')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '请求参数错误', 
        errors: errors.array() 
      });
    }

    const { emailNotifications, pushNotifications, notificationTypes, weeklyDigest } = req.body;
    
    // 构建更新对象
    const updateData = {};
    if (emailNotifications !== undefined) updateData['settings.emailNotifications'] = emailNotifications;
    if (pushNotifications !== undefined) updateData['settings.pushNotifications'] = pushNotifications;
    if (weeklyDigest !== undefined) updateData['settings.weeklyDigest'] = weeklyDigest;
    
    if (notificationTypes) {
      if (notificationTypes.likes !== undefined) updateData['settings.likeNotifications'] = notificationTypes.likes;
      if (notificationTypes.comments !== undefined) updateData['settings.commentNotifications'] = notificationTypes.comments;
      if (notificationTypes.follows !== undefined) updateData['settings.followNotifications'] = notificationTypes.follows;
    }

    // 更新用户设置
    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('settings');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      success: true,
      message: '通知设置已更新',
      data: {
        emailNotifications: user.settings.emailNotifications,
        pushNotifications: user.settings.pushNotifications,
        notificationTypes: {
          likes: user.settings.likeNotifications,
          comments: user.settings.commentNotifications,
          follows: user.settings.followNotifications,
          featured: true,
          system: true
        },
        weeklyDigest: user.settings.weeklyDigest
      }
    });
  } catch (error) {
    console.error('更新通知设置错误:', error);
    res.status(500).json({ message: '更新通知设置失败' });
  }
});

// 创建系统通知（管理员专用）
router.post('/system', auth, [
  body('message').notEmpty().withMessage('通知消息不能为空'),
  body('recipients').optional().isArray().withMessage('接收者列表必须是数组'),
  body('recipients.*').optional().isMongoId().withMessage('接收者ID格式无效'),
  body('broadcast').optional().isBoolean().withMessage('广播设置必须是布尔值')
], async (req, res) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '请求参数错误', 
        errors: errors.array() 
      });
    }

    const { message, recipients, broadcast = false } = req.body;

    if (broadcast) {
      // 广播给所有用户
      const User = require('../models/User');
      const allUsers = await User.find({ isActive: true }).select('_id');
      
      const notifications = allUsers.map(user => ({
        recipient: user._id,
        sender: req.userId,
        type: 'system',
        message,
        data: { broadcast: true }
      }));

      await Notification.insertMany(notifications);
      
      res.json({
        success: true,
        message: '系统通知已广播',
        data: { recipientCount: allUsers.length }
      });
    } else if (recipients && recipients.length > 0) {
      // 发送给指定用户
      const notifications = recipients.map(recipientId => ({
        recipient: recipientId,
        sender: req.userId,
        type: 'system',
        message,
        data: { targeted: true }
      }));

      await Notification.insertMany(notifications);
      
      res.json({
        success: true,
        message: '系统通知已发送',
        data: { recipientCount: recipients.length }
      });
    } else {
      return res.status(400).json({ message: '请指定接收者或设置为广播' });
    }
  } catch (error) {
    console.error('创建系统通知错误:', error);
    res.status(500).json({ message: '创建系统通知失败' });
  }
});

module.exports = router;