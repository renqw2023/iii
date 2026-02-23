import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, Clock, Heart, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PostCard from '../components/Post/PostCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Pagination from '../components/UI/Pagination';
import { enhancedPostAPI } from '../services/enhancedApi';
import { APP_CONFIG } from '../config/constants';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../utils/avatarUtils';

const Explore = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [viewMode, setViewMode] = useState('grid');
  const [timeRange, setTimeRange] = useState('week');
  const [page, setPage] = useState(1);

  // 获取帖子数据
  const { data: postsData, isLoading, error: _error } = useQuery( // error暂未使用
    ['explore-posts', { page, sort: sortBy, category, search: searchTerm, timeRange }],
    () => {
      const params = {
        page,
        limit: APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
        sort: sortBy === 'trending' ? 'views' : sortBy === 'latest' ? 'createdAt' : sortBy === 'popular' ? 'likes' : 'views',
        order: 'desc'
      };
      
      if (category !== 'all') {
        params.tag = category;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      return enhancedPostAPI.getPosts(params);
    },
    {
      keepPreviousData: true,
      staleTime: APP_CONFIG.CACHE.POSTS_STALE_TIME,
    }
  );

  // 获取热门标签作为分类
  const { data: tagsData } = useQuery(
    'explore-categories',
    () => enhancedPostAPI.getPopularTags(),
    {
      staleTime: APP_CONFIG.CACHE.TAGS_STALE_TIME,
    }
  );

  // 处理分类数据
  const categories = [
    { id: 'all', name: t('explore.filters.all'), count: 0 },
    ...(tagsData?.data?.tags?.map(tag => ({
      id: tag.name,
      name: tag.name,
      count: tag.count
    })) || APP_CONFIG.DEFAULT_CATEGORIES.slice(1))
  ];

  // 使用真实数据
  const posts = postsData?.data?.posts || [];
  const pagination = postsData?.data?.pagination || { current: 1, pages: 1, total: 0 };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // 重置到第一页
  };

  // const handleCategoryChange = (newCategory) => { // 暂未使用
  //   setCategory(newCategory);
  //   setPage(1);
  // };

  // const handleSortChange = (newSort) => { // 暂未使用
  //   setSortBy(newSort);
  //   setPage(1);
  // };

  // const handleTimeRangeChange = (newTimeRange) => { // 暂未使用
  //   setTimeRange(newTimeRange);
  //   setPage(1);
  // };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {t('explore.title')}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('explore.subtitle')}
          </p>
        </motion.div>

        {/* 搜索和Filter区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card p-6 mb-8"
        >
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl mx-auto flex">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('explore.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-12 pr-4 w-full text-lg rounded-r-none"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary rounded-l-none px-6 text-lg"
              >
                {t('explore.searchButton')}
              </button>
            </div>
          </form>

          {/* Filter选项 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* 分类Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="select py-2 px-3 text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* 排序方式 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select py-2 px-3 text-sm"
              >
                <option value="trending">{t('explore.filters.trending')}</option>
                <option value="latest">{t('explore.filters.latest')}</option>
                <option value="popular">{t('explore.filters.popular')}</option>
                <option value="views">{t('explore.filters.views')}</option>
              </select>

              {/* 时间范围 */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="select py-2 px-3 text-sm"
              >
                <option value="day">{t('explore.filters.today')}</option>
                <option value="week">{t('explore.filters.thisWeek')}</option>
                <option value="month">{t('explore.filters.thisMonth')}</option>
                <option value="year">{t('explore.filters.thisYear')}</option>
                <option value="all">{t('explore.filters.all')}</option>
              </select>
            </div>

            {/* 视图切换 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* 内容区域 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="card p-6"
                  >
                    <div className="flex gap-6">
                      <div className="w-48 h-32 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {(() => {
                          const firstMedia = post.media?.[0];
                          let imageUrl = '';
                          
                          if (firstMedia) {
                            if (firstMedia.type === 'video' && firstMedia.thumbnail) {
                              imageUrl = firstMedia.thumbnail;
                            } else {
                              imageUrl = firstMedia.url;
                            }
                          }
                          
                          return (
                            <img
                              src={imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          {post.title}
                        </h3>
                        <p className="text-slate-600 mb-3 line-clamp-2">
                          {post.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{post.likesCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{post.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{t('time.hoursAgo', { count: 2 })}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={getUserAvatar(post.author)} 
                              alt={post.author.username}
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = DEFAULT_FALLBACK_AVATAR;
                              }}
                            />
                            <span className="text-sm text-slate-600">
                              {post.author.username}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* 分页组件 */}
            {!isLoading && posts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-12"
              >
                <Pagination
                  currentPage={pagination.current}
                  totalPages={pagination.pages}
                  totalItems={pagination.total}
                  itemsPerPage={APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE}
                  onPageChange={handlePageChange}
                  className="justify-center"
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Explore;