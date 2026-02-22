import React from 'react';
import { motion } from 'framer-motion';
import { Edit3 } from 'lucide-react';
import PostCard from '../../Post/PostCard';
import Pagination from '../../UI/Pagination';
import { ANIMATION_CONFIG } from '../../../utils/dashboard/dashboardConstants';
import { getAnimationDelay } from '../../../utils/dashboard/dashboardHelpers';
import { useTranslation } from 'react-i18next';

const PostsTab = ({ 
  posts, 
  viewMode, 
  onEditPost, 
  editingPost, 
  loading,
  pagination,
  onPageChange
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <motion.div
        initial={ANIMATION_CONFIG.INITIAL}
        animate={ANIMATION_CONFIG.ANIMATE}
        transition={ANIMATION_CONFIG.TRANSITION}
        className="text-center py-12"
      >
        <div className="text-slate-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {t('dashboard.posts.empty.title')}
        </h3>
        <p className="text-slate-500 mb-6">
          {t('dashboard.posts.empty.description')}
        </p>
        <a
          href="/create"
          className="btn btn-primary"
        >
          {t('dashboard.posts.empty.action')}
        </a>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 作品列表 */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        {posts.map((post, index) => (
          <motion.div
            key={post._id}
            initial={ANIMATION_CONFIG.INITIAL}
            animate={ANIMATION_CONFIG.ANIMATE}
            transition={{
              ...ANIMATION_CONFIG.TRANSITION,
              delay: getAnimationDelay(index)
            }}
            className="relative group"
          >
            {/* 编辑按钮覆盖层 */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => onEditPost(post)}
                disabled={editingPost === post._id}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50"
                title={t('dashboard.posts.edit')}
              >
                <Edit3 className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            
            {/* 作品卡片 */}
            <PostCard 
              post={post} 
              viewMode={viewMode}
              showActions={false}
              className="h-full"
            />
          </motion.div>
        ))}
      </div>

      {/* 分页组件 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={12}
            onPageChange={onPageChange}
            showInfo={true}
          />
        </div>
      )}

      {/* 分页加载状态 */}
      {pagination && pagination.loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-slate-600">{t('common.loading')}</span>
        </div>
      )}
    </div>
  );
};

export default PostsTab;