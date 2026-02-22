/**
 * 请求管理工具 - 防止重复请求和循环调用
 * 解决429错误的核心工具
 */

class RequestManager {
  constructor() {
    // 存储正在进行的请求
    this.pendingRequests = new Map();
    // 请求缓存
    this.cache = new Map();
    // 防抖定时器
    this.debounceTimers = new Map();
    // 请求计数器
    this.requestCounts = new Map();
    // 请求限制配置
    this.limits = {
      maxRequestsPerMinute: 100, // 增加API请求限制
      maxConcurrentRequests: 15, // 增加并发请求数
      cacheTimeout: 10 * 60 * 1000, // 增加到10分钟
      debounceDelay: 200 // 减少防抖延迟
    };
    
    // 静态资源配置
    this.staticResourceCache = 30 * 60 * 1000; // 静态资源缓存30分钟
    this.maxStaticRequestsPerMinute = 200; // 静态资源更高的请求限制
  }

  /**
   * 生成请求的唯一键
   */
  generateRequestKey(url, method = 'GET', params = {}) {
    const paramString = JSON.stringify(params);
    return `${method}:${url}:${paramString}`;
  }

  /**
   * 清理日志键，隐藏敏感信息
   */
  sanitizeLogKey(key) {
    try {
      const [method, url, paramsStr] = key.split(':');
      
      // 如果包含参数，需要清理敏感字段
      if (paramsStr && paramsStr !== 'undefined') {
        const params = JSON.parse(paramsStr);
        const sanitizedParams = { ...params };
        
        // 隐藏密码字段
        if (sanitizedParams.password) {
          sanitizedParams.password = '***';
        }
        if (sanitizedParams.currentPassword) {
          sanitizedParams.currentPassword = '***';
        }
        if (sanitizedParams.newPassword) {
          sanitizedParams.newPassword = '***';
        }
        if (sanitizedParams.confirmPassword) {
          sanitizedParams.confirmPassword = '***';
        }
        
        // 隐藏邮箱的部分信息
        if (sanitizedParams.email) {
          const email = sanitizedParams.email;
          const [localPart, domain] = email.split('@');
          if (localPart && domain) {
            const maskedLocal = localPart.length > 3 
              ? localPart.substring(0, 2) + '***' + localPart.slice(-1)
              : '***';
            sanitizedParams.email = `${maskedLocal}@${domain}`;
          }
        }
        
        return `${method}:${url}:[${JSON.stringify(sanitizedParams)}]`;
      }
      
      return `${method}:${url}`;
    } catch (error) {
      // 如果解析失败，返回安全的默认值
      return key.split(':').slice(0, 2).join(':') + ':[...]';
    }
  }

  /**
   * 检测是否为静态资源
   */
  isStaticResource(url) {
    return /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(url) ||
           url.includes('/uploads/') ||
           url.includes('/Circle/');
  }

  /**
   * 获取适当的缓存超时时间
   */
  getCacheTimeout(url) {
    return this.isStaticResource(url) ? this.staticResourceCache : this.limits.cacheTimeout;
  }

  /**
   * 获取适当的请求限制
   */
  getRequestLimit(url) {
    return this.isStaticResource(url) ? this.maxStaticRequestsPerMinute : this.limits.maxRequestsPerMinute;
  }

