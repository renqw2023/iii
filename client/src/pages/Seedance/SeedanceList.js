import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, SlidersHorizontal } from 'lucide-react';
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

    const [category, setCategory] = useState(searchParams.get('category') || 'all');
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    const [page, setPage] = useState(1);

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
        setPage(1);
    }, [category, sort, debouncedSearch, setSearchParams]);

    // 分类列表
    const { data: categoriesData } = useQuery(
        'seedance-categories',
        () => seedanceAPI.getCategories(),
        { staleTime: 60000 }
    );
    const categories = categoriesData?.data?.categories || [];

    // 构建查询参数
    const buildParams = useCallback(() => {
        const params = { page, limit: 12, sort };
        if (category !== 'all') params.category = category;
        if (debouncedSearch) params.search = debouncedSearch;
        return params;
    }, [category, sort, page, debouncedSearch]);

    // 数据查询
    const { data, isLoading, isFetching } = useQuery(
        ['seedance', category, sort, page, debouncedSearch],
        () => seedanceAPI.getPrompts(buildParams()),
        { keepPreviousData: true, staleTime: 30000 }
    );

    const prompts = data?.data?.prompts || [];
    const pagination = data?.data?.pagination || { total: 0, totalPages: 1 };

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
                {/* 页面标题 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="gallery-header"
                >
                    <h1 className="gallery-title">
                        <span className="gradient-text-video">🎬 Seedance 2.0 Prompts</span>
                    </h1>
                    <p className="gallery-subtitle">
                        Curated video generation prompts with playable previews. Hover to preview.
                    </p>
                </motion.div>

                {/* 搜索栏 */}
                <div className="gallery-search-container">
                    <div className="gallery-search-box">
                        <Search size={18} className="gallery-search-icon" />
                        <input
                            type="text"
                            placeholder="Search video prompts..."
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

                {/* 分类过滤 + 排序 */}
                <div className="gallery-filters-row">
                    <div className="tag-filter">
                        <div className="tag-filter-scroll">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCategory('all')}
                                className={`tag-filter-btn ${category === 'all' ? 'active' : ''}`}
                            >
                                All
                            </motion.button>
                            {categories.map((cat) => (
                                <motion.button
                                    key={cat.name}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCategory(cat.name)}
                                    className={`tag-filter-btn ${category === cat.name ? 'active' : ''}`}
                                >
                                    {cat.name} <span className="tag-count">{cat.count}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    <div className="gallery-sort">
                        <SlidersHorizontal size={14} />
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="gallery-sort-select"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 结果统计 */}
                <div className="gallery-results-info">
                    <span>{pagination.total} video prompts</span>
                    {isFetching && <Loader2 size={14} className="animate-spin ml-2" />}
                </div>

                {/* 视频网格 */}
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
                    <AnimatePresence mode="popLayout">
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

export default SeedanceList;
