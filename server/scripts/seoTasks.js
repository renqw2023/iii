const cron = require('node-cron');
const SitemapGenerator = require('../utils/sitemapGenerator');
const config = require('../config');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const axios = require('axios');

/**
 * SEO定时任务脚本
 * 自动执行sitemap生成、搜索引擎提交等SEO相关任务
 */

class SEOTaskScheduler {
  constructor() {
    this.generator = new SitemapGenerator();
    this.isRunning = false;
  }

  /**
   * 启动所有定时任务
   */
  start() {
    if (this.isRunning) {
      console.log('SEO tasks are already running');
      return;
    }

    console.log('Starting SEO task scheduler...');
    this.isRunning = true;

    // 每天凌晨2点生成sitemap
    cron.schedule('0 2 * * *', async () => {
      console.log('Running daily sitemap generation...');
      await this.generateSitemaps();
    }, {
      timezone: 'Asia/Shanghai'
    });

    // 每周一凌晨3点提交sitemap到搜索引擎
    cron.schedule('0 3 * * 1', async () => {
      console.log('Running weekly sitemap submission...');
      await this.submitSitemaps();
    }, {
      timezone: 'Asia/Shanghai'
    });

    // 每小时检查并更新热门内容的sitemap
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly sitemap update for trending content...');
      await this.updateTrendingSitemaps();
    });

    // 每天凌晨4点清理过期的临时文件
    cron.schedule('0 4 * * *', async () => {
      console.log('Running daily cleanup...');
      await this.cleanupTempFiles();
    }, {
      timezone: 'Asia/Shanghai'
    });

    console.log('SEO task scheduler started successfully');
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    if (!this.isRunning) {
      console.log('SEO tasks are not running');
      return;
    }

    console.log('Stopping SEO task scheduler...');
    this.isRunning = false;
    // 这里可以添加清理逻辑
    console.log('SEO task scheduler stopped');
  }

  /**
   * 生成所有sitemap文件
   */
  async generateSitemaps() {
    try {
      console.log('Generating sitemaps...');
      await this.generator.generateAllSitemaps();
      console.log('Sitemaps generated successfully');
      
      // 记录生成统计
      await this.logSitemapStats();
    } catch (error) {
      console.error('Error generating sitemaps:', error);
      // 这里可以添加错误通知逻辑
      await this.notifyError('Sitemap Generation Failed', error.message);
    }
  }

  /**
   * 提交sitemap到搜索引擎
   */
  async submitSitemaps() {
    try {
      console.log('Submitting sitemaps to search engines...');
      const baseUrl = config.app.baseUrl;
      const sitemapUrl = `${baseUrl}/sitemap.xml`;
      
      const engines = [
        {
          name: 'Google',
          url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
        },
        {
          name: 'Bing',
          url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
        },
        {
          name: 'Baidu',
          url: `https://data.zz.baidu.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
        }
      ];

      const results = [];
      for (const engine of engines) {
        try {
          const response = await axios.get(engine.url, { timeout: 10000 });
          results.push({
            engine: engine.name,
            success: true,
            status: response.status
          });
          console.log(`Sitemap submitted to ${engine.name} successfully`);
        } catch (error) {
          results.push({
            engine: engine.name,
            success: false,
            error: error.message
          });
          console.error(`Failed to submit sitemap to ${engine.name}:`, error.message);
        }
      }

      console.log('Sitemap submission completed:', results);
    } catch (error) {
      console.error('Error submitting sitemaps:', error);
      await this.notifyError('Sitemap Submission Failed', error.message);
    }
  }

  /**
   * 更新热门内容的sitemap
   */
  async updateTrendingSitemaps() {
    try {
      // 获取最近更新的内容
      const recentPosts = await Post.find({
        updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // 最近1小时
      }).limit(100);

      if (recentPosts.length > 0) {
        console.log(`Found ${recentPosts.length} recently updated posts, regenerating sitemaps...`);
        await this.generator.generateAllSitemaps();
      }
    } catch (error) {
      console.error('Error updating trending sitemaps:', error);
    }
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const tempDir = path.join(__dirname, '../../uploads/temp');
      
      // 删除超过24小时的临时文件
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        const ageInHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageInHours > 24) {
          await fs.unlink(filePath);
          console.log(`Deleted temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  /**
   * 记录sitemap生成统计
   */
  async logSitemapStats() {
    try {
      const postCount = await Post.countDocuments();
      const userCount = await User.countDocuments();
      
      console.log('Sitemap generation stats:', {
        timestamp: new Date().toISOString(),
        totalPosts: postCount,
        totalUsers: userCount,
        sitemapFiles: [
          'sitemap.xml',
          'sitemap-zh-CN.xml',
          'sitemap-en-US.xml',
          'sitemap-ja-JP.xml',
          'sitemap-images.xml',
          'sitemap-videos.xml'
        ]
      });
    } catch (error) {
      console.error('Error logging sitemap stats:', error);
    }
  }

  /**
   * 发送错误通知
   */
  async notifyError(title, message) {
    try {
      // 这里可以集成邮件通知、Slack通知等
      console.error(`SEO Task Error - ${title}: ${message}`);
      
      // 示例：发送到日志文件
      const fs = require('fs').promises;
      const path = require('path');
      const logFile = path.join(__dirname, '../../logs/seo-errors.log');
      
      const logEntry = `${new Date().toISOString()} - ${title}: ${message}\n`;
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * 手动执行所有SEO任务
   */
  async runAllTasks() {
    console.log('Running all SEO tasks manually...');
    
    await this.generateSitemaps();
    await this.submitSitemaps();
    await this.cleanupTempFiles();
    
    console.log('All SEO tasks completed');
  }

  /**
   * 获取任务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRuns: {
        dailySitemapGeneration: '每天凌晨2点',
        weeklySitemapSubmission: '每周一凌晨3点',
        hourlySitemapUpdate: '每小时整点',
        dailyCleanup: '每天凌晨4点'
      }
    };
  }
}

// 创建全局实例
const seoScheduler = new SEOTaskScheduler();

// 如果直接运行此脚本，启动定时任务
if (require.main === module) {
  // 连接数据库
  mongoose.connect(config.database.uri, config.database.options)
    .then(() => {
      console.log('Connected to MongoDB for SEO tasks');
      seoScheduler.start();
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    });

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down SEO scheduler...');
    seoScheduler.stop();
    mongoose.connection.close();
    process.exit(0);
  });
}

module.exports = seoScheduler;