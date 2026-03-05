import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useNavigationType, Outlet } from 'react-router-dom';
import { useInfiniteQuery } from 'react-query';
import { Search, X, Loader2, SlidersHorizontal, ChevronLeft, SlidersHorizontal as FiltersIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import GalleryCard from '../../components/Gallery/GalleryCard';
import ModelFilter from '../../components/Gallery/ModelFilter';
import TagFilter from '../../components/Gallery/TagFilter';
import { galleryAPI } from '../../services/galleryApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
    { value: 'newest', labelKey: 'gallery.filters.newest' },
    { value: 'popular', labelKey: 'gallery.filters.popular' },
    { value: 'most-copied', labelKey: 'gallery.filters.trending' },
];

const GalleryList = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const sentinelRef = useRef(null);
    const navigationType = useNavigationType();

    // 从 URL 读取初始状态
    const [model, setModel] = useState(searchParams.get('model') || 'all');
    const [activeTag, setActiveTag] = useState(searchParams.get('tag') || 'all');
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    // 搜索防抖
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 同步 URL 参数（过滤条件变化时重置）
    useEffect(() => {
        // 如果是 POP 导航，完全跳过 URL 参数同步，避免干扰滚动恢复
        if (navigationType === 'POP') {
            return;
        }

        const params = {};
        if (model !== 'all') params.model = model;
        if (activeTag !== 'all') params.tag = activeTag;
        if (sort !== 'newest') params.sort = sort;
        if (debouncedSearch) params.q = debouncedSearch;
        setSearchParams(params, { replace: true });
    }, [model, activeTag, sort, debouncedSearch, setSearchParams, navigationType]);

    // 构建查询参数
    const buildParams = useCallback((page) => {
        const params = { page, limit: 24, sort };
        if (model !== 'all') params.model = model;
        if (activeTag !== 'all') {
            const styleKeys = ['photography', 'cinematic-film-still', 'anime-manga', '3d-render', 'illustration', 'cyberpunk-sci-fi'];
            const subjectKeys = ['portrait-selfie', 'product', 'food-drink', 'animal-creature'];
            if (styleKeys.includes(activeTag)) params.style = activeTag;
            else if (subjectKeys.includes(activeTag)) params.subject = activeTag;
            else params.tags = activeTag;
        }
        if (debouncedSearch) params.search = debouncedSearch;
        return params;
    }, [model, activeTag, sort, debouncedSearch]);

    // 无限查询
    const {
        data,
        isLoading,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery(
        ['gallery', model, activeTag, sort, debouncedSearch],
        ({ pageParam = 1 }) => galleryAPI.getPrompts(buildParams(pageParam)),
        {
            getNextPageParam: (lastPage) => {
                const { page, totalPages } = lastPage?.data?.pagination || {};
                return page < totalPages ? page + 1 : undefined;
            },
            keepPreviousData: true,
            staleTime: 30000,
        }
    );

    // 所有已加载的 prompts 合并
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

    // 交互处理
    const handleLike = async (id) => {
        try {
            await galleryAPI.toggleLike(id);
        } catch {
            toast.error(t('gallery.actions.loginRequired'));
        }
    };

    const handleFavorite = async (id) => {
        try {
            await galleryAPI.toggleFavorite(id);
        } catch {
            toast.error(t('gallery.actions.loginRequired'));
        }
    };

    // 键盘快捷键 Ctrl+K 搜索
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('gallery-search')?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <Helmet>
                <title>AI Prompts Gallery - Trending AI Image Prompts</title>
                <meta name="description" content="Discover trending AI prompts for NanoBanana Pro, GPT Image. One-click copy, no prompt engineering needed." />
            </Helmet>

            <div className="gallery-page">
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
                                        id="gallery-search"
                                        type="text"
                                        placeholder="Search prompts..."
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

                        {/* 模型过滤 */}
                        <div className="gallery-sidebar-section">
                            <div className="gallery-sidebar-section-label">Model</div>
                            <ModelFilter activeModel={model} onChange={setModel} />
                        </div>

                        {/* 标签过滤 */}
                        <div className="gallery-sidebar-section">
                            <div className="gallery-sidebar-section-label">Style</div>
                            <TagFilter activeTag={activeTag} onChange={setActiveTag} />
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
                                {total} prompts found
                                {isFetching && !isFetchingNextPage && <Loader2 size={13} className="animate-spin ml-2" style={{ display: 'inline', marginLeft: '0.5rem' }} />}
                            </span>
                        </div>

                        {/* 画廊网格 */}
                        {isLoading ? (
                            <div className="gallery-loading">
                                <Loader2 size={32} className="animate-spin" />
                                <p>Loading prompts...</p>
                            </div>
                        ) : prompts.length === 0 ? (
                            <div className="gallery-empty">
                                <span className="text-4xl">🔍</span>
                                <p>No prompts found. Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <div className="gallery-grid">
                                {prompts.map((prompt) => (
                                    <GalleryCard
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
            <Outlet />
        </>
    );
};

export default GalleryList;
