import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image, AlertCircle, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const ImageUpload = ({ 
  onUpload, 
  maxFiles = 9, 
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.mkv']
  },
  className = ''
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // 处理被拒绝的文件
    rejectedFiles.forEach((file) => {
      file.errors.forEach((err) => {
        if (err.code === 'file-too-large') {
          toast.error(t('imageUpload.errors.fileTooLarge', { fileName: file.file.name, maxSize: maxSize / 1024 / 1024 }));
        } else if (err.code === 'file-invalid-type') {
          toast.error(t('imageUpload.errors.invalidFileType', { fileName: file.file.name }));
        } else if (err.code === 'too-many-files') {
          toast.error(t('imageUpload.errors.tooManyFiles', { maxFiles }));
        }
      });
    });

    // 处理接受的文件
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: URL.createObjectURL(file),
        status: 'pending', // pending, uploading, success, error
        progress: 0
      }));

      setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
    }
  }, [maxFiles, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    maxSize,
    multiple: maxFiles > 1
  });

  const removeFile = (id) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadPromises = files.map(async (fileItem) => {
      try {
        // 更新状态为上传中
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        // 模拟上传进度
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, progress }
              : f
          ));
        }

        // 实际上传逻辑应该在这里
        const formData = new FormData();
        formData.append('file', fileItem.file);
        
        // 这里应该调用实际的上传API
        // const response = await uploadAPI(formData);
        
        // 模拟成功
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'success', progress: 100 }
            : f
        ));

        return {
          id: fileItem.id,
          url: fileItem.preview, // 实际应该是服务器返回的URL
          type: fileItem.file.type.startsWith('image/') ? 'image' : 'video',
          name: fileItem.file.name,
          size: fileItem.file.size
        };
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error' }
            : f
        ));
        throw error;
      }
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      onUpload?.(uploadedFiles);
      toast.success(t('imageUpload.messages.uploadSuccess'));
    } catch (error) {
      toast.error(t('imageUpload.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          <Upload className={`w-12 h-12 mb-4 ${
            isDragActive ? 'text-primary-500' : 'text-slate-400'
          }`} />
          
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {isDragActive ? t('imageUpload.dropHere') : t('imageUpload.dragHere')}
          </h3>
          
          <p className="text-slate-500 mb-4">
            {t('imageUpload.or')} <span className="text-primary-600 font-medium">{t('imageUpload.clickToSelect')}</span>
          </p>
          
          <div className="text-sm text-slate-400">
            <p>{t('imageUpload.supportedFiles')}</p>
            <p>{t('imageUpload.fileLimits', { maxSize: maxSize / 1024 / 1024, maxFiles })}</p>
          </div>
        </div>
      </div>

      {/* 文件列表 */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {files.map((fileItem) => (
              <motion.div
                key={fileItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
              >
                {/* 文件预览 */}
                <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                  {fileItem.file.type.startsWith('image/') ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatFileSize(fileItem.file.size)}
                  </p>
                  
                  {/* 上传进度 */}
                  {fileItem.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{t('imageUpload.uploading')}</span>
                        <span>{fileItem.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1">
                        <div
                          className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 状态图标 */}
                <div className="flex items-center gap-2">
                  {fileItem.status === 'success' && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {fileItem.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 上传按钮 */}
      {files.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={uploadFiles}
            disabled={uploading || files.every(f => f.status === 'success')}
            className="btn btn-primary"
          >
            {uploading ? t('imageUpload.uploading') : t('imageUpload.startUpload')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;