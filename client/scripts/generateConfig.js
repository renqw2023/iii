#!/usr/bin/env node

/**
 * 前端配置生成脚本
 * 用于生成开发和生产环境的前端配置文件
 */

const fs = require('fs');
const path = require('path');
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

class ClientConfigGenerator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.config = {};
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

  // 收集API配置
  async collectApiConfig() {
    log.title('🌐 API配置');
    
    this.config.REACT_APP_API_URL = await this.ask('API服务器地址', 'http://localhost:5000/api');
    this.config.REACT_APP_API_TIMEOUT = await this.ask('API超时时间(毫秒)', '30000');
    this.config.REACT_APP_API_RETRY_ATTEMPTS = await this.ask('API重试次数', '3');
    this.config.REACT_APP_API_RETRY_DELAY = await this.ask('API重试延迟(毫秒)', '1000');
  }

  // 收集应用配置
  async collectAppConfig() {
    log.title('📱 应用配置');
    
    this.config.REACT_APP_NAME = await this.ask('应用名称', 'MJ Gallery');
    this.config.REACT_APP_VERSION = await this.ask('应用版本', '1.0.0');
    this.config.REACT_APP_DESCRIPTION = await this.ask('应用描述', 'Midjourney作品展示平台');
    this.config.REACT_APP_AUTHOR = await this.ask('应用作者', 'MJ Gallery Team');
    this.config.REACT_APP_HOMEPAGE = await this.ask('应用主页', 'https://iii.pics');
  }

  // 收集功能开关配置
  async collectFeatureConfig() {
    log.title('🔧 功能开关配置');
    
    this.config.REACT_APP_ENABLE_ANALYTICS = (await this.confirm('启用分析功能?', true)).toString();
    this.config.REACT_APP_ENABLE_PWA = (await this.confirm('启用PWA功能?', true)).toString();
    this.config.REACT_APP_ENABLE_DARK_MODE = (await this.confirm('启用暗色模式?', true)).toString();
    this.config.REACT_APP_ENABLE_NOTIFICATIONS = (await this.confirm('启用通知功能?', true)).toString();
    this.config.REACT_APP_ENABLE_SOCIAL_SHARE = (await this.confirm('启用社交分享?', true)).toString();
    this.config.REACT_APP_ENABLE_COMMENTS = (await this.confirm('启用评论功能?', true)).toString();
    this.config.REACT_APP_ENABLE_FAVORITES = (await this.confirm('启用收藏功能?', true)).toString();
    this.config.REACT_APP_ENABLE_SEARCH = (await this.confirm('启用搜索功能?', true)).toString();
  }

  // 收集文件上传配置
  async collectUploadConfig() {
    log.title('📁 文件上传配置');
    
    this.config.REACT_APP_MAX_FILE_SIZE = await this.ask('最大文件大小(字节)', '10485760');
    this.config.REACT_APP_MAX_FILES = await this.ask('最大文件数量', '9');
    this.config.REACT_APP_ALLOWED_IMAGE_TYPES = await this.ask('允许的图片类型', 'image/jpeg,image/jpg,image/png,image/gif,image/webp');
    this.config.REACT_APP_ALLOWED_VIDEO_TYPES = await this.ask('允许的视频类型', 'video/mp4,video/mov,video/avi,video/mkv');
    
    this.config.REACT_APP_ENABLE_CHUNK_UPLOAD = (await this.confirm('启用分块上传?', true)).toString();
    this.config.REACT_APP_CHUNK_SIZE = await this.ask('分块大小(字节)', '1048576');
    this.config.REACT_APP_CONCURRENT_UPLOADS = await this.ask('并发上传数', '3');
  }

  // 收集分页配置
  async collectPaginationConfig() {
    log.title('📄 分页配置');
    
    this.config.REACT_APP_PAGINATION_DEFAULT_LIMIT = await this.ask('默认分页大小', '12');
    this.config.REACT_APP_PAGINATION_MAX_LIMIT = await this.ask('最大分页大小', '100');
    this.config.REACT_APP_PAGINATION_OPTIONS = await this.ask('分页选项(逗号分隔)', '12,24,48,96');
  }

  // 收集缓存配置
  async collectCacheConfig() {
    log.title('💾 缓存配置');
    
    this.config.REACT_APP_CACHE_ENABLED = (await this.confirm('启用缓存?', true)).toString();
    this.config.REACT_APP_CACHE_TTL = await this.ask('缓存过期时间(秒)', '300');
    this.config.REACT_APP_CACHE_MAX_SIZE = await this.ask('最大缓存大小(MB)', '50');
  }

  // 收集UI配置
  async collectUIConfig() {
    log.title('🎨 UI配置');
    
    this.config.REACT_APP_ENABLE_ANIMATIONS = (await this.confirm('启用动画效果?', true)).toString();
    this.config.REACT_APP_ENABLE_TOAST = (await this.confirm('启用Toast通知?', true)).toString();
    this.config.REACT_APP_DEBOUNCE_DELAY = await this.ask('防抖延迟(毫秒)', '300');
    this.config.REACT_APP_THROTTLE_DELAY = await this.ask('节流延迟(毫秒)', '100');
    this.config.REACT_APP_LAZY_LOAD_OFFSET = await this.ask('懒加载偏移(像素)', '100');
    this.config.REACT_APP_INFINITE_SCROLL_THRESHOLD = await this.ask('无限滚动阈值', '0.8');
  }

  // 收集主题配置
  async collectThemeConfig() {
    log.title('🌈 主题配置');
    
    this.config.REACT_APP_DEFAULT_THEME = await this.ask('默认主题', 'light');
    this.config.REACT_APP_PRIMARY_COLOR = await this.ask('主色调', '#1976d2');
    this.config.REACT_APP_SECONDARY_COLOR = await this.ask('辅助色', '#dc004e');
  }

  // 收集Midjourney参数配置
  async collectMidjourneyConfig() {
    log.title('🎭 Midjourney参数配置');
    
    this.config.REACT_APP_MJ_CHAOS_MIN = await this.ask('混沌值最小值', '0');
    this.config.REACT_APP_MJ_CHAOS_MAX = await this.ask('混沌值最大值', '100');
    this.config.REACT_APP_MJ_STYLIZE_MIN = await this.ask('风格化最小值', '0');
    this.config.REACT_APP_MJ_STYLIZE_MAX = await this.ask('风格化最大值', '1000');
  }

  // 收集第三方服务配置
  async collectServicesConfig() {
    log.title('🔌 第三方服务配置');
    
    // Google Analytics
    const enableGA = await this.confirm('启用Google Analytics?', false);
    this.config.REACT_APP_GOOGLE_ANALYTICS_ID = enableGA ? await this.ask('Google Analytics ID') : '';
    
    // Sentry
    const enableSentry = await this.confirm('启用Sentry错误监控?', false);
    this.config.REACT_APP_SENTRY_DSN = enableSentry ? await this.ask('Sentry DSN') : '';
    
    // Hotjar
    const enableHotjar = await this.confirm('启用Hotjar用户行为分析?', false);
    this.config.REACT_APP_HOTJAR_ID = enableHotjar ? await this.ask('Hotjar ID') : '';
    this.config.REACT_APP_HOTJAR_SV = enableHotjar ? await this.ask('Hotjar Snippet Version', '6') : '';
  }

  // 生成环境变量文件内容
  generateEnvContent() {
    const lines = [
      '# MJ Gallery 前端环境配置',
      '# 由配置生成脚本自动生成',
      `# 生成时间: ${new Date().toISOString()}`,
      '',
      '# API配置',
      `REACT_APP_API_URL=${this.config.REACT_APP_API_URL}`,
      `REACT_APP_API_TIMEOUT=${this.config.REACT_APP_API_TIMEOUT}`,
      `REACT_APP_API_RETRY_ATTEMPTS=${this.config.REACT_APP_API_RETRY_ATTEMPTS}`,
      `REACT_APP_API_RETRY_DELAY=${this.config.REACT_APP_API_RETRY_DELAY}`,
      '',
      '# 应用配置',
      `REACT_APP_NAME=${this.config.REACT_APP_NAME}`,
      `REACT_APP_VERSION=${this.config.REACT_APP_VERSION}`,
      `REACT_APP_DESCRIPTION=${this.config.REACT_APP_DESCRIPTION}`,
      `REACT_APP_AUTHOR=${this.config.REACT_APP_AUTHOR}`,
      `REACT_APP_HOMEPAGE=${this.config.REACT_APP_HOMEPAGE}`,
      '',
      '# 功能开关',
      `REACT_APP_ENABLE_ANALYTICS=${this.config.REACT_APP_ENABLE_ANALYTICS}`,
      `REACT_APP_ENABLE_PWA=${this.config.REACT_APP_ENABLE_PWA}`,
      `REACT_APP_ENABLE_DARK_MODE=${this.config.REACT_APP_ENABLE_DARK_MODE}`,
      `REACT_APP_ENABLE_NOTIFICATIONS=${this.config.REACT_APP_ENABLE_NOTIFICATIONS}`,
      `REACT_APP_ENABLE_SOCIAL_SHARE=${this.config.REACT_APP_ENABLE_SOCIAL_SHARE}`,
      `REACT_APP_ENABLE_COMMENTS=${this.config.REACT_APP_ENABLE_COMMENTS}`,
      `REACT_APP_ENABLE_FAVORITES=${this.config.REACT_APP_ENABLE_FAVORITES}`,
      `REACT_APP_ENABLE_SEARCH=${this.config.REACT_APP_ENABLE_SEARCH}`,
      '',
      '# 文件上传配置',
      `REACT_APP_MAX_FILE_SIZE=${this.config.REACT_APP_MAX_FILE_SIZE}`,
      `REACT_APP_MAX_FILES=${this.config.REACT_APP_MAX_FILES}`,
      `REACT_APP_ALLOWED_IMAGE_TYPES=${this.config.REACT_APP_ALLOWED_IMAGE_TYPES}`,
      `REACT_APP_ALLOWED_VIDEO_TYPES=${this.config.REACT_APP_ALLOWED_VIDEO_TYPES}`,
      `REACT_APP_ENABLE_CHUNK_UPLOAD=${this.config.REACT_APP_ENABLE_CHUNK_UPLOAD}`,
      `REACT_APP_CHUNK_SIZE=${this.config.REACT_APP_CHUNK_SIZE}`,
      `REACT_APP_CONCURRENT_UPLOADS=${this.config.REACT_APP_CONCURRENT_UPLOADS}`,
      '',
      '# 分页配置',
      `REACT_APP_PAGINATION_DEFAULT_LIMIT=${this.config.REACT_APP_PAGINATION_DEFAULT_LIMIT}`,
      `REACT_APP_PAGINATION_MAX_LIMIT=${this.config.REACT_APP_PAGINATION_MAX_LIMIT}`,
      `REACT_APP_PAGINATION_OPTIONS=${this.config.REACT_APP_PAGINATION_OPTIONS}`,
      '',
      '# 缓存配置',
      `REACT_APP_CACHE_ENABLED=${this.config.REACT_APP_CACHE_ENABLED}`,
      `REACT_APP_CACHE_TTL=${this.config.REACT_APP_CACHE_TTL}`,
      `REACT_APP_CACHE_MAX_SIZE=${this.config.REACT_APP_CACHE_MAX_SIZE}`,
      '',
      '# UI配置',
      `REACT_APP_ENABLE_ANIMATIONS=${this.config.REACT_APP_ENABLE_ANIMATIONS}`,
      `REACT_APP_ENABLE_TOAST=${this.config.REACT_APP_ENABLE_TOAST}`,
      `REACT_APP_DEBOUNCE_DELAY=${this.config.REACT_APP_DEBOUNCE_DELAY}`,
      `REACT_APP_THROTTLE_DELAY=${this.config.REACT_APP_THROTTLE_DELAY}`,
      `REACT_APP_LAZY_LOAD_OFFSET=${this.config.REACT_APP_LAZY_LOAD_OFFSET}`,
      `REACT_APP_INFINITE_SCROLL_THRESHOLD=${this.config.REACT_APP_INFINITE_SCROLL_THRESHOLD}`,
      '',
      '# 主题配置',
      `REACT_APP_DEFAULT_THEME=${this.config.REACT_APP_DEFAULT_THEME}`,
      `REACT_APP_PRIMARY_COLOR=${this.config.REACT_APP_PRIMARY_COLOR}`,
      `REACT_APP_SECONDARY_COLOR=${this.config.REACT_APP_SECONDARY_COLOR}`,
      '',
      '# Midjourney参数配置',
      `REACT_APP_MJ_CHAOS_MIN=${this.config.REACT_APP_MJ_CHAOS_MIN}`,
      `REACT_APP_MJ_CHAOS_MAX=${this.config.REACT_APP_MJ_CHAOS_MAX}`,
      `REACT_APP_MJ_STYLIZE_MIN=${this.config.REACT_APP_MJ_STYLIZE_MIN}`,
      `REACT_APP_MJ_STYLIZE_MAX=${this.config.REACT_APP_MJ_STYLIZE_MAX}`,
      '',
      '# 第三方服务配置',
      `REACT_APP_GOOGLE_ANALYTICS_ID=${this.config.REACT_APP_GOOGLE_ANALYTICS_ID}`,
      `REACT_APP_SENTRY_DSN=${this.config.REACT_APP_SENTRY_DSN}`,
      `REACT_APP_HOTJAR_ID=${this.config.REACT_APP_HOTJAR_ID}`,
      `REACT_APP_HOTJAR_SV=${this.config.REACT_APP_HOTJAR_SV}`,
    ];

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
  }

  // 运行配置生成流程
  async run() {
    console.log(`${colors.magenta}🔧 MJ Gallery 前端配置生成工具${colors.reset}\n`);
    
    try {
      await this.collectApiConfig();
      await this.collectAppConfig();
      await this.collectFeatureConfig();
      await this.collectUploadConfig();
      await this.collectPaginationConfig();
      await this.collectCacheConfig();
      await this.collectUIConfig();
      await this.collectThemeConfig();
      await this.collectMidjourneyConfig();
      await this.collectServicesConfig();
      
      await this.saveConfig();
      
      log.success('前端配置生成完成！');
      log.info('请重新启动开发服务器以应用新配置');
      
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
  const generator = new ClientConfigGenerator();
  generator.run().catch(error => {
    console.error('生成失败:', error);
    process.exit(1);
  });
}

module.exports = ClientConfigGenerator;