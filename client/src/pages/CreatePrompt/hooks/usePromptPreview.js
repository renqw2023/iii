import { useState, useEffect } from 'react';

/**
 * 提示词预览Hook
 * 根据表单数据生成提示词预览
 */
const usePromptPreview = (watchedFields) => {
  const [previewParams, setPreviewParams] = useState('');
  const [fullPromptPreview, setFullPromptPreview] = useState('');

  useEffect(() => {
    if (!watchedFields) return;
    
    const [prompt, sref, style, stylize, chaos, aspect, version, videoVersion, quality, seed, other] = watchedFields;
    
    // 生成风格参数预览
    const params = [];
    if (sref) params.push(`--sref ${sref}`);
    if (style) params.push(`--style ${style}`);
    if (stylize) params.push(`--stylize ${stylize}`);
    if (chaos) params.push(`--chaos ${chaos}`);
    if (aspect) params.push(`--ar ${aspect}`);
    if (version) params.push(`--v ${version}`);
    if (videoVersion) params.push(`--video ${videoVersion}`);
    if (quality) params.push(`--q ${quality}`);
    if (seed) params.push(`--seed ${seed}`);
    if (other) params.push(other);
    
    const paramsString = params.join(' ');
    setPreviewParams(paramsString);
    
    // 生成完整提示词预览
    let fullPrompt = prompt || '';
    if (params.length > 0) {
      fullPrompt += (fullPrompt ? ' ' : '') + paramsString;
    }
    setFullPromptPreview(fullPrompt);
  }, [watchedFields]);

  /**
   * 生成风格参数对象（用于提交）
   * @param {Object} formData - 表单数据
   * @returns {Object} 风格参数对象
   */
  const generateStyleParams = (formData) => {
    return {
      sref: formData.sref,
      style: formData.style,
      stylize: formData.stylize ? parseInt(formData.stylize) : undefined,
      chaos: formData.chaos ? parseInt(formData.chaos) : undefined,
      aspect: formData.aspect,
      version: formData.version,
      videoVersion: formData.videoVersion,
      quality: formData.quality,
      seed: formData.seed ? parseInt(formData.seed) : undefined,
      other: formData.other
    };
  };

  return {
    previewParams,
    promptPreviewText: previewParams,
    fullPromptPreview,
    generateStyleParams
  };
};

export default usePromptPreview;