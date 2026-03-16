import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';

/**
 * 处理表单提交错误
 * @param {Error} error - 错误对象
 * @param {Function} t - 翻译函数
 */
export const handleSubmitError = (error, _t) => { // t参数暂未使用
  console.error('Publish failed:', error);
  
  // 400错误 - 请求参数错误
  if (error.response?.status === 400) {
    const errorData = error.response.data;
    if (errorData.errors && Array.isArray(errorData.errors)) {
      errorData.errors.forEach(err => {
        // 将技术错误转换为用户友好的提示
        let userMessage = err.msg;
        if (err.path === 'title') {
          userMessage = i18n.t('createPrompt.errors.titleLength');
        } else if (err.path === 'prompt') {
          userMessage = i18n.t('createPrompt.errors.promptLength');
        } else if (err.path === 'description') {
          userMessage = i18n.t('createPrompt.errors.descriptionLength');
        }
        toast.error(userMessage);
      });
    } else {
      toast.error(errorData.message || 'Invalid input, please check and try again');
    }
  }
  // 413错误 - 文件过大
  else if (error.response?.status === 413) {
    toast.error('File size exceeds limit (max 200MB)');
  }
  // 500错误 - 服务器内部错误
  else if (error.response?.status === 500) {
    const errorMessage = error.response?.data?.message;
    if (errorMessage && errorMessage.includes('文件')) {
      toast.error(i18n.t('createPrompt.errors.fileUploadFailed'));
    } else if (errorMessage && errorMessage.includes('创建')) {
      toast.error(i18n.t('createPrompt.errors.createFailed'));
    } else {
      toast.error(i18n.t('createPrompt.errors.serverError'));
    }
  }
  // Network error
  else if (error.code === 'NETWORK_ERROR' || !error.response) {
    toast.error(i18n.t('createPrompt.errors.networkError'));
  }
  // Other errors
  else {
    toast.error(i18n.t('createPrompt.errors.publishFailed'));
  }
};

/**
 * 验证提示词基本要求
 * @param {string} prompt - 提示词内容
 * @param {Function} t - 翻译函数
 * @returns {boolean} 验证是否通过
 */
export const validatePrompt = (prompt, t) => {
  if (!prompt || prompt.trim().length < 10) {
    toast.error(t('createPrompt.error.promptTooShort'));
    return false;
  }
  return true;
};

/**
 * 创建错误处理Hook
 * @returns {Object} 错误处理相关函数
 */
export const useErrorHandling = () => {
  const { t } = useTranslation();
  
  return {
    handleSubmitError: (error) => handleSubmitError(error, t),
    validatePrompt: (prompt) => validatePrompt(prompt, t)
  };
};