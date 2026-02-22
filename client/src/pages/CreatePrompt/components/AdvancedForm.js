import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

const AdvancedForm = ({ formData }) => {
  const { t } = useTranslation();
  const { register, watch, formState: { errors } } = formData;
  const [isExpanded, setIsExpanded] = useState(false);

  // 监听字段值以显示字符计数
  const expectedEffect = watch('expectedEffect') || '';
  const usageTips = watch('usageTips') || '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left mb-4 hover:bg-gray-50 p-2 rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('createPrompt.advancedInfo')}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-6">
        {/* 预期效果 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.advanced.expectedResultLabel')} ({t('createPrompt.upload.optional')})
          </label>
          <div className="relative">
            <textarea
              {...register('expectedEffect', {
                maxLength: {
                  value: 500,
                  message: '预期效果描述不能超过500个字符'
                }
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.expectedEffect ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={4}
              placeholder={t('createPrompt.advanced.expectedResultPlaceholder')}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {expectedEffect.length}/500
            </div>
          </div>
          {errors.expectedEffect && (
            <p className="mt-1 text-sm text-red-600">
              {errors.expectedEffect.message}
            </p>
          )}
        </div>

        {/* 使用技巧 */}
         <div>
           <label className="block text-sm font-medium text-slate-700 mb-2">
             {t('createPrompt.advanced.tipsLabel')} ({t('createPrompt.upload.optional')})
           </label>
          <div className="relative">
            <textarea
              {...register('usageTips', {
                maxLength: {
                  value: 500,
                  message: '使用技巧不能超过500个字符'
                }
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.usageTips ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={4}
              placeholder={t('createPrompt.advanced.tipsPlaceholder')}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {usageTips.length}/500
            </div>
          </div>
          {errors.usageTips && (
            <p className="mt-1 text-sm text-red-600">
              {errors.usageTips.message}
            </p>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedForm;