import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 导入模块化翻译资源
import { generateTranslationResources } from './modules';

// 导入原有的完整翻译文件作为备用
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import jaJP from './locales/ja-JP.json';

// 生成模块化翻译资源
const modularResources = generateTranslationResources();

// 合并模块化翻译和原有翻译，确保向后兼容
const resources = {
  'zh-CN': {
    translation: {
      // 先加载原有翻译作为基础
      ...zhCN,
      // 然后用模块化翻译覆盖，确保最新的翻译生效
      ...modularResources['zh-CN'].translation
    }
  },
  'en-US': {
    translation: {
      ...enUS,
      ...modularResources['en-US'].translation
    }
  },
  'ja-JP': {
    translation: {
      ...jaJP,
      ...modularResources['ja-JP'].translation
    }
  }
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React已经默认转义了
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    console.log('i18n initialized successfully, language:', i18n.language);
  })
  .catch((error) => {
    console.error('i18n initialization failed:', error);
  });

export default i18n;