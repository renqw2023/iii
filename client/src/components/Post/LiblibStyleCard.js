import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { enhancedPostAPI } from '../../services/enhancedApi';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar } from '../../utils/avatarUtils';
import './LiblibStyleCard.css';

const LiblibStyleCard = ({ post }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [likesCount, setLikesCount] = useState(() => {
    const rawLikes = post?.likesCount || 0;
    const parsedLikes = Number(rawLikes);
    return (isNaN(parsedLikes) || !isFinite(parsedLikes) || parsedLikes < 0) ? 0 : Math.floor(parsedLikes);
  });
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error(t('postCard.errors.loginRequired'));
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    const wasLiked = isLiked;
    
    // 乐观更新UI
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      const response = await enhancedPostAPI.likePost(post._id);
      toast.success(response.data.message);
    } catch (error) {
      // 回滚UI状态
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
      toast.error(error.response?.data?.message || t('postCard.errors.operationFailed'));
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const postUrl = `${window.location.origin}/post/${post._id}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(postUrl).then(() => {
        toast.success(t('postCard.messages.linkCopied'));
      }).catch(() => {
        fallbackCopyTextToClipboard(postUrl);
      });
    } else {
      fallbackCopyTextToClipboard(postUrl);
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
      toast.success(t('postCard.messages.linkCopied'));
    } catch (err) {
      toast.error(t('postCard.errors.copyFailed') || '复制失败');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  // 生成风格参数标签
  const getStyleTag = () => {
    if (!post?.styleParams) return null;
    
    const { styleParams } = post;
    
    // 优先显示版本信息
    if (styleParams.version) {
      return `v${styleParams.version}`;
    }
    
    // 其次显示风格
    if (styleParams.style) {
      return styleParams.style;
    }
    
    // 最后显示其他参数
    if (styleParams.aspect) {
      return styleParams.aspect;
    }
    
    return 'MJ';
  };

  // 格式化数字显示
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // 验证post对象的有效性
  if (!post || typeof post !== 'object') {
    return null;
  }

  const styleTag = getStyleTag();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="liblib-card bg-white rounded-xl overflow-hidden shadow-lg group cursor-pointer"
      style={{ height: '430px' }}
    >
      <Link to={`/post/${post._id || 'unknown'}`} className="block h-full">
        {/* 主图片区域 - 占90% */}
        <div className="relative overflow-hidden" style={{ height: '370px' }}>
          {post?.media?.[0] ? (
            (() => {
              const firstMedia = post.media[0];
              let imageUrl = firstMedia.url;
              
              // 如果是视频且有缩略图，使用缩略图
              if (firstMedia.type === 'video' && firstMedia.thumbnail) {
                imageUrl = firstMedia.thumbnail;
              }
              
              return (
                <img
                  src={imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              );
            })()
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <div className="text-slate-400 text-center">
                <div className="w-16 h-16 bg-slate-300 rounded-lg mx-auto mb-2"></div>
                <p className="text-sm">{t('postCard.noImage')}</p>
              </div>
            </div>
          )}
          
          {/* 顶部风格标签 */}
          {styleTag && (
            <div className="absolute top-3 left-3">
              <div className="h-[22px] text-[12px] inline-flex items-center px-2 font-semibold whitespace-nowrap bg-black/50 rounded-full text-white backdrop-blur-sm">
                <span>{styleTag}</span>
              </div>
            </div>
          )}
          
          {/* 顶部右侧操作按钮 */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleShare}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* 底部渐变遮罩和统计信息 */}
          <div className="absolute bottom-0 left-0 right-0 h-[54px] bg-gradient-to-t from-black/80 to-transparent">
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
              {/* 左侧统计数据 */}
              <div className="flex items-center gap-3 text-white text-xs font-semibold">
                {/* 点赞数 */}
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-1 transition-colors duration-200 ${
                    isLiked ? 'text-red-400' : 'text-white hover:text-red-400'
                  } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
                  <span>{formatNumber(likesCount || 0)}</span>
                </button>
                
                {/* 浏览量 */}
                {post?.views > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(post.views)}</span>
                  </div>
                )}
                
                {/* 评论数 */}
                {post?.commentsCount > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    <span>{formatNumber(post.commentsCount)}</span>
                  </div>
                )}
              </div>
              
              {/* 右侧特殊标识 */}
              <div className="flex items-center gap-2">
                {post?.featured && (
                  <span className="text-white text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-400 px-2 py-1 rounded-full">
                    精选
                  </span>
                )}
                {post?.isOriginal && (
                  <span className="text-white text-xs font-medium">
                    原创
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 底部信息区域 - 占10% */}
        <div className="h-[60px] p-3 flex flex-col justify-center">
          {/* 标题 */}
          <h3 className="text-sm font-medium text-slate-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors duration-200">
            {post?.title || t('postCard.noTitle')}
          </h3>
          
          {/* 作者信息 */}
          <div className="flex items-center">
            <img
              src={getUserAvatar(post?.author)}
              alt={post?.author?.username || t('postCard.authorAvatar')}
              className="w-4 h-4 rounded-full object-cover border border-slate-200 mr-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/user/${post?.author?._id || post?.author?.id}`;
              }}
              onError={(e) => {
                e.target.src = '/Circle/01.png';
              }}
            />
            <span className="text-xs text-slate-600 truncate">
              {String(post?.author?.username || t('postCard.anonymousUser'))}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default LiblibStyleCard;