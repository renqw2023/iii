const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const promptRoutes = require('./routes/prompts');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');
const seoRoutes = require('./routes/seo');
const galleryRoutes = require('./routes/gallery');
const seedanceRoutes = require('./routes/seedance');
const srefRoutes = require('./routes/sref');
const favoritesRoutes = require('./routes/favorites');
const creditsRoutes = require('./routes/credits');
const { startAutoSync: startGptImageSync } = require('./services/syncGptImage');

const app = express();
// 信任代理设置
app.set('trust proxy', config.server.trustProxy);
// 安全中间件
app.use(helmet(config.security.helmet));
app.use(cors(config.cors));

// 限流
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// 解析JSON
app.use(express.json({ limit: config.server.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.server.bodyLimit }));

// 添加静态文件缓存头
app.use('/uploads', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=86400'); // 24小时缓存
  next();
});
app.use('/Circle', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=604800'); // 7天缓存
  next();
});

// 静态文件服务 - 指向项目根目录的uploads，与服务器保持一致
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// 为Circle头像文件提供静态服务（从client/public目录）
app.use('/Circle', express.static(path.join(__dirname, '../client/public/Circle')));
// Sref output 静态文件服务（图片/视频）
app.use('/output', express.static(path.join(__dirname, '../output'), { maxAge: '7d' }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/seedance', seedanceRoutes);
app.use('/api/sref', srefRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/credits', creditsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 连接MongoDB
mongoose.connect(config.database.uri, config.database.options)
  .then(() => {
    console.log('✅ MongoDB连接成功');
    app.listen(config.server.port, config.server.host, () => {
      console.log(`🚀 服务器运行在 http://${config.server.host}:${config.server.port}`);

      // 启动自动同步服务
      startGptImageSync();
    });
  })
  .catch(err => {
    console.error('❌ MongoDB连接失败:', err);
    process.exit(1);
  });