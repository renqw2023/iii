const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prompt:      { type: String, required: true },
  modelId:     { type: String, required: true },
  modelName:   { type: String },
  imageUrl:    { type: String },
  aspectRatio:      { type: String, default: '1:1' },
  creditCost:       { type: Number, default: 0 },
  resolution:       { type: String, enum: ['2K', '4K', '480p', '720p', '1080p'], default: '2K' },
  originalImageUrl: { type: String },
  videoUrl:         { type: String },
  mediaType:        { type: String, enum: ['image', 'video'], default: 'image' },
  status:           { type: String, enum: ['success', 'error'], default: 'success' },
  errorMsg:         { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Generation', schema);
