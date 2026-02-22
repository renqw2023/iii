/**
 * 增强的API服务 - 集成请求管理器
 * 防止429错误的核心实现
 */

import { manageRequest } from '../utils/requestManager';
import { notificationAPI, postAPI, userAPI, authAPI, adminAPI, uploadAPI } from './api';
import { promptAPI } from './promptApi';

/**
 * 创建增强的API方法
 */
const createEnhancedAPI = (originalAPI, apiName) => {
  const enhanced = {};
  
  Object.keys(originalAPI).forEach(methodName => {
    const originalMethod = originalAPI[methodName];
    
    enhanced[methodName] = (...args) => {
      // 生成稳定的请求键，确保相同操作生成相同key
      let key;
      if (apiName === 'post' && methodName === 'likePost') {
        // 对于点赞操作，只使用postId作为key的一部分
        const postId = args[0];
        key = `${apiName}:${methodName}:${postId}`;
      } else if (apiName === 'prompt' && (methodName === 'updatePrompt' || methodName === 'createPrompt')) {
        // 对于提示词更新/创建操作，FormData无法JSON序列化，使用ID和时间戳
        const id = args[0];
        const timestamp = Date.now();
        key = `${apiName}:${methodName}:${id}:${timestamp}`;
      } else {
        // 其他操作使用原有逻辑，但要处理FormData等特殊对象
        const serializedArgs = args.map(arg => {
          if (arg instanceof FormData) {
            return '[FormData]';
          }
          return arg;
        });
        key = `${apiName}:${methodName}:${JSON.stringify(serializedArgs)}`;
      }
      
      // 根据方法类型设置不同的策略
      const options = getRequestOptions(apiName, methodName, args);
      
      return manageRequest(
        () => originalMethod(...args),
        { key, ...options }
      );
    };
  });
  
  return enhanced;
};

/**
 * 根据API类型和方法获取请求选项
 */
const getRequestOptions = (apiName, methodName, _args) => {
  const options = {
    useCache: true,
    useDebounce: false,
    debounceDelay: 300,
    skipRateLimit: false
  };

  // 通知相关API配置
  if (apiName === 'notification') {
    if (methodName === 'getNotifications' || methodName === 'getUnreadCount') {
      options.useCache = true;
      options.useDebounce = true;
      options.debounceDelay = 500; // 通知请求防抖500ms
    }
    if (methodName === 'markAsRead' || methodName === 'markAllAsRead') {
      options.useCache = false;
      options.useDebounce = true;
      options.debounceDelay = 200;
    }
  }

  // 帖子相关API配置
  if (apiName === 'post') {
    if (methodName === 'getPosts' || methodName === 'getPost' || methodName === 'getFeaturedPosts' || methodName === 'getPopularTags') {
      options.useCache = true;
      options.useDebounce = true;
      options.debounceDelay = 300;
    }
    if (methodName === 'likePost' || methodName === 'addComment') {
      options.useCache = false;
      options.useDebounce = true;
      options.debounceDelay = 1000; // 增加点赞防抖时间到1秒
    }
    if (methodName === 'createPost' || methodName === 'updatePost' || methodName === 'deletePost') {
      options.useCache = false;
      options.useDebounce = false;
    }
  }

  // 用户相关API配置
  if (apiName === 'user') {
    if (methodName === 'getProfile') {
      options.useCache = true;
      options.useDebounce = true;
      options.debounceDelay = 400;
    }
    if (methodName === 'followUser' || methodName === 'toggleFavorite') {
      options.useCache = false;
      options.useDebounce = true;
      options.debounceDelay = 300;
    }
  }

  // 认证相关API配置
  if (apiName === 'auth') {
    if (methodName === 'getMe') {
      options.useCache = true;
      options.useDebounce = true;
      options.debounceDelay = 500;
    }
    if (methodName === 'login' || methodName === 'register') {
      options.useCache = false;
      options.useDebounce = false;
    }
  }

  // 管理员API配置
  if (apiName === 'admin') {
    if (methodName === 'getStats' || methodName === 'getUsers' || methodName === 'getPosts') {
      options.useCache = true;
      options.useDebounce = true;
      options.debounceDelay = 600;
    }
    if (methodName === 'getAnalytics') {
      options.useCache = true;
      options.useDebounce = true;
      options.debounceDelay = 1500;
    }
  }

  // 上传API配置
  if (apiName === 'upload') {
    options.useCache = false;
    options.useDebounce = false;
    options.skipRateLimit = true; // 上传不受频率限制
  }

  // 提示词API配置
  if (apiName === 'prompt') {
    if (methodName === 'getPrompts' || methodName === 'getPromptById' || methodName === 'getFeaturedPrompts') {
      options.useCache = true;
      options.useDebounce = true;
      options.debounceDelay = 300;
    }
    if (methodName === 'toggleLike' || methodName === 'toggleBookmark' || methodName === 'addComment') {
      options.useCache = false;
      options.useDebounce = true;
      options.debounceDelay = 1000;
    }
    if (methodName === 'createPrompt' || methodName === 'updatePrompt' || methodName === 'deletePrompt') {
      options.useCache = false;
      options.useDebounce = false;
    }
  }

  return options;
};

// 创建增强的API实例
export const enhancedNotificationAPI = createEnhancedAPI(notificationAPI, 'notification');
export const enhancedPostAPI = createEnhancedAPI(postAPI, 'post');
export const enhancedUserAPI = createEnhancedAPI(userAPI, 'user');
export const enhancedAuthAPI = createEnhancedAPI(authAPI, 'auth');
export const enhancedAdminAPI = createEnhancedAPI(adminAPI, 'admin');
export const enhancedUploadAPI = createEnhancedAPI(uploadAPI, 'upload');
export const enhancedPromptAPI = createEnhancedAPI(promptAPI, 'prompt');

// 为了向后兼容，也导出为promptAPI
export { enhancedPromptAPI as promptAPI };

// 导出所有增强的API
export const enhancedAPI = {
  notification: enhancedNotificationAPI,
  post: enhancedPostAPI,
  user: enhancedUserAPI,
  auth: enhancedAuthAPI,
  admin: enhancedAdminAPI,
  upload: enhancedUploadAPI,
  prompt: enhancedPromptAPI
};

// 便捷方法：清理特定API的缓存
export const clearAPICache = (apiName) => {
  const { clearRequestCache } = require('../utils/requestManager');
  clearRequestCache(apiName);
};

// 便捷方法：获取API统计信息
export const getAPIStats = () => {
  const { getRequestStats } = require('../utils/requestManager');
  return getRequestStats();
};

export default enhancedAPI;