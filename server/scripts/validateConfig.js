#!/usr/bin/env node

/**
 * 配置验证脚本
 * 用于验证环境变量配置的完整性和正确性
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

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
};

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  // 验证必需的环境变量
  validateRequired() {
    log.title('🔍 验证必需的环境变量');
    
    const required = [
      { key: 'JWT_SECRET', minLength: 32, description: 'JWT密钥' },
      { key: 'MONGODB_URI', pattern: /^mongodb(\+srv)?:\/\//, description: 'MongoDB连接字符串' },
    ];

    required.forEach(({ key, minLength, pattern, description }) => {
      const value = process.env[key];
      
      if (!value) {
        this.errors.push(`缺少必需的环境变量: ${key} (${description})`);
        return;
      }

      if (minLength && value.length < minLength) {
        this.warnings.push(`${key} 长度过短，建议至少 ${minLength} 个字符`);
      }

      if (pattern && !pattern.test(value)) {
        this.errors.push(`${key} 格式不正确 (${description})`);
      }

      log.success(`${key}: 已设置`);
    });
  }

  // 验证数据库连接
  async validateDatabase() {
    log.title('🗄️  验证数据库连接');
    
    try {
      const mongoose = require('mongoose');
      await mongoose.connect(config.database.uri, {
        ...config.database.options,
        serverSelectionTimeoutMS: 5000, // 5秒超时
      });
      
      log.success('数据库连接成功');
      await mongoose.disconnect();
    } catch (error) {
      this.errors.push(`数据库连接失败: ${error.message}`);
    }
  }

  // 验证文件上传目录
  validateUploadDirectories() {
    log.title('📁 验证文件上传目录');
    
    const directories = Object.values(config.upload.directories);
    directories.push(config.upload.path);

    directories.forEach(dir => {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          log.success(`创建目录: ${dir}`);
        } else {
          log.success(`目录存在: ${dir}`);
        }

        // 检查写入权限
        const testFile = path.join(dir, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        
      } catch (error) {
        this.errors.push(`目录 ${dir} 无法访问或创建: ${error.message}`);
      }
    });
  }

  // 验证端口可用性
  async validatePort() {
    log.title('🌐 验证端口可用性');
    
    const net = require('net');
    const port = config.server.port;
    
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => {
          log.success(`端口 ${port} 可用`);
          resolve();
        });
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          this.warnings.push(`端口 ${port} 已被占用`);
        } else {
          this.errors.push(`端口 ${port} 检查失败: ${err.message}`);
        }
        resolve();
      });
    });
  }

  // 验证邮件配置
  validateEmailConfig() {
    log.title('📧 验证邮件配置');
    
    if (!config.email.enabled) {
      log.info('邮件功能已禁用');
      return;
    }

    const { smtp } = config.email;
    
    if (!smtp.auth.user || !smtp.auth.pass) {
      this.warnings.push('邮件功能已启用但缺少SMTP认证信息');
    } else {
      log.success('SMTP配置完整');
    }
  }

  // 验证第三方服务配置
  validateServices() {
    log.title('🔌 验证第三方服务配置');
    
    const { services } = config;
    
    // Google Analytics
    if (services.analytics.enabled && !services.analytics.googleAnalyticsId) {
      this.warnings.push('Google Analytics已启用但未设置跟踪ID');
    }

    // Sentry
    if (services.sentry.enabled && !services.sentry.dsn) {
      this.warnings.push('Sentry已启用但未设置DSN');
    }

    // Cloudinary
    if (services.cloudinary.enabled) {
      const { cloudName, apiKey, apiSecret } = services.cloudinary;
      if (!cloudName || !apiKey || !apiSecret) {
        this.warnings.push('Cloudinary已启用但配置不完整');
      }
    }

    log.success('第三方服务配置检查完成');
  }

  // 验证安全配置
  validateSecurity() {
    log.title('🔒 验证安全配置');
    
    // JWT密钥强度
    const jwtSecret = config.jwt.secret;
    if (jwtSecret === 'your-secret-key' || jwtSecret.includes('example')) {
      this.errors.push('JWT_SECRET 使用了默认值，存在安全风险');
    }

    // 生产环境检查
    if (config.isProduction) {
      if (config.admin.password === 'admin123456') {
        this.errors.push('生产环境中管理员密码使用了默认值');
      }

      if (!process.env.SESSION_SECRET) {
        this.warnings.push('生产环境建议设置SESSION_SECRET');
      }
    }

    log.success('安全配置检查完成');
  }

  // 生成配置报告
  generateReport() {
    log.title('📊 配置验证报告');
    
    console.log(`\n${colors.cyan}环境信息:${colors.reset}`);
    console.log(`  - 环境: ${config.env}`);
    console.log(`  - 服务器: ${config.server.host}:${config.server.port}`);
    console.log(`  - 数据库: ${config.database.uri.replace(/\/\/.*@/, '//***:***@')}`);
    console.log(`  - 上传路径: ${config.upload.path}`);
    
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}错误 (${this.errors.length}):${colors.reset}`);
      this.errors.forEach(error => log.error(error));
    }

    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}警告 (${this.warnings.length}):${colors.reset}`);
      this.warnings.forEach(warning => log.warning(warning));
    }

    if (this.info.length > 0) {
      console.log(`\n${colors.blue}信息:${colors.reset}`);
      this.info.forEach(info => log.info(info));
    }

    const hasErrors = this.errors.length > 0;
    const hasWarnings = this.warnings.length > 0;

    console.log(`\n${colors.cyan}验证结果:${colors.reset}`);
    if (hasErrors) {
      log.error(`发现 ${this.errors.length} 个错误，请修复后重试`);
      process.exit(1);
    } else if (hasWarnings) {
      log.warning(`发现 ${this.warnings.length} 个警告，建议修复`);
      log.success('配置基本正确，可以启动应用');
    } else {
      log.success('配置验证通过，一切正常！');
    }
  }

  // 运行所有验证
  async run() {
    console.log(`${colors.magenta}🔧 MJ Gallery 配置验证工具${colors.reset}\n`);
    
    try {
      this.validateRequired();
      await this.validateDatabase();
      this.validateUploadDirectories();
      await this.validatePort();
      this.validateEmailConfig();
      this.validateServices();
      this.validateSecurity();
      
      this.generateReport();
    } catch (error) {
      log.error(`验证过程中发生错误: ${error.message}`);
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const validator = new ConfigValidator();
  validator.run().catch(error => {
    console.error('验证失败:', error);
    process.exit(1);
  });
}

module.exports = ConfigValidator;