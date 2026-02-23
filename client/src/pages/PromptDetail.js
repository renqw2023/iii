import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Bookmark, 
  Copy, 
  Share2, 
  Eye, 
  Calendar, 
  Tag, 
  ArrowLeft,
  Flag,
  Lightbulb,
  Target,
  HelpCircle,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { promptAPI } from '../services/promptApi';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CommentSection from '../components/CommentSection';
import RelatedPrompts from '../components/RelatedPrompts';
import UserAvatar from '../components/UserAvatar';
import ShareCard from '../components/UI/ShareCard';

// ATL标识组件 - 仿X.com样式，半透明背景
const AltTextBadge = ({ altText, onShow }) => {
  if (!altText || altText.trim().length === 0) return null;
  
  return (
    <button
      onClick={onShow}
      className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-sm text-xs font-bold hover:bg-opacity-80 transition-all duration-200 z-10 shadow-sm backdrop-blur-sm"
      style={{ fontSize: '11px', lineHeight: '1' }}
    >
      ALT
    </button>
  );
};

// ATL文本弹窗组件 - 仿X.com样式
const AltTextModal = ({ isOpen, onClose, altText, imageUrl, mediaType }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Image Description</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6">
          {mediaType === 'image' && (
            <div className="mb-4">
              <img src={imageUrl} alt="" className="w-full h-40 object-cover rounded-xl" />
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-gray-800 leading-relaxed text-sm" style={{ whiteSpace: 'pre-wrap' }}>{altText}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full bg-black text-white py-3 px-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 图片放大组件
const ImageLightbox = ({ isOpen, onClose, imageUrl, altText, onPrev, onNext, showNavigation }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img 
          src={imageUrl} 
          alt={altText || 'Original'} 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
        
        {/* Close按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* 导航按钮 */}
        {showNavigation && (
          <>
            <button 
              onClick={onPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <button 
              onClick={onNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const PromptDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [copyCount, setCopyCount] = useState(0);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [_activeImageIndex, _setActiveImageIndex] = useState(0);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [showAltModal, setShowAltModal] = useState(false);
  const [selectedAltText, setSelectedAltText] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState('');
  const [lightboxImageAlt, setLightboxImageAlt] = useState('');
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  const fetchPromptDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await promptAPI.getPromptById(id);
      const promptData = response.data.prompt;
      
      setPrompt(promptData);
      setIsLiked(promptData.isLiked || false);
      setIsBookmarked(promptData.isFavorited || false);
      setLikesCount(promptData.likesCount || 0);
      setCopyCount(promptData.copyCount || 0);
    } catch (error) {
      console.error('Failed to fetch prompt:', error);
      setError(error.response?.data?.message || '获取提示词详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPromptDetail();
  }, [fetchPromptDetail]);

  const handleLike = async () => {
    if (!user) {
      toast.error(t('common.loginRequired'));
      return;
    }

    try {
      const response = await promptAPI.toggleLike(id);
      const { isLiked: newIsLiked, likesCount: newLikesCount, message } = response.data;
      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);
      toast.success(message);
    } catch (error) {
      console.error('点赞操作失败:', error);
      toast.error(t('common.operationFailed'));
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error(t('common.loginRequired'));
      return;
    }

    try {
      const response = await promptAPI.toggleBookmark(id);
      const { isFavorited: newIsFavorited, message } = response.data;
      setIsBookmarked(newIsFavorited);
      toast.success(message);
    } catch (error) {
      console.error('收藏操作失败:', error);
      toast.error(t('common.operationFailed'));
    }
  };

  const handleCopy = async () => {
    try {
      await promptAPI.copyPrompt(id);
      setCopyCount(prev => prev + 1);
      toast.success(t('common.promptCopied'));
    } catch (error) {
      toast.error(t('common.copyFailed'));
    }
  };

  const handleShare = () => {
    setIsShareCardOpen(true);
  };

  const handleShowAltText = (altText, imageUrl, mediaType) => {
    setSelectedAltText(altText);
    setSelectedImageUrl(imageUrl);
    setSelectedMediaType(mediaType);
    setShowAltModal(true);
  };

  const handleCloseAltModal = () => {
    setShowAltModal(false);
    setSelectedAltText('');
    setSelectedImageUrl('');
    setSelectedMediaType('');
  };

  const handleImageClick = (imageUrl, altText, index = 0) => {
    setLightboxImageUrl(imageUrl);
    setLightboxImageAlt(altText || '');
    setLightboxImageIndex(index);
    setShowImageLightbox(true);
  };

  const handleCloseLightbox = () => {
    setShowImageLightbox(false);
    setLightboxImageUrl('');
    setLightboxImageAlt('');
  };

  const handlePrevImage = () => {
    if (!prompt?.media || prompt.media.length <= 1) return;
    const prevIndex = lightboxImageIndex > 0 ? lightboxImageIndex - 1 : prompt.media.length - 1;
    const prevMedia = prompt.media[prevIndex];
    setLightboxImageIndex(prevIndex);
    setLightboxImageUrl(prevMedia.url);
    setLightboxImageAlt(prevMedia.altText || '');
  };

  const handleNextImage = () => {
    if (!prompt?.media || prompt.media.length <= 1) return;
    const nextIndex = lightboxImageIndex < prompt.media.length - 1 ? lightboxImageIndex + 1 : 0;
    const nextMedia = prompt.media[nextIndex];
    setLightboxImageIndex(nextIndex);
    setLightboxImageUrl(nextMedia.url);
    setLightboxImageAlt(nextMedia.altText || '');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'character': return '👤';
      case 'landscape': return '🏞️';
      case 'architecture': return '🏛️';
      case 'abstract': return '🎨';
      case 'fantasy': return '🧙‍♂️';
      case 'scifi': return '🚀';
      case 'portrait': return '📸';
      case 'animal': return '🐾';
      case 'object': return '📦';
      case 'style': return '✨';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">提示词不存在</h2>
          <p className="text-slate-600 mb-4">您访问的提示词可能已被删除或不存在</p>
          <button
            onClick={() => navigate('/prompts')}
            className="btn btn-primary"
          >
            返回提示词列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 提示词头部信息 */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getCategoryIcon(prompt.category)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(prompt.difficulty)}`}>
                      {t(`createPrompt.difficulty.${prompt.difficulty}`)}
                    </span>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{prompt.title}</h1>
                  
                  {prompt.description && (
                    <p className="text-slate-600 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{prompt.description}</p>
                  )}
                </div>
              </div>

              {/* 作者信息 */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Link
                  to={`/user/${prompt.author._id}`}
                  className="flex items-center space-x-3 hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <UserAvatar user={prompt.author} size="sm" />
                  <div>
                    <p className="font-medium text-slate-900">{prompt.author.username}</p>
                    <p className="text-sm text-slate-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {prompt.views || 0}
                  </div>
                  <div className="flex items-center">
                    <Copy className="w-4 h-4 mr-1" />
                    {copyCount}
                  </div>
                </div>
              </div>
            </div>

            {/* 提示词内容 */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                提示词内容
              </h2>
              
              <div className="relative">
                <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-slate-700 border-l-4 border-primary-500 pr-12" style={{ whiteSpace: 'pre-wrap' }}>
                  {prompt.prompt ? (
                    showFullPrompt || prompt.prompt.length <= 200 
                      ? prompt.prompt 
                      : `${prompt.prompt.substring(0, 200)}...`
                  ) : (
                    <span className="text-slate-500 italic">暂无提示词内容</span>
                  )}
                  
                  {prompt.prompt && prompt.prompt.length > 200 && (
                    <button
                      onClick={() => setShowFullPrompt(!showFullPrompt)}
                      className="text-primary-600 hover:text-primary-700 ml-2 font-sans"
                    >
                      {showFullPrompt ? '收起' : '展开'}
                    </button>
                  )}
                </div>
                
                <CopyToClipboard 
                  text={prompt.prompt || ''} 
                  onCopy={handleCopy}
                >
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-slate-700 shadow-sm">
                    <Copy className="w-4 h-4" />
                  </button>
                </CopyToClipboard>
              </div>
            </div>

            {/* 风格参数 */}
            {prompt.styleParams && Object.keys(prompt.styleParams).some(key => prompt.styleParams[key]) && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">风格参数</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {prompt.styleParams.sref && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Style Reference</div>
                      <div className="font-mono text-sm text-slate-600">--sref {prompt.styleParams.sref}</div>
                    </div>
                  )}
                  
                  {prompt.styleParams.style && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Style</div>
                      <div className="font-mono text-sm text-slate-600">--style {prompt.styleParams.style}</div>
                    </div>
                  )}
                  
                  {prompt.styleParams.stylize && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Stylize</div>
                      <div className="font-mono text-sm text-slate-600">--stylize {prompt.styleParams.stylize}</div>
                    </div>
                  )}
                  
                  {prompt.styleParams.chaos && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Chaos</div>
                      <div className="font-mono text-sm text-slate-600">--chaos {prompt.styleParams.chaos}</div>
                    </div>
                  )}
                  
                  {prompt.styleParams.aspect && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Aspect Ratio</div>
                      <div className="font-mono text-sm text-slate-600">--ar {prompt.styleParams.aspect}</div>
                    </div>
                  )}
                  
                  {prompt.styleParams.version && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Version</div>
                      <div className="font-mono text-sm text-slate-600">--v {prompt.styleParams.version}</div>
                    </div>
                  )}
                  
                  {prompt.styleParams.quality && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Quality</div>
                      <div className="font-mono text-sm text-slate-600">--q {prompt.styleParams.quality}</div>
                    </div>
                  )}
                  
                  {prompt.styleParams.seed && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Seed</div>
                      <div className="font-mono text-sm text-slate-600">--seed {prompt.styleParams.seed}</div>
                    </div>
                  )}
                </div>
                
                {prompt.styleParams.other && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-slate-700 mb-2">其他参数</div>
                    <div className="bg-slate-50 rounded-lg p-3 font-mono text-sm text-slate-600" style={{ whiteSpace: 'pre-wrap' }}>
                      {prompt.styleParams.other}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 预期效果和使用技巧 */}
            {(prompt.expectedResult || prompt.tips) && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  使用指南
                </h2>
                
                <div className="space-y-4">
                  {prompt.expectedResult && (
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2">预期效果</h3>
                      <p className="text-slate-600 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{prompt.expectedResult}</p>
                    </div>
                  )}
                  
                  {prompt.tips && (
                    <div>
                      <h3 className="font-medium text-slate-900 mb-2 flex items-center">
                        <HelpCircle className="w-4 h-4 mr-1" />
                        使用技巧
                      </h3>
                      <p className="text-slate-600 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{prompt.tips}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 示例图片 */}
            {prompt.media && prompt.media.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">示例图片</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prompt.media.map((item, index) => (
                    <div key={index} className="relative group cursor-pointer" onClick={() => {
                      if (item.type === 'image') {
                        handleImageClick(item.url, item.altText, index);
                      } else if (item.type === 'video' && item.thumbnail) {
                        // 点击视频缩略图时，创建一个临时的视频元素来播放
                        const videoElement = document.createElement('video');
                        videoElement.src = item.url;
                        videoElement.controls = true;
                        videoElement.autoplay = true;
                        videoElement.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 90vw; max-height: 90vh; z-index: 9999; background: black; border-radius: 8px;';
                        
                        const overlay = document.createElement('div');
                        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9998; display: flex; align-items: center; justify-content: center;';
                        
                        const closeBtn = document.createElement('button');
                        closeBtn.innerHTML = '✕';
                        closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; z-index: 10000;';
                        
                        const closeVideo = () => {
                          document.body.removeChild(overlay);
                          videoElement.pause();
                        };
                        
                        closeBtn.onclick = closeVideo;
                        overlay.onclick = (e) => e.target === overlay && closeVideo();
                        
                        overlay.appendChild(videoElement);
                        overlay.appendChild(closeBtn);
                        document.body.appendChild(overlay);
                      }
                    }}>
                      <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.altText || `示例 ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          // 视频类型，优先显示缩略图
                          item.thumbnail ? (
                            <div className="relative w-full h-full">
                              <img
                                src={item.thumbnail}
                                alt={item.altText || `视频缩略图 ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              {/* 播放按钮覆盖层 */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )
                        )}
                      </div>
                      
                      {/* ATL标识 - 支持图片和视频 */}
                      <AltTextBadge 
                        altText={item.altText}
                        onShow={(e) => {
                          e.stopPropagation();
                          handleShowAltText(item.altText, item.url, item.type);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 标签 */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  标签
                </h2>
                
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`/prompts?tags=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 评论区 */}
            <CommentSection 
              promptId={id}
            />
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 操作按钮 */}
            <div className="card p-6">
              <div className="space-y-3">
                <button
                  onClick={handleLike}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    isLiked 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? '已点赞' : '点赞'} ({likesCount})
                </button>
                
                <button
                  onClick={handleBookmark}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    isBookmarked 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? '已收藏' : '收藏'}
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  分享
                </button>
                
                <CopyToClipboard text={prompt.fullPrompt} onCopy={handleCopy}>
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
                    <Copy className="w-4 h-4 mr-2" />
                    复制提示词
                  </button>
                </CopyToClipboard>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                统计信息
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">浏览次数</span>
                  <span className="font-medium">{prompt.views || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">点赞数</span>
                  <span className="font-medium">{likesCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">复制次数</span>
                  <span className="font-medium">{copyCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">评论数</span>
                  <span className="font-medium">{prompt.commentsCount || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">分类</span>
                  <span className="font-medium">{t(`createPrompt.categories.${prompt.category}`)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">难度</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(prompt.difficulty)}`}>
                    {t(`createPrompt.difficulty.${prompt.difficulty}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Prompts */}
            <RelatedPrompts promptId={id} category={prompt.category} tags={prompt.tags} />

            {/* 举报按钮 */}
            {user && user._id !== prompt.author._id && (
              <div className="card p-6">
                <button className="w-full flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Flag className="w-4 h-4 mr-2" />
                  举报内容
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 分享卡片弹窗 */}
      <ShareCard
        isOpen={isShareCardOpen}
        onClose={() => setIsShareCardOpen(false)}
        post={{
          ...prompt,
          author: prompt.author,
          media: prompt.media || [],
          likesCount: likesCount,
          viewsCount: prompt.views
        }}
        user={user}
      />
      
      {/* ATL文本弹窗 */}
      <AltTextModal
        isOpen={showAltModal}
        onClose={handleCloseAltModal}
        altText={selectedAltText}
        imageUrl={selectedImageUrl}
        mediaType={selectedMediaType}
      />
      
      {/* 图片放大弹窗 */}
      {prompt && prompt.media && (
        <ImageLightbox
          isOpen={showImageLightbox}
          onClose={handleCloseLightbox}
          imageUrl={lightboxImageUrl}
          altText={lightboxImageAlt}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
          showNavigation={prompt.media.filter(item => item.type === 'image').length > 1}
        />
      )}
    </div>
  );
};

export default PromptDetail;