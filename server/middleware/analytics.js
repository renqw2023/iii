const User = require('../models/User');
const analyticsQueue = require('../services/analyticsQueue');
const { getClientIP, getGeoLocation, getDeviceInfo } = require('../utils/analyticsUtils');

/**
 * 更新用户analytics数据的中间件
 */
const updateUserAnalytics = async (req, res, next) => {
  try {
    // 如果作为函数调用而不是中间件
    if (typeof req === 'string' && res && !next) {
      const userId = req;
      const reqObj = res;
      return await updateUserAnalyticsFunction(userId, reqObj);
    }
    
    // 只有在用户已认证的情况下才更新analytics
    if (req.user && req.user.userId) {
      // 将analytics更新任务添加到异步队列，不阻塞请求
      analyticsQueue.addTask('userAnalytics', {
        userId: req.user.userId,
        req: {
          headers: req.headers,
          ip: req.ip,
          connection: req.connection,
          socket: req.socket
        }
      });
    }
  } catch (error) {
    console.error('添加用户analytics任务到队列失败:', error);
    // 不阻断请求流程
  }
  
  if (next && typeof next === 'function') {
    next();
  }
};

/**
 * 作为函数调用的用户analytics更新
 */
const updateUserAnalyticsFunction = async (userId, req) => {
  try {
    if (!userId) {
      return Promise.resolve();
    }

    // 将analytics更新任务添加到异步队列
    analyticsQueue.addTask('userAnalytics', {
      userId,
      req: {
        headers: req.headers || {},
        ip: req.ip,
        connection: req.connection,
        socket: req.socket
      }
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('添加用户分析任务到队列失败:', error);
    return Promise.resolve();
  }
};

/**
 * 专门用于登录时更新analytics的函数
 */
const updateLoginAnalytics = async (userId, req) => {
  try {
    // 将登录analytics更新任务添加到异步队列
    analyticsQueue.addTask('loginAnalytics', {
      userId,
      req: {
        headers: req.headers || {},
        ip: req.ip,
        connection: req.connection,
        socket: req.socket
      }
    });
    
    console.log(`✅ 用户 ${userId} 的登录analytics任务已添加到队列`);
  } catch (error) {
    console.error('添加登录analytics任务到队列失败:', error);
  }
};

/**
 * 更新用户活动analytics的函数
 */
const updateActivityAnalytics = async (userId, activityType, req) => {
  try {
    // 将活动analytics更新任务添加到异步队列
    analyticsQueue.addTask('activityAnalytics', {
      userId,
      activityType,
      req: req ? {
        headers: req.headers || {},
        ip: req.ip,
        connection: req.connection,
        socket: req.socket
      } : null
    });
  } catch (error) {
    console.error('添加活动analytics任务到队列失败:', error);
  }
};

module.exports = {
  updateUserAnalytics: updateUserAnalyticsFunction,
  updateLoginAnalytics,
  updateActivityAnalytics,
  getClientIP,
  getGeoLocation,
  getDeviceInfo
};