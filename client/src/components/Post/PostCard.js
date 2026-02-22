import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Copy, Eye } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { enhancedPostAPI } from '../../services/enhancedApi';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar } from '../../utils/avatarUtils';

const PostCard = ({ post }) => {
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

  const handleCopyParams = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(t('postCard.messages.paramsCopied'));
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const postUrl = `${window.location.origin}/post/${post._id}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      // 使用现代 Clipboard API
      navigator.clipboard.writeText(postUrl).then(() => {
        toast.success(t('postCard.messages.linkCopied'));
      }).catch(() => {
        // 降级到传统方法
        fallbackCopyTextToClipboard(postUrl);
      });
    } else {
      // 降级到传统方法
      fallbackCopyTextToClipboard(postUrl);
    }
  };
  
  // 降级复制方法
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

  // 生成风格参数字符串
  const getStyleParamsString = () => {
    if (!post?.styleParams) return '';
    
    const params = [];
    const { styleParams } = post;
    
    if (styleParams.sref) params.push(`--sref ${styleParams.sref}`);
    if (styleParams.style) params.push(`--style ${styleParams.style}`);
    if (styleParams.stylize) params.push(`--stylize ${styleParams.stylize}`);
    if (styleParams.chaos) params.push(`--chaos ${styleParams.chaos}`);
    if (styleParams.aspect) params.push(`--ar ${styleParams.aspect}`);
    if (styleParams.version) params.push(`--v ${styleParams.version}`);
    if (styleParams.quality) params.push(`--q ${styleParams.quality}`);
    if (styleParams.seed) params.push(`--seed ${styleParams.seed}`);
    if (styleParams.other) params.push(styleParams.other);
    
    return params.join(' ');
  };

  const styleParamsString = getStyleParamsString();

  // 验证post对象的有效性
  if (!post || typeof post !== 'object') {
    return null;
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card overflow-hidden group"
    >
      <Link to={`/post/${post._id || 'unknown'}`} className="block">
        {/* 图片区域 */}
        <div className="relative overflow-hidden aspect-square">
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
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          
          {/* 悬浮操作按钮 */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleShare}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-lg"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* 浏览量 */}
          {post?.views > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1 text-white text-xs">
              <Eye className="w-3 h-3" />
              <span>{post.views}</span>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="p-4">
          {/* 标题 */}
          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
            {post?.title || t('postCard.noTitle')}
          </h3>

          {/* 风格参数 */}
          {styleParamsString && (
            <div className="relative mb-3">
              <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs text-slate-700 border-l-4 border-primary-500 pr-10">
                <div className="line-clamp-2">
                  {styleParamsString}
                </div>
              </div>
              <CopyToClipboard text={styleParamsString} onCopy={handleCopyParams}>
                <button className="absolute top-2 right-2 w-6 h-6 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-slate-700 shadow-sm">
                  <Copy className="w-3 h-3" />
                </button>
              </CopyToClipboard>
            </div>
          )}

          {/* 标签 */}
          {post?.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 作者和互动 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={getUserAvatar(post?.author)}
                alt={post?.author?.username || t('postCard.authorAvatar')}
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                onError={(e) => {
                  e.target.src = '/Circle/01.png';
                }}
              />
              <span className="text-sm text-slate-600 truncate max-w-20">
                {String(post?.author?.username || t('postCard.anonymousUser'))}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-1 text-sm transition-colors duration-200 ${
                  isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
                } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
                <span>{likesCount || 0}</span>
              </button>

              <div className="flex items-center space-x-1 text-slate-500 text-sm">
                <MessageCircle className="w-4 h-4" />
                <span>{post?.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PostCard;