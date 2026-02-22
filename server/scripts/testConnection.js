const mongoose = require('mongoose');
const config = require('../config');

const testConnection = async () => {
  try {
    console.log('🔍 正在测试MongoDB连接...');
    console.log('连接字符串:', config.database.uri);
    
    // 连接数据库
    await mongoose.connect(config.database.uri, config.database.options);
    
    console.log('✅ MongoDB连接成功！');
    
    // 获取数据库信息
    const db = mongoose.connection.db;
    const admin = db.admin();
    const info = await admin.serverStatus();
    
    console.log('📊 数据库信息:');
    console.log(`- 版本: ${info.version}`);
    console.log(`- 主机: ${info.host}`);
    console.log(`- 运行时间: ${Math.floor(info.uptime / 60)} 分钟`);
    
    // 列出现有数据库
    const databases = await admin.listDatabases();
    console.log('📁 现有数据库:');
    databases.databases.forEach(db => {
      console.log(`- ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // 测试写入权限
    const testCollection = db.collection('connection_test');
    await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Connection test successful' 
    });
    
    const testDoc = await testCollection.findOne({ test: true });
    if (testDoc) {
      console.log('✅ 数据库读写测试成功！');
      await testCollection.deleteOne({ _id: testDoc._id });
      console.log('🧹 清理测试数据完成');
    }
    
  } catch (error) {
    console.error('❌ MongoDB连接失败:');
    console.error('错误信息:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 建议检查:');
      console.error('1. MongoDB Docker容器是否正在运行: docker ps');
      console.error('2. 端口映射是否正确: 27017:27017');
      console.error('3. 防火墙是否阻止连接');
    } else if (error.name === 'MongoServerError') {
      console.error('💡 可能是认证问题，请检查用户名密码');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
    process.exit(0);
  }
};

testConnection();