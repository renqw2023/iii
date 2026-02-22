// SEO组件统一导出
export { default as SEOHead } from './SEOHead';
export { default as withSEO } from './withSEO';
export {
  withHomeSEO,
  withExploreSEO,
  withPostSEO,
  withUserSEO,
  withCreateSEO,
  withPromptsSEO,
  withSettingsSEO,
  withAuthSEO,
  withAboutSEO,
  withHelpSEO
} from './withSEO';

// SEO工具函数
export {
  generateSEOConfig,
  updateMetaTags,
  generateStructuredData,
  generateHreflangLinks,
  generateCanonicalUrl,
  configurePageSEO,
  getPagePerformanceMetrics
} from '../../utils/seo';

// SEO Hooks
export {
  useSEO,
  useHomeSEO,
  useExploreSEO,
  usePostSEO,
  useUserSEO,
  useCreateSEO,
  usePromptsSEO,
  useSettingsSEO,
  useLoginSEO,
  useRegisterSEO,
  useAboutSEO,
  useHelpSEO
} from '../../hooks/useSEO';