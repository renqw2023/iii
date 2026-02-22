const path = require('path');
// 确保在配置初始化前加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// 添加调试日志验证环境变量加载（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  console.log('====== 环境变量加载 ======');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('=========================');
}

/**
 * 应用配置管理
 * 统一管理所有配置项，避免硬编码
 */
class Config {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.isDevelopment = this.env === 'development';
    this.isProduction = this.env === 'production';
    this.isTest = this.env === 'test';
  }

  // 显示配置摘要（延迟调用，避免循环引用）
  showConfigSummary() {
    console.log('====== 配置摘要 ======');
    console.log(`环境: ${this.env}`);
    console.log(`端口: ${this.server.port}`);
    console.log(`数据库: ${this.database.uri.replace(/\/\/.*@/, '//***:***@')}`);
    console.log(`邮件服务: ${this.email.enabled ? '✅ 已启用' : '❌ 已禁用'}`);
    if (this.email.enabled) {
      console.log(`SMTP主机: ${this.email.smtp.host}`);
      console.log(`发件人: ${this.email.from.address}`);
    }
    console.log('======================');
  }

  // 服务器配置
  get server() {
    // 智能trust proxy配置
    let trustProxy = false;
    if (process.env.TRUST_PROXY === 'true') {
      // 生产环境下，只信任特定的代理IP
      if (this.isProduction) {
        trustProxy = process.env.TRUSTED_PROXIES ? 
          process.env.TRUSTED_PROXIES.split(',').map(ip => ip.trim()) : 
          ['127.0.0.1', '::1']; // 默认只信任本地代理
      } else {
        trustProxy = true; // 开发环境可以信任所有代理
      }
    }
    
    return {
      port: parseInt(process.env.PORT) || 5500,
      host: process.env.HOST || 'localhost',
      trustProxy: trustProxy,
      bodyLimit: process.env.BODY_LIMIT || '200mb',
      clientUrl: process.env.CLIENT_URL || 'http://localhost:3100',
    };
  }

  // 数据库配置
  get database() {
    return {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/midjourney-gallery',
      options: {
        // MongoDB 4.0.0+ 驱动已移除弃用选项
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 15, // 增加连接池大小
        serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 3000, // 减少服务器选择超时
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 30000, // 减少socket超时
        // 添加其他推荐的连接选项
        maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 20000, // 减少空闲时间
        connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 5000, // 减少连接超时
        // 添加性能优化选项
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2, // 最小连接池大小
        heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQ) || 10000, // 心跳频率
      },
    };
  }

  // JWT配置
  get jwt() {
    return {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
    };
  }

  // CORS配置
  get cors() {
    const clientUrls = process.env.CLIENT_URL ? 
      process.env.CLIENT_URL.split(',').map(url => url.trim()) : 
      ['http://localhost:3000'];
    
    return {
      origin: this.isDevelopment ? clientUrls : clientUrls,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    };
  }

  // 限流配置
  get rateLimit() {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // 进一步增加到1000个请求
      message: {
        error: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      // 自定义keyGenerator以避免trust proxy警告
      keyGenerator: (req) => {
        // 如果trust proxy启用，优先使用X-Forwarded-For
        if (this.server.trustProxy && req.headers['x-forwarded-for']) {
          const forwarded = req.headers['x-forwarded-for'].split(',')[0].trim();
          return forwarded;
        }
        // 否则使用连接IP
        return req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
      },
      // 跳过静态资源和健康检查的限流
      skip: (req) => {
        return req.path.startsWith('/uploads/') || 
               req.path.startsWith('/Circle/') ||
               req.path === '/api/health' ||
               req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i);
      }
    };
  }

  // 文件上传配置
  get upload() {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const resolvedUploadPath = path.resolve(uploadPath);
    return {
      path: resolvedUploadPath,
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024, // 200MB
      maxFiles: parseInt(process.env.MAX_FILES) || 9,
      allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/jpg,image/png,image/gif,image/webp').split(','),
      allowedVideoTypes: (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/mov,video/avi,video/mkv').split(','),
      thumbnailSize: {
        width: parseInt(process.env.THUMBNAIL_WIDTH) || 300,
        height: parseInt(process.env.THUMBNAIL_HEIGHT) || 300,
      },
      directories: {
        images: path.join(resolvedUploadPath, 'images'),
        videos: path.join(resolvedUploadPath, 'videos'),
        thumbnails: path.join(resolvedUploadPath, 'thumbnails'),
        temp: path.join(resolvedUploadPath, 'temp'),
      },
    };
  }

  // 邮件配置 - 增强布尔值兼容性
  get email() {
    const enabled = process.env.EMAIL_ENABLED;
    return {
      // 兼容 true, TRUE, True, 1 等多种格式
      enabled: enabled === 'true' || enabled === 'TRUE' || enabled === 'True' || enabled === '1',
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        // 兼容 secure 的不同格式
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'TRUE' || process.env.SMTP_SECURE === '1',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: {
        name: process.env.EMAIL_FROM_NAME || 'III.PICS',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER,
      },
      templates: {
        welcome: process.env.EMAIL_TEMPLATE_WELCOME || 'welcome',
        resetPassword: process.env.EMAIL_TEMPLATE_RESET || 'reset-password',
      },
    };
  }

  // 管理员配置
  get admin() {
    return {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      autoCreate: process.env.ADMIN_AUTO_CREATE !== 'false',
    };
  }

  // 缓存配置
  get cache() {
    return {
      enabled: process.env.CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.CACHE_TTL) || 300, // 5分钟
      redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'mj-gallery:',
      },
    };
  }

  // 应用配置
  get app() {
    return {
      baseUrl: process.env.BASE_URL || 'https://iii.pics',
      name: process.env.APP_NAME || 'III.PICS',
      version: process.env.APP_VERSION || '1.0.0',
      description: process.env.APP_DESCRIPTION || 'AI Generated Image Gallery',
    };
  }

  // 日志配置
  get logging() {
    return {
      level: process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info'),
      format: process.env.LOG_FORMAT || 'combined',
      file: {
        enabled: process.env.LOG_FILE_ENABLED === 'true',
        path: process.env.LOG_FILE_PATH || './logs',
        maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES) || 5,
      },
    };
  }

  // 安全配置
  get security() {
    return {
      helmet: {
        contentSecurityPolicy: this.isDevelopment ? false : {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false,
      },
      bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
      },
      session: {
        secret: process.env.SESSION_SECRET || this.jwt.secret,
        maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24小时
      },
    };
  }

  // 分页配置
  get pagination() {
    return {
      defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 12,
      maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT) || 100,
    };
  }

  // 第三方服务配置
  get services() {
    return {
      analytics: {
        enabled: process.env.ANALYTICS_ENABLED === 'true',
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
      },
      sentry: {
        enabled: process.env.SENTRY_ENABLED === 'true',
        dsn: process.env.SENTRY_DSN,
        environment: this.env,
      },
      cloudinary: {
        enabled: process.env.CLOUDINARY_ENABLED === 'true',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
      },
    };
  }

  // 验证配置
  validate() {
    const required = [
      'JWT_SECRET',
      'MONGODB_URI',
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
    }

    // 验证JWT密钥强度
    if (this.jwt.secret.length < 32) {
      console.warn('⚠️  警告: JWT_SECRET 长度过短，建议使用至少32个字符的强密钥');
    }

    // 验证数据库连接字符串
    if (!this.database.uri.startsWith('mongodb://') && !this.database.uri.startsWith('mongodb+srv://')) {
      throw new Error('MONGODB_URI 格式不正确');
    }

    console.log('✅ 配置验证通过');
  }

  // 获取所有配置（用于调试）
  getAll() {
    return {
      env: this.env,
      server: this.server,
      database: { ...this.database, uri: this.database.uri.replace(/\/\/.*@/, '//***:***@') },
      jwt: { ...this.jwt, secret: '***' },
      cors: this.cors,
      rateLimit: this.rateLimit,
      upload: this.upload,
      email: { ...this.email, smtp: { ...this.email.smtp, auth: { user: this.email.smtp.auth.user, pass: '***' } } },
      admin: { ...this.admin, password: '***' },
      cache: this.cache,
      logging: this.logging,
      security: { ...this.security, session: { ...this.security.session, secret: '***' } },
      pagination: this.pagination,
      services: this.services,
    };
  }
}

// 创建配置实例
const config = new Config();

// 在非测试环境下验证配置
if (process.env.NODE_ENV !== 'test') {
  try {
    config.validate();
    
    // 显示配置摘要（仅开发环境显示详细信息）
    if (config.isDevelopment) {
      console.log('====== 配置摘要 ======');
      console.log(`环境: ${config.env}`);
      console.log(`端口: ${config.server.port}`);
      console.log(`数据库: ${config.database.uri.replace(/\/\/.*@/, '//***:***@')}`);
      console.log(`邮件服务: ${config.email.enabled ? '✅ 已启用' : '❌ 已禁用'}`);
      if (config.email.enabled) {
        console.log(`SMTP主机: ${config.email.smtp.host}`);
        console.log(`发件人: ${config.email.from.address}`);
      }
      console.log('======================');
    } else {
      console.log(`✅ 服务器配置加载完成 [${config.env}:${config.server.port}]`);
    }
  } catch (error) {
    console.error('❌ 配置验证失败:', error.message);
    process.exit(1);
  }
}

module.exports = config;
