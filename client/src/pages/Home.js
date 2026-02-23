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

const Home = () => {
  const { t } = useTranslation();

  // Sort options with i18n
  const SORT_OPTIONS = useMemo(() => [
    { value: 'createdAt', label: t('home.sortByNewest') },
    { value: 'views', label: t('home.sortByViews') },
    { value: 'likes', label: t('home.sortByLikes') },
  ], [t]);

  useHomeSEO();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ========== Gallery featured ==========
  const { data: galleryFeaturedData, isLoading: isGalleryLoading } = useQuery(
    'homeFeaturedGallery',
    () => galleryAPI.getFeatured(8),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const galleryFeatured = galleryFeaturedData?.data?.prompts || [];

  // ========== Seedance featured ==========
  const { data: seedanceFeaturedData, isLoading: isSeedanceLoading } = useQuery(
    'homeFeaturedSeedance',
    () => seedanceAPI.getFeatured(6),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const seedanceFeatured = seedanceFeaturedData?.data?.prompts || [];

  // ========== Latest combined content ==========
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
      console.error('Data fetch failed:', error);
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

  // Popular tags
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

  // Infinite scroll
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

  // Ctrl+K shortcut
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
        <h2>{t('home.loadError.title')}</h2>
        <p>{t('home.loadError.message')}</p>
      </div>
    );
  }

  return (
    <>
      <Hero />

      <div className="home-dark-area">
        {/* Explore collections */}
        <section className="home-section">
          <div className="home-section-header">
            <h2>
              <span className="gradient-text">{t('home.explore.title')}</span>
              <span className="home-section-header-text"> {t('home.explore.titleSuffix')}</span>
            </h2>
            <p className="home-section-desc">{t('home.explore.description')}</p>
          </div>

          <div className="home-entry-grid">
            <Link to="/explore" className="home-entry-card home-entry-mj">
              <div className="home-entry-icon">
                <Palette size={28} />
              </div>
              <h3>🎨 {t('home.explore.mj.title')}</h3>
              <p>{t('home.explore.mj.description')}</p>
              <span className="home-entry-arrow"><ArrowRight size={16} /></span>
            </Link>

            <Link to="/gallery" className="home-entry-card home-entry-gallery">
              <div className="home-entry-icon">
                <BookOpen size={28} />
              </div>
              <h3>📝 {t('home.explore.gallery.title')}</h3>
              <p>{t('home.explore.gallery.description')}</p>
              <span className="home-entry-arrow"><ArrowRight size={16} /></span>
            </Link>

            <Link to="/seedance" className="home-entry-card home-entry-seedance">
              <div className="home-entry-icon">
                <Film size={28} />
              </div>
              <h3>🎬 {t('home.explore.seedance.title')}</h3>
              <p>{t('home.explore.seedance.description')}</p>
              <span className="home-entry-arrow"><ArrowRight size={16} /></span>
            </Link>
          </div>
        </section>

        {/* Gallery featured */}
        {galleryFeatured.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2>
                <span className="gradient-text">{t('home.featuredGallery.title')}</span>
                <span className="home-section-header-text"> {t('home.featuredGallery.titleSuffix')}</span>
              </h2>
              <Link to="/gallery" className="home-section-link">
                {t('home.featuredGallery.viewAll')} <ArrowRight size={14} />
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
              <p>{t('home.loadingFeatured')}</p>
            </div>
          </section>
        )}

        {/* Seedance featured */}
        {seedanceFeatured.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2>
                <span className="gradient-text-video">{t('home.featuredSeedance.title')}</span>
                <span className="home-section-header-text"> {t('home.featuredSeedance.titleSuffix')}</span>
              </h2>
              <Link to="/seedance" className="home-section-link">
                {t('home.featuredSeedance.viewAll')} <ArrowRight size={14} />
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
              <p>{t('home.loadingFeatured')}</p>
            </div>
          </section>
        )}

        {/* Latest content */}
        <section className="home-section home-content-section">
          <div className="home-section-header">
            <h2>
              <span className="gradient-text">{t('home.latestContent.title')}</span>
              <span className="home-section-header-text"> {t('home.latestContent.titleSuffix')}</span>
            </h2>
            <p className="home-section-desc">{t('home.latestContent.description')}</p>
          </div>

          {/* Search bar */}
          <div className="gallery-search-container">
            <div className="gallery-search-box">
              <Search size={18} className="gallery-search-icon" />
              <input
                id="home-search"
                type="text"
                placeholder={`${t('home.searchPlaceholder')} (${t('home.search.shortcut')})`}
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

          {/* Filters + Sort */}
          <div className="gallery-filters-row">
            <div className="tag-filter">
              <div className="tag-filter-scroll">
                <button
                  className={`tag-filter-btn ${!selectedTag ? 'active' : ''}`}
                  onClick={() => setSelectedTag('')}
                >
                  {t('home.filters.allTags')}
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

          {/* Content grid */}
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

              {/* Infinite scroll */}
              {hasNextPage && (
                <div ref={ref} className="home-load-more">
                  {isFetchingNextPage ? (
                    <div className="home-load-more-inner">
                      <Loader2 size={18} className="animate-spin" />
                      <span>{t('home.loadingMore')}</span>
                    </div>
                  ) : (
                    <span className="home-load-more-hint">{t('home.loadingMore')}</span>
                  )}
                </div>
              )}

              {/* No more content */}
              {!hasNextPage && allPosts.length > 0 && (
                <div className="home-load-more">
                  <span className="home-load-more-hint">—</span>
                </div>
              )}

              {/* Empty state */}
              {allPosts?.length === 0 && (
                <div className="gallery-empty">
                  <Sparkles size={48} className="opacity-30" />
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                    {searchTerm || selectedTag ? t('home.noResults.title') : t('home.noContent')}
                  </h3>
                  <p>
                    {searchTerm || selectedTag
                      ? t('home.noResults.message')
                      : t('home.beFirstToShare')
                    }
                  </p>
                  {!searchTerm && !selectedTag && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <Link to="/create" className="detail-btn-primary">{t('home.createStyle')}</Link>
                      <Link to="/create-prompt" className="detail-btn-secondary">{t('home.createPrompt')}</Link>
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