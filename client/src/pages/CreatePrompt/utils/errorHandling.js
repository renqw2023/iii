import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
          userMessage = '标题长度必须在1-100个字符之间';
        } else if (err.path === 'prompt') {
          userMessage = '提示词长度必须在10-5000个字符之间';
        } else if (err.path === 'description') {
          userMessage = '描述不能超过2000个字符';
        }
        toast.error(userMessage);
      });
    } else {
      toast.error(errorData.message || '输入数据有误，请检查后重试');
    }
  }
  // 413错误 - 文件过大
  else if (error.response?.status === 413) {
    toast.error('文件大小超过限制（最大200MB），请选择较小的文件');
  }
  // 500错误 - 服务器内部错误
  else if (error.response?.status === 500) {
    const errorMessage = error.response?.data?.message;
    if (errorMessage && errorMessage.includes('文件')) {
      toast.error('文件上传失败，请检查文件格式和大小（最多9张图片，每张最大200MB）');
    } else if (errorMessage && errorMessage.includes('创建')) {
      toast.error('提示词创建失败，请稍后重试或联系客服');
    } else {
      toast.error('服务器暂时无法处理您的请求，请稍后重试');
    }
  }
  // 网络错误
  else if (error.code === 'NETWORK_ERROR' || !error.response) {
    toast.error('网络连接失败，请检查网络连接后重试');
  }
  // 其他错误
  else {
    toast.error('发布失败，请稍后重试');
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