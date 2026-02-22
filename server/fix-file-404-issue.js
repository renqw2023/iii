const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const Post = require('./models/Post');
const User = require('./models/User');

/**
 * 修复文件404问题 - Server目录版本
 * 1. 检查数据库中的文件URL格式
 * 2. 修复不正确的文件路径
 * 3. 确保文件能够正确访问
 */

const fixFileUrls = async () => {
  try {
    console.log('开始修复文件404问题...');
    
    // 连接数据库
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ 数据库连接成功');
    
    // 获取所有包含媒体文件的帖子
    const posts = await Post.find({ 
      'media.0': { $exists: true } 
    }).populate('author', 'username');
    
    console.log(`找到 ${posts.length} 个包含媒体文件的帖子`);
    
    let fixedCount = 0;
    let errorCount = 0;
    const problematicFiles = [];
    
    for (const post of posts) {
      let hasChanges = false;
      
      for (let i = 0; i < post.media.length; i++) {
        const media = post.media[i];
        const originalUrl = media.url;
        
        // 检查是否是旧格式的URL (直接在uploads根目录)
        if (media.url.match(/^\/uploads\/[^/]+\.(jpg|jpeg|png|gif|mp4|mov|avi)$/i)) {
          console.log(`发现旧格式URL: ${originalUrl}`);
          
          // 获取文件名
          const filename = path.basename(media.url);
          
          // 确定文件类型
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
          
          // 构建新的URL格式
          const userId = post.author._id.toString();
          const newUrl = `/uploads/${fileType}/${userId}/${filename}`;
          
          // 检查新路径的文件是否存在
          const newFilePath = path.join(__dirname, 'uploads', fileType, userId, filename);
          const oldFilePath = path.join(__dirname, 'uploads', filename);
          
          if (fs.existsSync(newFilePath)) {
            // 新路径文件存在，更新URL
            post.media[i].url = newUrl;
            hasChanges = true;
            console.log(`✅ 更新URL: ${originalUrl} -> ${newUrl}`);
          } else if (fs.existsSync(oldFilePath)) {
            // 旧路径文件存在，需要移动文件
            try {
              // 确保目标目录存在
              const targetDir = path.dirname(newFilePath);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              
              // 移动文件
              fs.renameSync(oldFilePath, newFilePath);
              post.media[i].url = newUrl;
              hasChanges = true;
              console.log(`✅ 移动文件并更新URL: ${originalUrl} -> ${newUrl}`);
            } catch (moveError) {
              console.error(`❌ 移动文件失败: ${oldFilePath} -> ${newFilePath}`, moveError);
              problematicFiles.push({
                postId: post._id,
                originalUrl,
                error: '文件移动失败'
              });
              errorCount++;
            }
          } else {
            // 文件不存在
            console.error(`❌ 文件不存在: ${filename}`);
            problematicFiles.push({
              postId: post._id,
              originalUrl,
              error: '文件不存在'
            });
            errorCount++;
          }
        }
        
        // 检查是否是错误的新格式URL（文件不存在）
        else if (media.url.match(/^\/uploads\/(images|videos)\/[a-f0-9]{24}\/[^/]+\.(jpg|jpeg|png|gif|mp4|mov|avi)$/i)) {
          const filePath = path.join(__dirname, 'uploads', media.url.replace(/^\/uploads\//, ''));
          if (!fs.existsSync(filePath)) {
            console.error(`❌ 新格式文件不存在: ${media.url}`);
            problematicFiles.push({
              postId: post._id,
              originalUrl: media.url,
              error: '新格式文件不存在'
            });
            errorCount++;
          }
        }
      }
      
      // 保存更改
      if (hasChanges) {
        try {
          await post.save();
          fixedCount++;
          console.log(`✅ 已更新帖子: ${post._id}`);
        } catch (saveError) {
          console.error(`❌ 保存帖子失败: ${post._id}`, saveError);
          errorCount++;
        }
      }
    }
    
    console.log('\n=== 修复结果 ===');
    console.log(`✅ 成功修复的帖子数量: ${fixedCount}`);
    console.log(`❌ 出现错误的文件数量: ${errorCount}`);
    
    if (problematicFiles.length > 0) {
      console.log('\n=== 问题文件详情 ===');
      problematicFiles.forEach((item, index) => {
        console.log(`${index + 1}. 帖子ID: ${item.postId}`);
        console.log(`   原始URL: ${item.originalUrl}`);
        console.log(`   错误: ${item.error}`);
      });
    }
    
    console.log('\n修复完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  fixFileUrls();
}

module.exports = { fixFileUrls };