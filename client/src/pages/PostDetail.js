import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Heart, 
  Share2, 
  Copy, 
  Eye,
  Calendar,
  User,
  Tag,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import RelatedPosts from '../components/RelatedPosts';
import FollowButton from '../components/UI/FollowButton';
import CommentSection from '../components/Post/CommentSection';
import ShareCard from '../components/UI/ShareCard';
import { useAuth } from '../contexts/AuthContext';
import { enhancedPostAPI, enhancedUserAPI } from '../services/enhancedApi';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../utils/avatarUtils';

const PostDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [error, setError] = useState(null);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // 获取帖子详情 - 优化版本
  const fetchPost = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await enhancedPostAPI.getPost(id);
      setPost(response.data.post);
      
      // 检查当前用户是否已点赞
      if (user && response.data.post.likes) {
        setIsLiked(response.data.post.likes.some(like => like.user === user.id));
      }
      
      // 使用Promise.allSettled并行处理用户相关请求
      if (user) {
        const userRequests = [
          enhancedUserAPI.getProfile(user.id), // 检查收藏状态
        ];
        
        // 如果有作者信息，添加作者请求
        if (response.data.post.author) {
          userRequests.push(enhancedUserAPI.getProfile(response.data.post.author._id));
        }
        
        const results = await Promise.allSettled(userRequests);
        
        // 处理用户收藏状态
        if (results[0].status === 'fulfilled') {
          setIsFavorited(results[0].value.data.user.favorites?.includes(id));
        } else {
          console.error('Failed to check favorite status:', results[0].reason);
        }
        
        // 处理作者信息
        if (results[1] && results[1].status === 'fulfilled') {
          setIsFollowing(results[1].value.data.user.isFollowing || false);
          setFollowersCount(results[1].value.data.user.followers?.length || 0);
        } else if (results[1]) {
          console.error('Failed to load author info:', results[1].reason);
        }
      }
    } catch (error) {
      console.error('Failed to load post details:', error);
      // 如果是429错误，显示特殊提示
      if (error.response?.status === 429) {
        setError(t('error.rateLimitExceeded'));
      } else {
        setError(t('error.loadPostFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, user, t]); // 依赖id、user对象和t函数

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (isLiking) {
      return; // 防止重复点击
    }
    
    try {
      setIsLiking(true);
      const response = await enhancedPostAPI.likePost(id);
      setPost(prev => ({
        ...prev,
        likes: response.data.isLiked 
          ? [...(prev.likes || []), { user: user.id }]
          : (prev.likes || []).filter(like => like.user !== user.id)
      }));
      setIsLiked(response.data.isLiked);
      toast.success(response.data.isLiked ? t('postDetail.messages.likeSuccess') : t('postDetail.messages.unlikeSuccess'));
    } catch (error) {
      console.error('Like operation failed:', error);
      if (error.response?.status === 429) {
        toast.error(t('postDetail.messages.rateLimitExceeded'));
      } else {
        toast.error(t('postDetail.messages.likeFailed'));
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    setIsShareCardOpen(true);
  };

  // 图片放大功能
  const handleImageClick = (index) => {
    if (post.media[index].type === 'image') {
      setLightboxImageIndex(index);
      setShowImageLightbox(true);
    }
  };

  const handleCloseLightbox = () => {
    setShowImageLightbox(false);
  };

  const handlePrevImage = () => {
    const imageIndices = post.media.map((media, index) => media.type === 'image' ? index : null).filter(index => index !== null);
    const currentImageIndex = imageIndices.indexOf(lightboxImageIndex);
    const prevIndex = currentImageIndex > 0 ? currentImageIndex - 1 : imageIndices.length - 1;
    setLightboxImageIndex(imageIndices[prevIndex]);
  };

  const handleNextImage = () => {
    const imageIndices = post.media.map((media, index) => media.type === 'image' ? index : null).filter(index => index !== null);
    const currentImageIndex = imageIndices.indexOf(lightboxImageIndex);
    const nextIndex = currentImageIndex < imageIndices.length - 1 ? currentImageIndex + 1 : 0;
    setLightboxImageIndex(imageIndices[nextIndex]);
  };

  // ImageLightbox 组件
  const ImageLightbox = ({ isOpen, imageUrl, imageAlt, onClose, onPrev, onNext, showNavigation }) => {
    if (!isOpen) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
          <img 
            src={imageUrl} 
            alt={imageAlt} 
            className="max-w-full max-h-[90vh] object-contain"
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



  useEffect(() => {
    let isMounted = true;
    
    const loadPost = async () => {
      if (id && isMounted) {
        await fetchPost();
      }
    };
    
    loadPost();
    
    return () => {
      isMounted = false;
    };
  }, [id, fetchPost]); // 添加fetchPost依赖

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
    if (styleParams.videoVersion) params.push(`--video ${styleParams.videoVersion}`);
    if (styleParams.quality) params.push(`--q ${styleParams.quality}`);
    if (styleParams.seed) params.push(`--seed ${styleParams.seed}`);
    if (styleParams.other) params.push(styleParams.other);
    
    return params.join(' ');
  };

  const styleParamsString = getStyleParamsString();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('postDetail.error.loadFailed')}</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button onClick={() => fetchPost()} className="btn btn-primary">
            {t('postDetail.actions.reload')}
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('postDetail.error.notFound')}</h2>
          <p className="text-slate-600 mb-4">{t('postDetail.error.notFoundDesc')}</p>
          <Link to="/" className="btn btn-primary">
            {t('postDetail.actions.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <Link
          to="/"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('postDetail.actions.backToHome')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容区域 */}
          <div className="lg:col-span-2">
            {/* 媒体展示 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="card overflow-hidden mb-6"
            >
              {/* 主要媒体显示 */}
              <div className={post.media[selectedImageIndex].type === 'video' ? 'flex justify-center bg-black' : 'aspect-video'}>
                {post.media[selectedImageIndex].type === 'video' ? (
                  <video
                    src={post.media[selectedImageIndex].url}
                    controls
                    className="max-w-full max-h-[70vh] w-auto h-auto"
                    preload="metadata"
                    style={{ objectFit: 'contain' }}
                  >
                    {t('postDetail.media.videoNotSupported')}
                  </video>
                ) : (
                  <img
                    src={post.media[selectedImageIndex].url}
                    alt={post.title}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(selectedImageIndex)}
                  />
                )}
              </div>
              
              {/* 多媒体缩略图导航 */}
              {post.media && post.media.length > 1 && (
                <div className="p-4 bg-slate-50 border-t">
                  <div className="flex space-x-2 overflow-x-auto">
                    {post.media.map((media, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedImageIndex === index 
                            ? 'border-primary-500 ring-2 ring-primary-200' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {media.type === 'video' ? (
                          <div className="w-full h-full bg-black flex items-center justify-center">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-0.5"></div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={media.url}
                            alt={t('postDetail.media.mediaAlt', { index: index + 1 })}
                            className="w-full h-full object-cover"
                            onDoubleClick={() => handleImageClick(index)}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-center mt-2 text-sm text-slate-500">
                    {selectedImageIndex + 1} / {post.media.length}
                  </div>
                </div>
              )}
            </motion.div>

            {/* 作品信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6 mb-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {post.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{t('postDetail.stats.views', { count: post.views })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isLiked 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
                    <span>{post.likes?.length || 0}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{t('postDetail.actions.share')}</span>
                  </button>
                </div>
              </div>

              {/* 描述 */}
              {post.description && (
                <p className="text-slate-700 leading-relaxed mb-6">
                  {post.description}
                </p>
              )}

              {/* 风格参数 */}
              {styleParamsString && (
                <div className="relative mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    {t('postDetail.styleParams.title')}
                  </h3>
                  <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-slate-700 border-l-4 border-primary-500 pr-12">
                    {styleParamsString}
                  </div>
                  <CopyToClipboard 
                    text={styleParamsString} 
                    onCopy={() => toast.success(t('postDetail.messages.paramsCopied'))}
                  >
                    <button className="absolute top-10 right-3 w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-slate-700 shadow-sm transition-colors duration-200">
                      <Copy className="w-4 h-4" />
                    </button>
                  </CopyToClipboard>
                </div>
              )}

              {/* 标签 */}
              {post.tags && post.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    {t('postDetail.tags.title')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/?tag=${tag}`}
                        className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium hover:bg-primary-100 transition-colors duration-200"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* 评论区域 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card p-6"
            >
              <CommentSection 
                postId={id} 
                comments={post.comments || []} 
                onCommentAdded={(newComment) => {
                  setPost(prev => ({
                    ...prev,
                    comments: [...(prev.comments || []), newComment]
                  }));
                }}
              />
            </motion.div>
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            {/* 作者信息 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                {t('postDetail.author.title')}
              </h3>
              
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src={getUserAvatar(post.author)} 
                  alt={post.author.username}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = DEFAULT_FALLBACK_AVATAR;
                  }}
                />
                <div>
                  <Link
                    to={`/user/${post.author._id}`}
                    className="font-medium text-slate-900 hover:text-primary-600 transition-colors duration-200"
                  >
                    {post.author.username}
                  </Link>
                  {post.author.bio && (
                    <p className="text-sm text-slate-500">{post.author.bio}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="w-full">
                  <FollowButton 
                    userId={post.author._id}
                    isFollowing={isFollowing}
                    followersCount={followersCount}
                    size="md"
                    variant="primary"
                  />
                </div>
                
                <button 
                  onClick={async () => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    
                    try {
                      const response = await enhancedUserAPI.toggleFavorite(id);
                      setIsFavorited(response.data.isFavorited);
                      toast.success(response.data.isFavorited ? t('postDetail.messages.favoriteAdded') : t('postDetail.messages.favoriteRemoved'));
                    } catch (error) {
                      console.error('Favorite operation failed:', error);
                      toast.error(t('postDetail.messages.favoriteFailed'));
                    }
                  }}
                  className={`w-full btn ${
                    isFavorited 
                      ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100' 
                      : 'btn-outline'
                  }`}
                >
                  {isFavorited ? t('postDetail.actions.favorited') : t('postDetail.actions.favorite')}
                </button>
              </div>
            </motion.div>

            {/* 相关作品 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {t('postDetail.relatedPosts.title')}
              </h3>
              
              <RelatedPosts currentPostId={id} authorId={post.author._id} />
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* 分享卡片弹窗 */}
      <ShareCard
        isOpen={isShareCardOpen}
        onClose={() => setIsShareCardOpen(false)}
        post={post}
        user={user}
      />
      
      {/* 图片放大弹窗 */}
      {post && post.media && (
        <ImageLightbox
          isOpen={showImageLightbox}
          imageUrl={post.media[lightboxImageIndex]?.url}
          imageAlt={post.title}
          onClose={handleCloseLightbox}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
          showNavigation={post.media.filter(media => media.type === 'image').length > 1}
        />
      )}
    </div>
  );
};

export default PostDetail;