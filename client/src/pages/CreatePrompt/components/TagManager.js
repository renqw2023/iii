import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, X } from 'lucide-react';

const TagManager = ({ tagManager }) => {
  const { t } = useTranslation();
  const {
    tags,
    inputValue,
    setInputValue,
    addTag,
    removeTag,
    handleKeyPress,
    clearTags
  } = tagManager;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('createPrompt.tags')}
        <span className="text-gray-500 ml-1">({t('createPrompt.optional')})</span>
      </label>
      
      {/* 标签输入框 */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('createPrompt.tagsPlaceholder')}
          maxLength={20}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!inputValue.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {t('createPrompt.addTag')}
        </button>
      </div>

      {/* 已添加的标签 */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('createPrompt.addedTags')} ({tags.length})
            </span>
            {tags.length > 0 && (
              <button
                type="button"
                onClick={clearTags}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                {t('createPrompt.clearAllTags')}
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 标签提示 */}
      <p className="mt-2 text-xs text-gray-500">
        {t('createPrompt.tagsHint')}
      </p>
    </div>
  );
};

export default TagManager;