import { useState, useCallback } from 'react';
import { enhancedPostAPI } from '../services/enhancedApi';
import { DEFAULT_POST_FORM } from '../utils/dashboard/dashboardConstants';
import { validatePostForm, handleApiError } from '../utils/dashboard/dashboardHelpers';
import toast from 'react-hot-toast';

/**
 * 作品编辑Hook
 * @param {Function} onUpdateSuccess - 更新成功回调
 * @returns {Object} 编辑状态和操作函数
 */
const usePostEdit = (onUpdateSuccess) => {
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState(DEFAULT_POST_FORM);
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * 开始编辑帖子
   * @param {Object} post - 要编辑的帖子
   */
  const startEdit = useCallback((post) => {
    setEditingPost(post._id);
    setEditForm({
      title: post.title || '',
      description: post.description || '',
      styleParams: {
        sref: post.styleParams?.sref || '',
        style: post.styleParams?.style || '',
        stylize: post.styleParams?.stylize || '',
        chaos: post.styleParams?.chaos || '',
        aspect: post.styleParams?.aspect || '',
        version: post.styleParams?.version || '',
        quality: post.styleParams?.quality || '',
        seed: post.styleParams?.seed || '',
        other: post.styleParams?.other || ''
      },
      tags: post.tags || [],
      isPublic: post.isPublic !== undefined ? post.isPublic : true
    });
    setValidationErrors({});
  }, []);

  /**
   * 取消编辑
   */
  const cancelEdit = useCallback(() => {
    setEditingPost(null);
    setEditForm(DEFAULT_POST_FORM);
    setValidationErrors({});
  }, []);

  /**
   * 更新表单字段
   * @param {string} field - 字段名
   * @param {any} value - 字段值
   */
  const updateField = useCallback((field, value) => {
    setEditForm(prev => {
      if (field.includes('.')) {
        // 处理嵌套字段，如 styleParams.sref
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    
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
    if (!editingPost || isUpdating) return;
    
    // 验证表单
    const validation = validatePostForm(editForm);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Please check form input');
      return;
    }
    
    console.log('Starting to update post:', {
      editingPost,
      editForm,
      postId: editingPost
    });
    
    setIsUpdating(true);
    try {
      const response = await enhancedPostAPI.updatePost(editingPost, editForm);
      
      // 调用成功回调
      if (onUpdateSuccess) {
        onUpdateSuccess(editingPost, response.data.post);
      }
      
      // 重置编辑状态
      cancelEdit();
      toast.success('帖子更新成功');
      
      return response.data.post;
    } catch (error) {
      console.error('更新帖子失败:', {
        error,
        postId: editingPost,
        errorMessage: error.message,
        responseData: error.response?.data
      });
      
      const errorMessage = handleApiError(error, '更新帖子失败');
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [editingPost, editForm, isUpdating, onUpdateSuccess, cancelEdit]);

  /**
   * 检查是否正在编辑指定帖子
   * @param {string} postId - 帖子ID
   * @returns {boolean} 是否正在编辑
   */
  const isEditing = useCallback((postId) => {
    return editingPost === postId;
  }, [editingPost]);

  /**
   * 检查表单是否有变更
   * @param {Object} originalPost - 原始帖子数据
   * @returns {boolean} 是否有变更
   */
  const hasChanges = useCallback((originalPost) => {
    if (!originalPost) return false;
    
    return (
      editForm.title !== (originalPost.title || '') ||
      editForm.description !== (originalPost.description || '') ||
      editForm.isPublic !== (originalPost.isPublic !== undefined ? originalPost.isPublic : true) ||
      JSON.stringify(editForm.tags) !== JSON.stringify(originalPost.tags || []) ||
      JSON.stringify(editForm.styleParams) !== JSON.stringify(originalPost.styleParams || {})
    );
  }, [editForm]);

  return {
    editingPost,
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
    hasChanges
  };
};

export default usePostEdit;