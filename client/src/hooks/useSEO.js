import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { configurePageSEO, generateStructuredData } from '../utils/seo';
import config from '../config';

/**
 * SEO Hook - 简化页面SEO配置
 * @param {Object} options - SEO配置选项
 * @param {string} options.title - 页面标题键名或直接标题
 * @param {string} options.description - 页面描述键名或直接描述
 * @param {string} options.keywords - 关键词
 * @param {string} options.image - 分享图片URL
 * @param {string} options.type - 页面类型 (website, article, etc.)
 * @param {Object} options.structuredData - 结构化数据
 * @param {Array} options.breadcrumbs - 面包屑导航
 * @param {boolean} options.noIndex - 是否禁止索引
 */
export const useSEO = (options = {}) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const currentLang = i18n.language;

  useEffect(() => {
    const {
      title = '',
      description = '',
      keywords = '',
      image = '',
      type = 'website',
      structuredData,
      breadcrumbs,
      noIndex = false
    } = options;

    // 处理国际化标题和描述
    const finalTitle = title.includes('.') ? t(title) : title;
    const finalDescription = description.includes('.') ? t(description) : description;

    // 生成完整URL
    const fullUrl = `${config.app.baseUrl}${location.pathname}${location.search}`;

    // 配置页面SEO
    configurePageSEO({
      title: finalTitle,
      description: finalDescription,
      keywords,
      image,
      url: fullUrl,
      type,
      lang: currentLang,
      structuredData,
      breadcrumbs,
      currentPath: location.pathname,
      noIndex
    });
  }, [options, t, i18n.language, location, currentLang]);
};

/**
 * 首页SEO Hook
 */
export const useHomeSEO = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('home.seo.title', 'III.PICS - 专业AI视觉艺术平台 | 激发灵感·释放想象·推动创新'),
    description: t('home.seo.description', 'III.PICS专业AI视觉艺术平台，激发灵感(Inspire)、释放想象(Imagine)、推动创新(Innovate)。汇聚全球创作者的精美作品，发现无限创意可能，探索AI艺术的无限魅力'),
    keywords: t('home.seo.keywords', 'III.PICS,AI艺术,视觉创作,Midjourney,创意灵感,艺术作品,提示词,风格参数,数字艺术,人工智能,创作平台'),
    type: 'website',
    structuredData: generateStructuredData({
      name: 'III.PICS',
      description: 'III.PICS - 专业AI视觉艺术平台，激发灵感、释放想象、推动创新',
      url: 'https://iii.pics',
      logo: 'https://iii.pics/logo.svg',
      sameAs: [
        'https://iii.pics'
      ]
    }, 'WebSite')
  });
};

/**
 * 探索页面SEO Hook
 */
export const useExploreSEO = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('explore.seo.title', '探索 - III.PICS | 发现精美AI艺术作品'),
    description: t('explore.seo.description', '在III.PICS探索页面浏览和发现来自全球创作者的精美AI艺术作品，获取无限创作灵感，激发你的想象力'),
    keywords: t('explore.seo.keywords', 'III.PICS,AI艺术探索,数字艺术作品,创作灵感,艺术画廊,视觉艺术'),
    type: 'website'
  });
};

/**
 * 作品详情页SEO Hook
 * @param {Object} post - 作品数据
 */
export const usePostSEO = (post) => {
  const { t } = useTranslation();
  
  const title = post?.title || t('post.defaultTitle', '精美AI艺术作品');
  const description = post?.description || t('post.defaultDescription', '查看这个精美的AI艺术作品');
  const image = post?.imageUrl || post?.thumbnailUrl;
  const keywords = post?.tags ? post.tags.join(',') : '';

  useSEO({
    title,
    description,
    keywords,
    image,
    type: 'article',
    structuredData: post ? generateStructuredData(post, 'Article') : null,
    breadcrumbs: [
      { name: t('nav.home', '首页'), url: '/' },
      { name: t('nav.explore', '探索'), url: '/explore' },
      { name: title, url: post ? `/post/${post._id}` : '#' }
    ]
  });
};

/**
 * 用户页面SEO Hook
 * @param {Object} user - 用户数据
 */
