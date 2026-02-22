import React from 'react';
import SEOHead from './SEOHead';
import { useSEO } from '../../hooks/useSEO';

/**
 * SEO高阶组件
 * 为页面组件自动添加SEO功能
 */
const withSEO = (WrappedComponent, seoConfig = {}) => {
  const WithSEOComponent = (props) => {
    const {
      title,
      description,
      keywords,
      image,
      type,
      author,
      publishedTime,
      modifiedTime,
      canonicalUrl,
      noindex,
      nofollow,
      structuredData,
      breadcrumbs,
      alternateUrls,
      customMeta,
      // 从seoConfig或props中获取配置
      ...seoProps
    } = { ...seoConfig, ...props.seo };

    // 使用SEO hook进行基础配置
    const seoData = useSEO({
      title,
      description,
      keywords,
      image,
      type,
      ...seoProps
    });

    return (
      <>
        <SEOHead
          title={title || seoData.title}
          description={description || seoData.description}
          keywords={keywords || seoData.keywords}
          image={image || seoData.image}
          type={type || seoData.type}
          author={author}
          publishedTime={publishedTime}
          modifiedTime={modifiedTime}
          canonicalUrl={canonicalUrl}
          noindex={noindex}
          nofollow={nofollow}
          structuredData={structuredData || seoData.structuredData}
          breadcrumbs={breadcrumbs}
          alternateUrls={alternateUrls}
          customMeta={customMeta}
        />
        <WrappedComponent {...props} />
      </>
    );
  };

  // 设置显示名称
  WithSEOComponent.displayName = `withSEO(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithSEOComponent;
};

/**
 * 预配置的SEO HOC工厂函数
 */
export const withHomeSEO = (Component) => withSEO(Component, {
  type: 'website',
  templateKey: 'home'
});

export const withExploreSEO = (Component) => withSEO(Component, {
  type: 'website',
  templateKey: 'explore'
});

export const withPostSEO = (Component) => withSEO(Component, {
  type: 'article',
  templateKey: 'post'
});

export const withUserSEO = (Component) => withSEO(Component, {
  type: 'profile',
  templateKey: 'user'
});

export const withCreateSEO = (Component) => withSEO(Component, {
  type: 'website',
  templateKey: 'create',
  noindex: true // 创作页面不需要被索引
});

export const withPromptsSEO = (Component) => withSEO(Component, {
  type: 'website',
  templateKey: 'prompts'
});

export const withSettingsSEO = (Component) => withSEO(Component, {
  type: 'website',
  templateKey: 'settings',
  noindex: true // 设置页面不需要被索引
});

export const withAuthSEO = (Component) => withSEO(Component, {
  type: 'website',
  noindex: true, // 登录注册页面不需要被索引
  nofollow: true
});

export const withAboutSEO = (Component) => withSEO(Component, {
  type: 'website',
  templateKey: 'about'
});

export const withHelpSEO = (Component) => withSEO(Component, {
  type: 'website',
  templateKey: 'help'
});

export default withSEO;