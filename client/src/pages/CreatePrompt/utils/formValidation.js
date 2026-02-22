/**
 * 表单验证规则和工具函数
 */

/**
 * 获取表单验证规则
 * @param {Function} t - 翻译函数
 * @returns {Object} 验证规则对象
 */
export const getValidationRules = (t) => {
  return {
    title: {
      required: t('createPrompt.basicInfo.titleRequired'),
      maxLength: {
        value: 100,
        message: '标题不能超过100个字符'
      }
    },
    prompt: {
      required: t('createPrompt.basicInfo.promptRequired'),
      minLength: {
        value: 10,
        message: t('createPrompt.basicInfo.promptMinLength')
      },
      maxLength: {
        value: 5000,
        message: t('createPrompt.basicInfo.promptMaxLength')
      }
    },
    description: {
      maxLength: {
        value: 2000,
        message: '描述不能超过2000个字符'
      }
    },
    expectedResult: {
      maxLength: {
        value: 1000,
        message: '预期效果描述不能超过1000个字符'
      }
    },
    tips: {
      maxLength: {
        value: 1000,
        message: '使用技巧不能超过1000个字符'
      }
    }
  };
};

/**
 * 验证字符串长度
 * @param {string} value - 要验证的值
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @returns {boolean} 验证结果
 */
export const validateLength = (value, min = 0, max = Infinity) => {
  if (!value) return min === 0;
  const length = value.trim().length;
  return length >= min && length <= max;
};

/**
 * 验证必填字段
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

/**
 * 验证数字范围
 * @param {string|number} value - 要验证的值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 验证结果
 */
export const validateNumberRange = (value, min = 0, max = Infinity) => {
  if (!value) return true; // 可选字段
  const num = parseInt(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {string[]} allowedTypes - 允许的文件类型
 * @returns {boolean} 验证结果
 */
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.some(type => file.type.startsWith(type));
};

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSize - 最大文件大小（字节）
 * @returns {boolean} 验证结果
 */
export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

/**
 * 批量验证文件
 * @param {File[]} files - 文件数组
 * @param {Object} options - 验证选项
 * @returns {Object} 验证结果
 */
export const validateFiles = (files, options = {}) => {
  const {
    maxCount = 9,
    maxSize = 200 * 1024 * 1024, // 200MB
    allowedTypes = ['image/', 'video/']
  } = options;

  const errors = [];

  // 验证文件数量
  if (files.length > maxCount) {
    errors.push(`最多只能上传${maxCount}个文件`);
  }

  // 验证每个文件
  files.forEach((file, index) => {
    // 验证文件类型
    if (!validateFileType(file, allowedTypes)) {
      errors.push(`文件${index + 1}：不支持的文件类型`);
    }

    // 验证文件大小
    if (!validateFileSize(file, maxSize)) {
      errors.push(`文件${index + 1}：文件大小超过限制`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};