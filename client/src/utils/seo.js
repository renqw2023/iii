// SEO工具函数
import config from '../config';

/**
 * 生成页面SEO配置
 * @param {Object} options - SEO配置选项
 * @param {string} options.title - 页面标题
 * @param {string} options.description - 页面描述
 * @param {string} options.keywords - 关键词
 * @param {string} options.image - 分享图片
 * @param {string} options.url - 页面URL
 * @param {string} options.type - 页面类型
 * @param {string} options.lang - 语言
 * @returns {Object} SEO配置对象
 */
export const generateSEOConfig = (options = {}) => {
  const {
    title = '',
    description = '',
    keywords = '',
    image = '',
    url = '',
    type = 'website',
    lang = 'zh-CN'
  } = options;

  const baseTitle = 'III.PICS - AI艺术创作平台';
  const baseDescription = '专业的AI艺术创作平台，展示Midjourney风格参数，激发无限创作灵感';
  const baseKeywords = 'Midjourney,AI艺术,数字艺术,人工智能,创作平台,风格参数';
  const baseImage = `${config.app.baseUrl}/images/og-default.jpg`;

  const finalTitle = title ? `${title} | ${baseTitle}` : baseTitle;
  const finalDescription = description || baseDescription;
  const finalKeywords = keywords ? `${keywords},${baseKeywords}` : baseKeywords;
  const finalImage = image || baseImage;
  const finalUrl = url || window.location.href;

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    image: finalImage,
    url: finalUrl,
    type,
    lang
  };
};

/**
 * 更新页面meta标签
 * @param {Object} seoConfig - SEO配置
 */
export const updatePageMeta = (seoConfig) => {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type,
    lang
  } = seoConfig;

  // 更新title
  document.title = title;

  // 更新或创建meta标签
  const updateMeta = (name, content, property = false) => {
    const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let meta = document.querySelector(selector);
    
    if (!meta) {
      meta = document.createElement('meta');
      if (property) {
        meta.setAttribute('property', name);
      } else {
        meta.setAttribute('name', name);
      }
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  };

  // 基础SEO标签
  updateMeta('description', description);
  updateMeta('keywords', keywords);
  updateMeta('robots', 'index, follow');
  updateMeta('author', 'III.PICS Team');
  updateMeta('language', lang);

  // Open Graph标签
  updateMeta('og:title', title, true);
  updateMeta('og:description', description, true);
  updateMeta('og:image', image, true);
  updateMeta('og:url', url, true);
  updateMeta('og:type', type, true);
  updateMeta('og:site_name', 'III.PICS', true);
  updateMeta('og:locale', lang, true);

  // Twitter Card标签
  updateMeta('twitter:card', 'summary_large_image');
  updateMeta('twitter:site', '@mjgallery');
  updateMeta('twitter:title', title);
  updateMeta('twitter:description', description);
  updateMeta('twitter:image', image);

  // 百度特定标签
  if (lang === 'zh-CN') {
    updateMeta('applicable-device', 'pc,mobile');
  }
};

/**
 * 生成结构化数据
 * @param {Object} data - 数据对象
 * @param {string} type - 数据类型
 * @returns {Object} 结构化数据
 */
