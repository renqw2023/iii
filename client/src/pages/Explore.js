import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Search, X, Loader2, SlidersHorizontal, ChevronLeft, SlidersHorizontal as FiltersIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import LiblibStyleCard from '../components/Post/LiblibStyleCard';
import { enhancedPostAPI } from '../services/enhancedApi';
import { APP_CONFIG } from '../config/constants';

const SORT_OPTIONS = [
  { value: 'views',      label: '最热' },
  { value: 'createdAt',  label: '最新' },
  { value: 'likes',      label: '最赞' },
];

const Explore = () => {
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('views');
  const [page, setPage] = useState(1);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 重置到第一页
  useEffect(() => {
    setPage(1);
  }, [category, sortBy, debouncedSearch]);

  // 热门标签作为分类
  const { data: tagsData } = useQuery(
    'explore-categories',
    () => enhancedPostAPI.getPopularTags(),
    { staleTime: APP_CONFIG.CACHE.TAGS_STALE_TIME }
  );
  const categories = tagsData?.data?.tags?.map(tag => ({ id: tag.name, name: tag.name, count: tag.count })) || [];

  // 帖子数据
  const { data: postsData, isLoading, isFetching } = useQuery(
    ['explore-posts', { page, sort: sortBy, category, search: debouncedSearch }],
    () => enhancedPostAPI.getPosts({
      page,
      limit: 24,
      sort: sortBy,
      order: 'desc',
      ...(category !== 'all' && { tag: category }),
      ...(debouncedSearch && { search: debouncedSearch }),
    }),
    { keepPreviousData: true, staleTime: APP_CONFIG.CACHE.POSTS_STALE_TIME }
  );

  const posts = postsData?.data?.posts || [];
  const pagination = postsData?.data?.pagination || { total: 0, pages: 1, current: 1 };

  return (
    <>
      <Helmet>
        <title>Style Gallery - AI Art Works</title>
        <meta name="description" content="Explore amazing AI-generated works from creators worldwide. Browse Midjourney styles, prompts, and creative inspiration." />
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
                    placeholder="Search works..."
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

            {/* 分类 */}
            <div className="gallery-sidebar-section">
              <div className="gallery-sidebar-section-label">Category</div>
              <div className="tag-filter">
                <div className="tag-filter-scroll">
                  <button
                    className={`tag-filter-btn ${category === 'all' ? 'active' : ''}`}
                    onClick={() => setCategory('all')}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`tag-filter-btn ${category === cat.id ? 'active' : ''}`}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.name}
                      <span className="tag-count">{cat.count}</span>
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

          {/* 右侧主内容 */}
          <main className="gallery-main">
            {/* 工具栏 */}
            <div className="gallery-toolbar">
              {!sidebarOpen && (
                <button className="gallery-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
                  <FiltersIcon size={14} />
                  Filters
                </button>
              )}
              <span className="gallery-results-info" style={{ margin: 0 }}>
                {pagination.total} works
                {isFetching && <Loader2 size={13} className="animate-spin" style={{ display: 'inline', marginLeft: '0.5rem' }} />}
              </span>
            </div>

            {/* 作品网格 */}
            {isLoading ? (
              <div className="gallery-loading">
                <Loader2 size={32} className="animate-spin" />
                <p>Loading works...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="gallery-empty">
                <span className="text-4xl">🎨</span>
                <p>No works found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="gallery-grid">
                {posts.map((post) => (
                  <LiblibStyleCard key={post._id} post={post} />
                ))}
              </div>
            )}

            {/* 分页 */}
            {pagination.pages > 1 && (
              <div className="gallery-pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gallery-page-btn"
                >
                  ← Previous
                </button>
                <span className="gallery-page-info">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="gallery-page-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Explore;
