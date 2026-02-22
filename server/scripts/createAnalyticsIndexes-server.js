const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
require('dotenv').config();

/**
 * 检查索引是否存在
 */
async function indexExists(collection, indexName) {
  try {
    const indexes = await collection.listIndexes().toArray();
    return indexes.some(index => index.name === indexName);
  } catch (error) {
    return false;
  }
}

/**
 * 安全创建索引（如果不存在才创建）
 */
async function safeCreateIndex(collection, indexSpec, options, description) {
  try {
    const exists = await indexExists(collection, options.name);
    if (exists) {
      console.log(`⏭️  跳过已存在的索引: ${options.name}`);
      return;
    }
    
    await collection.createIndex(indexSpec, options);
    console.log(`✅ 创建${description}`);
  } catch (error) {
    console.log(`⚠️  创建${description}失败: ${error.message}`);
  }
}

/**
 * 为analytics相关字段创建数据库索引
 * 提高查询性能，特别是admin面板的analytics查询
 */
async function createAnalyticsIndexes() {
  try {
    // 连接数据库 - 使用服务器配置的数据库地址
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/midjourney-gallery';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ 数据库连接成功');
    console.log(`📍 数据库地址: ${mongoUri}`);
    
    // 为User模型创建analytics相关索引
    console.log('🔄 为User模型创建analytics索引...');
    
    // 1. 最后活跃时间索引（用于活跃用户查询）
    await safeCreateIndex(
      User.collection,
      { 'analytics.lastActiveAt': -1 },
      { name: 'analytics_lastActiveAt_desc' },
      'analytics.lastActiveAt 索引'
    );
    
    // 2. 登录次数索引（用于用户活跃度排序）
    await safeCreateIndex(
      User.collection,
      { 'analytics.loginCount': -1 },
      { name: 'analytics_loginCount_desc' },
      'analytics.loginCount 索引'
    );
    
    // 3. 地理位置复合索引（用于地域分析）
    await safeCreateIndex(
      User.collection,
      { 
        'analytics.country': 1,
        'analytics.region': 1,
        'analytics.city': 1
      },
      { name: 'analytics_geo_compound' },
      '地理位置复合索引'
    );
    
    // 4. 设备类型索引（用于设备分析）
    await safeCreateIndex(
      User.collection,
      { 'analytics.deviceType': 1 },
      { name: 'analytics_deviceType' },
      'analytics.deviceType 索引'
    );
    
    // 5. 浏览器索引（用于浏览器分析）
    await safeCreateIndex(
      User.collection,
      { 'analytics.browser': 1 },
      { name: 'analytics_browser' },
      'analytics.browser 索引'
    );
    
    // 6. 操作系统索引（用于OS分析）
    await safeCreateIndex(
      User.collection,
      { 'analytics.os': 1 },
      { name: 'analytics_os' },
      'analytics.os 索引'
    );
    
    // 7. 用户活动复合索引（用于行为分析）
    await safeCreateIndex(
      User.collection,
      {
        'analytics.likesGiven': -1,
        'analytics.commentsGiven': -1,
        'analytics.sharesGiven': -1
      },
      { name: 'analytics_activity_compound' },
      '用户活动复合索引'
    );
    
    // 8. 创建时间和最后活跃时间复合索引（用于用户生命周期分析）
    await safeCreateIndex(
      User.collection,
      {
        'createdAt': -1,
        'analytics.lastActiveAt': -1
      },
      { name: 'user_lifecycle_compound' },
      '用户生命周期复合索引'
    );
    
    // 为Post模型创建analytics相关索引
    console.log('🔄 为Post模型创建analytics索引...');
    
    // 9. 帖子浏览量索引（用于热门内容排序）
    await safeCreateIndex(
      Post.collection,
      { 'views': -1 },
      { name: 'post_views_desc' },
      '帖子浏览量索引'
    );
    
    // 10. 帖子热度分数索引（用于热门推荐）
    await safeCreateIndex(
      Post.collection,
      { 'analytics.hotScore': -1 },
      { name: 'post_hotScore_desc' },
      '帖子热度分数索引'
    );
    
    // 11. 帖子创建时间和浏览量复合索引（用于趋势分析）
    await safeCreateIndex(
      Post.collection,
      {
        'createdAt': -1,
        'views': -1
      },
      { name: 'post_trend_compound' },
      '帖子趋势复合索引'
    );
    
    // 12. 标签索引（用于标签分析）
    await safeCreateIndex(
      Post.collection,
      { 'tags': 1 },
      { name: 'post_tags' },
      '帖子标签索引'
    );
    
    // 13. 作者和创建时间复合索引（用于用户内容分析）
    await safeCreateIndex(
      Post.collection,
      {
        'author': 1,
        'createdAt': -1
      },
      { name: 'post_author_time_compound' },
      '作者时间复合索引'
    );
    
    // 14. 特色帖子索引（用于特色内容查询）
    await safeCreateIndex(
      Post.collection,
      { 'isFeatured': 1, 'createdAt': -1 },
      { name: 'post_featured_time' },
      '特色帖子索引'
    );
    
    // 15. 公开状态索引（用于内容过滤）
    await safeCreateIndex(
      Post.collection,
      { 'isPublic': 1, 'createdAt': -1 },
      { name: 'post_public_time' },
      '公开状态索引'
    );
    
    // 显示所有索引
    console.log('\n📊 User模型索引列表:');
    const userIndexes = await User.collection.listIndexes().toArray();
    userIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n📊 Post模型索引列表:');
    const postIndexes = await Post.collection.listIndexes().toArray();
    postIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n🎉 所有analytics索引创建完成！');
    console.log('\n📈 性能优化效果:');
    console.log('  - Admin面板查询速度将显著提升');
    console.log('  - 地理位置分析查询优化');
    console.log('  - 用户行为分析查询优化');
    console.log('  - 内容热度排序查询优化');
    
  } catch (error) {
    console.error('❌ 创建索引失败:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createAnalyticsIndexes();
}

module.exports = createAnalyticsIndexes;