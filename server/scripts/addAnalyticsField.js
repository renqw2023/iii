const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// 数据库连接配置 - 使用环境变量
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/midjourney-gallery';

// 空的analytics字段结构模板，将由真实数据填充
const emptyAnalyticsTemplate = {
  ipAddress: null,
  country: null,
  region: null,
  city: null,
  loginCount: 0,
  totalSessionTime: 0,
  averageSessionTime: 0,
  lastActiveAt: null,
  activeDays: 0,
  likesGiven: 0,
  commentsGiven: 0,
  sharesGiven: 0,
  deviceType: null,
  browser: null,
  os: null
};

const addAnalyticsField = async () => {
  try {
    // 连接数据库
    console.log('🔗 正在连接数据库...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ 数据库连接成功');

    // 查找缺少analytics字段的用户
    const usersWithoutAnalytics = await User.find({
      $or: [
        { analytics: { $exists: false } },
        { 'analytics.ipAddress': { $exists: false } }
      ]
    });

    if (usersWithoutAnalytics.length === 0) {
      console.log('✅ 所有用户都已有analytics字段');
      return;
    }

    console.log(`🔧 发现 ${usersWithoutAnalytics.length} 个用户缺少analytics字段，正在添加...`);

    // 为每个用户添加空的analytics字段结构
    for (let i = 0; i < usersWithoutAnalytics.length; i++) {
      const user = usersWithoutAnalytics[i];
      
      // 使用空的analytics结构，真实数据将在用户登录和活动时自动填充
      await User.findByIdAndUpdate(user._id, {
        $set: { analytics: { ...emptyAnalyticsTemplate } }
      });

      console.log(`✅ 为用户 ${user.username || user.email} 添加了空的analytics字段结构`);
    }

    console.log('🎉 analytics字段添加完成！');
    console.log(`📊 总共更新了 ${usersWithoutAnalytics.length} 个用户`);

  } catch (error) {
    console.error('❌ 添加analytics字段失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
    process.exit(0);
  }
};

// 运行脚本
addAnalyticsField();