const NodeCache = require('node-cache');
const User = require('../models/User');
const Post = require('../models/Post');
const PromptPost = require('../models/PromptPost');
const CreditTransaction = require('../models/CreditTransaction');
const Order = require('../models/Order');

/**
 * Admin查询缓存管理器
 * 为管理面板的复杂查询提供缓存支持
 */
class AdminCache {
  constructor() {
    // 创建不同类型的缓存实例
    this.statsCache = new NodeCache({ stdTTL: 300 }); // 统计数据缓存5分钟
    this.analyticsCache = new NodeCache({ stdTTL: 600 }); // 分析数据缓存10分钟
    this.listCache = new NodeCache({ stdTTL: 180 }); // 列表数据缓存3分钟
    this.revenueCache = new NodeCache({ stdTTL: 300 }); // 收入数据缓存5分钟

    // 缓存键前缀
    this.CACHE_KEYS = {
      STATS: 'admin:stats',
      ANALYTICS: 'admin:analytics',
      USERS_LIST: 'admin:users:list',
      POSTS_LIST: 'admin:posts:list',
      PROMPTS_LIST: 'admin:prompts:list',
      REVENUE: 'admin:revenue',
    };
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return paramString ? `${prefix}:${paramString}` : prefix;
  }

  /**
   * 获取或设置统计数据缓存
   */
  async getOrSetStats(cacheKey, dataFetcher) {
    const cached = this.statsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await dataFetcher();
    this.statsCache.set(cacheKey, data);
    return data;
  }

  /**
   * 获取或设置分析数据缓存
   */
  async getOrSetAnalytics(cacheKey, dataFetcher) {
    const cached = this.analyticsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await dataFetcher();
    this.analyticsCache.set(cacheKey, data);
    return data;
  }

  /**
   * 获取或设置列表数据缓存
   */
  async getOrSetList(cacheKey, dataFetcher) {
    const cached = this.listCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await dataFetcher();
    this.listCache.set(cacheKey, data);
    return data;
  }

