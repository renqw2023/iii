const mongoose = require('mongoose');

const visitLogSchema = new mongoose.Schema({
  ip:       { type: String, index: true },
  path:     { type: String, index: true },
  method:   { type: String },
  status:   { type: Number },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userAgent:{ type: String },
  duration: { type: Number },  // ms
  country:  { type: String, default: '' },
  city:     { type: String, default: '' },
  createdAt:{ type: Date, default: Date.now, index: { expireAfterSeconds: 7776000 } }, // 90-day TTL
});

visitLogSchema.index({ ip: 1, createdAt: 1 });

module.exports = mongoose.model('VisitLog', visitLogSchema);
