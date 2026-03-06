const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['sref', 'gallery', 'seedance'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 复合唯一索引：防止重复收藏
favoriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
// 用户收藏列表查询索引
favoriteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