  /**
   * 缓存统计数据
   */
  async getCachedStats() {
    const cacheKey = this.CACHE_KEYS.STATS;

    return this.getOrSetStats(cacheKey, async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Build daily registration data for last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers, totalPosts, totalPrompts, activeUsers,
        totalViews, totalLikes, totalPromptViews, totalPromptLikes,
        recentUsers, recentPosts, recentPrompts,
        newUsersToday,
        creditsIssuedToday, creditsConsumedToday,
        totalGenerations,
        dailyRegistrationsRaw
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Post.countDocuments({ isPublic: true }),
        PromptPost.countDocuments({ isPublic: true }),
        User.countDocuments({
          isActive: true,
          'analytics.lastActiveAt': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        Post.aggregate([
          { $group: { _id: null, totalViews: { $sum: { $ifNull: ['$views', 0] } } } }
        ]),
        Post.aggregate([
          { $match: { likes: { $exists: true, $ne: [] } } },
          { $unwind: '$likes' },
          { $group: { _id: null, totalLikes: { $sum: 1 } } }
        ]),
        PromptPost.aggregate([
          { $group: { _id: null, totalViews: { $sum: { $ifNull: ['$views', 0] } } } }
        ]),
        PromptPost.aggregate([
          { $match: { likes: { $exists: true, $ne: [] } } },
          { $unwind: '$likes' },
          { $group: { _id: null, totalLikes: { $sum: 1 } } }
        ]),
        User.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('username avatar createdAt')
          .lean(),
        Post.find({ isPublic: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('author', 'username')
          .select('title views likes createdAt author')
          .lean(),
        PromptPost.find({ isPublic: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('author', 'username')
          .select('title views likes createdAt author')
          .lean(),
        // New users registered today
        User.countDocuments({ createdAt: { $gte: todayStart } }),
        // Credits issued today (earn transactions)
        CreditTransaction.aggregate([
          { $match: { type: 'earn', createdAt: { $gte: todayStart } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        // Credits consumed today (spend transactions)
        CreditTransaction.aggregate([
          { $match: { type: 'spend', createdAt: { $gte: todayStart } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        // Total generation count
        CreditTransaction.countDocuments({
          reason: { $in: ['generate_image', 'generate_video'] }
        }),
        // Daily registrations for last 7 days
        User.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      // Build 7-day registration array (fill missing days with 0)
      const dailyRegistrations = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        const found = dailyRegistrationsRaw.find(r => r._id === dateStr);
        dailyRegistrations.push({ date: dateStr, count: found ? found.count : 0 });
      }

      return {
        totalUsers,
        totalPosts,
        totalPrompts,
        activeUsers,
        totalViews: totalViews[0]?.totalViews || 0,
        totalLikes: totalLikes[0]?.totalLikes || 0,
        totalPromptViews: totalPromptViews[0]?.totalViews || 0,
        totalPromptLikes: totalPromptLikes[0]?.totalLikes || 0,
        recentUsers,
        recentPosts,
        recentPrompts,
        newUsersToday,
        creditsIssuedToday: creditsIssuedToday[0]?.total || 0,
        creditsConsumedToday: creditsConsumedToday[0]?.total || 0,
        totalGenerations,
        dailyRegistrations
      };
    });
  }

  /**
   * 缓存分析数据
   */
  async getCachedAnalytics(type = 'overview', timeRange = '7d') {
    const cacheKey = this.generateCacheKey(this.CACHE_KEYS.ANALYTICS, { type, timeRange });
    
    return this.getOrSetAnalytics(cacheKey, async () => {
      // 计算时间范围
      const timeRangeMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };
      const days = timeRangeMap[timeRange] || 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let analyticsData = {};
      
      if (type === 'overview' || type === 'geo') {
        // 地域分析
        const geoAnalysis = await User.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              'analytics.country': { $exists: true, $ne: '' }
            }
          },
          {
            $group: {
              _id: '$analytics.country',
              userCount: { $sum: 1 },
              cities: { $addToSet: '$analytics.city' }
            }
          },
          { $sort: { userCount: -1 } },
          { $limit: 10 }
        ]);
        
        analyticsData.geoAnalysis = geoAnalysis;
      }
      
      if (type === 'overview' || type === 'behavior') {
        // 用户行为分析
        const behaviorAnalysis = await User.aggregate([
          {
            $match: {
              'analytics.lastActiveAt': { $gte: startDate }
            }
          },
          {
            $group: {
              _id: null,
              avgSessionTime: { $avg: '$analytics.averageSessionTime' },
              totalLogins: { $sum: '$analytics.loginCount' },
              activeUsers: { $sum: 1 },
              totalLikesGiven: { $sum: '$analytics.likesGiven' },
              totalCommentsGiven: { $sum: '$analytics.commentsGiven' }
            }
          }
        ]);
        
        // 设备类型分析
        const deviceAnalysis = await User.aggregate([
          {
            $match: {
              'analytics.lastActiveAt': { $gte: startDate }
            }
          },
          {
            $group: {
              _id: '$analytics.deviceType',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]);
        
        analyticsData.behaviorAnalysis = behaviorAnalysis[0] || {};
        analyticsData.deviceAnalysis = deviceAnalysis;
      }
      
      if (type === 'overview' || type === 'content') {
        // 内容分析
        const contentAnalysis = await Post.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: null,
              avgViews: { $avg: '$views' },
              avgLikes: { $avg: { $size: '$likes' } },
              avgComments: { $avg: { $size: '$comments' } },
              totalPosts: { $sum: 1 }
            }
          }
        ]);
        
        // 热门标签分析
        const tagAnalysis = await Post.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          { $unwind: '$tags' },
          {
            $group: {
              _id: '$tags',
              count: { $sum: 1 },
              avgViews: { $avg: '$views' }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        
        analyticsData.contentAnalysis = contentAnalysis[0] || {};
        analyticsData.tagAnalysis = tagAnalysis;
      }
      
      return analyticsData;
    });
  }

  /**
   * 缓存用户列表
   */
  async getCachedUsers(page = 1, limit = 20, search = '', status = '', sortBy = 'createdAt', sortOrder = 'desc') {
    const cacheKey = this.generateCacheKey(this.CACHE_KEYS.USERS_LIST, {
      page, limit, search, status, sortBy, sortOrder
    });
    
    return this.getOrSetList(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
      
      let query = {};
      
      // 搜索条件
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      // 状态筛选
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      // else: show all users (no isActive filter)
      }
      
      const [users, total] = await Promise.all([
        User.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .select('username email avatar createdAt lastLoginAt analytics.loginCount analytics.lastActiveAt isActive role authProvider credits freeCredits hasPurchasedBefore inviteUsedCount')
          .lean(),
        User.countDocuments(query)
      ]);
      
      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    });
  }

  /**
   * 缓存帖子列表
   */
  async getCachedPosts(page = 1, limit = 20, search = '', status = '', sortBy = 'createdAt', sortOrder = 'desc') {
    const cacheKey = this.generateCacheKey(this.CACHE_KEYS.POSTS_LIST, {
      page, limit, search, status, sortBy, sortOrder
    });
    
    return this.getOrSetList(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
      
      let query = {};
      
      // 搜索条件
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      // 状态筛选
      if (status === 'public') {
        query.isPublic = true;
      } else if (status === 'private') {
        query.isPublic = false;
      } else if (status === 'featured') {
        query.isFeatured = true;
      }
      
      const [posts, total] = await Promise.all([
        Post.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('author', 'username avatar email')
          .select('title description views likes comments isPublic isFeatured createdAt author')
          .lean(),
        Post.countDocuments(query)
      ]);
      
      return {
        posts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    });
  }

  /**
   * 缓存提示词列表
   */
  async getCachedPrompts(page = 1, limit = 20, search = '', status = '', sortBy = 'createdAt', sortOrder = 'desc') {
    const cacheKey = this.generateCacheKey(this.CACHE_KEYS.PROMPTS_LIST, {
      page, limit, search, status, sortBy, sortOrder
    });
    
    return this.getOrSetList(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
      
      let query = {};
      
      // 搜索条件
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { prompt: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      
      // 状态筛选
      if (status === 'public') {
        query.isPublic = true;
      } else if (status === 'private') {
        query.isPublic = false;
      } else if (status === 'featured') {
        query.isFeatured = true;
      }
      
      const [prompts, total] = await Promise.all([
        PromptPost.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('author', 'username avatar email')
          .select('title prompt category views likes comments isPublic isFeatured createdAt author')
          .lean(),
        PromptPost.countDocuments(query)
      ]);
      
      return {
        prompts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    });
  }

  /**
   * 获取收入数据（带缓存）
   * period: '7d' | '30d' | '90d' | 'all'
   */
  async getCachedRevenue(period = '30d') {
    const cacheKey = `${this.CACHE_KEYS.REVENUE}:${period}`;
    const cached = this.revenueCache.get(cacheKey);
    if (cached) return cached;

    const periodDays = { '7d': 7, '30d': 30, '90d': 90, 'all': null };
    const days = periodDays[period] ?? 30;
    const startDate = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const matchFilter = startDate
      ? { $match: { createdAt: { $gte: startDate }, status: 'completed' } }
      : { $match: { status: 'completed' } };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      summaryAgg,
      revenueToday,
      revenueThisMonth,
      ordersToday,
      ordersThisMonth,
      planBreakdownRaw,
      dailyRevenueRaw,
      recentOrders,
    ] = await Promise.all([
      // Total revenue + orders in period
      Order.aggregate([
        matchFilter,
        { $group: { _id: null, totalRevenue: { $sum: '$amountUSD' }, totalOrders: { $sum: 1 } } },
      ]),
      // Revenue today (always from today, regardless of period)
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amountUSD' } } },
      ]),
      // Revenue this month
      Order.aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amountUSD' } } },
      ]),
      // Orders today
      Order.countDocuments({ createdAt: { $gte: todayStart }, status: 'completed' }),
      // Orders this month
      Order.countDocuments({ createdAt: { $gte: monthStart }, status: 'completed' }),
      // Plan breakdown
      Order.aggregate([
        matchFilter,
        {
          $group: {
            _id: '$planId',
            planName: { $first: '$planName' },
            revenue: { $sum: '$amountUSD' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      // Daily revenue (last 30 days regardless of period for chart consistency)
      Order.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amountUSD' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Recent orders
      Order.find({ ...dateFilter, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'username email avatar')
        .lean(),
    ]);

    // Build 30-day array (fill missing days with 0)
    const dailyRevenue = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const found = dailyRevenueRaw.find(r => r._id === dateStr);
      dailyRevenue.push({ date: dateStr, revenue: found ? found.revenue : 0, orders: found ? found.orders : 0 });
    }

    // Plan breakdown with percentage
    const totalRevenue = summaryAgg[0]?.totalRevenue || 0;
    const planColors = { starter: '#6366f1', pro: '#3b82f6', ultimate: '#f59e0b' };
    const planPrices = { starter: 9.99, pro: 19.99, ultimate: 49.99 };
    const planBreakdown = planBreakdownRaw.map(p => ({
      planId: p._id,
      planName: p.planName,
      price: planPrices[p._id] || 0,
      color: planColors[p._id] || '#6366f1',
      orders: p.orders,
      revenue: p.revenue,
      pct: totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0,
    }));

    const totalOrders = summaryAgg[0]?.totalOrders || 0;
    const result = {
      summary: {
        totalRevenue,
        totalOrders,
        revenueToday: revenueToday[0]?.total || 0,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
        ordersToday,
        ordersThisMonth,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      planBreakdown,
      dailyRevenue,
      recentOrders,
    };

    this.revenueCache.set(cacheKey, result);
    return result;
  }

  /**
   * 清除相关缓存
   */
  clearCache(type) {
    switch (type) {
      case 'stats':
        this.statsCache.flushAll();
        break;
      case 'analytics':
        this.analyticsCache.flushAll();
        break;
      case 'lists':
        this.listCache.flushAll();
        break;
      case 'revenue':
        this.revenueCache.flushAll();
        break;
      case 'all':
        this.statsCache.flushAll();
        this.analyticsCache.flushAll();
        this.listCache.flushAll();
        this.revenueCache.flushAll();
        break;
    }
  }

  /**
   * 获取缓存状态
   */
  getCacheStats() {
    return {
      stats: {
        keys: this.statsCache.keys().length,
        hits: this.statsCache.getStats().hits,
        misses: this.statsCache.getStats().misses
      },
      analytics: {
        keys: this.analyticsCache.keys().length,
        hits: this.analyticsCache.getStats().hits,
        misses: this.analyticsCache.getStats().misses
      },
      lists: {
        keys: this.listCache.keys().length,
        hits: this.listCache.getStats().hits,
        misses: this.listCache.getStats().misses
      }
    };
  }
}

const adminCache = new AdminCache();
module.exports = adminCache;