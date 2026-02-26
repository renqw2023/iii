// importSrefOutput.js
//
// Scans output/sref_XXXXX/ directories and upserts SrefStyle records into MongoDB.
//
// Usage:
//   node server/scripts/importSrefOutput.js           # incremental upsert
//   node server/scripts/importSrefOutput.js --clear   # clear old data first, then import

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Load env from server directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SrefStyle = require('../models/SrefStyle');

const OUTPUT_DIR = path.join(__dirname, '../../output');
const CLEAR_FLAG = process.argv.includes('--clear');

async function run() {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/pm01';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');

    if (CLEAR_FLAG) {
        const deleted = await SrefStyle.deleteMany({});
        console.log(`🗑  Cleared ${deleted.deletedCount} existing SrefStyle records`);
    }

    // Scan output directory for sref_* folders
    const entries = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });
    const srefDirs = entries
        .filter(e => e.isDirectory() && e.name.startsWith('sref_'))
        .map(e => e.name);

    console.log(`📂 Found ${srefDirs.length} sref directories`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const dirName of srefDirs) {
        const dirPath = path.join(OUTPUT_DIR, dirName);
        const imagesDir = path.join(dirPath, 'images');
        const metaPath = path.join(dirPath, 'metadata.json');

        // Skip directories without images folder or no .png files
        if (!fs.existsSync(imagesDir)) {
            skipped++;
            continue;
        }
        const pngFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png'));
        if (pngFiles.length === 0) {
            skipped++;
            continue;
        }

        // Parse metadata
        let meta = {};
        if (fs.existsSync(metaPath)) {
            try {
                meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            } catch (e) {
                console.warn(`⚠️  Failed to parse metadata for ${dirName}:`, e.message);
            }
        }

        // Extract sref code from directory name (sref_1000003 → 1000003)
        const srefCode = dirName.replace(/^sref_/, '');

        // Determine images and videos from saved files (prefer metadata, fallback to fs scan)
        const images = meta.saved_images && meta.saved_images.length > 0
            ? meta.saved_images
            : pngFiles.sort();

        const videosDir = path.join(dirPath, 'videos');
        let videos = [];
        if (meta.saved_videos && meta.saved_videos.length > 0) {
            videos = meta.saved_videos;
        } else if (fs.existsSync(videosDir)) {
            videos = fs.readdirSync(videosDir).filter(f => /\.(mp4|webm|mov)$/i.test(f)).sort();
        }

        try {
            await SrefStyle.findOneAndUpdate(
                { sourceId: srefCode },
                {
                    $set: {
                        srefCode,
                        sourceId: srefCode,
                        title: meta.title || `--sref ${srefCode}`,
                        description: meta.description || '',
                        tags: meta.tags || [],
                        images,
                        videos,
                        isActive: true,
                    }
                },
                { upsert: true, new: true }
            );
            imported++;
            if (imported % 100 === 0) {
                console.log(`  ↳ ${imported} imported so far...`);
            }
        } catch (e) {
            console.error(`❌ Error upserting ${srefCode}:`, e.message);
            errors++;
        }
    }

    console.log('\n✅ Import complete!');
    console.log(`   Imported/updated: ${imported}`);
    console.log(`   Skipped (no images): ${skipped}`);
    console.log(`   Errors: ${errors}`);

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
