const mongoose = require('mongoose');

// Midjourney提示词帖子模型
const promptPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 2000
  },
  // 核心提示词内容
  prompt: {
    type: String,
    required: true,
    maxlength: 5000,
    trim: true
  },
  // Midjourney风格参数
  styleParams: {
    sref: String,        // --sref 参数
    style: String,       // --style 参数
    stylize: Number,     // --stylize 参数
    chaos: Number,       // --chaos 参数
    aspect: String,      // --ar 参数
    version: String,     // --v 参数
    videoVersion: String, // --video 参数
    quality: String,     // --q 参数
    seed: Number,        // --seed 参数
    other: String        // 其他自定义参数
  },
  // 示例图片/视频（可选）
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String,   // 缩略图
    size: Number,        // 文件大小
    dimensions: {
      width: Number,
      height: Number
    },
    // ATL功能：图片描述文本
    altText: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: ''
    },
    // 是否包含ATL文本的标识
    hasAltText: {
      type: Boolean,
      default: false
    }
  }],
  // 提示词分类
  category: {
    type: String,
    enum: [
      'character',     // 人物角色
      'landscape',     // 风景
      'architecture',  // 建筑
      'abstract',      // 抽象
      'fantasy',       // 奇幻
      'scifi',         // 科幻
      'portrait',      // 肖像
      'animal',        // 动物
      'object',        // 物体
      'style',         // 风格
      'other'          // 其他
    ],
    default: 'other'
  },
  // 难度等级
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  // 预期效果描述
  expectedResult: {
    type: String,
    maxlength: 1000
  },
  // 使用技巧和注意事项
  tips: {
    type: String,
    maxlength: 1000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: 300
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // 收藏数据
  favorites: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // 复制使用次数
  copyCount: {
    type: Number,
    default: 0
  },
  // 浏览次数
  views: {
    type: Number,
    default: 0
  },
  // 分析数据
  analytics: {
    // 浏览详情
    viewDetails: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      ipAddress: String,
      country: String,
      region: String,
      city: String,
      deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'unknown'
      },
      browser: String,
      referrer: String,
      viewDuration: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    // 复制记录
    copyHistory: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      ipAddress: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    // 热度指标
    hotScore: {
      type: Number,
      default: 0
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // 审核状态
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引优化
promptPostSchema.index({ author: 1, createdAt: -1 });
promptPostSchema.index({ tags: 1 });
promptPostSchema.index({ category: 1 });
promptPostSchema.index({ difficulty: 1 });
promptPostSchema.index({ 'styleParams.sref': 1 });
promptPostSchema.index({ createdAt: -1 });
promptPostSchema.index({ views: -1 });
promptPostSchema.index({ copyCount: -1 });
promptPostSchema.index({ 'analytics.hotScore': -1 });

// 虚拟字段
promptPostSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

promptPostSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

promptPostSchema.virtual('favoritesCount').get(function() {
  return this.favorites.length;
});

// 生成完整的提示词字符串（包含风格参数）
promptPostSchema.methods.getFullPrompt = function() {
  let fullPrompt = this.prompt;
  const params = [];
  const { styleParams } = this;
  
  if (styleParams.sref) params.push(`--sref ${styleParams.sref}`);
  if (styleParams.style) params.push(`--style ${styleParams.style}`);
  if (styleParams.stylize) params.push(`--stylize ${styleParams.stylize}`);
  if (styleParams.chaos) params.push(`--chaos ${styleParams.chaos}`);
  if (styleParams.aspect) params.push(`--ar ${styleParams.aspect}`);
  if (styleParams.version) params.push(`--v ${styleParams.version}`);
  if (styleParams.videoVersion) params.push(`--video ${styleParams.videoVersion}`);
  if (styleParams.quality) params.push(`--q ${styleParams.quality}`);
  if (styleParams.seed) params.push(`--seed ${styleParams.seed}`);
  if (styleParams.other) params.push(styleParams.other);
  
  if (params.length > 0) {
    fullPrompt += ' ' + params.join(' ');
  }
  
  return fullPrompt;
};

// 生成风格参数字符串
promptPostSchema.methods.getStyleParamsString = function() {
  const params = [];
  const { styleParams } = this;
  
  if (styleParams.sref) params.push(`--sref ${styleParams.sref}`);
  if (styleParams.style) params.push(`--style ${styleParams.style}`);
  if (styleParams.stylize) params.push(`--stylize ${styleParams.stylize}`);
  if (styleParams.chaos) params.push(`--chaos ${styleParams.chaos}`);
  if (styleParams.aspect) params.push(`--ar ${styleParams.aspect}`);
  if (styleParams.version) params.push(`--v ${styleParams.version}`);
  if (styleParams.videoVersion) params.push(`--video ${styleParams.videoVersion}`);
  if (styleParams.quality) params.push(`--q ${styleParams.quality}`);
  if (styleParams.seed) params.push(`--seed ${styleParams.seed}`);
  if (styleParams.other) params.push(styleParams.other);
  
  return params.join(' ');
};

// 更新热度分数
promptPostSchema.methods.updateHotScore = function() {
  const now = new Date();
  const ageInDays = (now - this.createdAt) / (1000 * 60 * 60 * 24);
  
  // 热度计算公式：基于点赞、评论、收藏、复制次数，考虑时间衰减
  const baseScore = (
    this.likesCount * 1 +
    this.commentsCount * 2 +
    this.favoritesCount * 3 +
    this.copyCount * 0.5
  );
  
  // 时间衰减因子（7天后开始衰减）
  const timeDecay = ageInDays > 7 ? Math.exp(-(ageInDays - 7) / 30) : 1;
  
  this.analytics.hotScore = Math.round(baseScore * timeDecay);
  return this.analytics.hotScore;
};

module.exports = mongoose.model('PromptPost', promptPostSchema);