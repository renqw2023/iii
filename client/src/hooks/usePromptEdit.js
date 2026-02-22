import { useState, useCallback } from 'react';
import { promptAPI } from '../services/enhancedApi';
import { DEFAULT_PROMPT_FORM } from '../utils/dashboard/dashboardConstants';
import { validatePromptForm, handleApiError } from '../utils/dashboard/dashboardHelpers';
import toast from 'react-hot-toast';

/**
 * 提示词编辑Hook
 * @param {Function} onUpdateSuccess - 更新成功回调
 * @returns {Object} 编辑状态和操作函数
 */
const usePromptEdit = (onUpdateSuccess) => {
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editForm, setEditForm] = useState(DEFAULT_PROMPT_FORM);
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * 开始编辑提示词
   * @param {Object} prompt - 要编辑的提示词
   */
  const startEdit = useCallback((prompt) => {
    setEditingPrompt(prompt._id);
    setEditForm({
      title: prompt.title || '',
      description: prompt.description || '',
      prompt: prompt.prompt || '',
      category: prompt.category || 'other',
      difficulty: prompt.difficulty || 'beginner',
      tags: prompt.tags || [],
      isPublic: prompt.isPublic !== undefined ? prompt.isPublic : true
    });
    setValidationErrors({});
  }, []);

  /**
   * 取消编辑
   */
  const cancelEdit = useCallback(() => {
    setEditingPrompt(null);
    setEditForm(DEFAULT_PROMPT_FORM);
    setValidationErrors({});
  }, []);

  /**
   * 更新表单字段
   * @param {string} field - 字段名
   * @param {any} value - 字段值
   */
  const updateField = useCallback((field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除该字段的验证错误
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  /**
   * 添加标签
   * @param {string} tag - 标签
   */
  const addTag = useCallback((tag) => {
    if (tag && !editForm.tags.includes(tag)) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  }, [editForm.tags]);

  /**
   * 移除标签
   * @param {string} tag - 标签
   */
  const removeTag = useCallback((tag) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  /**
   * 保存编辑
   */
  const saveEdit = useCallback(async () => {
    if (!editingPrompt || isUpdating) return;
    
    // 验证表单
    const validation = validatePromptForm(editForm);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('请检查表单输入');
      return;
    }
    
    console.log('Starting to update prompt:', {
      editingPrompt,
      editForm,
      promptId: editingPrompt
    });
    
    setIsUpdating(true);
    try {
      const response = await promptAPI.updatePrompt(editingPrompt, editForm);
      
      // 调用成功回调
      if (onUpdateSuccess) {
        onUpdateSuccess(editingPrompt, response.data.prompt);
      }
      
      // 重置编辑状态
      cancelEdit();
      toast.success('提示词更新成功');
      
      return response.data.prompt;
    } catch (error) {
      console.error('更新提示词失败:', {
        error,
        promptId: editingPrompt,
        errorMessage: error.message,
        responseData: error.response?.data
      });
      
      const errorMessage = handleApiError(error, '更新提示词失败');
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [editingPrompt, editForm, isUpdating, onUpdateSuccess, cancelEdit]);

  /**
   * 检查是否正在编辑指定提示词
   * @param {string} promptId - 提示词ID
   * @returns {boolean} 是否正在编辑
   */
  const isEditing = useCallback((promptId) => {
    return editingPrompt === promptId;
  }, [editingPrompt]);

  /**
   * 检查表单是否有变更
   * @param {Object} originalPrompt - 原始提示词数据
   * @returns {boolean} 是否有变更
   */
  const hasChanges = useCallback((originalPrompt) => {
    if (!originalPrompt) return false;
    
    return (
      editForm.title !== (originalPrompt.title || '') ||
      editForm.description !== (originalPrompt.description || '') ||
      editForm.prompt !== (originalPrompt.prompt || '') ||
      editForm.category !== (originalPrompt.category || 'other') ||
      editForm.difficulty !== (originalPrompt.difficulty || 'beginner') ||
      editForm.isPublic !== (originalPrompt.isPublic !== undefined ? originalPrompt.isPublic : true) ||
      JSON.stringify(editForm.tags) !== JSON.stringify(originalPrompt.tags || [])
    );
  }, [editForm]);

  /**
   * 获取分类选项
   */
  const getCategoryOptions = useCallback(() => {
    return [
      { value: 'art', label: '艺术' },
      { value: 'photography', label: '摄影' },
      { value: 'design', label: '设计' },
      { value: 'character', label: '角色' },
      { value: 'landscape', label: '风景' },
      { value: 'abstract', label: '抽象' },
      { value: 'other', label: '其他' }
    ];
  }, []);

  /**
   * 获取难度选项
   */
  const getDifficultyOptions = useCallback(() => {
    return [
      { value: 'beginner', label: '初级' },
      { value: 'intermediate', label: '中级' },
      { value: 'advanced', label: '高级' },
      { value: 'expert', label: '专家' }
    ];
  }, []);

  return {
    editingPrompt,
    editForm,
    isUpdating,
    validationErrors,
    startEdit,
    cancelEdit,
    updateField,
    addTag,
    removeTag,
    saveEdit,
    isEditing,
    hasChanges,
    getCategoryOptions,
    getDifficultyOptions
  };
};

export default usePromptEdit;