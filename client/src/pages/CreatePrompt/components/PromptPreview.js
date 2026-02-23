import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const PromptPreview = ({ promptPreview }) => {
  const { t } = useTranslation();
  const { promptPreviewText, fullPromptPreview } = promptPreview;
  const [copiedStates, setCopiedStates] = useState({
    prompt: false,
    full: false
  });

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [type]: true }));
      toast.success(t('createPrompt.styleParams.promptCopied'));
      
      // 重置复制状态
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      toast.error(t('common.copyFailed'));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('createPrompt.promptPreview')}
        </h3>
      </div>

      <div className="space-y-4">
        {/* 基础提示词预览 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              {t('createPrompt.basicPrompt')}
            </label>
            <button
              type="button"
              onClick={() => copyToClipboard(promptPreviewText, 'prompt')}
              disabled={!promptPreviewText || !promptPreviewText.trim()}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedStates.prompt ? (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  {t('createPrompt.copy')}
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 min-h-[80px]">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {promptPreviewText || t('createPrompt.promptPreviewPlaceholder')}
            </pre>
          </div>
        </div>

        {/* 完整提示词预览 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              {t('createPrompt.fullPrompt')}
            </label>
            <button
              type="button"
              onClick={() => copyToClipboard(fullPromptPreview, 'full')}
              disabled={!fullPromptPreview || !fullPromptPreview.trim()}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedStates.full ? (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  {t('createPrompt.copy')}
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 min-h-[100px]">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {fullPromptPreview || t('createPrompt.fullPromptPreviewPlaceholder')}
            </pre>
          </div>
        </div>

        {/* 预览说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-700">
            <strong>{t('createPrompt.previewNote')}:</strong> {t('createPrompt.previewNoteText')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromptPreview;