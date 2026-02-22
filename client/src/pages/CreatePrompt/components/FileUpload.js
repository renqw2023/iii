import React, { useState } from 'react';
// import { useDropzone } from 'react-dropzone'; // 暂未使用
import { Upload, X, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// import toast from 'react-hot-toast'; // 暂未使用
// import { useFileUpload } from '../hooks/useFileUpload'; // 暂未使用

const FileUpload = ({ fileUpload, formData: _formData }) => { // formData参数暂未使用
  const { t } = useTranslation();
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    files,
    removeFile,
    altTexts,
    updateAltText
  } = fileUpload;
  const [localAltTexts, setLocalAltTexts] = useState({});

  const handleAltTextChange = (index, value) => {
    setLocalAltTexts(prev => ({
      ...prev,
      [index]: value
    }));
    if (updateAltText) {
      updateAltText(index, value);
    }
  };

  // const formatFileSize = (bytes) => { // 暂未使用
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  const isImage = (file) => {
    const fileObj = file.file || file;
    return fileObj.type.startsWith('image/');
  };
  // const isVideo = (file) => { // 暂未使用
  //   const fileObj = file.file || file;
  //   return fileObj.type.startsWith('video/');
  // };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        {t('createPrompt.upload.title')}
      </h2>
      
      <p className="text-slate-600 mb-6">
        {t('createPrompt.upload.description')}
      </p>

      {/* 上传限制说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center text-blue-800">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">上传限制说明</span>
        </div>
        <ul className="text-sm text-blue-700 mt-2 ml-6 space-y-1">
          <li>• 最多上传 9 张图片或视频</li>
          <li>• 单个文件最大 200MB</li>
          <li>• 支持格式: JPG, PNG, GIF, WEBP, MP4, MOV, AVI</li>
          <li>• 当前已上传：{files.length}/9 个文件</li>
        </ul>
      </div>

      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-700 mb-2">
          {isDragActive ? t('createPrompt.upload.dropToUpload') : t('createPrompt.upload.dragOrClick')}
        </p>
        <p className="text-sm text-slate-500">
          {t('createPrompt.upload.supportedFiles')}
        </p>
      </div>

      {/* 文件预览 */}
      {files.length > 0 && (
        <div className="mt-6 space-y-6">
          {files.map((file, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex gap-4">
                {/* 图片预览 */}
                <div className="relative group flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-slate-100">
                    {isImage(file.file || file) ? (
                      <img
                        src={file.preview || URL.createObjectURL(file.file || file)}
                        alt={t('createPrompt.upload.preview')}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* ALT文本输入 - 支持图片和视频 */}
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className="bg-black text-white px-2 py-1 rounded-sm text-xs font-bold mr-3" style={{ fontSize: '11px', lineHeight: '1' }}>
                      ALT
                    </div>
                    <label className="text-sm font-semibold text-gray-900">
                      {isImage(file) ? t('createPrompt.upload.altText') : t('createPrompt.upload.videoAltText')}
                    </label>
                  </div>
                  <div className="relative">
                    <textarea
                      value={localAltTexts[index] || altTexts[index] || ''}
                      onChange={(e) => handleAltTextChange(index, e.target.value)}
                      placeholder={isImage(file) ? t('createPrompt.upload.altTextPlaceholder') : t('createPrompt.upload.videoAltTextPlaceholder')}
                      className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-sm leading-relaxed"
                      rows={3}
                      maxLength={1000}
                      style={{ minHeight: '80px', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-1">
                      {(localAltTexts[index] || altTexts[index] || '').length}/1000
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>良好的描述有助于让所有人都能理解内容</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;