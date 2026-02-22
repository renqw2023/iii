const mongoose = require('mongoose');

// 画廊提示词模型 - 用于存储从外部数据源导入的图像生成提示词
const galleryPromptSchema = new mongoose.Schema({
  // 基本信息
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  prompt: {
    type: String,
    required: true,
    maxlength: 10000,
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000,
    default: ''
  },

  // AI模型标识（对齐 meigen.ai 的模型过滤）
  model: {
    type: String,
    enum: ['nanobanana', 'midjourney', 'gptimage', 'other'],
    default: 'nanobanana',
    index: true
  },

  // 三维分类系统（对齐 nano-banana-pro 的41个子类）
  useCase: {
    type: String,
    enum: [
      'profile-avatar', 'social-media-post', 'infographic-edu-visual',
      'youtube-thumbnail', 'comic-storyboard', 'product-marketing',
      'ecommerce-main-image', 'game-asset', 'poster-flyer',
      'app-web-design', 'other'
    ],
    default: 'other',
    index: true
  },
  style: {
    type: String,
    enum: [
      'photography', 'cinematic-film-still', 'anime-manga', 'illustration',
      'sketch-line-art', 'comic-graphic-novel', '3d-render', 'chibi-q-style',
      'isometric', 'pixel-art', 'oil-painting', 'watercolor',
      'ink-chinese-style', 'retro-vintage', 'cyberpunk-sci-fi', 'minimalism',
      'other'
    ],
    default: 'other',
    index: true
  },
  subject: {
    type: String,
    enum: [
      'portrait-selfie', 'influencer-model', 'character', 'group-couple',
      'product', 'food-drink', 'fashion-item', 'animal-creature',
      'vehicle', 'architecture-interior', 'landscape-nature',
      'cityscape-street', 'diagram-chart', 'text-typography',
      'abstract-background', 'other'
    ],
    default: 'other',
    index: true
  },

  // 自由标签
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // 媒体预览
  previewImage: {
    type: String,
    default: ''
  },

  // 来源信息
  sourceAuthor: {
    type: String,
    default: ''
  },
  sourceUrl: {
    type: String,
    default: ''
  },
  sourcePlatform: {
    type: String,
    enum: ['twitter', 'github', 'meigen', 'user-created', 'other'],
    default: 'github'
  },

  // 数据来源标识
  dataSource: {
    type: String,
    enum: ['meigen', 'nano-banana-pro', 'user-created', 'other'],
    default: 'nano-banana-pro',
    index: true
  },

  // 唯一标识（用于避免重复导入）
  sourceId: {
    type: String,
    unique: true,
    sparse: true
  },

  // 互动数据
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
  views: {
    type: Number,
    default: 0
  },
  copyCount: {
    type: Number,
    default: 0
  },

  // 外部链接健康检查
  linkHealth: {
    lastChecked: {
      type: Date,
      default: null
    },
    isHealthy: {
      type: Boolean,
      default: true
    },
    failCount: {
      type: Number,
      default: 0
    }
  },

  // 状态标记
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引优化
galleryPromptSchema.index({ createdAt: -1 });
galleryPromptSchema.index({ views: -1 });
galleryPromptSchema.index({ copyCount: -1 });
galleryPromptSchema.index({ tags: 1 });
galleryPromptSchema.index({ model: 1, useCase: 1 });
galleryPromptSchema.index({ model: 1, style: 1 });
galleryPromptSchema.index({ model: 1, subject: 1 });
// 全文搜索索引
galleryPromptSchema.index({ title: 'text', prompt: 'text', tags: 'text' });

// 虚拟字段
galleryPromptSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

galleryPromptSchema.virtual('favoritesCount').get(function() {
  return this.favorites ? this.favorites.length : 0;
});

module.exports = mongoose.model('GalleryPrompt', galleryPromptSchema);
