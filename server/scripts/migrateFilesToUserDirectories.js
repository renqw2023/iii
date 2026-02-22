const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config');
const Post = require('../models/Post');
const User = require('../models/User');

/**
 * 文件迁移脚本：将现有文件移动到用户目录中
 * 这个脚本会：
 * 1. 查找所有帖子记录
 * 2. 根据帖子的作者ID创建用户目录
 * 3. 将文件移动到对应的用户目录
 * 4. 更新数据库中的文件URL
 */

// 确保目录存在
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`创建目录: ${dir}`);
  }
};

// 移动文件
const moveFile = (oldPath, newPath) => {
  try {
    if (fs.existsSync(oldPath)) {
      ensureDirectoryExists(path.dirname(newPath));
      fs.renameSync(oldPath, newPath);
      console.log(`移动文件: ${oldPath} -> ${newPath}`);
      return true;
    } else {
      console.log(`文件不存在: ${oldPath}`);
      return false;
    }
  } catch (error) {
    console.error(`移动文件失败: ${oldPath} -> ${newPath}`, error);
    return false;
  }
};

// 更新文件URL
const updateFileUrl = (oldUrl, userId) => {
  // 从 /uploads/filename 转换为 /uploads/type/userId/filename
  const filename = path.basename(oldUrl);
  
  // 判断文件类型
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv'];
  
  let fileType;
  if (imageExts.includes(ext)) {
    fileType = 'images';
  } else if (videoExts.includes(ext)) {
    fileType = 'videos';
  } else {
    fileType = 'images'; // 默认为图片
  }
  
  return `/uploads/${fileType}/${userId}/${filename}`;
};

// 主迁移函数
const migrateFiles = async () => {
  try {
    console.log('开始文件迁移...');
    
    // 连接数据库
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('数据库连接成功');
    
    // 获取所有帖子
    const posts = await Post.find({}).populate('author');
    console.log(`找到 ${posts.length} 个帖子`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const post of posts) {
      if (!post.author || !post.author._id) {
        console.log(`跳过帖子 ${post._id}: 没有作者信息`);
        continue;
      }
      
      const userId = post.author._id.toString();
      let hasChanges = false;
      
      // 处理媒体文件
      if (post.media && post.media.length > 0) {
        for (let i = 0; i < post.media.length; i++) {
          const media = post.media[i];
          
          if (media.url && !media.url.includes(`/${userId}/`)) {
            // 获取原始文件路径
            const filename = path.basename(media.url);
            const oldPath = path.join(process.cwd(), 'uploads', filename);
            
            // 确定文件类型和新路径
            const fileType = media.type === 'video' ? 'videos' : 'images';
            const newDir = path.join(process.cwd(), 'uploads', fileType, userId);
            const newPath = path.join(newDir, filename);
            
            // 移动文件
            if (moveFile(oldPath, newPath)) {
              // 更新URL
              post.media[i].url = updateFileUrl(media.url, userId);
              hasChanges = true;
              migratedCount++;
            } else {
              errorCount++;
            }
            
            // 处理缩略图
            if (media.thumbnailUrl && !media.thumbnailUrl.includes(`/${userId}/`)) {
              const thumbnailFilename = path.basename(media.thumbnailUrl);
              const oldThumbnailPath = path.join(process.cwd(), 'uploads', 'thumbnails', thumbnailFilename);
              const newThumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails', userId);
              const newThumbnailPath = path.join(newThumbnailDir, thumbnailFilename);
              
              if (moveFile(oldThumbnailPath, newThumbnailPath)) {
                post.media[i].thumbnailUrl = `/uploads/thumbnails/${userId}/${thumbnailFilename}`;
                hasChanges = true;
              }
            }
          }
        }
      }
      
      // 保存更改
      if (hasChanges) {
        await post.save();
        console.log(`更新帖子 ${post._id} 的文件路径`);
      }
    }
    
    console.log('\n=== 迁移完成 ===');
    console.log(`成功迁移文件: ${migratedCount}`);
    console.log(`迁移失败文件: ${errorCount}`);
    console.log(`处理帖子数量: ${posts.length}`);
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
};

// 运行迁移
if (require.main === module) {
  migrateFiles().then(() => {
    console.log('迁移脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('迁移脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { migrateFiles };