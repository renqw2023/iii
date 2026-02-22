import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

// 导入自定义 Hooks
import useFormData from './hooks/useFormData';
import useFileUpload from './hooks/useFileUpload';
import useTagManager from './hooks/useTagManager';
import usePromptPreview from './hooks/usePromptPreview';

// 导入子组件
import BasicInfoForm from './components/BasicInfoForm';
import StyleParamsForm from './components/StyleParamsForm';
import AdvancedForm from './components/AdvancedForm';
import FileUpload from './components/FileUpload';

// 导入工具函数
import { useErrorHandling } from './utils/errorHandling';
import { promptAPI } from '../../services/promptApi';

const CreatePromptRefactored = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 初始化自定义 Hooks
  const formData = useFormData();
  const fileUpload = useFileUpload();
  const tagManager = useTagManager();
  const { handleSubmitError } = useErrorHandling();
  
  // 监听表单字段变化
  const watchedFields = formData.watch([
    'prompt', 'sref', 'style', 'stylize', 'chaos', 
    'aspect', 'version', 'videoVersion', 'quality', 'seed', 'other'
  ]);
  const promptPreview = usePromptPreview(watchedFields);

  // 处理表单提交
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // 准备提交数据
      const formDataToSubmit = new FormData();
      
      // 添加基本信息
      formDataToSubmit.append('title', data.title);
      formDataToSubmit.append('prompt', data.prompt);
      formDataToSubmit.append('description', data.description || '');
      formDataToSubmit.append('category', data.category);
      formDataToSubmit.append('difficulty', data.difficulty);
      formDataToSubmit.append('tags', tagManager.getTagsString());
      
      // 添加风格参数
      const styleParams = {
        sref: data.sref || '',
        style: data.style || '',
        stylize: data.stylize || '',
        chaos: data.chaos || '',
        aspect: data.aspect || '',
        version: data.version || '',
        quality: data.quality || '',
        seed: data.seed || '',
        other: data.other || ''
      };
      formDataToSubmit.append('styleParams', JSON.stringify(styleParams));
      
      // 添加高级信息
      formDataToSubmit.append('expectedEffect', data.expectedEffect || '');
      formDataToSubmit.append('usageTips', data.usageTips || '');
      
      // 添加文件和ALT文本
      fileUpload.appendFilesToFormData(formDataToSubmit);
      
      // 提交到服务器
      const response = await promptAPI.createPrompt(formDataToSubmit);
      
      if (response.status === 200 || response.status === 201) {
        toast.success(t('createPrompt.success.createSuccess'));
        navigate('/prompts');
      } else {
        throw new Error(response.data?.message || 'Create failed');
      }
    } catch (error) {
      console.error('Create prompt error:', error);
      handleSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    if (formData.formState.isDirty || fileUpload.files.length > 0 || tagManager.tags.length > 0) {
      if (window.confirm(t('createPrompt.confirmCancel'))) {
        navigate('/prompts');
      }
    } else {
      navigate('/prompts');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('common.back')}
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {t('createPrompt.title')}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={formData.handleSubmit(onSubmit)} className="space-y-8">
          {/* 基本信息表单 */}
          <BasicInfoForm 
            formData={formData} 
            tagManager={tagManager}
          />

          {/* 风格参数表单 */}
          <StyleParamsForm 
            formData={formData}
            promptPreview={promptPreview}
          />

          {/* 高级信息表单 */}
          <AdvancedForm formData={formData} />

          {/* 文件上传 */}
          <FileUpload 
            fileUpload={fileUpload}
            formData={formData}
          />

          {/* 提交按钮 */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              {t('createPrompt.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.formState.isValid}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('createPrompt.buttons.publishing')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('createPrompt.buttons.publish')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePromptRefactored;