import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Bookmark, 
  Copy, 
  Eye, 
  MessageCircle, 
  Calendar, 
  Star,
  ExternalLink
} from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { promptAPI } from '../services/enhancedApi';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';

const PromptCard = ({ prompt, viewMode = 'grid', compact = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(prompt.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(prompt.isFavorited || false);
  const [likesCount, setLikesCount] = useState(prompt.likesCount || 0);
  const [copyCount, setCopyCount] = useState(prompt.copyCount || 0);


  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error(t('common.loginRequired'));
      return;
    }

    try {
      const response = await promptAPI.toggleLike(prompt._id);
      const { isLiked: newIsLiked, likesCount: newLikesCount, message } = response.data;
      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);
      toast.success(message);
    } catch (error) {
      console.error('点赞操作失败:', error);
      toast.error(t('common.operationFailed'));
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error(t('common.loginRequired'));
      return;
    }

    try {
      const response = await promptAPI.toggleBookmark(prompt._id);
      const { isFavorited: newIsFavorited, message } = response.data;
      setIsBookmarked(newIsFavorited);
      toast.success(message);
    } catch (error) {
      console.error('收藏操作失败:', error);
      toast.error(t('common.operationFailed'));
    }
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await promptAPI.copyPrompt(prompt._id);
      setCopyCount(prev => prev + 1);
      toast.success(t('common.promptCopied'));
    } catch (error) {
      toast.error(t('common.copyFailed'));
    }
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

  const truncatePrompt = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (viewMode === 'list' && !compact) {
    return (
      <Link to={`/prompt/${prompt._id}`} className="block">
        <div className="card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <div className="flex items-start space-x-4">
            {/* 左侧：示例图片 */}
            {prompt.media && prompt.media.length > 0 && (
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100">
                  {prompt.media[0].type === 'image' ? (
                    <img
                      src={prompt.media[0].thumbnail || prompt.media[0].url}
                      alt={prompt.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // 视频类型，优先显示缩略图
                    prompt.media[0].thumbnail ? (
                      <img
                        src={prompt.media[0].thumbnail}
                        alt={prompt.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ExternalLink className="w-6 h-6" />
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* 中间：内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(prompt.category)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(prompt.difficulty)}`}>
                    {t(`createPrompt.difficulty.${prompt.difficulty}`)}
                  </span>
                  {prompt.isFeatured && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      精选
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-1">
                {prompt.title}
              </h3>

              {prompt.description && (
                <p className="text-slate-600 text-sm mb-3 line-clamp-2" style={{ whiteSpace: 'pre-wrap' }}>
                  {prompt.description}
                </p>
              )}

              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <p className="font-mono text-sm text-slate-700 line-clamp-2" style={{ whiteSpace: 'pre-wrap' }}>
                  {truncatePrompt(prompt.prompt, 150)}
                </p>
              </div>

              {/* 标签 */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {prompt.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      #{tag}
                    </span>
                  ))}
                  {prompt.tags.length > 3 && (
                    <span className="text-xs text-slate-500">+{prompt.tags.length - 3}</span>
                  )}
                </div>
              )}

              {/* 作者和时间 */}
              <div className="flex items-center text-sm text-slate-500">
                <UserAvatar user={prompt.author} size="xs" />
                <span className="ml-2">{prompt.author.username}</span>
                <span className="mx-2">·</span>
                <Calendar className="w-4 h-4 mr-1" />
                <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* 右侧：操作按钮和统计 */}
            <div className="flex-shrink-0 flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-lg transition-colors ${
                    isLiked 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked 
                      ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="text-right text-sm text-slate-500 space-y-1">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {prompt.views || 0}
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {likesCount}
                </div>
                <div className="flex items-center">
                  <Copy className="w-4 h-4 mr-1" />
                  {copyCount}
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {prompt.commentsCount || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid view (default)
  return (
    <Link to={`/prompt/${prompt._id}`} className="block group">
      <div className={`card overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${
        compact ? 'h-full' : ''
      }`}>
        {/* 示例图片 */}
        {prompt.media && prompt.media.length > 0 && (
          <div className="relative aspect-video bg-slate-100 overflow-hidden">
            {prompt.media[0].type === 'image' ? (
              <img
                src={prompt.media[0].thumbnail || prompt.media[0].url}
                alt={prompt.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              // 视频类型，优先显示缩略图
              prompt.media[0].thumbnail ? (
                <img
                  src={prompt.media[0].thumbnail}
                  alt={prompt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ExternalLink className="w-8 h-8" />
                </div>
              )
            )}
            
            {/* 悬浮操作按钮 */}
            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleLike}
                className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
                  isLiked 
                    ? 'bg-red-500/90 text-white' 
                    : 'bg-white/90 text-slate-600 hover:bg-white'
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={handleBookmark}
                className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
                  isBookmarked 
                    ? 'bg-yellow-500/90 text-white' 
                    : 'bg-white/90 text-slate-600 hover:bg-white'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              
              <CopyToClipboard text={prompt.prompt} onCopy={handleCopy}>
                <button className="p-1.5 bg-primary-500/90 text-white hover:bg-primary-600/90 rounded-lg backdrop-blur-sm transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
              </CopyToClipboard>
            </div>

            {/* 左上角标签 */}
            <div className="absolute top-2 left-2 flex space-x-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getDifficultyColor(prompt.difficulty)}`}>
                {t(`createPrompt.difficulty.${prompt.difficulty}`)}
              </span>
              {prompt.isFeatured && (
                <span className="bg-yellow-500/90 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center backdrop-blur-sm">
                  <Star className="w-3 h-3 mr-1" />
                  精选
                </span>
              )}
            </div>
          </div>
        )}

        <div className={compact ? 'p-4' : 'p-6'}>
          {/* 分类图标和标题 */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getCategoryIcon(prompt.category)}</span>
              {!prompt.media && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(prompt.difficulty)}`}>
                  {t(`createPrompt.difficulty.${prompt.difficulty}`)}
                </span>
              )}
            </div>
            
            {!prompt.media && prompt.isFeatured && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <Star className="w-3 h-3 mr-1" />
                精选
              </span>
            )}
          </div>

          <h3 className={`font-semibold text-slate-900 mb-2 line-clamp-2 ${
            compact ? 'text-base' : 'text-lg'
          }`}>
            {prompt.title}
          </h3>

          {prompt.description && !compact && (
            <p className="text-slate-600 text-sm mb-3 line-clamp-2" style={{ whiteSpace: 'pre-wrap' }}>
              {prompt.description}
            </p>
          )}

          {/* 提示词预览 */}
          <div className="bg-slate-50 rounded-lg p-3 mb-3">
            <p className="font-mono text-xs text-slate-700 line-clamp-2" style={{ whiteSpace: 'pre-wrap' }}>
              {truncatePrompt(prompt.prompt, compact ? 80 : 120)}
            </p>
          </div>

          {/* 标签 */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {prompt.tags.slice(0, compact ? 2 : 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  #{tag}
                </span>
              ))}
              {prompt.tags.length > (compact ? 2 : 3) && (
                <span className="text-xs text-slate-500">+{prompt.tags.length - (compact ? 2 : 3)}</span>
              )}
            </div>
          )}

          {/* 底部信息 */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="flex items-center text-sm text-slate-500">
              <UserAvatar user={prompt.author} size="xs" />
              <span className="ml-2 truncate">{prompt.author.username}</span>
            </div>

            <div className="flex items-center space-x-3 text-sm text-slate-500">
              <div className="flex items-center">
                <Heart className="w-3 h-3 mr-1" />
                {likesCount}
              </div>
              <div className="flex items-center">
                <Copy className="w-3 h-3 mr-1" />
                {copyCount}
              </div>
              {!compact && (
                <div className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {prompt.views || 0}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PromptCard;