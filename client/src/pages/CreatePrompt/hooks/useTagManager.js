import { useState } from 'react';

/**
 * 标签管理Hook
 * 处理标签的添加、删除和键盘事件
 */
const useTagManager = () => {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  /**
   * 添加标签
   * @param {string} tag - 要添加的标签
   */
  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
    }
  };

  /**
   * 删除标签
   * @param {number} index - 要删除的标签索引
   */
  const removeTag = (index) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * 处理标签输入的键盘事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  /**
   * 清理所有标签
   */
  const clearTags = () => {
    setTags([]);
    setTagInput('');
  };

  /**
   * 获取标签字符串（用于提交）
   * @returns {string} 逗号分隔的标签字符串
   */
  const getTagsString = () => {
    return tags.join(',');
  };

  return {
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagKeyDown,
    clearTags,
    getTagsString
  };
};

export default useTagManager;