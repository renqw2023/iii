/**
 * Migration: Fix NanaBanana previewImage URLs and sourceUrl
 *
 * Problem 1: previewImage stored as 300px thumbnail (e.g. "..._-300x168.jpg")
 *            instead of full-size original ("..._.jpg")
 * Problem 2: sourceUrl stored as Twitter author profile link
 *            instead of YouMind gallery page
 *
 * Run: node server/scripts/fixNanaBananaImages.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const GalleryPrompt = require('../models/GalleryPrompt');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Fix 1: Strip thumbnail suffix from previewImage
  // Thumbnail pattern: "-{W}x{H}" before file extension
  // e.g. "...G6QBjQHbgAE3Yt_-300x168.jpg" → "...G6QBjQHbgAE3Yt_.jpg"
  const thumbDocs = await GalleryPrompt.find({
    sourceId: /^nanobanana-ym-/,
    previewImage: /-\d+x\d+\./,
  }).select('_id previewImage').lean();

  console.log(`Found ${thumbDocs.length} entries with thumbnail URLs`);

  let fixed = 0, skipped = 0;
  const BATCH = 500;

  for (let i = 0; i < thumbDocs.length; i += BATCH) {
    const batch = thumbDocs.slice(i, i + BATCH);
    const ops = batch.map(doc => {
      const fullUrl = doc.previewImage.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');
      if (fullUrl === doc.previewImage) { skipped++; return null; }
      fixed++;
      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { previewImage: fullUrl } },
        },
      };
    }).filter(Boolean);

    if (ops.length > 0) await GalleryPrompt.bulkWrite(ops);
    console.log(`  Progress: ${Math.min(i + BATCH, thumbDocs.length)}/${thumbDocs.length}`);
  }

  console.log(`previewImage fix: ${fixed} updated, ${skipped} skipped (no suffix found)`);

  // Fix 2: Update sourceUrl to YouMind gallery page for all ym entries
  const sourceResult = await GalleryPrompt.updateMany(
    { sourceId: /^nanobanana-ym-/ },
    { $set: { sourceUrl: 'https://youmind.com/nano-banana-pro-prompts' } }
  );
  console.log(`sourceUrl fix: ${sourceResult.modifiedCount} entries updated`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
