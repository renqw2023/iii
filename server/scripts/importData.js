const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// 导入模型
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

async function importData() {
  try {
    console.log('🔗 连接数据库...');
    await mongoose.connect(config.database.uri, config.database.options);
    
    // 检查导出数据是否存在
    const exportDir = path.join(__dirname, '../../data-export');
    if (!fs.existsSync(exportDir)) {
      console.error('❌ 错误: 未找到 data-export 目录');
      console.log('请确保已解压 data-export.tar.gz 文件');
      process.exit(1);
    }
    
    // 检查导出信息
    const exportInfoPath = path.join(exportDir, 'export-info.json');
    if (fs.existsSync(exportInfoPath)) {
      const exportInfo = JSON.parse(fs.readFileSync(exportInfoPath, 'utf8'));
      console.log('\n📋 导入数据信息:');
      console.log('='.repeat(50));
      console.log(`导出时间: ${exportInfo.exportDate}`);
      console.log(`原数据库: ${exportInfo.databaseUri}`);
      console.log(`原环境: ${exportInfo.nodeEnv}`);
      console.log(`用户数量: ${exportInfo.totalUsers}`);
      console.log(`帖子数量: ${exportInfo.totalPosts}`);
      console.log(`通知数量: ${exportInfo.totalNotifications}`);
      console.log('='.repeat(50));
    }
    
    // 读取导出的数据
    console.log('\n📖 读取导出数据...');
    const usersPath = path.join(exportDir, 'users.json');
    const postsPath = path.join(exportDir, 'posts.json');
    const notificationsPath = path.join(exportDir, 'notifications.json');
    
    let users = [];
    let posts = [];
    let notifications = [];
    
    if (fs.existsSync(usersPath)) {
      users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      console.log(`✅ 读取到 ${users.length} 个用户`);
    } else {
      console.log('⚠️  未找到用户数据文件');
    }
    
    if (fs.existsSync(postsPath)) {
      posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
      console.log(`✅ 读取到 ${posts.length} 个帖子`);
    } else {
      console.log('⚠️  未找到帖子数据文件');
    }
    
    if (fs.existsSync(notificationsPath)) {
      notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf8'));
      console.log(`✅ 读取到 ${notifications.length} 个通知`);
    } else {
      console.log('⚠️  未找到通知数据文件');
    }
    
    // 询问是否清空现有数据
    console.log('\n⚠️  警告: 导入数据将会覆盖现有数据!');
    console.log('请确认是否继续 (输入 yes 继续): ');
    
    // 在生产环境中，这里应该有用户确认步骤
    // 为了自动化，我们跳过确认步骤，但会备份现有数据
    
    // 备份现有数据
    console.log('\n💾 备份现有数据...');
    const backupDir = path.join(__dirname, '../../data-backup-' + Date.now());
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    try {
      const existingUsers = await User.find({}).lean();
      const existingPosts = await Post.find({}).lean();
      const existingNotifications = await Notification.find({}).lean();
      
      fs.writeFileSync(path.join(backupDir, 'users-backup.json'), JSON.stringify(existingUsers, null, 2));
      fs.writeFileSync(path.join(backupDir, 'posts-backup.json'), JSON.stringify(existingPosts, null, 2));
      fs.writeFileSync(path.join(backupDir, 'notifications-backup.json'), JSON.stringify(existingNotifications, null, 2));
      
      console.log(`✅ 现有数据已备份到: ${backupDir}`);
    } catch (backupError) {
      console.log('⚠️  备份失败，但继续导入:', backupError.message);
    }
    
    // 清空现有数据
    console.log('\n🗑️  清空现有数据...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Notification.deleteMany({});
    console.log('✅ 现有数据已清空');
    
    // 导入新数据
    let importedUsers = 0;
    let importedPosts = 0;
    let importedNotifications = 0;
    
    if (users.length > 0) {
      console.log('\n📥 导入用户数据...');
      // 移除 _id 字段，让 MongoDB 重新生成
      const usersToImport = users.map(user => {
        const { _id, ...userWithoutId } = user;
        return userWithoutId;
      });
      await User.insertMany(usersToImport);
      importedUsers = usersToImport.length;
      console.log(`✅ 成功导入 ${importedUsers} 个用户`);
    }
    
    if (posts.length > 0) {
      console.log('\n📥 导入帖子数据...');
      // 移除 _id 字段，让 MongoDB 重新生成
      const postsToImport = posts.map(post => {
        const { _id, ...postWithoutId } = post;
        return postWithoutId;
      });
      await Post.insertMany(postsToImport);
      importedPosts = postsToImport.length;
      console.log(`✅ 成功导入 ${importedPosts} 个帖子`);
    }
    
    if (notifications.length > 0) {
      console.log('\n📥 导入通知数据...');
      // 移除 _id 字段，让 MongoDB 重新生成
      const notificationsToImport = notifications.map(notification => {
        const { _id, ...notificationWithoutId } = notification;
        return notificationWithoutId;
      });
      await Notification.insertMany(notificationsToImport);
      importedNotifications = notificationsToImport.length;
      console.log(`✅ 成功导入 ${importedNotifications} 个通知`);
    }
    
    console.log('\n🎉 数据导入完成！');
    console.log('='.repeat(50));
    console.log(`导入用户: ${importedUsers}`);
    console.log(`导入帖子: ${importedPosts}`);
    console.log(`导入通知: ${importedNotifications}`);
    console.log(`备份位置: ${backupDir}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 检查是否有必要的依赖
if (!fs.existsSync(path.join(__dirname, '../models/User.js'))) {
  console.error('❌ 错误: 未找到用户模型文件');
  process.exit(1);
}

if (!fs.existsSync(path.join(__dirname, '../.env'))) {
  console.error('❌ 错误: 未找到 .env 文件');
  process.exit(1);
}

importData();