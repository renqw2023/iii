import React from 'react';
import { motion } from 'framer-motion';
import PostCard from '../../Post/PostCard';
import PromptCard from '../../PromptCard';
import { ANIMATION_CONFIG } from '../../../utils/dashboard/dashboardConstants';
import { getAnimationDelay } from '../../../utils/dashboard/dashboardHelpers';
import { useTranslation } from 'react-i18next';

const FavoritesTab = ({ 
  favorites, 
  favoritePrompts, 
  viewMode, 
  loading,
  activeSubTab = 'posts'
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentData = activeSubTab === 'posts' ? favorites : favoritePrompts;
  const isEmpty = currentData.length === 0;

  if (isEmpty) {
    return (
      <motion.div
        initial={ANIMATION_CONFIG.INITIAL}
        animate={ANIMATION_CONFIG.ANIMATE}
        transition={ANIMATION_CONFIG.TRANSITION}
        className="text-center py-12"
      >
        <div className="text-slate-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {activeSubTab === 'posts' 
            ? t('dashboard.favorites.posts.empty.title')
            : t('dashboard.favorites.prompts.empty.title')
          }
        </h3>
        <p className="text-slate-500 mb-6">
          {activeSubTab === 'posts' 
            ? t('dashboard.favorites.posts.empty.description')
            : t('dashboard.favorites.prompts.empty.description')
          }
        </p>
        <a
          href={activeSubTab === 'posts' ? '/explore' : '/prompts'}
          className="btn btn-primary"
        >
          {activeSubTab === 'posts' 
            ? t('dashboard.favorites.posts.empty.action')
            : t('dashboard.favorites.prompts.empty.action')
          }
        </a>
      </motion.div>
    );
  }

  return (
    <div className={
      viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'space-y-4'
    }>
      {currentData.map((item, index) => {
        const isPost = activeSubTab === 'posts';
        const content = isPost ? item.post : item.prompt;
        
        if (!content) return null;
        
        return (
          <motion.div
            key={content._id}
            initial={ANIMATION_CONFIG.INITIAL}
            animate={ANIMATION_CONFIG.ANIMATE}
            transition={{
              ...ANIMATION_CONFIG.TRANSITION,
              delay: getAnimationDelay(index)
            }}
            className="relative group"
          >
            {/* 收藏时间标签 */}
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {/* 内容卡片 */}
            {isPost ? (
              <PostCard 
                post={content} 
                viewMode={viewMode}
                showActions={true}
                className="h-full"
              />
            ) : (
              <PromptCard 
                prompt={content} 
                viewMode={viewMode}
                showActions={true}
                className="h-full"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default FavoritesTab;