export const useUserSEO = (user) => {
  const { t } = useTranslation();
  
  const username = user?.username || '用户';
  const title = t('user.seo.title', { username });
  const description = t('user.seo.description', { 
    username,
    bio: user?.bio || '查看用户的精美作品集'
  });
  const image = user?.avatar;

  useSEO({
    title,
    description,
    image,
    type: 'profile',
    structuredData: user ? generateStructuredData({
      '@type': 'Person',
      name: user.username,
      description: user.bio,
      image: user.avatar,
      url: `/user/${user._id}`
    }, 'Person') : null,
    breadcrumbs: [
      { name: t('nav.home', '首页'), url: '/' },
      { name: username, url: user ? `/user/${user._id}` : '#' }
    ]
  });
};

/**
 * 创作页面SEO Hook
 */
export const useCreateSEO = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('create.seo.title', '创作 - 分享你的AI艺术作品'),
    description: t('create.seo.description', '上传和分享你的AI艺术作品，展示创作技巧和风格参数'),
    keywords: t('create.seo.keywords', 'AI艺术创作,作品上传,创作分享,艺术社区'),
    type: 'website',
    noIndex: true // 创作页面通常不需要被索引
  });
};

/**
 * 设置页面SEO Hook
 */
export const useSettingsSEO = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('settings.seo.title', '设置 - 个人偏好配置'),
    description: t('settings.seo.description', '配置个人偏好设置，自定义使用体验'),
    type: 'website',
    noIndex: true // 设置页面不需要被索引
  });
};

/**
 * 登录页面SEO Hook
 */
export const useLoginSEO = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('login.seo.title', '登录 - III.PICS'),
    description: t('login.seo.description', '登录III.PICS，开始你的AI艺术创作之旅'),
    type: 'website',
    noIndex: true // 登录页面不需要被索引
  });
};

/**
 * 注册页面SEO Hook
 */
export const useRegisterSEO = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('register.seo.title', '注册 - 加入III.PICS'),
    description: t('register.seo.description', '注册III.PICS账户，加入AI艺术创作社区'),
    type: 'website',
    noIndex: true // 注册页面不需要被索引
  });
};

/**
 * 关于页面SEO Hook
 */
export const useAboutSEO = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('about.seo.title', '关于我们 - III.PICS'),
    description: t('about.seo.description', '了解III.PICS，专业的AI艺术创作平台的故事和使命'),
    keywords: t('about.seo.keywords', 'III.PICS,关于我们,AI艺术平台,团队介绍'),
    type: 'website'
  });
};

/**
 * 帮助页面SEO Hook
 */
export const useHelpSEO = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('help.seo.title', '帮助中心 - 使用指南'),
    description: t('help.seo.description', '查看详细的使用指南和常见问题解答，快速上手III.PICS'),
    keywords: t('help.seo.keywords', '帮助中心,使用指南,常见问题,教程'),
    type: 'website'
  });
};

/**
 * 提示词页面SEO Hook
 */
export const usePromptsSEO = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('prompts.seo.title', '提示词库 - AI创作提示词分享'),
    description: t('prompts.seo.description', '发现和分享优质的AI创作提示词，提升你的创作效果'),
    keywords: t('prompts.seo.keywords', 'AI提示词,创作提示,Midjourney提示词,AI绘画'),
    type: 'website'
  });
};

/**
 * 提示词详情页SEO Hook
 * @param {Object} prompt - 提示词数据
 */
export const usePromptSEO = (prompt) => {
  const { t } = useTranslation();
  
  const title = prompt?.title || t('prompt.defaultTitle', '优质AI提示词');
  const description = prompt?.description || t('prompt.defaultDescription', '查看这个优质的AI创作提示词');
  const keywords = prompt?.tags ? prompt.tags.join(',') : '';

  useSEO({
    title,
    description,
    keywords,
    type: 'article',
    structuredData: prompt ? generateStructuredData(prompt, 'CreativeWork') : null,
    breadcrumbs: [
      { name: t('nav.home', '首页'), url: '/' },
      { name: t('nav.prompts', '提示词库'), url: '/prompts' },
      { name: title, url: prompt ? `/prompt/${prompt._id}` : '#' }
    ]
  });
};

export default {
  useSEO,
  useHomeSEO,
  useExploreSEO,
  usePostSEO,
  useUserSEO,
  useCreateSEO,
  useSettingsSEO,
  useLoginSEO,
  useRegisterSEO,
  useAboutSEO,
  useHelpSEO,
  usePromptsSEO,
  usePromptSEO
};