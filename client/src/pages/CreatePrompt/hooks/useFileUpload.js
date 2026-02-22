import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

/**
 * 文件上传管理Hook
 * 处理文件上传、预览、删除和ALT文本管理
 */
const useFileUpload = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [altTexts, setAltTexts] = useState({});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 9,
    maxSize: 200 * 1024 * 1024, // 200MB
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video'
      }));
      setFiles(prev => [...prev, ...newFiles]);
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(t('createPrompt.error.fileTooLarge'));
          } else if (error.code === 'file-invalid-type') {
            toast.error(t('createPrompt.error.fileTypeInvalid'));
          } else if (error.code === 'too-many-files') {
            toast.error('最多只能上传9个文件，请减少文件数量');
          }
        });
      });
    }
  });

  /**
   * 删除文件
   * @param {number} index - 文件索引
   */
  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    // 同时移除对应的ALT文本并重新索引
    setAltTexts(prev => {
      const newAltTexts = { ...prev };
      delete newAltTexts[index];
      
      // 重新索引剩余的ALT文本
      const reindexedAltTexts = {};
      Object.keys(newAltTexts).forEach(key => {
        const numKey = parseInt(key);
        if (numKey > index) {
          reindexedAltTexts[numKey - 1] = newAltTexts[key];
        } else {
          reindexedAltTexts[key] = newAltTexts[key];
        }
      });
      return reindexedAltTexts;
    });
  };

  /**
   * 更新ALT文本
   * @param {number} index - 文件索引
   * @param {string} value - ALT文本内容
   */
  const handleAltTextChange = (index, value) => {
    setAltTexts(prev => ({
      ...prev,
      [index]: value
    }));
  };

  /**
   * 验证文件上传
   * @returns {boolean} 验证是否通过
   */
  const validateFiles = () => {
    // 验证文件数量
    if (files.length > 9) {
      toast.error('最多只能上传9张图片，请删除多余的文件后重试');
      return false;
    }

    // 检查文件大小
    const oversizedFiles = files.filter(({ file }) => file.size > 200 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(t('createPrompt.error.fileTooLarge'));
      return false;
    }

    return true;
  };

  /**
   * 清理所有文件和状态
   */
  const clearFiles = () => {
    // 清理预览URL
    files.forEach(({ preview }) => {
      URL.revokeObjectURL(preview);
    });
    
    setFiles([]);
    setAltTexts({});
  };

  /**
   * 准备提交数据
   * @param {FormData} formData - 表单数据对象
   */
  const appendFilesToFormData = (formData) => {
    // 添加媒体文件
    files.forEach(({ file }) => {
      formData.append('media', file);
    });
    
    // 添加ALT文本数据
    formData.append('altTexts', JSON.stringify(altTexts));
  };

  return {
    files,
    altTexts,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    updateAltText: handleAltTextChange,
    validateFiles,
    clearFiles,
    appendFilesToFormData
  };
};

export default useFileUpload;