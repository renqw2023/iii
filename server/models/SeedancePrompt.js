const mongoose = require('mongoose');

// Seedance 2.0 视频提示词模型
const seedancePromptSchema = new mongoose.Schema({
    // 基本信息
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    prompt: {
        type: String,
        required: true,
        maxlength: 15000,
        trim: true
    },
    description: {
        type: String,
        maxlength: 3000,
        default: ''
    },

    // 视频媒体
    videoUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },

    // 分类
    category: {
        type: String,
        enum: [
            'action', 'anime', 'cinematic', 'dance', 'comedy',
            'horror', 'sci-fi', 'fantasy', 'commercial', 'meme',
            'transformation', 'chase', 'fight', 'vlog', 'music-video',
            'educational', 'other'
        ],
        default: 'other',
        index: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],

    // 来源信息
    sourceUrl: {
        type: String,
        default: ''
    },
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
seedancePromptSchema.index({ createdAt: -1 });
seedancePromptSchema.index({ views: -1 });
seedancePromptSchema.index({ copyCount: -1 });
seedancePromptSchema.index({ tags: 1 });
seedancePromptSchema.index({ title: 'text', prompt: 'text', tags: 'text' });

// 虚拟字段
seedancePromptSchema.virtual('likesCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

seedancePromptSchema.virtual('favoritesCount').get(function () {
    return this.favorites ? this.favorites.length : 0;
});

module.exports = mongoose.model('SeedancePrompt', seedancePromptSchema);
