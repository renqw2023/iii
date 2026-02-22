const mongoose = require('mongoose');
const PromptPost = require('./models/PromptPost');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/midjourney-gallery', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 修复ATL数据
const fixATLData = async () => {
  try {
    console.log('开始检查和修复ATL数据...');
    
    // 查找所有提示词
    const prompts = await PromptPost.find({});
    console.log(`找到 ${prompts.length} 个提示词`);
    
    let updatedCount = 0;
    
    for (const prompt of prompts) {
      let needUpdate = false;
      
      // 检查media数组中的每个项目
      if (prompt.media && prompt.media.length > 0) {
        for (let i = 0; i < prompt.media.length; i++) {
          const mediaItem = prompt.media[i];
          
          // 如果没有altText字段，添加默认值
          if (mediaItem.altText === undefined) {
            prompt.media[i].altText = '';
            needUpdate = true;
          }
          
          // 如果没有hasAltText字段，添加默认值
          if (mediaItem.hasAltText === undefined) {
            prompt.media[i].hasAltText = false;
            needUpdate = true;
          }
        }
      }
      
      // 如果需要更新，保存到数据库
      if (needUpdate) {
        await prompt.save();
        updatedCount++;
        console.log(`更新提示词: ${prompt.title} (ID: ${prompt._id})`);
      }
    }
    
    console.log(`\n修复完成！共更新了 ${updatedCount} 个提示词`);
    
    // 验证修复结果
    console.log('\n验证修复结果...');
    const verifyPrompts = await PromptPost.find({ 'media.0': { $exists: true } }).limit(5);
    
    for (const prompt of verifyPrompts) {
      console.log(`\n提示词: ${prompt.title}`);
      prompt.media.forEach((media, index) => {
        console.log(`  图片 ${index + 1}:`);
        console.log(`    类型: ${media.type}`);
        console.log(`    altText: "${media.altText || '(空)'}"`);
        console.log(`    hasAltText: ${media.hasAltText}`);
      });
    }
    
  } catch (error) {
    console.error('修复ATL数据时出错:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
};

// 运行修复脚本
const runFix = async () => {
  await connectDB();
  await fixATLData();
};

runFix();