  /**
   * 检查请求频率限制
   */
  checkRateLimit(url) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const resourceType = this.isStaticResource(url) ? 'static' : 'api';
    const key = `${minute}:${resourceType}`;
    
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, 0);
    }
    
    const count = this.requestCounts.get(key);
    const limit = this.getRequestLimit(url);
    
    if (count >= limit) {
      throw new Error(`${resourceType === 'static' ? '静态资源' : 'API'}请求频率超限: ${count}/${limit} 每分钟`);
    }
    
    this.requestCounts.set(key, count + 1);
    
    // 清理旧的计数
    for (const [oldKey] of this.requestCounts) {
      const [oldMinute] = oldKey.split(':');
      if (parseInt(oldMinute) < minute - 1) {
        this.requestCounts.delete(oldKey);
      }
    }
  }

  /**
   * 检查并发请求限制
   */
  checkConcurrentLimit() {
    return this.pendingRequests.size < this.limits.maxConcurrentRequests;
  }

  /**
   * 获取缓存的响应
   */
  getCachedResponse(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() > cached.expiresAt;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    // 安全日志输出 - 隐藏敏感信息
    const safeKey = this.sanitizeLogKey(key);
    console.log(`使用缓存: ${safeKey}`);
    return cached.data;
  }

  /**
   * 设置响应缓存
   */
  setCachedResponse(key, data, url) {
    const timeout = this.getCacheTimeout(url);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + timeout
    });
    // 安全日志输出 - 隐藏敏感信息
    const safeKey = this.sanitizeLogKey(key);
    console.log(`缓存响应: ${safeKey} (${this.isStaticResource(url) ? '静态资源' : 'API'}, ${timeout/1000}s)`);
  }

  /**
   * 防抖处理
   */
  debounce(key, fn, delay = this.limits.debounceDelay) {
    // 如果已有相同key的防抖请求，直接返回现有的Promise
    if (this.debounceTimers.has(key)) {
      // 安全日志输出 - 隐藏敏感信息
      const safeKey = this.sanitizeLogKey(key);
      console.log(`防抖阻止重复请求: ${safeKey}`);
      const existingPromise = this.pendingRequests.get(key);
      if (existingPromise) {
        return existingPromise;
      }
      // 清除之前的定时器
      clearTimeout(this.debounceTimers.get(key));
    }

    const promise = new Promise((resolve, reject) => {
      // 设置新的定时器
      const timer = setTimeout(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, delay);

      this.debounceTimers.set(key, timer);
    });

    return promise;
  }

  /**
   * 管理请求 - 核心方法
   */
  async manageRequest(requestFn, options = {}) {
    const {
      key,
      useCache = true,
      useDebounce = false,
      debounceDelay = this.limits.debounceDelay,
      skipRateLimit = false
    } = options;

    if (!key) {
      throw new Error('Request key is required');
    }

    // 检查缓存
    if (useCache) {
      const cached = this.getCachedResponse(key);
      if (cached) {
        console.log(`使用缓存响应: ${key}`);
        return cached;
      }
    }

    // 检查是否已有相同请求在进行
    if (this.pendingRequests.has(key)) {
      // 安全日志输出 - 隐藏敏感信息
      const safeKey = this.sanitizeLogKey(key);
      console.log(`等待现有请求: ${safeKey}`);
      return this.pendingRequests.get(key);
    }

    // 检查是否有防抖定时器在运行（特别针对点赞等操作）
    if (useDebounce && this.debounceTimers.has(key)) {
      // 安全日志输出 - 隐藏敏感信息
      const safeKey = this.sanitizeLogKey(key);
      console.log(`防抖期间阻止重复请求: ${safeKey}`);
      // 如果已有pending请求，返回该请求的Promise
      if (this.pendingRequests.has(key)) {
        return this.pendingRequests.get(key);
      }
      // 否则返回一个立即解决的Promise，避免重复执行
      return Promise.resolve({ data: { message: '请求正在处理中，请稍候...', isLiked: true } });
    }

    // 检查频率限制
    if (!skipRateLimit) {
      try {
        // 从key中提取URL (格式: method:url:body)
        const url = key.split(':')[1];
        this.checkRateLimit(url);
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // 检查并发限制
    if (!this.checkConcurrentLimit()) {
      throw new Error('Concurrent request limit exceeded, please try again later');
    }

    // 执行请求的函数
    const executeRequest = async () => {
      try {
        // 安全日志输出 - 隐藏敏感信息
        const safeKey = this.sanitizeLogKey(key);
        console.log(`执行请求: ${safeKey}`);
        const response = await requestFn();
        
        // 缓存响应
        if (useCache) {
          this.setCachedResponse(key, response, key.split(':')[1]);
        }
        
        return response;
      } finally {
        // 清理pending请求
        this.pendingRequests.delete(key);
      }
    };

    // 创建请求Promise
    let requestPromise;
    if (useDebounce) {
      requestPromise = this.debounce(key, executeRequest, debounceDelay);
      // 对于防抖请求，立即存储到pending中
      this.pendingRequests.set(key, requestPromise);
    } else {
      requestPromise = executeRequest();
      // 存储pending请求
      this.pendingRequests.set(key, requestPromise);
    }

    return requestPromise;
  }

  /**
   * 清理缓存
   */
  clearCache(pattern) {
    if (pattern) {
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * 取消所有pending请求
   */
  cancelAllRequests() {
    this.pendingRequests.clear();
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      cachedResponses: this.cache.size,
      debounceTimers: this.debounceTimers.size,
      requestCounts: this.requestCounts.size
    };
  }
}

// 创建全局实例
const requestManager = new RequestManager();

// 导出便捷方法
export const manageRequest = (requestFn, options) => {
  return requestManager.manageRequest(requestFn, options);
};

export const clearRequestCache = (pattern) => {
  return requestManager.clearCache(pattern);
};

export const getRequestStats = () => {
  return requestManager.getStats();
};

export const cancelAllRequests = () => {
  return requestManager.cancelAllRequests();
};

export default requestManager;