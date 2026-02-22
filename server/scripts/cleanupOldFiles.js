const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config');
const Post = require('../models/Post');
const User = require('../models/User');

/**
 * 清理旧文件脚本：删除已经迁移到用户目录的旧文件
 * 这个脚本会：
 * 1. 检查uploads根目录下的文件
 * 2. 验证这些文件是否已经在用户目录中存在
 * 3. 删除已经迁移的旧文件
 * 4. 保留.gitkeep和目录
 */

// 获取所有已迁移的文件列表
const getMigratedFiles = async () => {
  const migratedFiles = new Set();
  
  try {
    // 连接数据库
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('数据库连接成功');
    
    // 获取所有帖子的媒体文件
    const posts = await Post.find({});
    
    for (const post of posts) {
      if (post.media && post.media.length > 0) {
        for (const media of post.media) {
          if (media.url) {
            const filename = path.basename(media.url);
            migratedFiles.add(filename);
          }
          if (media.thumbnailUrl) {
            const thumbnailFilename = path.basename(media.thumbnailUrl);
            migratedFiles.add(thumbnailFilename);
          }
        }
      }
    }
    
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('获取迁移文件列表失败:', error);
    await mongoose.disconnect();
  }
  
  return migratedFiles;
};

// 检查文件是否在用户目录中存在
const fileExistsInUserDirectories = (filename) => {
  const uploadsDir = config.upload.path;
  
  // 检查images目录
  const imagesDir = path.join(uploadsDir, 'images');
  if (fs.existsSync(imagesDir)) {
    const userDirs = fs.readdirSync(imagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const userDir of userDirs) {
      const filePath = path.join(imagesDir, userDir, filename);
      if (fs.existsSync(filePath)) {
        return true;
      }
    }
  }
  
  // 检查videos目录
  const videosDir = path.join(uploadsDir, 'videos');
  if (fs.existsSync(videosDir)) {
    const userDirs = fs.readdirSync(videosDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const userDir of userDirs) {
      const filePath = path.join(videosDir, userDir, filename);
      if (fs.existsSync(filePath)) {
        return true;
      }
    }
  }
  
  // 检查thumbnails目录
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
  if (fs.existsSync(thumbnailsDir)) {
    const userDirs = fs.readdirSync(thumbnailsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const userDir of userDirs) {
      const filePath = path.join(thumbnailsDir, userDir, filename);
      if (fs.existsSync(filePath)) {
        return true;
      }
    }
  }
  
  return false;
};

// 主清理函数
const cleanupOldFiles = async () => {
  try {
    console.log('开始清理旧文件...');
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // 获取已迁移的文件列表
    const migratedFiles = await getMigratedFiles();
    console.log(`数据库中找到 ${migratedFiles.size} 个文件记录`);
    
    // 读取uploads根目录下的所有文件
    const items = fs.readdirSync(uploadsDir, { withFileTypes: true });
    const files = items.filter(item => item.isFile() && item.name !== '.gitkeep');
    
    console.log(`uploads根目录下找到 ${files.length} 个文件`);
    
    let deletedCount = 0;
    let skippedCount = 0;
    
    for (const file of files) {
      const filename = file.name;
      const filePath = path.join(uploadsDir, filename);
      
      // 检查文件是否在数据库记录中，并且在用户目录中存在
      if (migratedFiles.has(filename) && fileExistsInUserDirectories(filename)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`删除旧文件: ${filename}`);
          deletedCount++;
        } catch (error) {
          console.error(`删除文件失败: ${filename}`, error);
        }
      } else {
        console.log(`跳过文件: ${filename} (未迁移或不在用户目录中)`);
        skippedCount++;
      }
    }
    
    console.log('\n=== 清理完成 ===');
    console.log(`删除文件数量: ${deletedCount}`);
    console.log(`跳过文件数量: ${skippedCount}`);
    
  } catch (error) {
    console.error('清理过程中发生错误:', error);
  }
};

// 运行清理
if (require.main === module) {
  cleanupOldFiles().then(() => {
    console.log('清理脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('清理脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { cleanupOldFiles };