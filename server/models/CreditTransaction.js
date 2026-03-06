const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'spend'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'daily_checkin',    // 每日签到
      'register_bonus',   // 注册奖励
      'invite_reward',    // 邀请奖励（被邀请人）
      'invite_bonus',     // 邀请奖励（邀请人）
      'admin_grant',      // 管理员赠送
      'generate_image',   // 生成图片消耗（预留）
    ],
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
