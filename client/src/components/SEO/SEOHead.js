import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

/**
 * SEO Head组件
 * 用于动态设置页面的SEO元数据
 */
const SEOHead = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  canonicalUrl,
  noindex = false,
  nofollow = false,
  structuredData,
  breadcrumbs,
  alternateUrls = {},
  customMeta = []
}) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const currentLang = i18n.language;
  
  // 基础配置
  const baseUrl = process.env.REACT_APP_BASE_URL || 'https://mjgallery.com';
  const siteName = 'III.PICS';
  const defaultImage = `${baseUrl}/images/og-default.jpg`;
  
  // 当前页面URL
  const currentUrl = canonicalUrl || `${baseUrl}${location.pathname}`;
  
  // 生成robots meta
  const robotsContent = [];
  if (noindex) robotsContent.push('noindex');
  if (nofollow) robotsContent.push('nofollow');
  if (robotsContent.length === 0) robotsContent.push('index', 'follow');
  
  // 生成hreflang链接
  const hreflangs = [];
  const supportedLanguages = ['zh-CN', 'en-US', 'ja-JP'];
  
  supportedLanguages.forEach(lang => {
    const url = alternateUrls[lang] || currentUrl.replace(`/${currentLang}/`, `/${lang}/`);
    hreflangs.push({
      rel: 'alternate',
      hreflang: lang,
      href: url
    });
  });
  
  // 添加x-default
  hreflangs.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: alternateUrls['x-default'] || currentUrl.replace(`/${currentLang}/`, '/zh-CN/')
  });
  
  return (
    <Helmet>
      {/* 基础meta标签 */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent.join(', ')} />
      <meta name="language" content={currentLang} />
      
      {/* 作者信息 */}
      {author && <meta name="author" content={author} />}
      
      {/* 发布和修改时间 */}
      {publishedTime && <meta name="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta name="article:modified_time" content={modifiedTime} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Hreflang链接 */}
      {hreflangs.map((link, index) => (
        <link
          key={index}
          rel={link.rel}
          hrefLang={link.hreflang}
          href={link.href}
        />
      ))}
      
      {/* Open Graph标签 */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={currentLang} />
      
      {/* 添加其他语言的og:locale:alternate */}
      {supportedLanguages
        .filter(lang => lang !== currentLang)
        .map(lang => (
          <meta key={lang} property="og:locale:alternate" content={lang} />
        ))
      }
      
      {/* Twitter Card标签 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
      <meta name="twitter:site" content="@mjgallery" />
      
      {/* 移动端优化 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* 主题颜色 */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      
      {/* 自定义meta标签 */}
      {customMeta.map((meta, index) => {
        if (meta.property) {
          return <meta key={index} property={meta.property} content={meta.content} />;
        }
        return <meta key={index} name={meta.name} content={meta.content} />;
      })}
      
      {/* 结构化数据 */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* 面包屑结构化数据 */}
      {breadcrumbs && breadcrumbs.length > 1 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: crumb.name,
              item: crumb.url
            }))
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;