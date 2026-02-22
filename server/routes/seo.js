const express = require('express');
const router = express.Router();
const SitemapGenerator = require('../utils/sitemapGenerator');
const Post = require('../models/Post');
const User = require('../models/User');
const config = require('../config');

/**
 * SEO相关路由
 * 提供sitemap生成、robots.txt和其他SEO功能
 */

/**
 * GET /api/seo/sitemap/generate
 * 手动生成所有sitemap文件
 */
router.get('/sitemap/generate', async (req, res) => {
  try {
    const generator = new SitemapGenerator();
    await generator.generateAllSitemaps();
    
    res.json({
      success: true,
      message: 'All sitemaps generated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sitemaps',
      error: error.message
    });
  }
});

/**
 * GET /api/seo/sitemap/status
 * 获取sitemap生成状态
 */
router.get('/sitemap/status', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const publicDir = path.join(__dirname, '../../client/public');
    
    const sitemapFiles = [
      'sitemap.xml',
      'sitemap-zh-CN.xml',
      'sitemap-en-US.xml',
      'sitemap-ja-JP.xml',
      'sitemap-images.xml',
      'sitemap-videos.xml',
      'robots.txt'
    ];
    
    const status = {};
    
    for (const file of sitemapFiles) {
      const filePath = path.join(publicDir, file);
      try {
        const stats = await fs.promises.stat(filePath);
        status[file] = {
          exists: true,
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        };
      } catch (error) {
        status[file] = {
          exists: false,
          error: 'File not found'
        };
      }
    }
    
    res.json({
      success: true,
      sitemaps: status,
      baseUrl: config.app.baseUrl
    });
  } catch (error) {
    console.error('Error checking sitemap status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check sitemap status',
      error: error.message
    });
  }
});

/**
 * GET /api/seo/meta/:type/:id?
 * 获取页面的SEO元数据
 */
router.get('/meta/:type/:id?', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { lang = 'zh-CN' } = req.query;
    
    let metaData = {};
    
    switch (type) {
      case 'post':
        if (id) {
          const post = await Post.findById(id)
            .populate('author', 'username avatar')
            .select('title description imageUrl thumbnailUrl tags createdAt updatedAt');
          
          if (post) {
            metaData = {
              title: `${post.title} - 精美AI艺术作品`,
              description: post.description || `查看这个精美的AI艺术作品：${post.title}`,
              image: post.imageUrl || post.thumbnailUrl,
              keywords: post.tags ? post.tags.join(',') : '',
              type: 'article',
              author: post.author?.username,
              publishedTime: post.createdAt,
              modifiedTime: post.updatedAt || post.createdAt,
              url: `${config.app.baseUrl}/${lang}/post/${post._id}`
            };
          }
        }
        break;
        
      case 'user':
        if (id) {
          const user = await User.findById(id)
            .select('username bio avatar createdAt');
          
          if (user) {
            metaData = {
              title: `${user.username}的作品集 - 创作者主页`,
              description: user.bio || `查看${user.username}的精美作品集`,
              image: user.avatar,
              type: 'profile',
              author: user.username,
              url: `${config.app.baseUrl}/${lang}/user/${user._id}`
            };
          }
        }
        break;
        
      case 'home':
        metaData = {
          title: 'III.PICS - 专业AI艺术创作平台',
          description: '发现AI艺术的无限可能，探索精美的Midjourney风格参数，与全球创作者分享灵感',
          keywords: 'Midjourney,AI艺术,数字艺术,人工智能,创作平台,风格参数',
          type: 'website',
          url: `${config.app.baseUrl}/${lang}/`
        };
        break;
        
      case 'explore':
        metaData = {
          title: '探索精美AI艺术作品 - 发现创作灵感',
          description: '浏览来自全球创作者的精美AI艺术作品，发现独特的创作风格和技巧',
          keywords: 'AI艺术探索,数字艺术作品,创作灵感,艺术画廊',
          type: 'website',
          url: `${config.app.baseUrl}/${lang}/explore`
        };
        break;
        
      default:
        metaData = {
          title: 'III.PICS - AI艺术创作平台',
          description: '专业的AI艺术创作平台，展示Midjourney风格参数',
          type: 'website',
          url: `${config.app.baseUrl}/${lang}/`
        };
    }
    
    // 添加默认图片
    if (!metaData.image) {
      metaData.image = `${config.app.baseUrl}/images/og-default.jpg`;
    }
    
    res.json({
      success: true,
      meta: metaData
    });
  } catch (error) {
    console.error('Error getting meta data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meta data',
      error: error.message
    });
  }
});

/**
 * GET /api/seo/structured-data/:type/:id?
 * 获取结构化数据
 */
