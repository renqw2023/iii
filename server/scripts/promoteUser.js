const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

const promoteUserToAdmin = async () => {
  try {
    // 连接数据库
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ 数据库连接成功');

    // 查找指定用户
    const username = 'mj_admin';
    const email = 'renqw5271@gmail.com';
    
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (!user) {
      console.log('❌ 未找到指定用户');
      console.log(`用户名: ${username}`);
      console.log(`邮箱: ${email}`);
      return;
    }

    // 检查用户信息
    console.log('📋 找到用户信息:');
    console.log(`用户名: ${user.username}`);
    console.log(`邮箱: ${user.email}`);
    console.log(`当前角色: ${user.role}`);
    console.log(`账户状态: ${user.isActive ? '激活' : '未激活'}`);
    console.log(`邮箱验证: ${user.emailVerified ? '已验证' : '未验证'}`);

    // 如果已经是管理员，则提示
    if (user.role === 'admin') {
      console.log('ℹ️  该用户已经是管理员');
      return;
    }

    // 提权为管理员
    user.role = 'admin';
    user.isActive = true; // 确保账户激活
    user.emailVerified = true; // 确保邮箱已验证
    
    await user.save();

    console.log('🎉 用户提权成功!');
    console.log(`${user.username} 现在是管理员`);
    
  } catch (error) {
    console.error('❌ 提权失败:', error.message);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('📤 数据库连接已关闭');
  }
};

// 执行提权操作
promoteUserToAdmin();