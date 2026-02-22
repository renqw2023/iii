const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // 通知接收者
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 通知发送者
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 通知类型
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'unfollow', 'post_featured', 'system'],
    required: true
  },
  
  // 通知消息
  message: {
    type: String,
    required: true
  },
  
  // 相关帖子（如果适用）
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  
  // 相关评论（如果适用）
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  // 是否已读
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 通知数据（额外信息）
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // 是否已删除（软删除）
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// 复合索引优化查询性能
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 });
notificationSchema.index({ sender: 1, type: 1, createdAt: -1 });

// 虚拟字段：格式化创建时间
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return this.createdAt.toLocaleDateString('zh-CN');
});

// 静态方法：创建通知
notificationSchema.statics.createNotification = async function(data) {
  const { recipient, sender, type, post, comment, additionalData = {} } = data;
  
  // 避免自己给自己发通知
  if (recipient.toString() === sender.toString()) {
    return null;
  }
  
  let message = '';
  const senderUser = await mongoose.model('User').findById(sender).select('username');
  
  // 根据类型生成消息
  switch (type) {
    case 'like':
      const likePost = await mongoose.model('Post').findById(post).select('title');
      message = `${senderUser.username} 点赞了你的作品「${likePost.title}」`;
      break;
    case 'comment':
      const commentPost = await mongoose.model('Post').findById(post).select('title');
      message = `${senderUser.username} 评论了你的作品「${commentPost.title}」`;
      break;
    case 'follow':
      message = `${senderUser.username} 关注了你`;
      break;
    case 'unfollow':
      message = `${senderUser.username} 取消关注了你`;
      break;
    case 'post_featured':
      const featuredPost = await mongoose.model('Post').findById(post).select('title');
      message = `你的作品「${featuredPost.title}」被设为精选`;
      break;
    case 'system':
      message = additionalData.message || '系统通知';
      break;
    default:
      message = '新通知';
  }
  
  // 检查是否已存在相同的通知（避免重复）
  const existingNotification = await this.findOne({
    recipient,
    sender,
    type,
    post: post || null,
    comment: comment || null,
    isDeleted: false,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24小时内
  });
  
  if (existingNotification) {
    // 更新现有通知的时间
    existingNotification.createdAt = new Date();
    existingNotification.read = false;
    return await existingNotification.save();
  }
  
  // 创建新通知
  const notification = new this({
    recipient,
    sender,
    type,
    message,
    post: post || null,
    comment: comment || null,
    data: additionalData
  });
  
  return await notification.save();
};

// 静态方法：获取用户通知
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options;
  
  const query = {
    recipient: userId,
    isDeleted: false
  };
  
  if (unreadOnly) {
    query.read = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  const notifications = await this.find(query)
    .populate('sender', 'username avatar')
    .populate('post', 'title media')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
  
  const total = await this.countDocuments(query);
  
  return {
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit),
    hasMore: page * limit < total
  };
};

// 静态方法：获取未读通知数量
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    read: false,
    isDeleted: false
  });
};

// 静态方法：标记通知为已读
notificationSchema.statics.markAsRead = async function(userId, notificationIds = null) {
  const query = {
    recipient: userId,
    isDeleted: false
  };
  
  if (notificationIds) {
    query._id = Array.isArray(notificationIds) ? { $in: notificationIds } : notificationIds;
  }
  
  return await this.updateMany(query, { read: true });
};

// 静态方法：删除通知（软删除）
notificationSchema.statics.deleteNotifications = async function(userId, notificationIds) {
  const query = {
    recipient: userId,
    _id: Array.isArray(notificationIds) ? { $in: notificationIds } : notificationIds
  };
  
  return await this.updateMany(query, { isDeleted: true });
};

// 静态方法：清理旧通知（定期任务）
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

// 中间件：删除用户时清理相关通知
notificationSchema.pre('remove', function(next) {
  // 这里可以添加清理逻辑
  next();
});

// 确保虚拟字段在JSON序列化时包含
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);