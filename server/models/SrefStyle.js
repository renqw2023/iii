const mongoose = require('mongoose');

const SrefStyleSchema = new mongoose.Schema({
    srefCode: {
        type: String,
        required: true,
        index: true,
    },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    tags: { type: [String], default: [], index: true },
    images: { type: [String], default: [] },   // filenames: ["01_xxx.png", ...]
    videos: { type: [String], default: [] },   // filenames: ["01_xxx.mp4", ...]
    sourceId: { type: String, unique: true },  // = srefCode, prevents duplicate import
    views: { type: Number, default: 0 },
    likes: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
    }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual: first image URL for card preview
SrefStyleSchema.virtual('previewImage').get(function () {
    if (this.images && this.images.length > 0) {
        return `/output/sref_${this.srefCode}/images/${this.images[0]}`;
    }
    return null;
});

// Virtual: likes count
SrefStyleSchema.virtual('likesCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

SrefStyleSchema.index({ createdAt: -1 });
SrefStyleSchema.index({ views: -1 });

module.exports = mongoose.model('SrefStyle', SrefStyleSchema);
