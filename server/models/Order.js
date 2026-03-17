const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  planId: {
    type: String,
    enum: ['starter', 'pro', 'ultimate'],
    required: true,
  },
  planName: {
    type: String,
    required: true,
  },
  amountUSD: {
    type: Number,
    required: true,
  },
  credits: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'usd',
  },
  stripeSessionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  stripePaymentIntentId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['completed', 'refunded'],
    default: 'completed',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ planId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
