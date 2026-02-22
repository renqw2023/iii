import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Tag, FileText, Type, Hash, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PromptEditModal = ({
  isOpen,
  onClose,
  editForm,
  onUpdateField,
  onAddTag,
  onRemoveTag,
  onSave,
  isUpdating,
  validationErrors,
  hasChanges,
  categoryOptions,
  difficultyOptions
}) => {
  const { t } = useTranslation();

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      onAddTag(e.target.value.trim());
      e.target.value = '';
    }
  };

  const handleSave = () => {
    if (hasChanges && !isUpdating) {
      onSave();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          
          {/* 模态框内容 */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">
                  {t('dashboard.modals.editPrompt.title')}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 内容 - 可滚动 */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* 标题 */}
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                    <Type className="w-4 h-4 mr-2" />
                    {t('dashboard.modals.editPrompt.fields.title')}
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => onUpdateField('title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      validationErrors.title ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder={t('dashboard.modals.editPrompt.placeholders.title')}
                  />
                  {validationErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                  )}
                </div>

                {/* 描述 */}
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                    <FileText className="w-4 h-4 mr-2" />
                    {t('dashboard.modals.editPrompt.fields.description')}
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => onUpdateField('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                      validationErrors.description ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder={t('dashboard.modals.editPrompt.placeholders.description')}
                  />
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                  )}
                </div>

                {/* 提示词内容 */}
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                    <FileText className="w-4 h-4 mr-2" />
                    {t('dashboard.modals.editPrompt.fields.prompt')}
                  </label>
                  <textarea
                    value={editForm.prompt}
                    onChange={(e) => onUpdateField('prompt', e.target.value)}
                    rows={8}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm ${
                      validationErrors.prompt ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder={t('dashboard.modals.editPrompt.placeholders.prompt')}
                  />
                  {validationErrors.prompt && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.prompt}</p>
                  )}
                </div>

                {/* 分类和难度 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 分类 */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                      <Settings className="w-4 h-4 mr-2" />
                      {t('dashboard.modals.editPrompt.fields.category')}
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => onUpdateField('category', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 难度 */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                      <Settings className="w-4 h-4 mr-2" />
                      {t('dashboard.modals.editPrompt.fields.difficulty')}
                    </label>
                    <select
                      value={editForm.difficulty}
                      onChange={(e) => onUpdateField('difficulty', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {difficultyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 标签 */}
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                    <Tag className="w-4 h-4 mr-2" />
                    {t('dashboard.modals.editPrompt.fields.tags')}
                  </label>
                  
                  {/* 现有标签 */}
                  {editForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editForm.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                        >
                          <Hash className="w-3 h-3 mr-1" />
                          {tag}
                          <button
                            onClick={() => onRemoveTag(tag)}
                            className="ml-2 hover:text-primary-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* 添加标签输入 */}
                  <input
                    type="text"
                    onKeyPress={handleTagInput}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('dashboard.modals.editPrompt.placeholders.addTag')}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {t('dashboard.modals.editPrompt.hints.tags')}
                  </p>
                </div>

                {/* 可见性设置 */}
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                    <Settings className="w-4 h-4 mr-2" />
                    {t('dashboard.modals.editPrompt.fields.visibility')}
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isPublic"
                        checked={editForm.isPublic === true}
                        onChange={() => onUpdateField('isPublic', true)}
                        className="mr-2"
                      />
                      {t('dashboard.modals.editPrompt.visibility.public')}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isPublic"
                        checked={editForm.isPublic === false}
                        onChange={() => onUpdateField('isPublic', false)}
                        className="mr-2"
                      />
                      {t('dashboard.modals.editPrompt.visibility.private')}
                    </label>
                  </div>
                </div>
              </div>

              {/* 底部操作 */}
              <div className="flex items-center justify-between p-6 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  {hasChanges ? t('dashboard.modals.editPrompt.status.hasChanges') : t('dashboard.modals.editPrompt.status.noChanges')}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="btn btn-outline"
                    disabled={isUpdating}
                  >
                    {t('dashboard.modals.editPrompt.actions.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isUpdating}
                    className="btn btn-primary flex items-center"
                  >
                    {isUpdating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('dashboard.modals.editPrompt.actions.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t('dashboard.modals.editPrompt.actions.save')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PromptEditModal;