export const generateStructuredData = (data, type = 'WebSite') => {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type
  };

  switch (type) {
    case 'WebSite':
      return {
        ...baseStructuredData,
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

    case 'Article':
      return {
        ...baseStructuredData,
        headline: data.title,
        description: data.description,
        image: data.image,
        author: {
          '@type': 'Person',
          name: data.author?.username || 'Anonymous'
        },
        publisher: {
          '@type': 'Organization',
          name: 'III.PICS',
          logo: {
            '@type': 'ImageObject',
            url: `${config.app.baseUrl}/logo.png`
          }
        },
        datePublished: data.createdAt,
        dateModified: data.updatedAt || data.createdAt,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${config.app.baseUrl}/post/${data._id}`
        }
      };

    case 'ImageObject':
      return {
        ...baseStructuredData,
        name: data.title,
        description: data.description,
        url: data.imageUrl,
        contentUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        creator: {
          '@type': 'Person',
          name: data.author?.username || 'Anonymous'
        },
        copyrightHolder: {
          '@type': 'Organization',
          name: 'III.PICS'
        }
      };

    case 'CreativeWork':
      return {
        ...baseStructuredData,
        name: data.title,
        description: data.description,
        image: data.imageUrl,
        creator: {
          '@type': 'Person',
          name: data.author?.username || 'Anonymous'
        },
        dateCreated: data.createdAt,
        genre: 'AI Art',
        keywords: data.tags?.join(', ') || ''
      };

    default:
      return baseStructuredData;
  }
};

/**
 * 插入结构化数据到页面
 * @param {Object} structuredData - 结构化数据
 */
export const insertStructuredData = (structuredData) => {
  // 移除现有的结构化数据
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // 插入新的结构化数据
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
};

/**
 * 生成面包屑导航结构化数据
 * @param {Array} breadcrumbs - 面包屑数组
 * @returns {Object} 面包屑结构化数据
 */
export const generateBreadcrumbStructuredData = (breadcrumbs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
};

/**
 * 生成多语言链接
 * @param {string} currentPath - 当前路径
 * @param {string} currentLang - 当前语言
 * @returns {Array} 多语言链接数组
 */
export const generateHrefLangLinks = (currentPath, _currentLang) => {
  const languages = {
    'zh-CN': 'zh-CN',
    'en-US': 'en-US',
    'ja-JP': 'ja-JP'
  };

  const links = [];

  // 为每种语言生成链接
  Object.entries(languages).forEach(([lang, hreflang]) => {
    const url = `${config.app.baseUrl}/${lang}${currentPath}`;
    links.push({
      rel: 'alternate',
      hreflang,
      href: url
    });
  });

  // 添加默认语言链接
  links.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${config.app.baseUrl}${currentPath}`
  });

  return links;
};

/**
 * 更新页面的hreflang链接
 * @param {Array} hrefLangLinks - hreflang链接数组
 */
export const updateHrefLangLinks = (hrefLangLinks) => {
  // 移除现有的hreflang链接
  const existingLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingLinks.forEach(link => link.remove());

  // 添加新的hreflang链接
  hrefLangLinks.forEach(linkData => {
    const link = document.createElement('link');
    link.rel = linkData.rel;
    link.hreflang = linkData.hreflang;
    link.href = linkData.href;
    document.head.appendChild(link);
  });
};

/**
 * 生成canonical链接
 * @param {string} url - 页面URL
 * @returns {string} canonical URL
 */
export const generateCanonicalUrl = (url) => {
  // 移除查询参数和片段标识符
  const cleanUrl = url.split('?')[0].split('#')[0];
  return cleanUrl;
};

/**
 * 更新canonical链接
 * @param {string} canonicalUrl - canonical URL
 */
export const updateCanonicalLink = (canonicalUrl) => {
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  
  canonicalLink.href = canonicalUrl;
};

/**
 * 页面SEO完整配置函数
 * @param {Object} options - 配置选项
 */
export const configurePageSEO = (options = {}) => {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    lang = 'zh-CN',
    structuredData,
    breadcrumbs,
    currentPath = window.location.pathname
  } = options;

  // 生成SEO配置
  const seoConfig = generateSEOConfig({
    title,
    description,
    keywords,
    image,
    url,
    type,
    lang
  });

  // 更新页面meta标签
  updatePageMeta(seoConfig);

  // 更新canonical链接
  const canonicalUrl = generateCanonicalUrl(seoConfig.url);
  updateCanonicalLink(canonicalUrl);

  // 更新hreflang链接
  const hrefLangLinks = generateHrefLangLinks(currentPath, lang);
  updateHrefLangLinks(hrefLangLinks);

  // 插入结构化数据
  if (structuredData) {
    insertStructuredData(structuredData);
  }

  // 插入面包屑结构化数据
  if (breadcrumbs && breadcrumbs.length > 0) {
    const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs);
    insertStructuredData(breadcrumbData);
  }
};

/**
 * 获取页面性能指标
 * @returns {Object} 性能指标
 */
export const getPagePerformanceMetrics = () => {
  if (!window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');

  return {
    // 页面加载时间
    loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
    // DOM内容加载时间
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
    // 首次内容绘制
    firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
    // 首次有意义绘制
    firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0
  };
};

// 添加别名导出以保持兼容性
export const updateMetaTags = updatePageMeta;
export const generateHreflangLinks = generateHrefLangLinks;

export default {
  generateSEOConfig,
  updatePageMeta,
  updateMetaTags,
  generateStructuredData,
  insertStructuredData,
  generateBreadcrumbStructuredData,
  generateHrefLangLinks,
  generateHreflangLinks,
  updateHrefLangLinks,
  generateCanonicalUrl,
  updateCanonicalLink,
  configurePageSEO,
  getPagePerformanceMetrics
};