router.get('/structured-data/:type/:id?', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { lang = 'zh-CN' } = req.query;
    
    let structuredData = {};
    
    switch (type) {
      case 'website':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'III.PICS',
          url: config.app.baseUrl,
          description: '专业的AI艺术创作平台，展示Midjourney风格参数',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${config.app.baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          },
          inLanguage: ['zh-CN', 'en-US', 'ja-JP']
        };
        break;
        
      case 'article':
        if (id) {
          const post = await Post.findById(id)
            .populate('author', 'username')
            .select('title description imageUrl createdAt updatedAt');
          
          if (post) {
            structuredData = {
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: post.title,
              description: post.description,
              image: post.imageUrl,
              author: {
                '@type': 'Person',
                name: post.author?.username || 'Anonymous'
              },
              publisher: {
                '@type': 'Organization',
                name: 'III.PICS',
                logo: {
                  '@type': 'ImageObject',
                  url: `${config.app.baseUrl}/logo.png`
                }
              },
              datePublished: post.createdAt,
              dateModified: post.updatedAt || post.createdAt,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${config.app.baseUrl}/${lang}/post/${post._id}`
              }
            };
          }
        }
        break;
        
      case 'organization':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'III.PICS',
          url: config.app.baseUrl,
          logo: `${config.app.baseUrl}/logo.png`,
          description: '专业的AI艺术创作平台',
          sameAs: [
            'https://twitter.com/mjgallery',
            'https://github.com/mjgallery'
          ]
        };
        break;
    }
    
    res.json({
      success: true,
      structuredData
    });
  } catch (error) {
    console.error('Error getting structured data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get structured data',
      error: error.message
    });
  }
});

/**
 * GET /api/seo/breadcrumbs
 * 生成面包屑导航数据
 */
router.get('/breadcrumbs', async (req, res) => {
  try {
    const { path, lang = 'zh-CN' } = req.query;
    
    if (!path) {
      return res.status(400).json({
        success: false,
        message: 'Path parameter is required'
      });
    }
    
    const breadcrumbs = [];
    const pathSegments = path.split('/').filter(segment => segment);
    
    // 添加首页
    breadcrumbs.push({
      name: lang === 'zh-CN' ? '首页' : lang === 'en-US' ? 'Home' : 'ホーム',
      url: `${config.app.baseUrl}/${lang}/`
    });
    
    // 根据路径生成面包屑
    let currentPath = `/${lang}`;
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      
      let name = segment;
      
      // 根据路径段生成名称
      switch (segment) {
        case 'explore':
          name = lang === 'zh-CN' ? '探索' : lang === 'en-US' ? 'Explore' : '探索';
          break;
        case 'prompts':
          name = lang === 'zh-CN' ? '提示词库' : lang === 'en-US' ? 'Prompts' : 'プロンプト';
          break;
        case 'post':
          name = lang === 'zh-CN' ? '作品' : lang === 'en-US' ? 'Post' : '作品';
          break;
        case 'user':
          name = lang === 'zh-CN' ? '用户' : lang === 'en-US' ? 'User' : 'ユーザー';
          break;
        case 'create':
          name = lang === 'zh-CN' ? '创作' : lang === 'en-US' ? 'Create' : '作成';
          break;
      }
      
      // 如果是ID，尝试获取实际名称
      if (i === pathSegments.length - 1 && pathSegments[i - 1]) {
        const parentSegment = pathSegments[i - 1];
        
        if (parentSegment === 'post') {
          try {
            const post = await Post.findById(segment).select('title');
            if (post) {
              name = post.title;
            }
          } catch (error) {
            // 忽略错误，使用默认名称
          }
        } else if (parentSegment === 'user') {
          try {
            const user = await User.findById(segment).select('username');
            if (user) {
              name = user.username;
            }
          } catch (error) {
            // 忽略错误，使用默认名称
          }
        }
      }
      
      breadcrumbs.push({
        name,
        url: `${config.app.baseUrl}${currentPath}`
      });
    }
    
    res.json({
      success: true,
      breadcrumbs
    });
  } catch (error) {
    console.error('Error generating breadcrumbs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate breadcrumbs',
      error: error.message
    });
  }
});

/**
 * POST /api/seo/submit-sitemap
 * 向搜索引擎提交sitemap
 */
router.post('/submit-sitemap', async (req, res) => {
  try {
    const { engines = ['google', 'bing', 'baidu'] } = req.body;
    const sitemapUrl = `${config.app.baseUrl}/sitemap.xml`;
    
    const results = {};
    
    for (const engine of engines) {
      try {
        let submitUrl = '';
        
        switch (engine) {
          case 'google':
            submitUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
            break;
          case 'bing':
            submitUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
            break;
          case 'baidu':
            submitUrl = `https://data.zz.baidu.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
            break;
        }
        
        if (submitUrl) {
          // 这里可以使用HTTP客户端提交sitemap
          // 为了简化，这里只是记录提交URL
          results[engine] = {
            success: true,
            submitUrl,
            message: 'Sitemap submission URL generated'
          };
        }
      } catch (error) {
        results[engine] = {
          success: false,
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      results,
      sitemapUrl
    });
  } catch (error) {
    console.error('Error submitting sitemap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit sitemap',
      error: error.message
    });
  }
});

module.exports = router;