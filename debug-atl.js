const mongoose = require('mongoose');
const PromptPost = require('./models/Post');
const User = require('./models/User');
const config = require('./config/index');

// 连接数据库
mongoose.connect(config.database.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugATL() {
  try {
    console.log('开始检查ATL数据...');
    
    // 查找最近的几个提示词
    const prompts = await PromptPost.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'username');
    
    console.log(`找到 ${prompts.length} 个提示词`);
    
    prompts.forEach((prompt, index) => {
      console.log(`\n=== 提示词 ${index + 1} ===`);
      console.log(`ID: ${prompt._id}`);
      console.log(`标题: ${prompt.title}`);
      console.log(`作者: ${prompt.author?.username || '未知'}`);
      console.log(`媒体文件数量: ${prompt.media?.length || 0}`);
      
      if (prompt.media && prompt.media.length > 0) {
        prompt.media.forEach((mediaItem, mediaIndex) => {
          console.log(`  媒体 ${mediaIndex + 1}:`);
          console.log(`    类型: ${mediaItem.type}`);
          console.log(`    URL: ${mediaItem.url}`);
          console.log(`    有ATL文本: ${mediaItem.hasAltText}`);
          console.log(`    ATL文本: "${mediaItem.altText || '无'}"`);  
          console.log(`    ATL文本长度: ${(mediaItem.altText || '').length}`);
        });
      } else {
        console.log('  无媒体文件');
      }
    });
    
    // 查找有ATL文本的提示词
    const promptsWithAlt = await PromptPost.find({
      'media.hasAltText': true
    }).limit(3);
    
    console.log(`\n\n=== 有ATL文本的提示词 (${promptsWithAlt.length}个) ===`);
    promptsWithAlt.forEach((prompt, index) => {
      console.log(`\n提示词 ${index + 1}: ${prompt.title}`);
      const mediaWithAlt = prompt.media.filter(m => m.hasAltText);
      mediaWithAlt.forEach((media, mediaIndex) => {
        console.log(`  图片 ${mediaIndex + 1} ATL: "${media.altText}"`);
      });
    });
    
  } catch (error) {
    console.error('检查ATL数据时出错:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugATL();