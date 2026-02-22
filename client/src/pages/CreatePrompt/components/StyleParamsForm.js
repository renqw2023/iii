import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

/**
 * Midjourney风格参数表单组件
 * 处理各种风格参数和提示词预览
 */
const StyleParamsForm = ({ formData, promptPreview }) => {
  const { t } = useTranslation();
  const { register } = formData;
  const { fullPromptPreview } = promptPreview;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card p-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left mb-4 hover:bg-gray-50 p-2 rounded-md transition-colors"
      >
        <h2 className="text-xl font-semibold text-slate-900">
          {t('createPrompt.styleParams.title')}
        </h2>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Style Reference */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.styleParams.sref')}
          </label>
          <input
            type="text"
            {...register('sref')}
            className="input font-mono"
            placeholder="3311400918"
          />
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.styleParams.style')}
          </label>
          <select {...register('style')} className="select">
            <option value="">{t('createPrompt.styleParams.selectStyle')}</option>
            <option value="raw">Raw</option>
            <option value="expressive">Expressive</option>
            <option value="cute">Cute</option>
            <option value="scenic">Scenic</option>
          </select>
        </div>

        {/* Stylize */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.styleParams.stylize')}
          </label>
          <input
            type="number"
            {...register('stylize')}
            className="input font-mono"
            placeholder="100"
            min="0"
            max="1000"
          />
        </div>

        {/* Chaos */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.styleParams.chaos')}
          </label>
          <input
            type="number"
            {...register('chaos')}
            className="input font-mono"
            placeholder="0"
            min="0"
            max="100"
          />
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.styleParams.aspect')}
          </label>
          <select {...register('aspect')} className="select">
            <option value="">{t('createPrompt.styleParams.selectAspect')}</option>
            <option value="1:1">{t('createPrompt.styleParams.aspect11')}</option>
            <option value="4:3">4:3</option>
            <option value="16:9">{t('createPrompt.styleParams.aspect169')}</option>
            <option value="9:16">{t('createPrompt.styleParams.aspect916')}</option>
            <option value="3:2">3:2</option>
            <option value="2:3">2:3</option>
          </select>
        </div>

        {/* Version */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.styleParams.version')}
          </label>
          <select {...register('version')} className="select">
            <option value="">{t('createPrompt.styleParams.selectVersion')}</option>
            <option value="7">Version 7</option>
            <option value="6">Version 6</option>
            <option value="5.2">Version 5.2</option>
            <option value="5.1">Version 5.1</option>
            <option value="5">Version 5</option>
          </select>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.styleParams.quality')}
          </label>
          <select {...register('quality')} className="select">
            <option value="">{t('createPrompt.styleParams.selectQuality')}</option>
            <option value="0.25">{t('createPrompt.styleParams.quality025')}</option>
            <option value="0.5">0.5</option>
            <option value="1">{t('createPrompt.styleParams.quality1')}</option>
            <option value="2">{t('createPrompt.styleParams.quality2')}</option>
          </select>
        </div>

        {/* Seed */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.styleParams.seed')}
          </label>
          <input
            type="number"
            {...register('seed')}
            className="input font-mono"
            placeholder="123456"
          />
        </div>
      </div>

      {/* Other Parameters */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('createPrompt.styleParams.otherParams')}
        </label>
        <textarea
          {...register('other')}
          rows={2}
          className="textarea font-mono"
          style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
          placeholder={t('createPrompt.styleParams.otherParamsPlaceholder')}
        />
      </div>

          {/* 完整提示词预览 */}
          {fullPromptPreview && (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('createPrompt.styleParams.fullPreview')}
              </label>
              <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-slate-700 border-l-4 border-primary-500 pr-12">
                {fullPromptPreview}
              </div>
              <CopyToClipboard 
                text={fullPromptPreview} 
                onCopy={() => toast.success(t('createPrompt.styleParams.promptCopied'))}
              >
                <button
                  type="button"
                  className="absolute top-8 right-3 w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-slate-700 shadow-sm"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </CopyToClipboard>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StyleParamsForm;