import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, Share2, Copy, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

import { promptAPI } from '../../services/enhancedApi';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar } from '../../utils/avatarUtils';
import './LiblibPromptCard.css';

const LiblibPromptCard = ({ prompt }) => {
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(prompt?.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(prompt?.isFavorited || false);
  const [likesCount, setLikesCount] = useState(() => {
    const rawLikes = prompt?.likesCount || 0;
    const parsedLikes = Number(rawLikes);
    return (isNaN(parsedLikes) || !isFinite(parsedLikes) || parsedLikes < 0) ? 0 : Math.floor(parsedLikes);
  });
  const [copyCount, setCopyCount] = useState(prompt?.copyCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login first');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    const wasLiked = isLiked;
    
    // 乐观更新UI
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      const response = await promptAPI.toggleLike(prompt._id);
      const { isLiked: newIsLiked, likesCount: newLikesCount, message } = response.data;
      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);
      toast.success(message);
    } catch (error) {
      // 回滚UI状态
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
      toast.error('Operation failed, please try again');
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login first');
      return;
    }

    try {
      const response = await promptAPI.toggleBookmark(prompt._id);
      const { isFavorited: newIsFavorited, message } = response.data;
      setIsBookmarked(newIsFavorited);
      toast.success(message);
    } catch (error) {
      toast.error('Operation failed, please try again');
    }
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // 复制提示词内容到剪贴板
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(prompt.prompt);
      } else {
        fallbackCopyTextToClipboard(prompt.prompt);
      }
      
      // 更新复制计数
      await promptAPI.copyPrompt(prompt._id);
      setCopyCount(prev => prev + 1);
      toast.success('Prompt copied!');
    } catch (error) {
      toast.error('Copy failed');
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const promptUrl = `${window.location.origin}/prompt/${prompt._id}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(promptUrl).then(() => {
        toast.success('Link copied!');
      }).catch(() => {
        fallbackCopyTextToClipboard(promptUrl);
      });
    } else {
      fallbackCopyTextToClipboard(promptUrl);
    }
  };
  
  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      toast.success('Copied!');
    } catch (err) {
      toast.error('Copy failed');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  // 获取难度等级颜色
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-white';
      case 'intermediate': return 'bg-yellow-500/20 text-white';
      case 'advanced': return 'bg-red-500/20 text-white';
      default: return 'bg-gray-500/20 text-white';
    }
  };

  // 获取分类图标
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

  // 获取主要图片
  const getMainImage = () => {
    if (prompt?.media && prompt.media.length > 0) {
      const media = prompt.media[0];
      return media.thumbnail || media.url;
    }
    return null;
  };



  const mainImage = getMainImage();
  const authorAvatar = getUserAvatar(prompt?.author);

  return (
    <motion.div
      className="liblib-prompt-card group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/prompt/${prompt._id}`} className="liblib-prompt-card__link">
        {/* 主要图片区域 (90%高度) */}
        <div className="liblib-prompt-card__image-container">
          {mainImage ? (
            <img
              src={mainImage}
              alt={prompt.title}
              className="liblib-prompt-card__image"
              loading="lazy"
            />
          ) : (
            <div className="liblib-prompt-card__placeholder">
              <div className="liblib-prompt-card__placeholder-icon">
                {getCategoryIcon(prompt.category)}
              </div>
              <div className="liblib-prompt-card__placeholder-text">
                {prompt.category || 'Prompt'}
              </div>
            </div>
          )}
          
          {/* 左上角标签 */}
          <div className="liblib-prompt-card__tags">
            <span className="liblib-prompt-card__prompt-tag">
              PROMPT
            </span>
            {prompt.difficulty && (
              <span className={`liblib-prompt-card__difficulty-tag ${getDifficultyColor(prompt.difficulty)}`}>
                {prompt.difficulty.toUpperCase()}
              </span>
            )}
          </div>

          {/* 悬浮操作按钮 */}
          <div className="liblib-prompt-card__actions">
            <button
              onClick={handleShare}
              className="liblib-prompt-card__action-btn"
              title="分享"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* 底部渐变遮罩 */}
          <div className="liblib-prompt-card__gradient" />

          {/* 统计信息 */}
          <div className="liblib-prompt-card__stats">
            <div className="liblib-prompt-card__stat-item">
              <Heart 
                className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : 'text-white'}`} 
              />
              <span>{likesCount}</span>
            </div>
            <div className="liblib-prompt-card__stat-item">
              <Eye className="w-4 h-4 text-white" />
              <span>{prompt.views || 0}</span>
            </div>
            <div className="liblib-prompt-card__stat-item">
              <Copy className="w-4 h-4 text-white" />
              <span>{copyCount}</span>
            </div>
          </div>
        </div>

        {/* 底部内容区域 (10%高度) */}
        <div className="liblib-prompt-card__content">
          {/* 标题 */}
          <h3 className="text-sm font-medium text-slate-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors duration-200">
            {prompt?.title || '无标题'}
          </h3>
          
          {/* 作者信息 */}
          <div className="flex items-center">
            <img
              src={authorAvatar}
              alt={prompt?.author?.username || '用户头像'}
              className="w-4 h-4 rounded-full object-cover border border-slate-200 mr-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/user/${prompt?.author?._id || prompt?.author?.id}`;
              }}
              onError={(e) => {
                e.target.src = '/Circle/01.png';
              }}
            />
            <span className="text-xs text-slate-600 truncate">
              {String(prompt?.author?.username || '匿名用户')}
            </span>
          </div>
        </div>
      </Link>

      {/* 交互按钮层 */}
      <div className="liblib-prompt-card__interaction">
        <button
          onClick={handleLike}
          className={`liblib-prompt-card__like-btn ${
            isLiked ? 'liblib-prompt-card__like-btn--active' : ''
          }`}
          disabled={isLiking}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
        
        <button
          onClick={handleBookmark}
          className={`liblib-prompt-card__bookmark-btn ${
            isBookmarked ? 'liblib-prompt-card__bookmark-btn--active' : ''
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
        
        <button
          onClick={handleCopy}
          className="liblib-prompt-card__copy-btn"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default LiblibPromptCard;