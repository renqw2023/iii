import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * 基本信息表单组件
 * 处理标题、提示词、描述、分类、难度等基本信息
 */
const BasicInfoForm = ({ formData, tagManager }) => {
  const { t } = useTranslation();
  const { register, watch, errors, validationRules } = formData;
  const { tags, tagInput, setTagInput, removeTag, handleTagKeyDown } = tagManager;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
        <BookOpen className="w-5 h-5 mr-2" />
        {t('createPrompt.basicInfo.title')}
      </h2>
      
      <div className="space-y-4">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.basicInfo.titleLabel')} *
          </label>
          <input
            type="text"
            {...register('title', validationRules.title)}
            className="input"
            placeholder={t('createPrompt.basicInfo.titlePlaceholder')}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* 提示词 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.basicInfo.promptLabel')} *
          </label>
          <div className="relative">
            <textarea
              {...register('prompt', validationRules.prompt)}
              rows={4}
              className={`textarea font-mono ${
                errors.prompt ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder={t('createPrompt.basicInfo.promptPlaceholder')}
              maxLength={5000}
            />
            <div className="absolute bottom-2 right-2 text-xs text-slate-500">
              {watch('prompt')?.length || 0}/5000
            </div>
          </div>
          {errors.prompt && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="w-4 h-4 mr-1">⚠️</span>
              {errors.prompt.message}
            </p>
          )}
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.basicInfo.descriptionLabel')}
          </label>
          <div className="relative">
            <textarea
              {...register('description', validationRules.description)}
              rows={3}
              className={`textarea ${
                errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder={t('createPrompt.basicInfo.descriptionPlaceholder')}
              maxLength={2000}
              style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-slate-500">
              {watch('description')?.length || 0}/2000
            </div>
          </div>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* 分类和难度 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('createPrompt.basicInfo.categoryLabel')}
            </label>
            <select {...register('category')} className="select">
              <option value="other">{t('createPrompt.categories.other')}</option>
              <option value="character">{t('createPrompt.categories.character')}</option>
              <option value="landscape">{t('createPrompt.categories.landscape')}</option>
              <option value="architecture">{t('createPrompt.categories.architecture')}</option>
              <option value="abstract">{t('createPrompt.categories.abstract')}</option>
              <option value="fantasy">{t('createPrompt.categories.fantasy')}</option>
              <option value="scifi">{t('createPrompt.categories.scifi')}</option>
              <option value="portrait">{t('createPrompt.categories.portrait')}</option>
              <option value="animal">{t('createPrompt.categories.animal')}</option>
              <option value="object">{t('createPrompt.categories.object')}</option>
              <option value="style">{t('createPrompt.categories.style')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('createPrompt.basicInfo.difficultyLabel')}
            </label>
            <select {...register('difficulty')} className="select">
              <option value="beginner">{t('createPrompt.difficulty.beginner')}</option>
              <option value="intermediate">{t('createPrompt.difficulty.intermediate')}</option>
              <option value="advanced">{t('createPrompt.difficulty.advanced')}</option>
            </select>
          </div>
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('createPrompt.basicInfo.tagsLabel')}
          </label>
          <div className="space-y-2">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="input"
              placeholder={t('createPrompt.basicInfo.tagsPlaceholder')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoForm;