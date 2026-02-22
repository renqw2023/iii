const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const Post = require('../models/Post');
const mongoose = require('mongoose');
const config = require('../config');

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath);

// 确保目录存在
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 生成视频缩略图
const generateVideoThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '300x300'
      })
      .on('end', () => {
        console.log('✅ 视频缩略图生成成功:', thumbnailPath);
        resolve(thumbnailPath);
      })
      .on('error', (err) => {
        console.error('❌ 视频缩略图生成失败:', err);
        reject(err);
      });
  });
};

// 为现有视频生成缩略图
const generateThumbnailsForExistingVideos = async () => {
  try {
    console.log('🎬 开始为现有视频生成缩略图...');
    
    // 确保缩略图目录存在
    ensureDirectoryExists(path.join(__dirname, '../../uploads/thumbnails'));
    
    // 连接数据库
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ 数据库连接成功');
    
    // 查找所有包含视频的帖子
    const posts = await Post.find({
      'media.type': 'video'
    });
    
    console.log(`📊 找到 ${posts.length} 个包含视频的帖子`);
    
    let updatedCount = 0;
    
    for (const post of posts) {
      console.log(`\n🔄 处理帖子: ${post.title}`);
      
      let hasUpdates = false;
      
      for (let i = 0; i < post.media.length; i++) {
        const media = post.media[i];
        
        if (media.type === 'video' && !media.thumbnail) {
          console.log(`  📹 处理视频: ${media.url}`);
          
          // 构建视频文件路径
          const videoFileName = media.url.replace('/uploads/', '');
          const videoPath = path.join(__dirname, '../../uploads', videoFileName);
          
          // 检查视频文件是否存在
          if (!fs.existsSync(videoPath)) {
            console.log(`  ⚠️  视频文件不存在: ${videoPath}`);
            continue;
          }
          
          try {
            // 生成缩略图文件名和路径
            const thumbnailFileName = videoFileName.replace('videos/', '').replace(/\.[^/.]+$/, '.jpg');
            const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', thumbnailFileName);
            
            // 生成缩略图
            await generateVideoThumbnail(videoPath, thumbnailPath);
            
            // 更新媒体对象
            post.media[i].thumbnail = `/uploads/thumbnails/${thumbnailFileName}`;
            hasUpdates = true;
            
            console.log(`  ✅ 缩略图生成成功: ${thumbnailFileName}`);
          } catch (error) {
            console.error(`  ❌ 生成缩略图失败:`, error.message);
          }
        }
      }
      
      // 如果有更新，保存帖子
      if (hasUpdates) {
        await post.save();
        updatedCount++;
        console.log(`  💾 帖子已更新`);
      }
    }
    
    console.log(`\n🎉 处理完成! 共更新了 ${updatedCount} 个帖子`);
    
  } catch (error) {
    console.error('❌ 处理失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
};

// 运行脚本
if (require.main === module) {
  generateThumbnailsForExistingVideos()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { generateThumbnailsForExistingVideos };