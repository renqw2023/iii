const mongoose = require('mongoose');

const DataSyncLogSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    enum: ['sref', 'nanobanana', 'seedance-github', 'seedance-youmind', 'github-trending'],
    index: true,
  },
  status: {
    type: String,
    enum: ['running', 'success', 'error', 'partial', 'stopped'],
    default: 'running',
    index: true,
  },
  startedAt:    { type: Date, default: Date.now },
  completedAt:  { type: Date },
  newCount:     { type: Number, default: 0 },
  updatedCount: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  errorCount:   { type: Number, default: 0 },
  totalAfter:   { type: Number, default: 0 }, // collection count after sync
  errorMessages: { type: [String], default: [] },
  // For sref: { currentPage, totalPages, totalDetails, processedDetails, lastDetailUrl }
  // For github/youmind: { rawUrl }
  meta:         { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

DataSyncLogSchema.index({ source: 1, startedAt: -1 });

module.exports = mongoose.model('DataSyncLog', DataSyncLogSchema);
