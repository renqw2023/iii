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
const paymentsRoutes = require('./routes/payments');
const toolsRoutes = require('./routes/tools');
const generateRoutes = require('./routes/generate');
const { startAutoSync: startGptImageSync } = require('./services/syncGptImage');
const syncRoutes = require('./routes/sync');
const { startCronJobs } = require('./cron/index');
const visitTracker = require('./middleware/visitTracker');
const { isBot } = require('./utils/botDetect');
const renderRoutes = require('./routes/render');

const app = express();
// 信任代理设置
app.set('trust proxy', config.server.trustProxy);
// 安全中间件
app.use(helmet(config.security.helmet));
app.use(cors(config.cors));

// 限流
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// 访客流量统计（非阻塞，批量写入 MongoDB）
app.use(visitTracker);

// Stripe webhook 需要 raw body，在 express.json() 之前注册
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { req.rawBody = data; next(); });
  } else {
    next();
  }
});

// 解析JSON（webhook 路由已由上方 rawBody 中间件处理，跳过）
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') return next();
  express.json({ limit: config.server.bodyLimit })(req, res, next);
});
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') return next();
  express.urlencoded({ extended: true, limit: config.server.bodyLimit })(req, res, next);
});

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
// 本地视频存储（/v/seedance/{id}.mp4 → uploads/videos/seedance/）
app.use('/v', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=604800'); // 7天缓存
  next();
});
app.use('/v', express.static(path.join(__dirname, 'uploads/videos'), { maxAge: '7d' }));

// 动态渲染中间件 — 仅对搜索引擎爬虫触发（Bot UA 检测）
// 对 /gallery/:id, /explore/:id, /seedance/:id 返回包含完整 meta/JSON-LD 的轻量 HTML
// 普通浏览器请求直接 next() → React SPA 由 Vercel 静态文件提供
app.use((req, res, next) => {
  if (isBot(req)) return renderRoutes(req, res, next);
  next();
});

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
app.use('/api/payments', paymentsRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/admin/sync', syncRoutes);

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

      // 启动定时数据同步任务
      startCronJobs();
    });
  })
  .catch(err => {
    console.error('❌ MongoDB连接失败:', err);
    process.exit(1);
  });