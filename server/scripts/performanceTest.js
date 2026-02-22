const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const PromptPost = require('../models/PromptPost');
const adminCache = require('../services/adminCache');
const analyticsQueue = require('../services/analyticsQueue');
require('dotenv').config();

/**
 * 性能测试脚本
 * 测试优化后的Analytics中间件和Admin查询性能
 */
class PerformanceTest {
  constructor() {
    this.results = {
      database: {},
      cache: {},
      analytics: {},
      summary: {}
    };
  }

  /**
   * 连接数据库
   */
  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fenge');
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      process.exit(1);
    }
  }

  /**
   * 测试数据库索引性能
   */
  async testDatabaseIndexes() {
    console.log('\n🔍 测试数据库索引性能...');
    
    const tests = [
      {
        name: '用户analytics.lastActiveAt查询',
        query: () => User.find({ 'analytics.lastActiveAt': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }).limit(100)
      },
      {
        name: '用户analytics.loginCount排序',
        query: () => User.find({}).sort({ 'analytics.loginCount': -1 }).limit(50)
      },
      {
        name: '用户地理位置查询',
        query: () => User.find({ 'analytics.country': 'China' }).limit(100)
      },
      {
        name: '帖子views排序查询',
        query: () => Post.find({}).sort({ views: -1 }).limit(50)
      },
      {
        name: '帖子hotScore查询',
        query: () => Post.find({}).sort({ 'analytics.hotScore': -1 }).limit(50)
      },
      {
        name: '帖子创建时间和浏览量复合查询',
        query: () => Post.find({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }).sort({ views: -1 }).limit(50)
      }
    ];

    for (const test of tests) {
      const startTime = Date.now();
      try {
        const result = await test.query();
        const duration = Date.now() - startTime;
        this.results.database[test.name] = {
          duration: `${duration}ms`,
          count: result.length,
          status: 'success'
        };
        console.log(`  ✅ ${test.name}: ${duration}ms (${result.length} 条记录)`);
      } catch (error) {
        this.results.database[test.name] = {
          duration: 'N/A',
          error: error.message,
          status: 'failed'
        };
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  /**
   * 测试缓存性能
   */
  async testCachePerformance() {
    console.log('\n💾 测试缓存性能...');
    
    const cacheTests = [
      {
        name: '统计数据缓存',
        test: async () => {
          // 第一次查询（无缓存）
          const start1 = Date.now();
          await adminCache.getCachedStats();
          const firstQuery = Date.now() - start1;
          
          // 第二次查询（有缓存）
          const start2 = Date.now();
          await adminCache.getCachedStats();
          const secondQuery = Date.now() - start2;
          
          return { firstQuery, secondQuery, improvement: firstQuery - secondQuery };
        }
      },
      {
        name: '分析数据缓存',
        test: async () => {
          const start1 = Date.now();
          await adminCache.getCachedAnalytics('overview', '7d');
          const firstQuery = Date.now() - start1;
          
          const start2 = Date.now();
          await adminCache.getCachedAnalytics('overview', '7d');
          const secondQuery = Date.now() - start2;
          
          return { firstQuery, secondQuery, improvement: firstQuery - secondQuery };
        }
      },
      {
        name: '用户列表缓存',
        test: async () => {
          const start1 = Date.now();
          await adminCache.getCachedUsers(1, 20, '', 'active');
          const firstQuery = Date.now() - start1;
          
          const start2 = Date.now();
          await adminCache.getCachedUsers(1, 20, '', 'active');
          const secondQuery = Date.now() - start2;
          
          return { firstQuery, secondQuery, improvement: firstQuery - secondQuery };
        }
      },
      {
        name: '帖子列表缓存',
        test: async () => {
          const start1 = Date.now();
          await adminCache.getCachedPosts(1, 20, '', 'public');
          const firstQuery = Date.now() - start1;
          
          const start2 = Date.now();
          await adminCache.getCachedPosts(1, 20, '', 'public');
          const secondQuery = Date.now() - start2;
          
          return { firstQuery, secondQuery, improvement: firstQuery - secondQuery };
        }
      }
    ];

    for (const test of cacheTests) {
      try {
        const result = await test.test();
        this.results.cache[test.name] = {
          firstQuery: `${result.firstQuery}ms`,
          secondQuery: `${result.secondQuery}ms`,
          improvement: `${result.improvement}ms`,
          improvementPercent: `${Math.round((result.improvement / result.firstQuery) * 100)}%`,
          status: 'success'
        };
        console.log(`  ✅ ${test.name}:`);
        console.log(`     首次查询: ${result.firstQuery}ms`);
        console.log(`     缓存查询: ${result.secondQuery}ms`);
        console.log(`     性能提升: ${result.improvement}ms (${Math.round((result.improvement / result.firstQuery) * 100)}%)`);
      } catch (error) {
        this.results.cache[test.name] = {
          error: error.message,
          status: 'failed'
        };
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  /**
   * 测试Analytics队列性能
   */
  async testAnalyticsQueue() {
    console.log('\n⚡ 测试Analytics队列性能...');
    
    try {
      // 模拟批量添加任务
      const taskCount = 100;
      const startTime = Date.now();
      
      const tasks = [];
      for (let i = 0; i < taskCount; i++) {
        tasks.push({
          type: 'user_activity',
          userId: new mongoose.Types.ObjectId(),
          data: {
            action: 'view_post',
            postId: new mongoose.Types.ObjectId(),
            timestamp: new Date(),
            ipAddress: '127.0.0.1'
          }
        });
      }
      
      // 批量添加任务
      for (const task of tasks) {
        analyticsQueue.addTask(task.type, task.userId, task.data);
      }
      
      const addTasksTime = Date.now() - startTime;
      
      // 等待队列处理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.results.analytics = {
        taskCount,
        addTasksTime: `${addTasksTime}ms`,
        avgTaskTime: `${(addTasksTime / taskCount).toFixed(2)}ms`,
        status: 'success'
      };
      
      console.log(`  ✅ 批量添加 ${taskCount} 个任务: ${addTasksTime}ms`);
      console.log(`  ✅ 平均每个任务: ${(addTasksTime / taskCount).toFixed(2)}ms`);
      
    } catch (error) {
      this.results.analytics = {
        error: error.message,
        status: 'failed'
      };
      console.log(`  ❌ Analytics队列测试失败: ${error.message}`);
    }
  }

  /**
   * 测试分页查询性能
   */
  async testPaginationPerformance() {
    console.log('\n📄 测试分页查询性能...');
    
    const paginationTests = [
      {
        name: '用户列表分页 (第1页)',
        test: () => adminCache.getCachedUsers(1, 20)
      },
      {
        name: '用户列表分页 (第10页)',
        test: () => adminCache.getCachedUsers(10, 20)
      },
      {
        name: '帖子列表分页 (第1页)',
        test: () => adminCache.getCachedPosts(1, 20)
      },
      {
        name: '帖子列表分页 (第10页)',
        test: () => adminCache.getCachedPosts(10, 20)
      },
      {
        name: '提示词列表分页 (第1页)',
        test: () => adminCache.getCachedPrompts(1, 20)
      }
    ];

    for (const test of paginationTests) {
      const startTime = Date.now();
      try {
        const result = await test.test();
        const duration = Date.now() - startTime;
        console.log(`  ✅ ${test.name}: ${duration}ms (${result.total} 总记录, ${result.totalPages} 总页数)`);
      } catch (error) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    console.log('\n📊 性能测试报告');
    console.log('=' .repeat(50));
    
    // 数据库索引测试结果
    console.log('\n🔍 数据库索引性能:');
    Object.entries(this.results.database).forEach(([name, result]) => {
      if (result.status === 'success') {
        console.log(`  ${name}: ${result.duration}`);
      } else {
        console.log(`  ${name}: 失败 - ${result.error}`);
      }
    });
    
    // 缓存性能测试结果
    console.log('\n💾 缓存性能提升:');
    Object.entries(this.results.cache).forEach(([name, result]) => {
      if (result.status === 'success') {
        console.log(`  ${name}: ${result.improvementPercent} 提升 (${result.improvement})`);
      } else {
        console.log(`  ${name}: 失败 - ${result.error}`);
      }
    });
    
    // Analytics队列性能
    console.log('\n⚡ Analytics队列性能:');
    if (this.results.analytics.status === 'success') {
      console.log(`  批量处理能力: ${this.results.analytics.taskCount} 任务/${this.results.analytics.addTasksTime}`);
      console.log(`  平均处理时间: ${this.results.analytics.avgTaskTime}/任务`);
    } else {
      console.log(`  测试失败: ${this.results.analytics.error}`);
    }
    
    console.log('\n✅ 性能测试完成!');
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始性能测试...');
    
    await this.connectDB();
    await this.testDatabaseIndexes();
    await this.testCachePerformance();
    await this.testAnalyticsQueue();
    await this.testPaginationPerformance();
    
    this.generateReport();
    
    await mongoose.connection.close();
    console.log('\n👋 数据库连接已关闭');
  }
}

// 运行测试
if (require.main === module) {
  const test = new PerformanceTest();
  test.runAllTests().catch(console.error);
}

module.exports = PerformanceTest;