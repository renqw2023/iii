const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

const createAdminUser = async () => {
  try {
    // 连接数据库
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ 数据库连接成功');

    // 检查是否已存在管理员账户
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  管理员账户已存在:', existingAdmin.username);
      process.exit(0);
    }

    // 创建管理员账户
    const adminData = {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      role: 'admin',
      bio: '网站管理员',
      isActive: true,
      emailVerified: true  // 管理员账户默认邮箱已验证
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ 管理员账户创建成功!');
    console.log('用户名:', adminData.username);
    console.log('邮箱:', adminData.email);
    console.log('密码:', adminData.password);
    console.log('');
    console.log('⚠️  请及时修改默认密码!');

  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminUser();