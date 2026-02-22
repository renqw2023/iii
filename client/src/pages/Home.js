import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useInfiniteQuery, useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { Search, Sparkles, ArrowRight, Palette, Film, BookOpen, X, SlidersHorizontal, Loader2 } from 'lucide-react';
import { enhancedPostAPI } from '../services/enhancedApi';
import { promptAPI } from '../services/promptApi';
import { galleryAPI } from '../services/galleryApi';
import { seedanceAPI } from '../services/seedanceApi';
import LiblibStyleCard from '../components/Post/LiblibStyleCard';
import LiblibPromptCard from '../components/Prompt/LiblibPromptCard';
import GalleryCard from '../components/Gallery/GalleryCard';
import VideoCard from '../components/Seedance/VideoCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Hero from '../components/Home/Hero';

import { APP_CONFIG } from '../config/constants';
import { useHomeSEO } from '../hooks/useSEO';

const SORT_OPTIONS = [
  { value: 'createdAt', label: '最新发布' },
  { value: 'views', label: '最多浏览' },
  { value: 'likes', label: '最多点赞' },
];

const Home = () => {
  const { t } = useTranslation();

  // SEO配置
  useHomeSEO();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ========== Gallery 精选 ==========
  const { data: galleryFeaturedData, isLoading: isGalleryLoading } = useQuery(
    'homeFeaturedGallery',
    () => galleryAPI.getFeatured(8),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const galleryFeatured = galleryFeaturedData?.data?.prompts || [];

  // ========== Seedance 精选 ==========
  const { data: seedanceFeaturedData, isLoading: isSeedanceLoading } = useQuery(
    'homeFeaturedSeedance',
    () => seedanceAPI.getFeatured(6),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const seedanceFeatured = seedanceFeaturedData?.data?.prompts || [];

  // ========== 最新混合内容 ==========
  const fetchCombinedData = useCallback(async ({ pageParam = 1 }) => {
    try {
      const [postsResponse, promptsResponse] = await Promise.all([
        enhancedPostAPI.getPosts({
          page: pageParam,
          limit: APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
          sort: sortBy,
          order: 'desc',
          tag: selectedTag,
          search: debouncedSearch
        }),
        promptAPI.getPrompts({
          page: pageParam,
          limit: APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
          sort: sortBy,
          order: 'desc',
          tag: selectedTag,
          search: debouncedSearch
        })
      ]);

      const stylePosts = postsResponse?.data?.posts || [];
      const prompts = promptsResponse?.data?.prompts || [];

      const postsWithType = stylePosts.map(post => ({ ...post, contentType: 'style' }));
      const promptsWithType = prompts.map(prompt => ({ ...prompt, contentType: 'prompt' }));

      const allContent = [...postsWithType, ...promptsWithType]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || 0);
          const dateB = new Date(b.createdAt || b.created_at || 0);
          return dateB - dateA;
        });

      const hasMorePosts = postsResponse?.data?.pagination?.pages > pageParam;
      const hasMorePrompts = promptsResponse?.data?.pagination?.pages > pageParam;

      return {
        posts: allContent,
        nextPage: (hasMorePosts || hasMorePrompts) ? pageParam + 1 : undefined,
        currentPage: pageParam
      };
    } catch (error) {
      console.error('数据获取失败:', error);
      return { posts: [], nextPage: undefined, currentPage: pageParam };
    }
  }, [sortBy, selectedTag, debouncedSearch]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery(
    ['homePosts', { sort: sortBy, tag: selectedTag, search: debouncedSearch }],
    fetchCombinedData,
    {
      getNextPageParam: (lastPage) => lastPage.nextPage,
      staleTime: APP_CONFIG.CACHE.POSTS_STALE_TIME * 2,
      cacheTime: APP_CONFIG.CACHE.POSTS_STALE_TIME * 4,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
      retryDelay: 1000
    }
  );

  // 获取热门标签
  const { data: styleTagsData } = useQuery(
    'stylePopularTags',
    () => enhancedPostAPI.getPopularTags(),
    { staleTime: 30 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const { data: promptTagsData } = useQuery(
    'promptPopularTags',
    () => promptAPI.getPopularTags(),
    { staleTime: 30 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const allPosts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.posts || []);
  }, [data]);

  const popularTags = useMemo(() => {
    const styleTags = styleTagsData?.data?.tags || [];
    const promptTags = promptTagsData?.data?.tags || [];
    const allTags = [...styleTags, ...promptTags];
    const tagMap = new Map();
    allTags.forEach(tag => {
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

  // 无限滚动
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '200px',
    triggerOnce: false
  });

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage]);

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(loadMore, 100);
      return () => clearTimeout(timer);
    }
  }, [inView, loadMore]);

  const handleTagSelect = useCallback((tag) => {
    setSelectedTag(prevTag => prevTag === tag ? '' : tag);
  }, []);

  // Ctrl+K 快捷键搜索
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('home-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (error) {
    return (
      <div className="home-error-state">
        <h2>{t('error.loadFailed')}</h2>
        <p>{t('error.refreshPage')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero区域 — 保持不变 */}
      <Hero />

      {/* ===== 以下为 meigen.ai 暗色风格区域 ===== */}
      <div className="home-dark-area">

        {/* 三大板块快速入口 */}
        <section className="home-section">
          <div className="home-section-header">
            <h2>
              <span className="gradient-text">Explore</span>
              <span className="home-section-header-text"> Our Collections</span>
            </h2>
            <p className="home-section-desc">探索三大内容板块，发现无限灵感</p>
          </div>

          <div className="home-entry-grid">
            <Link to="/explore" className="home-entry-card home-entry-mj">
              <div className="home-entry-icon">
                <Palette size={28} />
              </div>
              <h3>🎨 MJ 风格参数</h3>
              <p>Midjourney --sref 风格代码精选集</p>
              <span className="home-entry-arrow"><ArrowRight size={16} /></span>
            </Link>

            <Link to="/gallery" className="home-entry-card home-entry-gallery">
              <div className="home-entry-icon">
                <BookOpen size={28} />
              </div>
              <h3>📝 AI 提示词库</h3>
              <p>NanoBanana · Midjourney · GPT Image 热门提示词</p>
              <span className="home-entry-arrow"><ArrowRight size={16} /></span>
            </Link>

            <Link to="/seedance" className="home-entry-card home-entry-seedance">
              <div className="home-entry-icon">
                <Film size={28} />
              </div>
              <h3>🎬 Seedance 视频</h3>
              <p>AI 视频生成提示词 · 在线预览</p>
              <span className="home-entry-arrow"><ArrowRight size={16} /></span>
            </Link>
          </div>
        </section>

        {/* Gallery 精选推荐 */}
        {galleryFeatured.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2>
                <span className="gradient-text">Featured</span>
                <span className="home-section-header-text"> AI Prompts</span>
              </h2>
              <Link to="/gallery" className="home-section-link">
                查看全部 <ArrowRight size={14} />
              </Link>
            </div>

            <div className="home-featured-grid gallery-grid">
              {galleryFeatured.map((prompt, index) => (
                <motion.div
                  key={prompt._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <GalleryCard prompt={prompt} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {isGalleryLoading && (
          <section className="home-section">
            <div className="gallery-loading">
              <Loader2 size={28} className="animate-spin" />
              <p>Loading featured prompts...</p>
            </div>
          </section>
        )}

        {/* Seedance 精选推荐 */}
        {seedanceFeatured.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2>
                <span className="gradient-text-video">Seedance</span>
                <span className="home-section-header-text"> 2.0 精选视频</span>
              </h2>
              <Link to="/seedance" className="home-section-link">
                查看全部 <ArrowRight size={14} />
              </Link>
            </div>

            <div className="home-featured-grid seedance-grid">
              {seedanceFeatured.map((prompt, index) => (
                <motion.div
                  key={prompt._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <VideoCard prompt={prompt} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {isSeedanceLoading && (
          <section className="home-section">
            <div className="gallery-loading">
              <Loader2 size={28} className="animate-spin" />
              <p>Loading Seedance videos...</p>
            </div>
          </section>
        )}

        {/* ===== 最新内容区域 ===== */}
        <section className="home-section home-content-section">
          <div className="home-section-header">
            <h2>
              <span className="gradient-text">Latest</span>
              <span className="home-section-header-text"> Content</span>
            </h2>
            <p className="home-section-desc">风格参数和提示词库的最新作品</p>
          </div>

          {/* 搜索栏 — gallery 暗色风格 */}
          <div className="gallery-search-container">
            <div className="gallery-search-box">
              <Search size={18} className="gallery-search-icon" />
              <input
                id="home-search"
                type="text"
                placeholder="搜索风格参数和提示词... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gallery-search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="gallery-search-clear">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 筛选 + 排序 — gallery 暗色风格 */}
          <div className="gallery-filters-row">
            <div className="tag-filter">
              <div className="tag-filter-scroll">
                <button
                  className={`tag-filter-btn ${!selectedTag ? 'active' : ''}`}
                  onClick={() => setSelectedTag('')}
                >
                  All
                </button>
                {popularTags.slice(0, 12).map((tag, index) => (
                  <button
                    key={`home-tag-${tag.name}-${index}`}
                    onClick={() => handleTagSelect(tag.name)}
                    className={`tag-filter-btn ${selectedTag === tag.name ? 'active' : ''}`}
                  >
                    #{tag.name}
                    <span className="tag-count">({tag.count})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="gallery-sort">
              <SlidersHorizontal size={14} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="gallery-sort-select"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 内容网格 */}
          {isLoading ? (
            <div className="gallery-loading">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <div className="gallery-grid">
                {allPosts?.map((post, index) => {
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
              </div>

              {/* 无限滚动加载 */}
              {hasNextPage && (
                <div ref={ref} className="home-load-more">
                  {isFetchingNextPage ? (
                    <div className="home-load-more-inner">
                      <Loader2 size={18} className="animate-spin" />
                      <span>加载更多内容...</span>
                    </div>
                  ) : (
                    <span className="home-load-more-hint">向下滚动加载更多</span>
                  )}
                </div>
              )}

              {/* 没有更多内容 */}
              {!hasNextPage && allPosts.length > 0 && (
                <div className="home-load-more">
                  <span className="home-load-more-hint">已显示全部内容</span>
                </div>
              )}

              {/* 空状态 */}
              {allPosts?.length === 0 && (
                <div className="gallery-empty">
                  <Sparkles size={48} className="opacity-30" />
                  <h3 style={{ color: 'var(--text-primary, #f1f5f9)', fontSize: '1.1rem', fontWeight: 600 }}>
                    {searchTerm || selectedTag ? '没有找到相关内容' : '暂无内容'}
                  </h3>
                  <p>
                    {searchTerm || selectedTag
                      ? '尝试调整搜索条件或标签筛选'
                      : '成为第一个分享作品的人吧！'
                    }
                  </p>
                  {!searchTerm && !selectedTag && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <Link to="/create" className="detail-btn-primary">创建风格参数</Link>
                      <Link to="/create-prompt" className="detail-btn-secondary">创建提示词</Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
};

export default Home;