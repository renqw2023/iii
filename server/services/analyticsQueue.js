const User = require('../models/User');
const { getClientIP, getGeoLocation, getDeviceInfo } = require('../utils/analyticsUtils');

/**
 * Analytics异步队列服务
 * 用于批量处理analytics数据，避免阻塞主请求
 */
class AnalyticsQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 10; // 批量处理大小
    this.flushInterval = 5000; // 5秒刷新一次
    this.geoCache = new Map(); // 地理位置缓存
    this.cacheExpiry = 60 * 60 * 1000; // 缓存1小时
    
    // 启动定时处理
    this.startProcessor();
  }

  /**
   * 添加analytics任务到队列
   */
  addTask(type, data) {
    const task = {
      id: Date.now() + Math.random(),
      type,
      data,
      timestamp: new Date()
    };
    
    this.queue.push(task);
    
    // 如果队列达到批量大小，立即处理
    if (this.queue.length >= this.batchSize) {
      this.processQueue();
    }
  }

  /**
   * 启动定时处理器
   */
  startProcessor() {
    setInterval(() => {
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }, this.flushInterval);
  }

  /**
   * 处理队列中的任务
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    
    try {
      // 取出当前批次的任务
      const batch = this.queue.splice(0, this.batchSize);
      
      // 按类型分组处理
      const groupedTasks = this.groupTasksByType(batch);
      
      // 并行处理不同类型的任务
      await Promise.all([
        this.processBatchUserAnalytics(groupedTasks.userAnalytics || []),
        this.processBatchLoginAnalytics(groupedTasks.loginAnalytics || []),
        this.processBatchActivityAnalytics(groupedTasks.activityAnalytics || [])
      ]);
      
      console.log(`✅ 处理了 ${batch.length} 个analytics任务`);
    } catch (error) {
      console.error('处理analytics队列失败:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * 按类型分组任务
   */
  groupTasksByType(tasks) {
    const grouped = {};
    
    tasks.forEach(task => {
      if (!grouped[task.type]) {
        grouped[task.type] = [];
      }
      grouped[task.type].push(task);
    });
    
    return grouped;
  }

  /**
   * 批量处理用户analytics更新
   */
  async processBatchUserAnalytics(tasks) {
    if (tasks.length === 0) return;
    
    const bulkOps = [];
    
    for (const task of tasks) {
      const { userId, req } = task.data;
      
      if (!userId) continue;
      
      const ip = getClientIP(req);
      const geoLocation = this.getCachedGeoLocation(ip);
      const deviceInfo = getDeviceInfo(req.headers['user-agent'] || '');
      
      bulkOps.push({
        updateOne: {
          filter: { _id: userId },
          update: {
            $set: {
              'analytics.ipAddress': ip,
              'analytics.country': geoLocation.country,
              'analytics.region': geoLocation.region,
              'analytics.city': geoLocation.city,
              'analytics.browser': deviceInfo.browser,
              'analytics.os': deviceInfo.os,
              'analytics.deviceType': deviceInfo.deviceType,
              'analytics.lastActiveAt': task.timestamp
            }
          }
        }
      });
    }
    
    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }
  }

  /**
   * 批量处理登录analytics更新
   */
  async processBatchLoginAnalytics(tasks) {
    if (tasks.length === 0) return;
    
    const bulkOps = [];
    
    for (const task of tasks) {
      const { userId, req } = task.data;
      
      if (!userId) continue;
      
      const ip = getClientIP(req);
      const geoLocation = this.getCachedGeoLocation(ip);
      const deviceInfo = getDeviceInfo(req.headers['user-agent'] || '');
      
      bulkOps.push({
        updateOne: {
          filter: { _id: userId },
          update: {
            $set: {
              'analytics.ipAddress': ip,
              'analytics.country': geoLocation.country,
              'analytics.region': geoLocation.region,
              'analytics.city': geoLocation.city,
              'analytics.browser': deviceInfo.browser,
              'analytics.os': deviceInfo.os,
              'analytics.deviceType': deviceInfo.deviceType,
              'analytics.lastActiveAt': task.timestamp
            },
            $inc: {
              'analytics.loginCount': 1
            }
          }
        }
      });
    }
    
    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }
  }

  /**
   * 批量处理活动analytics更新
   */
  async processBatchActivityAnalytics(tasks) {
    if (tasks.length === 0) return;
    
    // 按用户ID和活动类型分组，合并相同用户的多个活动
    const userActivities = new Map();
    
    tasks.forEach(task => {
      const { userId, activityType } = task.data;
      
      if (!userId) return;
      
      const key = userId.toString();
      if (!userActivities.has(key)) {
        userActivities.set(key, {
          userId,
          activities: {},
          lastActiveAt: task.timestamp
        });
      }
      
      const userActivity = userActivities.get(key);
      userActivity.activities[activityType] = (userActivity.activities[activityType] || 0) + 1;
      
      // 更新最后活跃时间为最新的
      if (task.timestamp > userActivity.lastActiveAt) {
        userActivity.lastActiveAt = task.timestamp;
      }
    });
    
    const bulkOps = [];
    
    for (const [userId, userActivity] of userActivities) {
      const updateData = {
        'analytics.lastActiveAt': userActivity.lastActiveAt
      };
      
      const incData = {};
      
      // 根据活动类型设置增量更新
      Object.entries(userActivity.activities).forEach(([activityType, count]) => {
        switch (activityType) {
          case 'like':
            incData['analytics.likesGiven'] = count;
            break;
          case 'comment':
            incData['analytics.commentsGiven'] = count;
            break;
          case 'share':
            incData['analytics.sharesGiven'] = count;
            break;
        }
      });
      
      bulkOps.push({
        updateOne: {
          filter: { _id: userActivity.userId },
          update: {
            $set: updateData,
            ...(Object.keys(incData).length > 0 && { $inc: incData })
          }
        }
      });
    }
    
    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }
  }

  /**
   * 获取缓存的地理位置信息
   */
  getCachedGeoLocation(ip) {
    const cacheKey = ip;
    const cached = this.geoCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }
    
    // 获取新的地理位置信息并缓存
    const geoLocation = getGeoLocation(ip);
    this.geoCache.set(cacheKey, {
      data: geoLocation,
      timestamp: Date.now()
    });
    
    return geoLocation;
  }

  /**
   * 清理过期的缓存
   */
  cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.geoCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.geoCache.delete(key);
      }
    }
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      cacheSize: this.geoCache.size
    };
  }
}

// 创建全局队列实例
const analyticsQueue = new AnalyticsQueue();

// 定期清理缓存
setInterval(() => {
  analyticsQueue.cleanExpiredCache();
}, 10 * 60 * 1000); // 每10分钟清理一次

module.exports = analyticsQueue;