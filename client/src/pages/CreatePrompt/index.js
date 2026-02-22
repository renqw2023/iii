// 导出重构后的主组件
export { default } from './CreatePromptRefactored';

// 导出所有子组件
export { default as BasicInfoForm } from './components/BasicInfoForm';
export { default as StyleParamsForm } from './components/StyleParamsForm';
export { default as AdvancedForm } from './components/AdvancedForm';
export { default as FileUpload } from './components/FileUpload';
export { default as TagManager } from './components/TagManager';
export { default as PromptPreview } from './components/PromptPreview';

// 导出所有自定义 Hooks
export { default as useFormData } from './hooks/useFormData';
export { default as useFileUpload } from './hooks/useFileUpload';
export { default as useTagManager } from './hooks/useTagManager';
export { default as usePromptPreview } from './hooks/usePromptPreview';

// 导出工具函数
export * from './utils/errorHandling';
export * from './utils/formValidation';
export * from './utils/promptGenerator';