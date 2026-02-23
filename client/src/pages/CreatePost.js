import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { 
  Upload, 
  X, 
  Video, 
  Copy,
  Sparkles,
  Plus
} from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import { enhancedPostAPI, clearAPICache } from '../services/enhancedApi';
import { useTranslation } from 'react-i18next';

const CreatePost = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewParams, setPreviewParams] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();

  // 监听风格参数变化
  const watchedParams = watch(['sref', 'style', 'stylize', 'chaos', 'aspect', 'version', 'videoVersion', 'quality', 'seed', 'other']);

  React.useEffect(() => {
    const params = [];
    const [sref, style, stylize, chaos, aspect, version, videoVersion, quality, seed, other] = watchedParams;
    
    if (sref) params.push(`--sref ${sref}`);
    if (style) params.push(`--style ${style}`);
    if (stylize) params.push(`--stylize ${stylize}`);
    if (chaos) params.push(`--chaos ${chaos}`);
    if (aspect) params.push(`--ar ${aspect}`);
    if (version) params.push(`--v ${version}`);
    if (videoVersion) params.push(`--video ${videoVersion}`);
    if (quality) params.push(`--q ${quality}`);
    if (seed) params.push(`--seed ${seed}`);
    if (other) params.push(other);
    
    setPreviewParams(params.join(' '));
  }, [watchedParams]);

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
            toast.error(t('createPost.error.fileTooLarge'));
          } else if (error.code === 'file-invalid-type') {
            toast.error(t('createPost.error.fileTypeInvalid'));
          }
        });
      });
    }
  });

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // 标签处理函数
  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
    }
  };

  const removeTag = (index) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // 如果输入框为空且按下退格键，删除最后一个标签
      removeTag(tags.length - 1);
    }
  };

  const onSubmit = async (data) => {
    if (files.length === 0) {
      toast.error(t('createPost.error.noFiles'));
      return;
    }

    // 前端验证描述长度
    if (data.description && data.description.length > 2000) {
      toast.error(t('common.descriptionTooLong'));
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('styleParams', JSON.stringify({
        sref: data.sref,
        style: data.style,
        stylize: data.stylize ? parseInt(data.stylize) : undefined,
        chaos: data.chaos ? parseInt(data.chaos) : undefined,
        aspect: data.aspect,
        version: data.version,
        videoVersion: data.videoVersion,
        quality: data.quality,
        seed: data.seed ? parseInt(data.seed) : undefined,
        other: data.other
      }));
      formData.append('tags', tags.join(','));

      files.forEach(({ file }) => {
        formData.append('media', file);
      });

      const response = await enhancedPostAPI.createPost(formData);
      toast.success(t('createPost.success.published'));
      
      // 清理相关缓存，确保状态完全重置
      clearAPICache('post');
      
      // 重置表单状态，避免状态管理问题
      setFiles([]);
      setTags([]);
      setTagInput('');
      setPreviewParams('');
      
      // 重置useForm管理的表单字段
      reset();
      
      navigate(`/post/${response.data.post._id}`);
    } catch (error) {
      console.error('Publish failed:', error);
      
      // 处理不同类型的错误
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // 显示验证错误的详细信息
          errorData.errors.forEach(err => {
            toast.error(`${err.path}: ${err.msg}`);
          });
        } else {
          toast.error(errorData.message || 'Invalid input, please check and try again');
        }
      } else if (error.response?.status === 413) {
        toast.error('File size exceeds limit');
      } else if (error.response?.status === 500) {
        toast.error(t('common.serverError'));
      } else {
        toast.error(error.response?.data?.message || t('createPost.error.publishFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary-500 mr-2" />
            <h1 className="text-3xl font-bold text-slate-900">{t('createPost.title')}</h1>
          </div>
          <p className="text-slate-600">{t('createPost.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 文件上传区域 */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">{t('createPost.upload.title')}</h2>
            
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
                {isDragActive ? t('createPost.upload.dropToUpload') : t('createPost.upload.dragOrClick')}
              </p>
              <p className="text-sm text-slate-500">
                {t('createPost.upload.supportedFiles')}
              </p>
            </div>

            {/* 文件预览 */}
            {files.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                      {file.type === 'image' ? (
                        <img
                          src={file.preview}
                          alt={t('createPost.upload.preview')}
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
                ))}
              </div>
            )}
          </div>

          {/* 基本信息 */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">{t('createPost.basicInfo.title')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.basicInfo.titleLabel')} *
                </label>
                <input
                  type="text"
                  {...register('title', { required: t('createPost.basicInfo.titleRequired') })}
                  className="input"
                  placeholder={t('createPost.basicInfo.titlePlaceholder')}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.basicInfo.descriptionLabel')}
                </label>
                <div className="relative">
                  <textarea
                    {...register('description', {
                      maxLength: {
                        value: 2000,
                        message: 'Description must be under 2000 characters'
                      }
                    })}
                    rows={3}
                    className={`textarea ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder={t('createPost.basicInfo.descriptionPlaceholder')}
                    maxLength={2000}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                    {watch('description')?.length || 0}/2000
                  </div>
                </div>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="w-4 h-4 mr-1">⚠️</span>
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.basicInfo.tagsLabel')}
                </label>
                <div className="space-y-2">
                  {/* 标签显示区域 */}
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
                  {/* 标签输入框 */}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="input"
                    placeholder={t('createPost.basicInfo.tagsPlaceholder')}
                  />
                  <input
                    type="hidden"
                    {...register('tags')}
                    value={tags.join(',')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Midjourney风格参数 */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">{t('createPost.styleParams.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.sref')}
                </label>
                <input
                  type="text"
                  {...register('sref')}
                  className="input font-mono"
                  placeholder="3311400918"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.style')}
                </label>
                <select {...register('style')} className="select">
                  <option value="">{t('createPost.styleParams.selectStyle')}</option>
                  <option value="raw">Raw</option>
                  <option value="expressive">Expressive</option>
                  <option value="cute">Cute</option>
                  <option value="scenic">Scenic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.stylize')}
                </label>
                <input
                  type="number"
                  {...register('stylize')}
                  className="input font-mono"
                  placeholder="100"
                  min="0"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.chaos')}
                </label>
                <input
                  type="number"
                  {...register('chaos')}
                  className="input font-mono"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.aspect')}
                </label>
                <select {...register('aspect')} className="select">
                  <option value="">{t('createPost.styleParams.selectAspect')}</option>
                  <option value="1:1">{t('createPost.styleParams.aspect11')}</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">{t('createPost.styleParams.aspect169')}</option>
                  <option value="9:16">{t('createPost.styleParams.aspect916')}</option>
                  <option value="3:2">3:2</option>
                  <option value="2:3">2:3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.version')}
                </label>
                <select {...register('version')} className="select">
                  <option value="">{t('createPost.styleParams.selectVersion')}</option>
                  <option value="7">Version 7</option>
                  <option value="6">Version 6</option>
                  <option value="5.2">Version 5.2</option>
                  <option value="5.1">Version 5.1</option>
                  <option value="5">Version 5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.videoVersion')}
                </label>
                <select {...register('videoVersion')} className="select">
                  <option value="">{t('createPost.styleParams.selectVideoVersion')}</option>
                  <option value="v1">Midjourney Video V1</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.quality')}
                </label>
                <select {...register('quality')} className="select">
                  <option value="">{t('createPost.styleParams.selectQuality')}</option>
                  <option value="0.25">{t('createPost.styleParams.quality025')}</option>
                  <option value="0.5">0.5</option>
                  <option value="1">{t('createPost.styleParams.quality1')}</option>
                  <option value="2">{t('createPost.styleParams.quality2')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.seed')}
                </label>
                <input
                  type="number"
                  {...register('seed')}
                  className="input font-mono"
                  placeholder="123456"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('createPost.styleParams.otherParams')}
              </label>
              <input
                type="text"
                {...register('other')}
                className="input font-mono"
                placeholder={t('createPost.styleParams.otherParamsPlaceholder')}
              />
            </div>

            {/* 参数预览 */}
            {previewParams && (
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('createPost.styleParams.preview')}
                </label>
                <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-slate-700 border-l-4 border-primary-500 pr-12">
                  {previewParams}
                </div>
                <CopyToClipboard 
                  text={previewParams} 
                  onCopy={() => toast.success(t('createPost.styleParams.paramsCopied'))}
                >
                  <button
                    type="button"
                    className="absolute top-8 right-3 w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-slate-700 shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </CopyToClipboard>
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              {t('createPost.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('createPost.buttons.publishing')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createPost.buttons.publish')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;