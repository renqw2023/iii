#!/usr/bin/env node

/**
 * 配置生成脚本
 * 用于生成开发和生产环境的配置文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
  question: (msg) => `${colors.magenta}?${colors.reset} ${msg}`,
};

class ConfigGenerator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.config = {};
  }

  // 生成随机密钥
  generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  // 询问用户输入
  async ask(question, defaultValue = '') {
    return new Promise((resolve) => {
      const prompt = defaultValue ? 
        `${log.question(question)} (${colors.yellow}${defaultValue}${colors.reset}): ` :
        `${log.question(question)}: `;
      
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  // 询问是否确认
  async confirm(question, defaultValue = false) {
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.ask(`${question} (${defaultText})`);
    
    if (!answer) return defaultValue;
    return answer.toLowerCase().startsWith('y');
  }

  // 收集基本配置
  async collectBasicConfig() {
    log.title('📋 基本配置');
    
    this.config.NODE_ENV = await this.ask('环境类型', 'development');
    this.config.PORT = await this.ask('服务器端口', '5000');
    this.config.HOST = await this.ask('服务器主机', 'localhost');
    
    // 生成JWT密钥
    const useGeneratedJWT = await this.confirm('生成随机JWT密钥?', true);
    if (useGeneratedJWT) {
      this.config.JWT_SECRET = this.generateSecret();
      log.success('已生成JWT密钥');
    } else {
      this.config.JWT_SECRET = await this.ask('JWT密钥 (至少32个字符)');
    }
  }

  // 收集数据库配置
  async collectDatabaseConfig() {
    log.title('🗄️  数据库配置');
    
    const dbType = await this.ask('数据库类型 (local/atlas)', 'local');
    
    if (dbType === 'atlas') {
      const username = await this.ask('MongoDB Atlas 用户名');
      const password = await this.ask('MongoDB Atlas 密码');
      const cluster = await this.ask('MongoDB Atlas 集群地址');
      const dbName = await this.ask('数据库名称', 'midjourney-gallery');
      
      this.config.MONGODB_URI = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority`;
    } else {
      const host = await this.ask('MongoDB 主机', 'localhost');
      const port = await this.ask('MongoDB 端口', '27017');
      const dbName = await this.ask('数据库名称', 'midjourney-gallery');
      
      this.config.MONGODB_URI = `mongodb://${host}:${port}/${dbName}`;
    }
  }

  // 收集客户端配置
  async collectClientConfig() {
    log.title('🌐 客户端配置');
    
    const clientUrls = await this.ask('客户端URL (多个用逗号分隔)', 'http://localhost:3000');
    this.config.CLIENT_URL = clientUrls;
  }

  // 收集文件上传配置
  async collectUploadConfig() {
    log.title('📁 文件上传配置');
    
    this.config.MAX_FILE_SIZE = await this.ask('最大文件大小 (字节)', '10485760');
    this.config.MAX_FILES = await this.ask('最大文件数量', '9');
    this.config.UPLOAD_PATH = await this.ask('上传路径', './server/uploads');
  }

  // 收集邮件配置
  async collectEmailConfig() {
    log.title('📧 邮件配置');
    
    const enableEmail = await this.confirm('启用邮件功能?', false);
    this.config.EMAIL_ENABLED = enableEmail.toString();
    
    if (enableEmail) {
      this.config.SMTP_HOST = await this.ask('SMTP 主机', 'smtp.gmail.com');
      this.config.SMTP_PORT = await this.ask('SMTP 端口', '587');
      this.config.SMTP_USER = await this.ask('SMTP 用户名');
      this.config.SMTP_PASS = await this.ask('SMTP 密码');
      this.config.EMAIL_FROM_NAME = await this.ask('发件人名称', 'MJ Gallery');
    }
  }

  // 收集管理员配置
  async collectAdminConfig() {
    log.title('👤 管理员配置');
    
    this.config.ADMIN_USERNAME = await this.ask('管理员用户名', 'admin');
    this.config.ADMIN_EMAIL = await this.ask('管理员邮箱', 'admin@example.com');
    
    const useGeneratedPassword = await this.confirm('生成随机管理员密码?', true);
    if (useGeneratedPassword) {
      this.config.ADMIN_PASSWORD = this.generateSecret(16);
      log.success('已生成管理员密码');
    } else {
      this.config.ADMIN_PASSWORD = await this.ask('管理员密码');
    }
  }

  // 收集第三方服务配置
  async collectServicesConfig() {
    log.title('🔌 第三方服务配置');
    
    // Google Analytics
    const enableGA = await this.confirm('启用Google Analytics?', false);
    this.config.ANALYTICS_ENABLED = enableGA.toString();
    if (enableGA) {
      this.config.GOOGLE_ANALYTICS_ID = await this.ask('Google Analytics ID');
    }
    
    // Sentry
    const enableSentry = await this.confirm('启用Sentry错误监控?', false);
    this.config.SENTRY_ENABLED = enableSentry.toString();
    if (enableSentry) {
      this.config.SENTRY_DSN = await this.ask('Sentry DSN');
    }
    
    // Cloudinary
    const enableCloudinary = await this.confirm('启用Cloudinary云存储?', false);
    this.config.CLOUDINARY_ENABLED = enableCloudinary.toString();
    if (enableCloudinary) {
      this.config.CLOUDINARY_CLOUD_NAME = await this.ask('Cloudinary Cloud Name');
      this.config.CLOUDINARY_API_KEY = await this.ask('Cloudinary API Key');
      this.config.CLOUDINARY_API_SECRET = await this.ask('Cloudinary API Secret');
    }
  }

  // 生成环境变量文件内容
  generateEnvContent() {
    const lines = [
      '# MJ Gallery 环境配置',
      '# 由配置生成脚本自动生成',
      `# 生成时间: ${new Date().toISOString()}`,
      '',
      '# 服务器配置',
      `PORT=${this.config.PORT}`,
      `HOST=${this.config.HOST}`,
      `NODE_ENV=${this.config.NODE_ENV}`,
      'TRUST_PROXY=true',
      'BODY_LIMIT=200mb',
      '',
      '# 数据库配置',
      `MONGODB_URI=${this.config.MONGODB_URI}`,
      'DB_MAX_POOL_SIZE=10',
      'DB_TIMEOUT=5000',
      'DB_SOCKET_TIMEOUT=45000',
      '',
      '# JWT配置',
      `JWT_SECRET=${this.config.JWT_SECRET}`,
      'JWT_EXPIRES_IN=7d',
      'JWT_REFRESH_EXPIRES_IN=30d',
      'JWT_ALGORITHM=HS256',
      '',
      '# 客户端URL',
      `CLIENT_URL=${this.config.CLIENT_URL}`,
      '',
      '# 限流配置',
      'RATE_LIMIT_WINDOW_MS=900000',
      'RATE_LIMIT_MAX=100',
      '',
      '# 文件上传配置',
      `MAX_FILE_SIZE=${this.config.MAX_FILE_SIZE}`,
      `MAX_FILES=${this.config.MAX_FILES}`,
      `UPLOAD_PATH=${this.config.UPLOAD_PATH}`,
      'ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/gif,image/webp',
      'ALLOWED_VIDEO_TYPES=video/mp4,video/mov,video/avi,video/mkv',
      'THUMBNAIL_WIDTH=300',
      'THUMBNAIL_HEIGHT=300',
      '',
      '# 邮件配置',
      `EMAIL_ENABLED=${this.config.EMAIL_ENABLED}`,
    ];

    if (this.config.EMAIL_ENABLED === 'true') {
      lines.push(
        `SMTP_HOST=${this.config.SMTP_HOST}`,
        `SMTP_PORT=${this.config.SMTP_PORT}`,
        'SMTP_SECURE=false',
        `SMTP_USER=${this.config.SMTP_USER}`,
        `SMTP_PASS=${this.config.SMTP_PASS}`,
        `EMAIL_FROM_NAME=${this.config.EMAIL_FROM_NAME}`,
        `EMAIL_FROM_ADDRESS=${this.config.SMTP_USER}`,
      );
    } else {
      lines.push(
        'SMTP_HOST=smtp.gmail.com',
        'SMTP_PORT=587',
        'SMTP_SECURE=false',
        'SMTP_USER=',
        'SMTP_PASS=',
        'EMAIL_FROM_NAME=MJ Gallery',
        'EMAIL_FROM_ADDRESS=',
      );
    }

    lines.push(
      'EMAIL_TEMPLATE_WELCOME=welcome',
      'EMAIL_TEMPLATE_RESET=reset-password',
      '',
      '# 管理员配置',
      `ADMIN_USERNAME=${this.config.ADMIN_USERNAME}`,
      `ADMIN_EMAIL=${this.config.ADMIN_EMAIL}`,
      `ADMIN_PASSWORD=${this.config.ADMIN_PASSWORD}`,
      'ADMIN_AUTO_CREATE=true',
      '',
      '# 缓存配置',
      'CACHE_ENABLED=true',
      'CACHE_TTL=300',
      'REDIS_ENABLED=false',
      'REDIS_URL=redis://localhost:6379',
      'REDIS_KEY_PREFIX=mj-gallery:',
      '',
      '# 日志配置',
      this.config.NODE_ENV === 'production' ? 'LOG_LEVEL=info' : 'LOG_LEVEL=debug',
      'LOG_FORMAT=combined',
      'LOG_FILE_ENABLED=false',
      'LOG_FILE_PATH=./logs',
      'LOG_FILE_MAX_SIZE=10m',
      'LOG_FILE_MAX_FILES=5',
      '',
      '# 安全配置',
      'BCRYPT_SALT_ROUNDS=12',
      `SESSION_SECRET=${this.generateSecret()}`,
      'SESSION_MAX_AGE=86400000',
      '',
      '# 分页配置',
      'PAGINATION_DEFAULT_LIMIT=12',
      'PAGINATION_MAX_LIMIT=100',
      '',
      '# 第三方服务配置',
      `ANALYTICS_ENABLED=${this.config.ANALYTICS_ENABLED}`,
      `GOOGLE_ANALYTICS_ID=${this.config.GOOGLE_ANALYTICS_ID || ''}`,
      `SENTRY_ENABLED=${this.config.SENTRY_ENABLED}`,
      `SENTRY_DSN=${this.config.SENTRY_DSN || ''}`,
      `CLOUDINARY_ENABLED=${this.config.CLOUDINARY_ENABLED}`,
      `CLOUDINARY_CLOUD_NAME=${this.config.CLOUDINARY_CLOUD_NAME || ''}`,
      `CLOUDINARY_API_KEY=${this.config.CLOUDINARY_API_KEY || ''}`,
      `CLOUDINARY_API_SECRET=${this.config.CLOUDINARY_API_SECRET || ''}`,
    );

    return lines.join('\n');
  }

  // 保存配置文件
  async saveConfig() {
    log.title('💾 保存配置文件');
    
    const envContent = this.generateEnvContent();
    const envPath = path.join(__dirname, '../.env');
    
    // 检查是否已存在.env文件
    if (fs.existsSync(envPath)) {
      const overwrite = await this.confirm('已存在.env文件，是否覆盖?', false);
      if (!overwrite) {
        const backupPath = `${envPath}.backup.${Date.now()}`;
        fs.copyFileSync(envPath, backupPath);
        log.success(`已备份现有配置到: ${backupPath}`);
      }
    }
    
    fs.writeFileSync(envPath, envContent);
    log.success(`配置文件已保存到: ${envPath}`);
    
    // 显示重要信息
    console.log(`\n${colors.yellow}重要信息:${colors.reset}`);
    console.log(`  管理员用户名: ${colors.green}${this.config.ADMIN_USERNAME}${colors.reset}`);
    console.log(`  管理员邮箱: ${colors.green}${this.config.ADMIN_EMAIL}${colors.reset}`);
    console.log(`  管理员密码: ${colors.green}${this.config.ADMIN_PASSWORD}${colors.reset}`);
    console.log(`  JWT密钥: ${colors.green}${this.config.JWT_SECRET.substring(0, 16)}...${colors.reset}`);
    
    log.warning('请妥善保管这些信息，特别是在生产环境中！');
  }

  // 运行配置生成流程
  async run() {
    console.log(`${colors.magenta}🔧 MJ Gallery 配置生成工具${colors.reset}\n`);
    
    try {
      await this.collectBasicConfig();
      await this.collectDatabaseConfig();
      await this.collectClientConfig();
      await this.collectUploadConfig();
      await this.collectEmailConfig();
      await this.collectAdminConfig();
      await this.collectServicesConfig();
      
      await this.saveConfig();
      
      log.success('配置生成完成！');
      log.info('请运行 "npm run validate-config" 验证配置');
      
    } catch (error) {
      log.error(`配置生成失败: ${error.message}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const generator = new ConfigGenerator();
  generator.run().catch(error => {
    console.error('生成失败:', error);
    process.exit(1);
  });
}

module.exports = ConfigGenerator;