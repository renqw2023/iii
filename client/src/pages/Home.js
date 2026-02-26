import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useInfiniteQuery, useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { Search, Sparkles, ArrowRight, Palette, Film, BookOpen, X, SlidersHorizontal, Loader2 } from 'lucide-react';
import { srefAPI } from '../services/srefApi';
import SrefCard from '../components/Sref/SrefCard';
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

  // ========== Sref 无限滚动 ==========
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery(
    ['homeSrefs', { sort: sortBy, tag: selectedTag, search: debouncedSearch }],
    ({ pageParam = 1 }) => srefAPI.getPosts({
      page: pageParam,
      limit: 24,
      sort: sortBy,
      ...(selectedTag && { tags: selectedTag }),
      ...(debouncedSearch && { search: debouncedSearch }),
    }),
    {
      getNextPageParam: (lastPage) => {
        const { page, pages } = lastPage?.data?.pagination || {};
        return page < pages ? page + 1 : undefined;
      },
      staleTime: APP_CONFIG.CACHE.POSTS_STALE_TIME * 2,
      refetchOnWindowFocus: false,
    }
  );

  // 热门标签（来自 srefAPI）
  const { data: tagsData } = useQuery(
    'homeSrefTags',
    () => srefAPI.getPopularTags(20),
    { staleTime: 30 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const allPosts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(p => p?.data?.posts || []);
  }, [data]);

  const popularTags = useMemo(() => {
    return tagsData?.data?.tags || [];
  }, [tagsData]);

  const isLoading = status === 'loading';

  // Infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '200px',
    triggerOnce: false
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isFetching, fetchNextPage]);

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
                {allPosts?.map((post) => (
                  <SrefCard key={post._id} sref={post} />
                ))}
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