// 翻译模块统一导出
import { common } from './common';
import { navigation } from './navigation';
import { home } from './home';
import { ui } from './ui';
import { errors, validation } from './errors';
import { time, language } from './time';
import { help } from './help';
import { settings } from './settings';
import { profile } from './profile';
import { favorites } from './favorites';
import { emailVerification } from './emailVerification';
import { resetPassword } from './resetPassword';
import { forgotPassword } from './forgotPassword';
import { createPost } from './createPost';
import { createPrompt } from './createPrompt';
import { about } from './about';
import { privacy } from './privacy';
import { notifications } from './notifications';
import { postDetail, relatedPosts } from './postDetail';
import { promptDetail } from './promptDetail';
import { header } from './header';
import { shareCard } from './shareCard';
import { adminStats } from './adminStats';
import { comments } from './comments';
import { form } from './form';
import { postCard } from './postCard';
import { followButton } from './followButton';
import { imageUpload } from './imageUpload';
import { errorDisplay } from './errorDisplay';
import { contact } from './contact';
import { dashboard } from './dashboard';
import { seo } from './seo';
import { gallery } from './gallery';
import { seedance } from './seedance';

// 合并所有翻译模块
export const mergeTranslations = (lang) => {
  const baseTranslations = {
    common: common[lang] || {},
    nav: navigation[lang] || {},
    navigation: navigation[lang] || {},
    home: home[lang] || {},
    ui: ui[lang] || {},
    errors: errors[lang] || {},
    validation: validation[lang] || {},
    time: time[lang] || {},
    language: language[lang] || {},
    help: help[lang] || {},
    settings: settings[lang] || {},
    profile: profile[lang] || {},
    favorites: favorites[lang] || {},
    emailVerification: emailVerification[lang] || {},
    resetPassword: resetPassword[lang] || {},
    forgotPassword: forgotPassword[lang] || {},
    createPost: createPost[lang] || {},
    createPrompt: createPrompt[lang] || {},
    about: about[lang] || {},
    privacy: privacy[lang] || {},
    notifications: notifications[lang] || {},
    postDetail: postDetail[lang] || {},
    relatedPosts: relatedPosts[lang] || {},
    promptDetail: promptDetail[lang] || {},
    header: header[lang] || {},
    shareCard: shareCard[lang] || {},
    comments: comments[lang] || {},
    form: form[lang] || {},
    postCard: postCard[lang] || {},
    followButton: followButton[lang] || {},
    imageUpload: imageUpload[lang] || {},
    errorDisplay: errorDisplay[lang] || {},
    contact: contact[lang] || {},
    dashboard: dashboard[lang] || {},
    seo: seo[lang] || {},
    gallery: gallery[lang] || {},
    seedance: seedance[lang] || {},
  };

  // 特殊处理adminStats，将其内容合并到根级别
  const adminStatsData = adminStats[lang] || {};

  return {
    ...baseTranslations,
    ...adminStatsData
  };
};

// 导出所有支持的语言
export const supportedLanguages = ['zh-CN', 'en-US', 'ja-JP'];

// 生成完整的翻译资源
export const generateTranslationResources = () => {
  const resources = {};

  supportedLanguages.forEach(lang => {
    resources[lang] = {
      translation: mergeTranslations(lang)
    };
  });

  return resources;
};