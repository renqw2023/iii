/**
 * 前端应用配置管理
 * 统一管理所有配置项，避免硬编码
 */
class AppConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.isDevelopment = this.env === 'development';
    this.isProduction = this.env === 'production';
  }

  // API配置
  get api() {
    return {
      baseURL: process.env.REACT_APP_API_URL || '/api',
      timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
      retryAttempts: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.REACT_APP_API_RETRY_DELAY) || 1000,
    };
  }

  // 应用基本信息
  get app() {
    return {
      name: process.env.REACT_APP_APP_NAME || 'III.PICS',
      version: process.env.REACT_APP_APP_VERSION || '1.0.0',
      description: process.env.REACT_APP_APP_DESCRIPTION || 'III.PICS - 专业AI视觉艺术平台，激发灵感(Inspire)、释放想象(Imagine)、推动创新(Innovate)。汇聚全球创作者的精美作品，发现无限创意可能',
      author: process.env.REACT_APP_APP_AUTHOR || 'III.PICS Team',
      homepage: process.env.REACT_APP_HOMEPAGE || 'https://iii.pics',
      baseUrl: process.env.REACT_APP_BASE_URL || process.env.REACT_APP_HOMEPAGE || 'https://iii.pics',
      slogan: 'Inspire • Imagine • Innovate',
      keywords: 'AI艺术,视觉创作,Midjourney,创意灵感,艺术作品,提示词,风格参数',
    };
  }

  // 功能开关
  get features() {
    return {
      analytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
      pwa: process.env.REACT_APP_ENABLE_PWA !== 'false', // 默认启用
      darkMode: process.env.REACT_APP_ENABLE_DARK_MODE !== 'false', // 默认启用
      notifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false', // 默认启用
      socialShare: process.env.REACT_APP_ENABLE_SOCIAL_SHARE !== 'false', // 默认启用
      comments: process.env.REACT_APP_ENABLE_COMMENTS !== 'false', // 默认启用
      favorites: process.env.REACT_APP_ENABLE_FAVORITES !== 'false', // 默认启用
      search: process.env.REACT_APP_ENABLE_SEARCH !== 'false', // 默认启用
    };
  }

  // 文件上传配置
  get upload() {
    const allowedImageTypes = process.env.REACT_APP_ALLOWED_IMAGE_TYPES || 
      'image/jpeg,image/jpg,image/png,image/gif,image/webp';
    const allowedVideoTypes = process.env.REACT_APP_ALLOWED_VIDEO_TYPES || 
      'video/mp4,video/mov,video/avi';
    
    return {
      maxFileSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 200 * 1024 * 1024, // 200MB
      maxFiles: parseInt(process.env.REACT_APP_MAX_FILES) || 9,
      allowedImageTypes: allowedImageTypes.split(',').map(type => type.trim()),
      allowedVideoTypes: allowedVideoTypes.split(',').map(type => type.trim()),
      chunkSize: parseInt(process.env.REACT_APP_UPLOAD_CHUNK_SIZE) || 1024 * 1024, // 1MB
      concurrent: parseInt(process.env.REACT_APP_UPLOAD_CONCURRENT) || 3,
    };
  }

  // 分页配置
  get pagination() {
    return {
      defaultPageSize: parseInt(process.env.REACT_APP_DEFAULT_PAGE_SIZE) || 12,
      maxPageSize: parseInt(process.env.REACT_APP_MAX_PAGE_SIZE) || 50,
      pageSizeOptions: (process.env.REACT_APP_PAGE_SIZE_OPTIONS || '12,24,36,48').split(',').map(size => parseInt(size)),
    };
  }

  // 缓存配置（优化性能）
  get cache() {
    return {
      postsStaleTime: parseInt(process.env.REACT_APP_POSTS_STALE_TIME) || 10 * 60 * 1000, // 10分钟（增加）
      featuredPostsStaleTime: parseInt(process.env.REACT_APP_FEATURED_POSTS_STALE_TIME) || 30 * 60 * 1000, // 30分钟（增加）
      tagsStaleTime: parseInt(process.env.REACT_APP_TAGS_STALE_TIME) || 60 * 60 * 1000, // 1小时（增加）
      userProfileStaleTime: parseInt(process.env.REACT_APP_USER_PROFILE_STALE_TIME) || 15 * 60 * 1000, // 15分钟
      maxCacheSize: parseInt(process.env.REACT_APP_MAX_CACHE_SIZE) || 100, // 增加到100个查询
    };
  }

  // UI配置
  get ui() {
    return {
      animationDuration: parseInt(process.env.REACT_APP_ANIMATION_DURATION) || 300,
      toastDuration: parseInt(process.env.REACT_APP_TOAST_DURATION) || 3000,
      debounceDelay: parseInt(process.env.REACT_APP_DEBOUNCE_DELAY) || 300,
      throttleDelay: parseInt(process.env.REACT_APP_THROTTLE_DELAY) || 100,
      lazyLoadOffset: parseInt(process.env.REACT_APP_LAZY_LOAD_OFFSET) || 100,
      infiniteScrollThreshold: parseInt(process.env.REACT_APP_INFINITE_SCROLL_THRESHOLD) || 0.8,
    };
  }

  // 主题配置
  get theme() {
    return {
      defaultTheme: process.env.REACT_APP_DEFAULT_THEME || 'light',
      primaryColor: process.env.REACT_APP_PRIMARY_COLOR || '#3B82F6',
      secondaryColor: process.env.REACT_APP_SECONDARY_COLOR || '#8B5CF6',
      accentColor: process.env.REACT_APP_ACCENT_COLOR || '#F59E0B',
      borderRadius: process.env.REACT_APP_BORDER_RADIUS || '0.5rem',
    };
  }

  // Midjourney参数选项
  get midjourney() {
    return {
      styles: [
        { value: '', label: '选择风格' },
        { value: 'raw', label: 'Raw' },
        { value: 'expressive', label: 'Expressive' },
        { value: 'cute', label: 'Cute' },
        { value: 'scenic', label: 'Scenic' },
      ],
      aspects: [
        { value: '', label: '选择比例' },
        { value: '1:1', label: '1:1 (正方形)' },
        { value: '4:3', label: '4:3' },
        { value: '16:9', label: '16:9 (宽屏)' },
        { value: '9:16', label: '9:16 (竖屏)' },
        { value: '3:2', label: '3:2' },
        { value: '2:3', label: '2:3' },
      ],
      versions: [
        { value: '', label: '选择版本' },
        { value: '6', label: 'Version 6' },
        { value: '5.2', label: 'Version 5.2' },
        { value: '5.1', label: 'Version 5.1' },
        { value: '5', label: 'Version 5' },
      ],
      qualities: [
        { value: '', label: '选择质量' },
        { value: '0.25', label: '0.25 (快速)' },
        { value: '0.5', label: '0.5' },
        { value: '1', label: '1 (默认)' },
        { value: '2', label: '2 (高质量)' },
      ],
      chaosRange: {
        min: parseInt(process.env.REACT_APP_CHAOS_MIN) || 0,
        max: parseInt(process.env.REACT_APP_CHAOS_MAX) || 100,
        step: parseInt(process.env.REACT_APP_CHAOS_STEP) || 1,
      },
      stylizeRange: {
        min: parseInt(process.env.REACT_APP_STYLIZE_MIN) || 0,
        max: parseInt(process.env.REACT_APP_STYLIZE_MAX) || 1000,
        step: parseInt(process.env.REACT_APP_STYLIZE_STEP) || 50,
      },
    };
  }

  // 默认分类数据
  get categories() {
    const defaultCategories = [
      { id: 'all', name: '全部', count: 0 },
      { id: 'portrait', name: '人像', count: 0 },
      { id: 'landscape', name: '风景', count: 0 },
      { id: 'abstract', name: '抽象', count: 0 },
      { id: 'fantasy', name: '奇幻', count: 0 },
      { id: 'cyberpunk', name: '赛博朋克', count: 0 },
      { id: 'anime', name: '动漫', count: 0 },
      { id: 'architecture', name: '建筑', count: 0 },
    ];

    // 允许通过环境变量自定义分类
    const customCategories = process.env.REACT_APP_CUSTOM_CATEGORIES;
    if (customCategories) {
      try {
        return JSON.parse(customCategories);
      } catch (error) {
        console.warn('Custom category config format error, using default categories');
      }
    }

    return defaultCategories;
  }

  // 第三方服务配置
  get services() {
    return {
      googleAnalytics: {
        enabled: this.features.analytics,
        trackingId: process.env.REACT_APP_GOOGLE_ANALYTICS_ID,
      },
      sentry: {
        enabled: process.env.REACT_APP_SENTRY_ENABLED === 'true',
        dsn: process.env.REACT_APP_SENTRY_DSN,
        environment: this.env,
        tracesSampleRate: parseFloat(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE) || 0.1,
      },
      hotjar: {
        enabled: process.env.REACT_APP_HOTJAR_ENABLED === 'true',
        hjid: process.env.REACT_APP_HOTJAR_ID,
        hjsv: process.env.REACT_APP_HOTJAR_SNIPPET_VERSION || '6',
      },
    };
  }

  // 路由配置
  get routes() {
    return {
      home: '/',
      explore: '/explore',
      create: '/create',
      profile: '/profile',
      settings: '/settings',
      notifications: '/notifications',
      login: '/login',
      register: '/register',
      postDetail: '/post/:id',
      userProfile: '/user/:id',
      favorites: '/favorites',
      dashboard: '/dashboard',
      admin: '/admin',
      search: '/search',
      tag: '/tag/:tag',
      category: '/category/:category',
    };
  }

  // 错误消息
  get errorMessages() {
    return {
      networkError: '网络连接失败，请检查网络设置',
      serverError: '服务器错误，请稍后重试',
      unauthorized: '请先登录',
      forbidden: '没有权限执行此操作',
      notFound: '请求的资源不存在',
      validationError: '输入数据验证失败',
      fileTooLarge: '文件大小超过限制',
      invalidFileType: '不支持的文件类型',
      uploadFailed: '文件上传失败',
      timeout: '请求超时，请稍后重试',
    };
  }

  // 成功消息
  get successMessages() {
    return {
      postCreated: '作品发布成功！',
      postUpdated: '作品更新成功！',
      postDeleted: '作品删除成功！',
      profileUpdated: '个人资料更新成功！',
      passwordUpdated: '密码更新成功！',
      followSuccess: '关注成功！',
      unfollowSuccess: '取消关注成功！',
      likeSuccess: '点赞成功！',
      unlikeSuccess: '取消点赞成功！',
      favoriteSuccess: '收藏成功！',
      unfavoriteSuccess: '取消收藏成功！',
      commentAdded: '评论添加成功！',
      settingsSaved: '设置保存成功！',
      uploadSuccess: '文件上传成功！',
    };
  }

  // 验证配置
  validate() {
    // 验证必需的环境变量
    const warnings = [];

    if (!process.env.REACT_APP_API_URL) {
      warnings.push('REACT_APP_API_URL 未设置，使用默认值 "/api"');
    }

    if (this.features.analytics && !this.services.googleAnalytics.trackingId) {
      warnings.push('启用了分析功能但未设置 REACT_APP_GOOGLE_ANALYTICS_ID');
    }

    if (this.services.sentry.enabled && !this.services.sentry.dsn) {
      warnings.push('启用了 Sentry 但未设置 REACT_APP_SENTRY_DSN');
    }

    if (warnings.length > 0) {
      console.warn('⚠️  配置警告:');
      warnings.forEach(warning => console.warn(`   ${warning}`));
    }

    console.log('✅ 前端配置验证完成');
  }

  // 获取所有配置（用于调试）
  getAll() {
    return {
      env: this.env,
      api: this.api,
      app: this.app,
      features: this.features,
      upload: this.upload,
      pagination: this.pagination,
      cache: this.cache,
      ui: this.ui,
      theme: this.theme,
      midjourney: this.midjourney,
      categories: this.categories,
      services: this.services,
      routes: this.routes,
      errorMessages: this.errorMessages,
      successMessages: this.successMessages,
    };
  }
}

// 创建配置实例
const config = new AppConfig();

// 在开发环境下验证配置
if (config.isDevelopment) {
  config.validate();
}

export default config;