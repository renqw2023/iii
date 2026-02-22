import config from './index';

// 应用常量配置（从配置管理系统导出）
export const APP_CONFIG = {
  // API配置
  API_BASE_URL: config.api.baseURL,
  API_TIMEOUT: config.api.timeout,
  
  // 文件上传配置
  UPLOAD: {
    MAX_FILE_SIZE: config.upload.maxFileSize,
    MAX_FILES: config.upload.maxFiles,
    ALLOWED_IMAGE_TYPES: config.upload.allowedImageTypes,
    ALLOWED_VIDEO_TYPES: config.upload.allowedVideoTypes,
    CHUNK_SIZE: config.upload.chunkSize,
    CONCURRENT: config.upload.concurrent,
  },
  
  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: config.pagination.defaultPageSize,
    MAX_PAGE_SIZE: config.pagination.maxPageSize,
    PAGE_SIZE_OPTIONS: config.pagination.pageSizeOptions,
  },
  
  // 缓存配置
  CACHE: {
    POSTS_STALE_TIME: config.cache.postsStaleTime,
    FEATURED_POSTS_STALE_TIME: config.cache.featuredPostsStaleTime,
    TAGS_STALE_TIME: config.cache.tagsStaleTime,
    USER_PROFILE_STALE_TIME: config.cache.userProfileStaleTime,
    MAX_CACHE_SIZE: config.cache.maxCacheSize,
  },
  
  // UI配置
  UI: {
    ANIMATION_DURATION: config.ui.animationDuration,
    TOAST_DURATION: config.ui.toastDuration,
    DEBOUNCE_DELAY: config.ui.debounceDelay,
    THROTTLE_DELAY: config.ui.throttleDelay,
    LAZY_LOAD_OFFSET: config.ui.lazyLoadOffset,
    INFINITE_SCROLL_THRESHOLD: config.ui.infiniteScrollThreshold,
  },
  
  // Midjourney参数选项
  MIDJOURNEY_OPTIONS: {
    STYLES: config.midjourney.styles,
    ASPECTS: config.midjourney.aspects,
    VERSIONS: config.midjourney.versions,
    QUALITIES: config.midjourney.qualities,
    CHAOS_RANGE: config.midjourney.chaosRange,
    STYLIZE_RANGE: config.midjourney.stylizeRange,
  },
  
  // 默认分类数据（用于Explore页面）
  DEFAULT_CATEGORIES: config.categories,
  
  // 功能开关
  FEATURES: config.features,
  
  // 主题配置
  THEME: config.theme,
};

// 错误消息
export const ERROR_MESSAGES = config.errorMessages;

// 成功消息
export const SUCCESS_MESSAGES = config.successMessages;

// 路由路径
export const ROUTES = config.routes;

// 应用信息
export const APP_INFO = config.app;

// 第三方服务配置
export const SERVICES = config.services;

// 导出配置实例供其他模块使用
export { config };

// 向后兼容的默认导出
export default {
  APP_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  APP_INFO,
  SERVICES,
  config,
};