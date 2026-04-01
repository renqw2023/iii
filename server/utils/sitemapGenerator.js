const fs = require('fs');
const path = require('path');
const config = require('../config');
const Post = require('../models/Post');
const User = require('../models/User');
const GalleryPrompt = require('../models/GalleryPrompt');
const SeedancePrompt = require('../models/SeedancePrompt');
const SrefStyle = require('../models/SrefStyle');

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
      { path: '/gallery', priority: 0.9, changefreq: 'daily' },
      { path: '/seedance', priority: 0.8, changefreq: 'daily' },
      { path: '/img2prompt', priority: 0.7, changefreq: 'weekly' },
      { path: '/docs', priority: 0.7, changefreq: 'monthly' },
      { path: '/docs#about', priority: 0.6, changefreq: 'monthly' },
      { path: '/docs#privacy', priority: 0.5, changefreq: 'yearly' },
      { path: '/docs#terms', priority: 0.5, changefreq: 'yearly' },
      // Keyword landing pages
      { path: '/midjourney-sref', priority: 0.85, changefreq: 'weekly' },
      { path: '/nanobanana', priority: 0.85, changefreq: 'daily' },
      { path: '/gpt-image', priority: 0.85, changefreq: 'daily' },
      { path: '/seedance-guide', priority: 0.85, changefreq: 'weekly' }
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

    // Sref style codes sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>${this.baseUrl}/sitemap-sref.xml</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    // Gallery prompts sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>${this.baseUrl}/sitemap-gallery.xml</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    // Seedance video sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>${this.baseUrl}/sitemap-seedance.xml</loc>\n`;
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
    xml += await this.generateSrefURLs();
    xml += await this.generateGalleryURLs();
    xml += await this.generateSeedanceURLs();

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
   * 生成图片sitemap (GalleryPrompt — 替代已废弃的 Post 来源)
   */
  async generateImageSitemap() {
    let xml = this.generateXMLHeader();
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    try {
      const items = await GalleryPrompt.find({
        isActive: true,
        previewImage: { $exists: true, $ne: '' }
      })
      .select('_id title prompt previewImage createdAt')
      .sort({ createdAt: -1 })
      .limit(50000);

      for (const item of items) {
        const pageUrl = `${this.baseUrl}/gallery/${item._id}`;
        const label = item.title || item.prompt?.substring(0, 60) || 'AI Image';

        xml += `  <url>\n`;
        xml += `    <loc>${pageUrl}</loc>\n`;
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${this.escapeXML(item.previewImage)}</image:loc>\n`;
        xml += `      <image:title>${this.escapeXML(label)}</image:title>\n`;
        xml += `    </image:image>\n`;
        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating image sitemap:', error);
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * 生成视频sitemap (SeedancePrompt — 替代已废弃的 Post 来源)
   */
  async generateVideoSitemap() {
    let xml = this.generateXMLHeader();
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

    try {
      const items = await SeedancePrompt.find({
        isActive: true,
        videoUrl: { $exists: true, $ne: '' }
      })
      .select('_id title prompt description videoUrl localVideoPath storageType thumbnailUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(10000);

      for (const item of items) {
        const pageUrl = `${this.baseUrl}/seedance/${item._id}`;
        const label = item.title || item.prompt?.substring(0, 60) || 'AI Video';
        const thumbnail = item.thumbnailUrl && !item.thumbnailUrl.includes('twimg.com')
          ? item.thumbnailUrl : '';
        // 优先使用本地存储 URL（对 Google 公开可访问）
        let contentLoc = '';
        if (item.storageType === 'local' && item.localVideoPath) {
          contentLoc = `${this.baseUrl}/v/${item.localVideoPath}`;
        } else if (item.storageType === 'r2' && item.videoUrl && item.videoUrl.startsWith('http')) {
          contentLoc = item.videoUrl;
        } else if (item.videoUrl && !item.videoUrl.includes('twimg.com')) {
          contentLoc = item.videoUrl;
        }

        // Skip entries with no usable thumbnail (Google requires thumbnail_loc)
        if (!thumbnail) continue;

        xml += `  <url>\n`;
        xml += `    <loc>${pageUrl}</loc>\n`;
        xml += `    <video:video>\n`;
        xml += `      <video:thumbnail_loc>${this.escapeXML(thumbnail)}</video:thumbnail_loc>\n`;
        xml += `      <video:title>${this.escapeXML(label)}</video:title>\n`;
        xml += `      <video:description>${this.escapeXML(item.description || item.prompt?.substring(0, 200) || label)}</video:description>\n`;
        if (contentLoc) {
          xml += `      <video:content_loc>${this.escapeXML(contentLoc)}</video:content_loc>\n`;
        }
        xml += `      <video:player_loc>${this.escapeXML(pageUrl)}</video:player_loc>\n`;
        xml += `      <video:publication_date>${item.createdAt.toISOString()}</video:publication_date>\n`;
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
Disallow: /dashboard/
Disallow: /settings/

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
   * 生成 Gallery 内容 URLs（用于语言 sitemap 内嵌）
   */
  async generateGalleryURLs() {
    let xml = '';
    try {
      const items = await GalleryPrompt.find({ isActive: true })
        .select('_id createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(50000);
      for (const item of items) {
        const lastmod = (item.updatedAt || item.createdAt).toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${this.baseUrl}/gallery/${item._id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating gallery URLs:', error);
    }
    return xml;
  }

  /**
   * 生成 Sref style code URLs（用于语言 sitemap 内嵌）
   */
  async generateSrefURLs() {
    let xml = '';
    try {
      const items = await SrefStyle.find({ isActive: true })
        .select('_id createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(50000);
      for (const item of items) {
        const lastmod = (item.updatedAt || item.createdAt).toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${this.baseUrl}/explore/${item._id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating sref URLs:', error);
    }
    return xml;
  }

  /**
   * 生成专用 Sref sitemap（含 image:image 条目）
   */
  async generateSrefSitemap() {
    let xml = this.generateXMLHeader();
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    try {
      const items = await SrefStyle.find({ isActive: true })
        .select('_id srefCode title description tags images createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(50000);

      for (const item of items) {
        const lastmod = (item.updatedAt || item.createdAt).toISOString().split('T')[0];
        const pageUrl = `${this.baseUrl}/explore/${item._id}`;
        const label = item.title || `--sref ${item.srefCode}`;

        xml += `  <url>\n`;
        xml += `    <loc>${pageUrl}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;

        // 添加预览图片
        if (item.images && item.images.length > 0) {
          const imgPath = `${this.baseUrl}/output/sref_${item.srefCode}/images/${item.images[0]}`;
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${imgPath}</image:loc>\n`;
          xml += `      <image:title>${this.escapeXML(label)}</image:title>\n`;
          if (item.description) {
            xml += `      <image:caption>${this.escapeXML(item.description)}</image:caption>\n`;
          }
          xml += `    </image:image>\n`;
        }

        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating sref sitemap:', error);
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * 生成专用 Gallery sitemap（含 image:image 条目）
   */
  async generateGallerySitemap() {
    let xml = this.generateXMLHeader();
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    try {
      const items = await GalleryPrompt.find({ isActive: true })
        .select('_id title prompt description previewImage tags createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(50000);

      for (const item of items) {
        const lastmod = (item.updatedAt || item.createdAt).toISOString().split('T')[0];
        const pageUrl = `${this.baseUrl}/gallery/${item._id}`;
        const label = item.title || item.prompt?.substring(0, 60) || 'AI Gallery';

        xml += `  <url>\n`;
        xml += `    <loc>${pageUrl}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;

        // 添加预览图片
        if (item.previewImage) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${this.escapeXML(item.previewImage)}</image:loc>\n`;
          xml += `      <image:title>${this.escapeXML(label)}</image:title>\n`;
          if (item.description) {
            xml += `      <image:caption>${this.escapeXML(item.description)}</image:caption>\n`;
          }
          xml += `    </image:image>\n`;
        }

        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating gallery sitemap:', error);
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * 生成专用 Seedance sitemap（含 video:video 条目）
   */
  async generateSeedanceSitemap() {
    let xml = this.generateXMLHeader();
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

    try {
      const items = await SeedancePrompt.find({ isActive: true })
        .select('_id title prompt description videoUrl localVideoPath storageType thumbnailUrl tags category createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(10000);

      for (const item of items) {
        const lastmod = (item.updatedAt || item.createdAt).toISOString().split('T')[0];
        const pageUrl = `${this.baseUrl}/seedance/${item._id}`;
        const label = item.title || item.prompt?.substring(0, 60) || 'AI Video';

        xml += `  <url>\n`;
        xml += `    <loc>${pageUrl}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;

        // Only emit video:video block when a usable public thumbnail exists
        const thumbnail = item.thumbnailUrl && !item.thumbnailUrl.includes('twimg.com')
          ? item.thumbnailUrl : '';
        // 优先使用本地存储 URL（对 Google 公开可访问）
        let contentLoc = '';
        if (item.storageType === 'local' && item.localVideoPath) {
          contentLoc = `${this.baseUrl}/v/${item.localVideoPath}`;
        } else if (item.storageType === 'r2' && item.videoUrl && item.videoUrl.startsWith('http')) {
          contentLoc = item.videoUrl;
        } else if (item.videoUrl && !item.videoUrl.includes('twimg.com')) {
          contentLoc = item.videoUrl;
        }

        if (thumbnail) {
          xml += `    <video:video>\n`;
          xml += `      <video:thumbnail_loc>${this.escapeXML(thumbnail)}</video:thumbnail_loc>\n`;
          xml += `      <video:title>${this.escapeXML(label)}</video:title>\n`;
          xml += `      <video:description>${this.escapeXML(item.description || item.prompt?.substring(0, 200) || label)}</video:description>\n`;
          if (contentLoc) {
            xml += `      <video:content_loc>${this.escapeXML(contentLoc)}</video:content_loc>\n`;
          }
          xml += `      <video:player_loc>${this.escapeXML(pageUrl)}</video:player_loc>\n`;
          xml += `      <video:publication_date>${item.createdAt.toISOString()}</video:publication_date>\n`;
          if (item.tags && item.tags.length > 0) {
            item.tags.slice(0, 10).forEach(tag => {
              xml += `      <video:tag>${this.escapeXML(tag)}</video:tag>\n`;
            });
          }
          xml += `    </video:video>\n`;
        }

        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating seedance sitemap:', error);
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * 生成 Seedance 内容 URLs
   */
  async generateSeedanceURLs() {
    let xml = '';
    try {
      const items = await SeedancePrompt.find({})
        .select('_id createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(5000);
      for (const item of items) {
        const lastmod = (item.updatedAt || item.createdAt).toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${this.baseUrl}/seedance/${item._id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      }
    } catch (error) {
      console.error('Error generating seedance URLs:', error);
    }
    return xml;
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
    const publicDir = path.join(__dirname, '../../client/public');
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

      // 生成 sref sitemap
      const srefSitemap = await this.generateSrefSitemap();
      await this.saveSitemap('sitemap-sref.xml', srefSitemap);

      // 生成 gallery sitemap
      const gallerySitemap = await this.generateGallerySitemap();
      await this.saveSitemap('sitemap-gallery.xml', gallerySitemap);

      // 生成 seedance video sitemap
      const seedanceSitemap = await this.generateSeedanceSitemap();
      await this.saveSitemap('sitemap-seedance.xml', seedanceSitemap);

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