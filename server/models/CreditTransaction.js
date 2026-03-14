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
      'daily_checkin',
      'register_bonus',
      'invite_reward',
      'invite_bonus',
      'admin_grant',
      'admin_deduct',
      'generate_image',
      'generate_video',
      'img2prompt',
      'purchase',
    ],
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  walletType: {
    type: String,
    enum: ['free', 'paid', 'mixed'],
    default: null
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  freeBalanceAfter: {
    type: Number,
    default: null
  },
  paidBalanceAfter: {
    type: Number,
    default: null
  },
  totalBalanceAfter: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
