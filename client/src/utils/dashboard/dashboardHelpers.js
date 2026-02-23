// import { useTranslation } from 'react-i18next'; // 未使用的导入
import { DASHBOARD_TABS } from './dashboardConstants';
// import { DEFAULT_USER_STATS } from './dashboardConstants'; // 未使用的导入

/**
 * 生成标签页配置
 * @param {Object} data - 包含各种数据的对象
 * @param {Object} pagination - 分页信息
 * @param {Function} t - 翻译函数
 * @returns {Array} 标签页配置数组
 */
export const generateTabsConfig = (data, pagination, t) => {
  const {
    userPosts = [],
    userPrompts = [],
    favoritesPosts = [],
    favoritesPrompts = [],
    followingUsers = [],
    followerUsers = []
  } = data;

  // 使用分页信息中的总数，如果没有则使用数组长度作为后备
  const postsCount = pagination?.posts?.total ?? userPosts.length;
  const promptsCount = pagination?.prompts?.total ?? userPrompts.length;

  return [
    {
      id: DASHBOARD_TABS.POSTS,
      label: t('dashboard.tabs.posts'),
      count: postsCount
    },
    {
      id: DASHBOARD_TABS.PROMPTS,
      label: t('dashboard.tabs.prompts'),
      count: promptsCount
    },
    {
      id: DASHBOARD_TABS.FAVORITES,
      label: t('dashboard.tabs.favorites'),
      count: favoritesPosts.length + favoritesPrompts.length
    },
    {
      id: DASHBOARD_TABS.FOLLOWING,
      label: t('dashboard.tabs.following'),
      count: followingUsers.length
    },
    {
      id: DASHBOARD_TABS.FOLLOWERS,
      label: t('dashboard.tabs.followers'),
      count: followerUsers.length
    },
    {
      id: DASHBOARD_TABS.SOCIAL,
      label: t('dashboard.tabs.social'),
      count: followingUsers.length + followerUsers.length
    }
  ];
};

/**
 * 格式化用户统计数据
 * @param {Object} stats - 原始统计数据
 * @param {Object} actualData - 实际数据用于补充统计
 * @returns {Object} 格式化后的统计数据
 */
export const formatUserStats = (stats = {}, actualData = {}) => {
  const {
    userPosts = [],
    followingUsers = [],
    followerUsers = []
  } = actualData;

  return {
    // 总计数据（兼容旧版本）
    totalPosts: stats.totalPosts || userPosts.length,
    totalLikes: stats.totalLikes || 0,
    totalViews: stats.totalViews || 0,
    totalFollowers: stats.totalFollowers || followerUsers.length,
    totalFollowing: stats.totalFollowing || followingUsers.length,
    
    // 分离的格式参考数据
    formatReference: {
      posts: stats.formatReference?.posts || 0,
      likes: stats.formatReference?.likes || 0,
      views: stats.formatReference?.views || 0
    },
    
    // 分离的提示词数据
    prompts: {
      posts: stats.prompts?.posts || 0,
      likes: stats.prompts?.likes || 0,
      views: stats.prompts?.views || 0
    }
  };
};

/**
 * 验证帖子表单数据
 * @param {Object} formData - 表单数据
 * @returns {Object} 验证结果 { isValid, errors }
 */
export const validatePostForm = (formData) => {
  const errors = {};
  
  if (!formData.title?.trim()) {
    errors.title = 'Title is required';
  }
  
  if (!formData.description?.trim()) {
    errors.description = 'Description is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 验证提示词表单数据
 * @param {Object} formData - 表单数据
 * @returns {Object} 验证结果 { isValid, errors }
 */
export const validatePromptForm = (formData) => {
  const errors = {};
  
  if (!formData.title?.trim()) {
    errors.title = 'Title is required';
  }
  
  if (!formData.prompt?.trim()) {
    errors.prompt = 'Prompt content is required';
  }
  
  if (!formData.category?.trim()) {
    errors.category = 'Please select a category';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 格式化数字显示
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 默认错误消息
 * @returns {string} 错误消息
 */
export const handleApiError = (error, defaultMessage = 'Operation failed') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

/**
 * 深度比较两个对象是否相等（用于React.memo）
 * @param {Object} obj1 - 对象1
 * @param {Object} obj2 - 对象2
 * @returns {boolean} 是否相等
 */
export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
};

/**
 * 生成动画延迟
 * @param {number} index - 索引
 * @param {number} delay - 基础延迟
 * @returns {number} 计算后的延迟
 */
export const getAnimationDelay = (index, delay = 0.1) => {
  return index * delay;
};