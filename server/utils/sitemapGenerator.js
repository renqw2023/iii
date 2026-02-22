const fs = require('fs');
const path = require('path');
const config = require('../config');
const Post = require('../models/Post');
const User = require('../models/User');

/**
 * 网站地图生成器
 * 支持多语言和多种内容类型
 */
class SitemapGenerator {
  constructor() {
    this.baseUrl = config.app.baseUrl || 'https://iii.pics';
    this.languages = ['zh-CN', 'en-US', 'ja-JP'];
    this.staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/explore', priority: 0.9, changefreq: 'daily' },
      { path: '/prompts', priority: 0.9, changefreq: 'daily' },
      { path: '/about', priority: 0.7, changefreq: 'monthly' },
      { path: '/help', priority: 0.7, changefreq: 'monthly' },
      { path: '/contact', priority: 0.6, changefreq: 'monthly' },
      { path: '/privacy', priority: 0.5, changefreq: 'yearly' },
      { path: '/terms', priority: 0.5, changefreq: 'yearly' }
    ];
  }

  /**
   * 生成XML头部
   */
  generateXMLHeader() {
    return '<?xml version="1.0" encoding="UTF-8"?>\n';
  }

  /**
   * 生成sitemap索引文件
   */
  async generateSitemapIndex() {
    const lastmod = new Date().toISOString();
    
    let xml = this.generateXMLHeader();
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // 为每种语言生成sitemap
    this.languages.forEach(lang => {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${this.baseUrl}/sitemap-${lang}.xml</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `  </sitemap>\n`;
    });
    
    // 图片sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>${this.baseUrl}/sitemap-images.xml</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    
    // 视频sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>${this.baseUrl}/sitemap-videos.xml</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    
    xml += '</sitemapindex>';
    
    return xml;
  }

  /**
   * 生成语言特定的sitemap
   */
  async generateLanguageSitemap(lang) {
    let xml = this.generateXMLHeader();
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
    
    // 静态页面
    for (const page of this.staticPages) {
      xml += await this.generateStaticPageURL(page, lang);
    }
    
    // 动态内容页面
    xml += await this.generatePostURLs(lang);
    xml += await this.generateUserURLs(lang);
    xml += await this.generatePromptURLs(lang);
    
    xml += '</urlset>';
    
    return xml;
  }

  /**
   * 生成静态页面URL
   */
  async generateStaticPageURL(page, lang) {
    const url = `${this.baseUrl}/${lang}${page.path}`;
    const lastmod = new Date().toISOString().split('T')[0];
    
    let xml = `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    
    // 添加多语言链接
    this.languages.forEach(altLang => {
      const altUrl = `${this.baseUrl}/${altLang}${page.path}`;
      xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
    });
    
    // 默认语言链接
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${this.baseUrl}${page.path}" />\n`;
    
    xml += `  </url>\n`;
    
    return xml;
  }

  /**
   * 生成作品页面URLs
   */
  async generatePostURLs(lang) {
    let xml = '';
    
    try {
      // 获取已发布的作品
      const posts = await Post.find({ 
        status: 'published',
        isDeleted: { $ne: true }
      })
      .select('_id title slug createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(10000); // 限制数量避免sitemap过大
      
      for (const post of posts) {
        const slug = post.slug || this.generateSlug(post.title);
        const url = `${this.baseUrl}/${lang}/post/${post._id}/${slug}`;
        const lastmod = (post.updatedAt || post.createdAt).toISOString().split('T')[0];
        
        xml += `  <url>\n`;
        xml += `    <loc>${url}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        
        // 添加多语言链接
        this.languages.forEach(altLang => {
          const altUrl = `${this.baseUrl}/${altLang}/post/${post._id}/${slug}`;
          xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
        });
        
        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating post URLs:', error);
    }
    
    return xml;
  }

  /**
   * 生成用户页面URLs
   */
  async generateUserURLs(lang) {
    let xml = '';
    
    try {
      // 获取活跃用户
      const users = await User.find({ 
        isActive: true,
        isDeleted: { $ne: true }
      })
      .select('_id username createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(5000);
      
      for (const user of users) {
        const url = `${this.baseUrl}/${lang}/user/${user.username || user._id}`;
        const lastmod = (user.updatedAt || user.createdAt).toISOString().split('T')[0];
        
        xml += `  <url>\n`;
        xml += `    <loc>${url}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        
        // 添加多语言链接
        this.languages.forEach(altLang => {
          const altUrl = `${this.baseUrl}/${altLang}/user/${user.username || user._id}`;
          xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
        });
        
        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating user URLs:', error);
    }
    
    return xml;
  }

  /**
   * 生成提示词页面URLs
   */
  async generatePromptURLs(lang) {
    let xml = '';
    
    try {
      // 如果有提示词模型，获取提示词数据
      // 这里假设有Prompt模型，如果没有可以注释掉
      /*
      const Prompt = require('../models/Prompt');
      const prompts = await Prompt.find({ 
        status: 'published',
        isDeleted: { $ne: true }
      })
      .select('_id title slug createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(5000);
      
      for (const prompt of prompts) {
        const slug = prompt.slug || this.generateSlug(prompt.title);
        const url = `${this.baseUrl}/${lang}/prompt/${prompt._id}/${slug}`;
        const lastmod = (prompt.updatedAt || prompt.createdAt).toISOString().split('T')[0];
        
        xml += `  <url>\n`;
        xml += `    <loc>${url}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        
        // 添加多语言链接
        this.languages.forEach(altLang => {
          const altUrl = `${this.baseUrl}/${altLang}/prompt/${prompt._id}/${slug}`;
          xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
        });
        
        xml += `  </url>\n`;
      }
      */
    } catch (error) {
      console.error('Error generating prompt URLs:', error);
    }
    
    return xml;
  }

  /**
   * 生成图片sitemap
   */
  async generateImageSitemap() {
    let xml = this.generateXMLHeader();
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
    
    try {
      const posts = await Post.find({ 
        status: 'published',
        isDeleted: { $ne: true },
        imageUrl: { $exists: true, $ne: null }
      })
      .select('_id title imageUrl thumbnailUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(10000);
      
      for (const post of posts) {
        const slug = this.generateSlug(post.title);
        const url = `${this.baseUrl}/zh-CN/post/${post._id}/${slug}`;
        
        xml += `  <url>\n`;
        xml += `    <loc>${url}</loc>\n`;
        
        if (post.imageUrl) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${post.imageUrl}</image:loc>\n`;
          xml += `      <image:title>${this.escapeXML(post.title)}</image:title>\n`;
          xml += `    </image:image>\n`;
        }
        
        if (post.thumbnailUrl && post.thumbnailUrl !== post.imageUrl) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${post.thumbnailUrl}</image:loc>\n`;
          xml += `      <image:title>${this.escapeXML(post.title)} - 缩略图</image:title>\n`;
          xml += `    </image:image>\n`;
        }
        
        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating image sitemap:', error);
    }
    
    xml += '</urlset>';
    return xml;
  }

  /**
   * 生成视频sitemap
   */
  async generateVideoSitemap() {
    let xml = this.generateXMLHeader();
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';
    
    try {
      const posts = await Post.find({ 
        status: 'published',
        isDeleted: { $ne: true },
        videoUrl: { $exists: true, $ne: null }
      })
      .select('_id title description videoUrl thumbnailUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(5000);
      
      for (const post of posts) {
        const slug = this.generateSlug(post.title);
        const url = `${this.baseUrl}/zh-CN/post/${post._id}/${slug}`;
        
        xml += `  <url>\n`;
        xml += `    <loc>${url}</loc>\n`;
        xml += `    <video:video>\n`;
        xml += `      <video:thumbnail_loc>${post.thumbnailUrl || post.videoUrl}</video:thumbnail_loc>\n`;
        xml += `      <video:title>${this.escapeXML(post.title)}</video:title>\n`;
        xml += `      <video:description>${this.escapeXML(post.description || post.title)}</video:description>\n`;
        xml += `      <video:content_loc>${post.videoUrl}</video:content_loc>\n`;
        xml += `      <video:publication_date>${post.createdAt.toISOString()}</video:publication_date>\n`;
        xml += `    </video:video>\n`;
        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating video sitemap:', error);
    }
    
    xml += '</urlset>';
    return xml;
  }

  /**
   * 生成robots.txt文件
   */
  generateRobotsTxt() {
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# 禁止访问的路径
Disallow: /api/
Disallow: /admin/
Disallow: /uploads/temp/
Disallow: /*?*
Disallow: /*/settings
Disallow: /*/login
Disallow: /*/register

# 允许搜索引擎访问静态资源
Allow: /static/
Allow: /images/
Allow: /css/
Allow: /js/

# 爬取延迟（可选）
Crawl-delay: 1

# 特定搜索引擎配置
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1

User-agent: Baiduspider
Crawl-delay: 2
`;
    
    return robotsTxt;
  }

  /**
   * 生成slug
   */
  generateSlug(title) {
    if (!title) return 'untitled';
    
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * 转义XML特殊字符
   */
  escapeXML(str) {
    if (!str) return '';
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 保存sitemap文件
   */
  async saveSitemap(filename, content) {
    const publicDir = path.join(__dirname, '../../client/build');
    const filePath = path.join(publicDir, filename);
    
    try {
      await fs.promises.writeFile(filePath, content, 'utf8');
      console.log(`Sitemap saved: ${filename}`);
    } catch (error) {
      console.error(`Error saving sitemap ${filename}:`, error);
    }
  }

  /**
   * 生成所有sitemap文件
   */
  async generateAllSitemaps() {
    try {
      console.log('Starting sitemap generation...');
      
      // 生成主sitemap索引
      const sitemapIndex = await this.generateSitemapIndex();
      await this.saveSitemap('sitemap.xml', sitemapIndex);
      
      // 生成各语言sitemap
      for (const lang of this.languages) {
        const languageSitemap = await this.generateLanguageSitemap(lang);
        await this.saveSitemap(`sitemap-${lang}.xml`, languageSitemap);
      }
      
      // 生成图片sitemap
      const imageSitemap = await this.generateImageSitemap();
      await this.saveSitemap('sitemap-images.xml', imageSitemap);
      
      // 生成视频sitemap
      const videoSitemap = await this.generateVideoSitemap();
      await this.saveSitemap('sitemap-videos.xml', videoSitemap);
      
      // 生成robots.txt
      const robotsTxt = this.generateRobotsTxt();
      await this.saveSitemap('robots.txt', robotsTxt);
      
      console.log('All sitemaps generated successfully!');
    } catch (error) {
      console.error('Error generating sitemaps:', error);
    }
  }
}

module.exports = SitemapGenerator;