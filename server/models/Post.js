const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  // Midjourney风格参数 - 这是核心功能
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
  // 媒体文件
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
    }
  }],
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
      maxlength: 300
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
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  
  // 深度分析相关字段
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
      referrer: String, // 来源页面
      viewDuration: Number, // 浏览时长（秒）
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    
    // 互动时间分析
    hourlyStats: {
      type: Map,
      of: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 }
      },
      default: new Map()
    },
    
    // 地域统计
    geoStats: {
      type: Map,
      of: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 }
      },
      default: new Map()
    },
    
    // 设备统计
    deviceStats: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 }
    },
    
    // 热度指标
    hotScore: {
      type: Number,
      default: 0 // 基于浏览、点赞、评论、分享的综合热度分数
    },
    
    // 趋势数据
    trendData: [{
      date: {
        type: Date,
        default: Date.now
      },
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    }]
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 索引优化
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'styleParams.sref': 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ views: -1 });

// 虚拟字段
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

postSchema.virtual('sharesCount').get(function() {
  return this.shares.length;
});

// 生成风格参数字符串
postSchema.methods.getStyleParamsString = function() {
  const params = [];
  const { styleParams } = this;
  
  if (styleParams.sref) params.push(`--sref ${styleParams.sref}`);
  if (styleParams.style) params.push(`--style ${styleParams.style}`);
  if (styleParams.stylize) params.push(`--stylize ${styleParams.stylize}`);
  if (styleParams.chaos) params.push(`--chaos ${styleParams.chaos}`);
  if (styleParams.aspect) params.push(`--ar ${styleParams.aspect}`);
  if (styleParams.version) params.push(`--v ${styleParams.version}`);
  if (styleParams.quality) params.push(`--q ${styleParams.quality}`);
  if (styleParams.seed) params.push(`--seed ${styleParams.seed}`);
  if (styleParams.other) params.push(styleParams.other);
  
  return params.join(' ');
};

module.exports = mongoose.model('Post', postSchema);