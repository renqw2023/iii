const mongoose = require('mongoose');

const giftCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
  },
  maxUses: {
    type: Number,
    default: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  usedBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      usedAt: { type: Date, default: Date.now },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  note: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('GiftCode', giftCodeSchema);
