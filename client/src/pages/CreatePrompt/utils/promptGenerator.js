/**
 * 提示词生成工具函数
 * 用于根据表单数据生成完整的提示词
 */

/**
 * 生成基础提示词预览
 * @param {Object} formData - 表单数据
 * @returns {string} 基础提示词
 */
export const generatePromptPreview = (formData) => {
  if (!formData || !formData.prompt) {
    return '';
  }
  return formData.prompt.trim();
};

/**
 * 生成风格参数字符串
 * @param {Object} styleParams - 风格参数对象
 * @returns {string} 风格参数字符串
 */
export const generateStyleParams = (styleParams) => {
  const params = [];
  
  // 处理各种风格参数
  if (styleParams.sref && styleParams.sref.trim()) {
    params.push(`--sref ${styleParams.sref.trim()}`);
  }
  
  if (styleParams.style && styleParams.style.trim()) {
    params.push(`--style ${styleParams.style.trim()}`);
  }
  
  if (styleParams.stylize && styleParams.stylize.trim()) {
    params.push(`--stylize ${styleParams.stylize.trim()}`);
  }
  
  if (styleParams.chaos && styleParams.chaos.trim()) {
    params.push(`--chaos ${styleParams.chaos.trim()}`);
  }
  
  if (styleParams.aspect && styleParams.aspect.trim()) {
    params.push(`--aspect ${styleParams.aspect.trim()}`);
  }
  
  if (styleParams.version && styleParams.version.trim()) {
    params.push(`--version ${styleParams.version.trim()}`);
  }
  
  if (styleParams.quality && styleParams.quality.trim()) {
    params.push(`--quality ${styleParams.quality.trim()}`);
  }
  
  if (styleParams.seed && styleParams.seed.trim()) {
    params.push(`--seed ${styleParams.seed.trim()}`);
  }
  
  if (styleParams.other && styleParams.other.trim()) {
    // 处理其他参数，确保格式正确
    const otherParams = styleParams.other.trim();
    if (otherParams.startsWith('--')) {
      params.push(otherParams);
    } else {
      params.push(`--${otherParams}`);
    }
  }
  
  return params.join(' ');
};

/**
 * 生成完整提示词预览
 * @param {Object} formData - 表单数据
 * @returns {string} 完整提示词
 */
export const generateFullPromptPreview = (formData) => {
  if (!formData || !formData.prompt) {
    return '';
  }
  
  const basePrompt = formData.prompt.trim();
  
  // 收集所有风格参数
  const styleParams = {
    sref: formData.sref,
    style: formData.style,
    stylize: formData.stylize,
    chaos: formData.chaos,
    aspect: formData.aspect,
    version: formData.version,
    quality: formData.quality,
    seed: formData.seed,
    other: formData.other
  };
  
  const styleParamsString = generateStyleParams(styleParams);
  
  // 组合基础提示词和风格参数
  if (styleParamsString) {
    return `${basePrompt} ${styleParamsString}`;
  }
  
  return basePrompt;
};

/**
 * 验证提示词参数格式
 * @param {string} param - 参数值
 * @param {string} type - 参数类型
 * @returns {boolean} 是否有效
 */
export const validateStyleParam = (param, type) => {
  if (!param || !param.trim()) {
    return true; // 空值是有效的
  }
  
  const value = param.trim();
  
  switch (type) {
    case 'stylize':
      // stylize 应该是 0-1000 的数字
      const stylizeNum = parseInt(value);
      return !isNaN(stylizeNum) && stylizeNum >= 0 && stylizeNum <= 1000;
      
    case 'chaos':
      // chaos 应该是 0-100 的数字
      const chaosNum = parseInt(value);
      return !isNaN(chaosNum) && chaosNum >= 0 && chaosNum <= 100;
      
    case 'aspect':
      // aspect 应该是比例格式，如 16:9, 1:1 等
      return /^\d+:\d+$/.test(value);
      
    case 'quality':
      // quality 通常是 0.25, 0.5, 1, 2
      const qualityNum = parseFloat(value);
      return !isNaN(qualityNum) && qualityNum > 0 && qualityNum <= 2;
      
    case 'seed':
      // seed 应该是正整数
      const seedNum = parseInt(value);
      return !isNaN(seedNum) && seedNum >= 0;
      
    case 'version':
      // version 通常是数字或数字.数字格式
      return /^\d+(\.\d+)?$/.test(value);
      
    default:
      return true; // 其他类型默认有效
  }
};

/**
 * 清理和格式化提示词
 * @param {string} prompt - 原始提示词
 * @returns {string} 清理后的提示词
 */
export const cleanPrompt = (prompt) => {
  if (!prompt) return '';
  
  return prompt
    .trim()
    .replace(/\s+/g, ' ') // 替换多个空格为单个空格
    .replace(/\n+/g, ' ') // 替换换行符为空格
    .trim();
};

/**
 * 获取提示词统计信息
 * @param {string} prompt - 提示词
 * @returns {Object} 统计信息
 */
export const getPromptStats = (prompt) => {
  if (!prompt) {
    return {
      characters: 0,
      words: 0,
      lines: 0
    };
  }
  
  const cleanedPrompt = prompt.trim();
  
  return {
    characters: cleanedPrompt.length,
    words: cleanedPrompt ? cleanedPrompt.split(/\s+/).length : 0,
    lines: cleanedPrompt ? cleanedPrompt.split('\n').length : 0
  };
};