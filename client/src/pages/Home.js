import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { Search, Filter, TrendingUp, Sparkles } from 'lucide-react';
import { enhancedPostAPI } from '../services/enhancedApi';
import { promptAPI } from '../services/promptApi';
import LiblibStyleCard from '../components/Post/LiblibStyleCard';
import LiblibPromptCard from '../components/Prompt/LiblibPromptCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Hero from '../components/Home/Hero';
import FeaturedPosts from '../components/Home/FeaturedPosts';

import { APP_CONFIG } from '../config/constants';
import { useHomeSEO } from '../hooks/useSEO';

const Home = () => {
  const { t } = useTranslation();
  
  // SEO配置
  useHomeSEO();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  // 优化的数据获取函数，使用useCallback缓存
  const fetchCombinedData = useCallback(async ({ pageParam = 1 }) => {
    try {
      const [postsResponse, promptsResponse] = await Promise.all([
        enhancedPostAPI.getPosts({
          page: pageParam,
          limit: APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
          sort: sortBy,
          order: 'desc',
          tag: selectedTag,
          search: searchTerm
        }),
        promptAPI.getPrompts({
          page: pageParam,
          limit: APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
          sort: sortBy,
          order: 'desc',
          tag: selectedTag,
          search: searchTerm
        })
      ]);

      const stylePosts = postsResponse?.data?.posts || [];
      const prompts = promptsResponse?.data?.prompts || [];
      
      // 为风格参数和提示词添加类型标识
      const postsWithType = stylePosts.map(post => ({ ...post, contentType: 'style' }));
      const promptsWithType = prompts.map(prompt => ({ ...prompt, contentType: 'prompt' }));
      
      // 合并数据并在页面级别排序，确保页面内容有序
      const allContent = [...postsWithType, ...promptsWithType]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || 0);
          const dateB = new Date(b.createdAt || b.created_at || 0);
          return dateB - dateA;
        });
      
      // 计算是否还有更多页面
      const hasMorePosts = postsResponse?.data?.pagination?.pages > pageParam;
      const hasMorePrompts = promptsResponse?.data?.pagination?.pages > pageParam;
      
      return {
        posts: allContent,
        nextPage: (hasMorePosts || hasMorePrompts) ? pageParam + 1 : undefined,
        currentPage: pageParam
      };
    } catch (error) {
      console.error('数据获取失败:', error);
      return {
        posts: [],
        nextPage: undefined,
        currentPage: pageParam
      };
    }
  }, [sortBy, selectedTag, searchTerm]);

  // 使用无限查询，优化缓存策略
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery(
    ['homePosts', { sort: sortBy, tag: selectedTag, search: searchTerm }],
    fetchCombinedData,
    {
      getNextPageParam: (lastPage) => lastPage.nextPage,
      staleTime: APP_CONFIG.CACHE.POSTS_STALE_TIME * 2, // 增加缓存时间
      cacheTime: APP_CONFIG.CACHE.POSTS_STALE_TIME * 4, // 设置缓存保持时间
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // 减少不必要的重新获取
      retry: 2, // 减少重试次数
      retryDelay: 1000 // 设置重试延迟
    }
  );

  // 获取热门标签
  const { data: styleTagsData } = useInfiniteQuery(
    ['stylePopularTags'],
    () => enhancedPostAPI.getPopularTags(),
    {
      staleTime: 30 * 60 * 1000, // 30分钟
      cacheTime: 60 * 60 * 1000, // 1小时
      getNextPageParam: () => undefined, // 标签不需要分页
      refetchOnWindowFocus: false
    }
  );

  const { data: promptTagsData } = useInfiniteQuery(
    ['promptPopularTags'], 
    () => promptAPI.getPopularTags(),
    {
      staleTime: 30 * 60 * 1000, // 30分钟
      cacheTime: 60 * 60 * 1000, // 1小时
      getNextPageParam: () => undefined, // 标签不需要分页
      refetchOnWindowFocus: false
    }
  );

  // 使用useMemo优化数据处理，保持页面加载顺序
  const allPosts = useMemo(() => {
    if (!data?.pages) return [];
    
    // 直接按页面顺序展开，每个页面内容已在fetchCombinedData中排序
    // 这样确保新加载的内容始终追加在末尾，不会插入中间位置
    return data.pages.flatMap(page => page.posts || []);
  }, [data]);
  
  // 使用useMemo优化标签处理
  const popularTags = useMemo(() => {
    const styleTags = styleTagsData?.pages?.[0]?.data?.tags || [];
    const promptTags = promptTagsData?.pages?.[0]?.data?.tags || [];
    
    // 合并两种标签并去重
    const allTags = [...styleTags, ...promptTags];
    const tagMap = new Map();
    
    allTags.forEach(tag => {
      // 统一标签名字段：风格参数API返回name字段，提示词API返回tag字段
      const tagName = tag.name || tag.tag;
      if (tagName) {
        if (tagMap.has(tagName)) {
          tagMap.get(tagName).count += tag.count;
        } else {
          tagMap.set(tagName, { name: tagName, count: tag.count });
        }
      }
    });
    
    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
  }, [styleTagsData, promptTagsData]);
  
  const isLoading = status === 'loading';
  
  // 优化无限滚动触发器
  const { ref, inView } = useInView({
    threshold: 0.1, // 提高触发阈值
    rootMargin: '200px', // 增加预加载距离
    triggerOnce: false
  });
  
  // 使用useCallback优化加载更多函数
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage]);
  
  // 当滚动到底部时自动加载更多（添加防抖）
  useEffect(() => {
    if (inView) {
      const timer = setTimeout(loadMore, 100); // 100ms防抖
      return () => clearTimeout(timer);
    }
  }, [inView, loadMore]);

  // 使用useCallback优化事件处理函数
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // 搜索时会自动重新查询，无需手动重置页面
  }, []);

  const handleTagSelect = useCallback((tag) => {
    setSelectedTag(prevTag => prevTag === tag ? '' : tag);
    // 标签变化时会自动重新查询，无需手动重置页面
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    // 排序变化时会自动重新查询，无需手动重置页面
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('error.loadFailed')}</h2>
          <p className="text-slate-600">{t('error.refreshPage')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        {/* Hero区域 */}
        <Hero />

      {/* 精选内容 */}
      <FeaturedPosts />

      {/* 主要内容区域 */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">最新内容</h2>
          <p className="text-slate-600">风格参数和提示词库的最新作品，按发布时间排序</p>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative flex">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="搜索风格参数和提示词..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 pr-4 rounded-r-none"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary rounded-l-none px-4"
                >
                  {t('common.search')}
                </button>
              </div>
            </form>

            {/* 排序选项 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="select py-2 px-3 text-sm"
                >
                  <option value="createdAt">{t('home.sortByNewest')}</option>
                  <option value="views">{t('home.sortByViews')}</option>
                  <option value="likes">{t('home.sortByLikes')}</option>
                  <option value="comments">{t('home.sortByComments')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* 热门标签 */}
          {popularTags && popularTags.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-medium text-slate-700">热门标签</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 8).map((tag, index) => (
                  <button
                    key={`tag-${tag.name}-${index}`}
                    onClick={() => handleTagSelect(tag.name)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedTag === tag.name
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-white/80 text-slate-600 hover:bg-primary-50 hover:text-primary-600 border border-slate-200'
                    }`}
                  >
                    #{tag.name}
                    <span className="ml-1 text-xs opacity-75">({tag.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 帖子网格 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {allPosts?.map((post, index) => {
                // 优化：减少动画延迟，只对前12个项目添加延迟
                const shouldAnimate = index < 12;
                const delay = shouldAnimate ? Math.min(index * 0.05, 0.6) : 0;
                
                return (
                  <motion.div
                    key={`${post.contentType}-${post._id}`}
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay }}
                  >
                    {post.contentType === 'prompt' ? (
                      <LiblibPromptCard prompt={post} />
                    ) : (
                      <LiblibStyleCard post={post} />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            {/* 无限滚动加载指示器 */}
            {hasNextPage && (
              <div ref={ref} className="flex justify-center mt-12">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-slate-600">
                    <LoadingSpinner size="sm" />
                    <span>加载更多内容...</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">
                    向下滚动加载更多
                  </div>
                )}
              </div>
            )}
            
            {/* 没有更多内容时的提示 */}
            {!hasNextPage && allPosts.length > 0 && (
              <div className="flex justify-center mt-12">
                <div className="text-center">
                  <div className="text-slate-400 text-sm">
                    已显示全部内容
                  </div>
                </div>
              </div>
            )}

            {/* 空状态 */}
            {allPosts?.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {searchTerm || selectedTag ? '没有找到相关内容' : '暂无内容'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm || selectedTag 
                    ? '尝试调整搜索条件或标签筛选' 
                    : '成为第一个分享作品的人吧！'
                  }
                </p>
                {!searchTerm && !selectedTag && (
                  <div className="flex justify-center gap-4">
                    <Link 
                      key="create-style"
                      to="/create" 
                      className="btn btn-primary"
                    >
                      创建风格参数
                    </Link>
                    <Link 
                      key="create-prompt"
                      to="/create-prompt" 
                      className="btn btn-secondary"
                    >
                      创建提示词
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default Home;