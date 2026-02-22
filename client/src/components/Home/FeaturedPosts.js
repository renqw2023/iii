import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { enhancedPostAPI } from '../../services/enhancedApi';
import LoadingSpinner from '../UI/LoadingSpinner';
import { APP_CONFIG } from '../../config/constants';

const FeaturedPosts = () => {
  const { t } = useTranslation();
  
  // 获取精选帖子数据
  const { data: featuredData, isLoading, error } = useQuery(
    'featuredPosts',
    () => enhancedPostAPI.getFeaturedPosts(),
    {
      staleTime: APP_CONFIG.CACHE.FEATURED_POSTS_STALE_TIME,
    }
  );

  // 使用真实数据，并确保数据格式正确
  const rawPosts = featuredData?.data?.posts || [];
  const featuredPosts = Array.isArray(rawPosts) ? rawPosts.filter(post => post && typeof post === 'object') : [];

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !featuredPosts || featuredPosts.length === 0) {
    return null; // 如果没有精选内容就不显示这个区域
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-yellow-500 mr-2" />
            <h2 className="text-3xl font-bold text-slate-900">{t('home.featured.title')}</h2>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t('home.featured.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredPosts.map((post, index) => {
            // 验证post对象的有效性
            if (!post || typeof post !== 'object') {
              return null;
            }

            // 安全地获取作者信息
            const authorName = typeof post.author === 'string' 
              ? post.author 
              : (post.author?.username || t('common.anonymousUser'));
            
            const authorInitial = String(authorName).charAt(0).toUpperCase() || 'U';
            
            // 安全地获取样式参数
            const getStyleParamsText = () => {
              if (typeof post.styleParams === 'string') {
                return post.styleParams;
              }
              
              if (typeof post.getStyleParamsString === 'function') {
                return post.getStyleParamsString();
              }
              
              if (post.styleParams && typeof post.styleParams === 'object') {
                const sref = post.styleParams.sref;
                if (sref !== null && sref !== undefined && sref !== '') {
                  return `--sref ${String(sref)}`;
                }
              }
              
              return '--sref unknown';
            };
            
            const styleParamsText = getStyleParamsText();

            // 安全地获取标题
            const title = String(post.title || t('common.noTitle'));
            
            // 安全地获取图片URL，对于视频使用缩略图
            const firstMedia = post.media?.[0];
            let imageUrl = post.image || '';
            
            if (firstMedia) {
              if (firstMedia.type === 'video' && firstMedia.thumbnail) {
                // 视频文件使用缩略图
                imageUrl = firstMedia.thumbnail;
              } else {
                // 图片文件或没有缩略图的视频使用原文件
                imageUrl = firstMedia.url;
              }
            }
            
            // 安全地获取点赞数，确保不是NaN
            const rawLikes = post.likesCount || post.likes || 0;
            let likesCount = 0;
            try {
              const parsedLikes = Number(rawLikes);
              if (!isNaN(parsedLikes) && isFinite(parsedLikes) && parsedLikes >= 0) {
                likesCount = Math.floor(parsedLikes);
              }
            } catch (error) {
              likesCount = 0;
            }

            return (
              <Link
                key={`featured-post-${post._id || post.id || index}`}
                to={`/post/${post._id || post.id}`}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (typeof index === 'number' && !isNaN(index) ? index : 0) * 0.1 }}
                  className="card overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative overflow-hidden">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                      {title}
                    </h3>
                    
                    <div className="bg-slate-50 rounded-lg p-3 mb-4 font-mono text-sm text-slate-700 border-l-4 border-primary-500">
                      {String(styleParamsText)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {authorInitial}
                        </div>
                        <span className="text-slate-600 text-sm">
                          {String(authorName)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-slate-500">
                        <Star className="w-4 h-4 fill-current text-yellow-500" />
                        <span className="text-sm">{String(likesCount || 0)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          }).filter(Boolean)}
        </div>

        <div className="text-center">
          <Link
            to="/explore"
            className="btn btn-primary group"
          >
            {t('home.featured.viewMore')}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPosts;