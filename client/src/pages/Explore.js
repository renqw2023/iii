import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery } from 'react-query';
import { Search, X, Loader2, SlidersHorizontal, ChevronLeft, SlidersHorizontal as FiltersIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import SrefCard from '../components/Sref/SrefCard';
import { srefAPI } from '../services/srefApi';

const SORT_OPTIONS = [
  { value: 'createdAt', label: '最新' },
  { value: 'views',     label: '最热' },
];

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt');
  const sentinelRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const params = {};
    if (activeTag !== 'all') params.tag = activeTag;
    if (sortBy !== 'createdAt') params.sort = sortBy;
    if (debouncedSearch) params.q = debouncedSearch;
    setSearchParams(params, { replace: true });
  }, [activeTag, sortBy, debouncedSearch, setSearchParams]);

  // 热门标签
  const { data: tagsData } = useQuery(
    'sref-tags',
    () => srefAPI.getPopularTags(40),
    { staleTime: 5 * 60 * 1000 }
  );
  const tags = tagsData?.data?.tags || [];

  // 无限滚动加载
  const buildParams = (page) => {
    const p = { page, limit: 24, sort: sortBy };
    if (activeTag !== 'all') p.tags = activeTag;
    if (debouncedSearch) p.search = debouncedSearch;
    return p;
  };

  const {
    data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage,
  } = useInfiniteQuery(
    ['sref-list', activeTag, sortBy, debouncedSearch],
    ({ pageParam = 1 }) => srefAPI.getPosts(buildParams(pageParam)),
    {
      getNextPageParam: (lastPage) => {
        const { page, pages } = lastPage?.data?.pagination || {};
        return page < pages ? page + 1 : undefined;
      },
      staleTime: 30000,
    }
  );

  const srefs = data?.pages?.flatMap(p => p?.data?.posts || []) || [];
  const total = data?.pages?.[0]?.data?.pagination?.total || 0;

  // 滚动到底部自动加载
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <Helmet>
        <title>Style Gallery - Midjourney Sref Styles</title>
        <meta name="description" content="Browse 1300+ Midjourney --sref style references. Find your perfect style code." />
      </Helmet>

      <div className="gallery-page">
        <div className="gallery-layout">

          {/* 左侧 Sidebar */}
          <aside className={`gallery-sidebar ${sidebarOpen ? '' : 'closed'}`}>
            <div className="gallery-sidebar-header">
              <span className="gallery-sidebar-title">Filters</span>
              <button className="gallery-sidebar-close" onClick={() => setSidebarOpen(false)}>
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* 搜索 */}
            <div className="gallery-sidebar-section">
              <div className="gallery-sidebar-section-label">Search</div>
              <div className="gallery-search-container">
                <div className="gallery-search-box">
                  <Search size={16} className="gallery-search-icon" />
                  <input
                    type="text"
                    placeholder="Search styles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="gallery-search-input"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="gallery-search-clear">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 标签过滤 */}
            <div className="gallery-sidebar-section">
              <div className="gallery-sidebar-section-label">Style</div>
              <div className="tag-filter">
                <div className="tag-filter-scroll">
                  <button
                    className={`tag-filter-btn ${activeTag === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTag('all')}
                  >
                    All
                  </button>
                  {tags.map((tag) => (
                    <button
                      key={tag.name}
                      className={`tag-filter-btn ${activeTag === tag.name ? 'active' : ''}`}
                      onClick={() => setActiveTag(tag.name)}
                    >
                      {tag.name}
                      <span className="tag-count">{tag.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 排序 */}
            <div className="gallery-sidebar-section">
              <div className="gallery-sidebar-section-label">Sort</div>
              <div className="gallery-sort" style={{ color: 'var(--text-secondary)' }}>
                <SlidersHorizontal size={13} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="gallery-sort-select"
                  style={{ flex: 1 }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* 主内容 */}
          <main className="gallery-main">
            <div className="gallery-toolbar">
              {!sidebarOpen && (
                <button className="gallery-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
                  <FiltersIcon size={14} />
                  Filters
                </button>
              )}
              <span className="gallery-results-info" style={{ margin: 0 }}>
                {total} styles
                {isFetching && !isFetchingNextPage && (
                  <Loader2 size={13} className="animate-spin" style={{ display: 'inline', marginLeft: '0.5rem' }} />
                )}
              </span>
            </div>

            {isLoading ? (
              <div className="gallery-loading">
                <Loader2 size={32} className="animate-spin" />
                <p>Loading styles...</p>
              </div>
            ) : srefs.length === 0 ? (
              <div className="gallery-empty">
                <span className="text-4xl">🎨</span>
                <p>No styles found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="gallery-grid">
                {srefs.map((sref) => (
                  <SrefCard key={sref._id} sref={sref} />
                ))}
              </div>
            )}

            <div ref={sentinelRef} style={{ height: 1 }} />
            {isFetchingNextPage && (
              <div className="gallery-loading" style={{ padding: '1.5rem 0' }}>
                <Loader2 size={24} className="animate-spin" />
              </div>
            )}
            {!hasNextPage && srefs.length > 0 && (
              <div className="home-load-more">
                <span className="home-load-more-hint">—</span>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Explore;
