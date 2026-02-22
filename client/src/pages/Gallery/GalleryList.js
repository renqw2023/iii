import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, SlidersHorizontal } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import GalleryCard from '../../components/Gallery/GalleryCard';
import ModelFilter from '../../components/Gallery/ModelFilter';
import TagFilter from '../../components/Gallery/TagFilter';
import { galleryAPI } from '../../services/galleryApi';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
    { value: 'newest', label: '最新' },
    { value: 'popular', label: '最热门' },
    { value: 'most-copied', label: '最多复制' },
];

const GalleryList = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // 从 URL 读取初始状态
    const [model, setModel] = useState(searchParams.get('model') || 'all');
    const [activeTag, setActiveTag] = useState(searchParams.get('tag') || 'all');
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    const [page, setPage] = useState(1);

    // 搜索防抖
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 同步 URL 参数
    useEffect(() => {
        const params = {};
        if (model !== 'all') params.model = model;
        if (activeTag !== 'all') params.tag = activeTag;
        if (sort !== 'newest') params.sort = sort;
        if (debouncedSearch) params.q = debouncedSearch;
        setSearchParams(params, { replace: true });
        setPage(1);
    }, [model, activeTag, sort, debouncedSearch, setSearchParams]);

    // 构建查询参数
    const buildParams = useCallback(() => {
        const params = { page, limit: 24, sort };
        if (model !== 'all') params.model = model;
        if (activeTag !== 'all') {
            // 根据标签类型决定参数
            const styleKeys = ['photography', 'cinematic-film-still', 'anime-manga', '3d-render', 'illustration', 'cyberpunk-sci-fi'];
            const subjectKeys = ['portrait-selfie', 'product', 'food-drink', 'animal-creature'];
            if (styleKeys.includes(activeTag)) params.style = activeTag;
            else if (subjectKeys.includes(activeTag)) params.subject = activeTag;
            else params.tags = activeTag;
        }
        if (debouncedSearch) params.search = debouncedSearch;
        return params;
    }, [model, activeTag, sort, page, debouncedSearch]);

    // 数据查询
    const { data, isLoading, isFetching } = useQuery(
        ['gallery', model, activeTag, sort, page, debouncedSearch],
        () => galleryAPI.getPrompts(buildParams()),
        { keepPreviousData: true, staleTime: 30000 }
    );

    const prompts = data?.data?.prompts || [];
    const pagination = data?.data?.pagination || { total: 0, totalPages: 1 };

    // 交互处理
    const handleLike = async (id) => {
        try {
            await galleryAPI.toggleLike(id);
        } catch {
            toast.error('请先登录');
        }
    };

    const handleFavorite = async (id) => {
        try {
            await galleryAPI.toggleFavorite(id);
        } catch {
            toast.error('请先登录');
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
                <meta name="description" content="Discover trending AI prompts for NanoBanana Pro, Midjourney, GPT Image. One-click copy, no prompt engineering needed." />
            </Helmet>

            <div className="gallery-page">
                {/* 页面标题 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="gallery-header"
                >
                    <h1 className="gallery-title">
                        <span className="gradient-text">AI Prompts Gallery</span>
                    </h1>
                    <p className="gallery-subtitle">
                        Discover trending AI prompts. One-click copy, no prompt engineering needed.
                    </p>
                </motion.div>

                {/* 搜索栏 */}
                <div className="gallery-search-container">
                    <div className="gallery-search-box">
                        <Search size={18} className="gallery-search-icon" />
                        <input
                            id="gallery-search"
                            type="text"
                            placeholder="Search prompts... (Ctrl+K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="gallery-search-input"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="gallery-search-clear">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 模型过滤 */}
                <ModelFilter activeModel={model} onChange={setModel} />

                {/* 标签过滤 + 排序 */}
                <div className="gallery-filters-row">
                    <TagFilter activeTag={activeTag} onChange={setActiveTag} />
                    <div className="gallery-sort">
                        <SlidersHorizontal size={14} />
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="gallery-sort-select"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 结果统计 */}
                <div className="gallery-results-info">
                    <span>{pagination.total} prompts found</span>
                    {isFetching && <Loader2 size={14} className="animate-spin ml-2" />}
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
                    <AnimatePresence mode="popLayout">
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
                    </AnimatePresence>
                )}

                {/* 分页 */}
                {pagination.totalPages > 1 && (
                    <div className="gallery-pagination">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="gallery-page-btn"
                        >
                            ← Previous
                        </button>
                        <span className="gallery-page-info">
                            Page {page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages}
                            className="gallery-page-btn"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default GalleryList;
