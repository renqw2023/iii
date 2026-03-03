import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, SlidersHorizontal, ChevronLeft, SlidersHorizontal as FiltersIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import VideoCard from '../../components/Seedance/VideoCard';
import { seedanceAPI } from '../../services/seedanceApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
    { value: 'newest', labelKey: 'seedance.filters.newest' },
    { value: 'popular', labelKey: 'seedance.filters.popular' },
    { value: 'most-copied', labelKey: 'seedance.filters.trending' },
];

const SeedanceList = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const sentinelRef = useRef(null);

    const [category, setCategory] = useState(searchParams.get('category') || 'all');
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    // 搜索防抖
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // URL 同步
    useEffect(() => {
        const params = {};
        if (category !== 'all') params.category = category;
        if (sort !== 'newest') params.sort = sort;
        if (debouncedSearch) params.q = debouncedSearch;
        setSearchParams(params, { replace: true });
    }, [category, sort, debouncedSearch, setSearchParams]);

    // 分类列表
    const { data: categoriesData } = useQuery(
        'seedance-categories',
        () => seedanceAPI.getCategories(),
        { staleTime: 60000 }
    );
    const categories = categoriesData?.data?.categories || [];

    // 构建查询参数
    const buildParams = useCallback((page) => {
        const params = { page, limit: 24, sort };
        if (category !== 'all') params.category = category;
        if (debouncedSearch) params.search = debouncedSearch;
        return params;
    }, [category, sort, debouncedSearch]);

    // 无限滚动查询
    const {
        data,
        isLoading,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery(
        ['seedance', category, sort, debouncedSearch],
        ({ pageParam = 1 }) => seedanceAPI.getPrompts(buildParams(pageParam)),
        {
            getNextPageParam: (lastPage) => {
                const { page, totalPages } = lastPage?.data?.pagination || {};
                return page < totalPages ? page + 1 : undefined;
            },
            keepPreviousData: false,
            staleTime: 30000,
        }
    );

    // 合并所有已加载页的 prompts
    const prompts = data?.pages?.flatMap(p => p?.data?.prompts || []) || [];
    const total = data?.pages?.[0]?.data?.pagination?.total || 0;

    // IntersectionObserver — 滚动到底部时自动加载下一页
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { rootMargin: '300px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleLike = async (id) => {
        try {
            await seedanceAPI.toggleLike(id);
        } catch {
            toast.error(t('seedance.actions.loginRequired'));
        }
    };

    const handleFavorite = async (id) => {
        try {
            await seedanceAPI.toggleFavorite(id);
        } catch {
            toast.error(t('seedance.actions.loginRequired'));
        }
    };

    return (
        <>
            <Helmet>
                <title>Seedance 2.0 Video Prompts - AI Video Generation</title>
                <meta name="description" content="Curated Seedance 2.0 video prompts with playable previews. Text-to-video, image-to-video, and more." />
            </Helmet>

            <div className="seedance-page">
                <div className="gallery-layout">
                    {/* 左侧 Sidebar */}
                    <aside className={`gallery-sidebar ${sidebarOpen ? '' : 'closed'}`}>
                        <div className="gallery-sidebar-header">
                            <span className="gallery-sidebar-title">Filters</span>
                            <button
                                className="gallery-sidebar-close"
                                onClick={() => setSidebarOpen(false)}
                                title="Close sidebar"
                            >
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
                                        placeholder="Search video prompts..."
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

                        {/* 分类过滤 */}
                        <div className="gallery-sidebar-section">
                            <div className="gallery-sidebar-section-label">Category</div>
                            <div className="tag-filter">
                                <div className="tag-filter-scroll">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setCategory('all')}
                                        className={`tag-filter-btn ${category === 'all' ? 'active' : ''}`}
                                    >
                                        All
                                    </motion.button>
                                    {categories.map((cat) => (
                                        <motion.button
                                            key={cat.name}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setCategory(cat.name)}
                                            className={`tag-filter-btn ${category === cat.name ? 'active' : ''}`}
                                        >
                                            {cat.name} <span className="tag-count">{cat.count}</span>
                                        </motion.button>
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
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                    className="gallery-sort-select"
                                    style={{ flex: 1 }}
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
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
                                <button
                                    className="gallery-sidebar-toggle"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <FiltersIcon size={14} />
                                    Filters
                                </button>
                            )}
                            <span className="gallery-results-info" style={{ margin: 0 }}>
                                {total} video prompts
                                {isFetching && !isFetchingNextPage && <Loader2 size={13} className="animate-spin ml-2" style={{ display: 'inline', marginLeft: '0.5rem' }} />}
                            </span>
                        </div>

                        {/* 视频网格 — 瀑布流 */}
                        {isLoading ? (
                            <div className="gallery-loading">
                                <Loader2 size={32} className="animate-spin" />
                                <p>Loading video prompts...</p>
                            </div>
                        ) : prompts.length === 0 ? (
                            <div className="gallery-empty">
                                <span className="text-4xl">🎥</span>
                                <p>No video prompts found.</p>
                            </div>
                        ) : (
                            <div className="seedance-grid">
                                {prompts.map((prompt) => (
                                    <VideoCard
                                        key={prompt._id}
                                        prompt={prompt}
                                        onLike={handleLike}
                                        onFavorite={handleFavorite}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 无限滚动 sentinel */}
                        <div ref={sentinelRef} style={{ height: 1 }} />
                        {isFetchingNextPage && (
                            <div className="gallery-loading" style={{ padding: '1.5rem 0' }}>
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                        )}
                        {!hasNextPage && prompts.length > 0 && (
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

export default SeedanceList;
