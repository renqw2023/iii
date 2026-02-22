const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/midjourney-gallery-dev').then(async () => {
  try {
    const user = await User.findOne({email: 'reki023@163.com'});
    if (user) {
      console.log('正在为用户添加完整的analytics数据...');
      
      const analyticsData = {
        ipAddress: '192.168.1.100',
        country: '中国',
        region: '北京市',
        city: '北京',
        loginCount: 25,
        totalSessionTime: 7200000, // 2小时
        averageSessionTime: 480000, // 8分钟
        lastActiveAt: new Date(),
        activeDays: 15,
        likesGiven: 35,
        commentsGiven: 18,
        sharesGiven: 8,
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'Windows'
      };
      
      await User.findByIdAndUpdate(user._id, {
        $set: { analytics: analyticsData }
      });
      
      console.log('✅ 用户analytics数据更新完成！');
      console.log('更新的数据:');
      console.log('IP地址:', analyticsData.ipAddress);
      console.log('国家:', analyticsData.country);
      console.log('地区:', analyticsData.region);
      console.log('城市:', analyticsData.city);
      console.log('登录次数:', analyticsData.loginCount);
      console.log('设备类型:', analyticsData.deviceType);
      console.log('浏览器:', analyticsData.browser);
      console.log('操作系统:', analyticsData.os);
    } else {
      console.log('未找到用户');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
});