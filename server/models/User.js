const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    maxlength: 200,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // 邮箱验证
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  // 密码重置
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  // 社交功能
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // 用户统计
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    }
  },
  
  // 深度分析相关字段
  analytics: {
    // 地域信息
    ipAddress: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    },
    region: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    
    // 行为分析
    loginCount: {
      type: Number,
      default: 0
    },
    totalSessionTime: {
      type: Number,
      default: 0 // 总在线时间（分钟）
    },
    averageSessionTime: {
      type: Number,
      default: 0 // 平均会话时间（分钟）
    },
    
    // 活跃度指标
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    activeDays: {
      type: Number,
      default: 0 // 活跃天数
    },
    
    // 内容互动分析
    likesGiven: {
      type: Number,
      default: 0 // 给出的点赞数
    },
    commentsGiven: {
      type: Number,
      default: 0 // 发出的评论数
    },
    sharesGiven: {
      type: Number,
      default: 0 // 分享次数
    },
    
    // 设备和浏览器信息
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: {
      type: String,
      default: ''
    },
    os: {
      type: String,
      default: ''
    }
  },
  // 收藏的帖子
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  // 用户设置
  settings: {
    // 隐私设置
    profileVisibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showLocation: {
      type: Boolean,
      default: true
    },
    allowFollow: {
      type: Boolean,
      default: true
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    // 通知设置
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    likeNotifications: {
      type: Boolean,
      default: true
    },
    commentNotifications: {
      type: Boolean,
      default: true
    },
    followNotifications: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: false
    },
    // 外观设置
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      enum: ['zh-CN', 'zh-TW', 'en', 'ja'],
      default: 'zh-CN'
    },
    timezone: {
      type: String,
      default: 'Asia/Shanghai'
    }
  },
  // 最后登录时间
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引优化 - 移除重复索引，因为unique已经创建了索引
userSchema.index({ createdAt: -1 });

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 生成邮箱验证码
userSchema.methods.generateEmailVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationCode = code;
  this.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期
  return code;
};

// 验证邮箱验证码
userSchema.methods.verifyEmailCode = function(code) {
  if (!this.emailVerificationCode || !this.emailVerificationExpires) {
    return false;
  }
  
  if (this.emailVerificationExpires < new Date()) {
    return false; // 验证码已过期
  }
  
  // 确保两个值都是字符串类型进行比较
  const storedCode = String(this.emailVerificationCode).trim();
  const inputCode = String(code).trim();
  
  return storedCode === inputCode;
};

// 清除验证码
userSchema.methods.clearEmailVerificationCode = function() {
  this.emailVerificationCode = null;
  this.emailVerificationExpires = null;
};

// 生成密码重置令牌
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期
  return token;
};

// 验证密码重置令牌
userSchema.methods.verifyPasswordResetToken = function(token) {
  if (!this.passwordResetToken || !this.passwordResetExpires) {
    return false;
  }
  
  if (this.passwordResetExpires < new Date()) {
    return false; // 令牌已过期
  }
  
  return this.passwordResetToken === token;
};

// 清除密码重置令牌
userSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

// 生成公开的用户信息
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.email;
  delete user.__v;
  return user;
};

// 虚拟字段
userSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

userSchema.virtual('favoritesCount').get(function() {
  return this.favorites ? this.favorites.length : 0;
});

// 确保虚拟字段被序列化
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);