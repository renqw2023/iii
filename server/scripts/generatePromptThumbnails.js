const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const PromptPost = require('../models/PromptPost');
require('dotenv').config();

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath);

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
        console.log('缩略图生成成功:', thumbnailPath);
        resolve(thumbnailPath);
      })
      .on('error', (err) => {
        console.error('缩略图生成失败:', err);
        reject(err);
      });
  });
};

// 确保目录存在
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('创建目录:', dirPath);
  }
};

// 为现有提示词生成缩略图
const generateThumbnailsForExistingPrompts = async () => {
  try {
    console.log('开始为现有提示词生成缩略图...');
    
    // 查找包含视频但没有缩略图的提示词
    const prompts = await PromptPost.find({
      'media.type': 'video',
      'media.thumbnail': { $exists: false }
    }).populate('author', 'username');
    
    console.log(`找到 ${prompts.length} 个包含视频的提示词需要生成缩略图`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const prompt of prompts) {
      console.log(`\n处理提示词: ${prompt.title} (ID: ${prompt._id})`);
      
      let hasUpdates = false;
      
      for (let i = 0; i < prompt.media.length; i++) {
        const mediaItem = prompt.media[i];
        
        if (mediaItem.type === 'video' && !mediaItem.thumbnail) {
          try {
            // 构建视频文件路径
            const videoPath = path.join(__dirname, '../../uploads', mediaItem.url.replace('/uploads/', ''));
            
            // 检查视频文件是否存在
            if (!fs.existsSync(videoPath)) {
              console.log(`  视频文件不存在，跳过: ${videoPath}`);
              continue;
            }
            
            // 从URL中提取用户ID
            const urlParts = mediaItem.url.split('/');
            const userId = urlParts[urlParts.length - 2]; // 倒数第二个部分是用户ID
            
            // 生成缩略图文件名
            const videoFileName = path.basename(mediaItem.url);
            const thumbnailFileName = videoFileName.replace(/\.[^/.]+$/, '.jpg');
            
            // 确保缩略图目录存在
            const thumbnailDir = path.join(__dirname, '../../uploads/thumbnails', userId);
            ensureDirectoryExists(thumbnailDir);
            
            const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);
            
            // 生成缩略图
            await generateVideoThumbnail(videoPath, thumbnailPath);
            
            // 更新媒体项的缩略图字段
            prompt.media[i].thumbnail = `/uploads/thumbnails/${userId}/${thumbnailFileName}`;
            hasUpdates = true;
            
            console.log(`  ✓ 缩略图生成成功: ${thumbnailFileName}`);
            
          } catch (error) {
            console.error(`  ✗ 生成缩略图失败:`, error.message);
            errorCount++;
          }
        }
      }
      
      // 如果有更新，保存到数据库
      if (hasUpdates) {
        try {
          await prompt.save();
          successCount++;
          console.log(`  ✓ 提示词更新成功`);
        } catch (error) {
          console.error(`  ✗ 保存提示词失败:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n=== 处理完成 ===`);
    console.log(`成功处理: ${successCount} 个提示词`);
    console.log(`处理失败: ${errorCount} 个`);
    
  } catch (error) {
    console.error('生成缩略图过程中发生错误:', error);
  }
};

// 连接数据库并执行脚本
const main = async () => {
  try {
    console.log('连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/midjourney-gallery');
    console.log('数据库连接成功');
    
    await generateThumbnailsForExistingPrompts();
    
  } catch (error) {
    console.error('脚本执行失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
};

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = {
  generateThumbnailsForExistingPrompts,
  generateVideoThumbnail
};