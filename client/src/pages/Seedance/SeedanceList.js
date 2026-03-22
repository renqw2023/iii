import React, { useCallback, useEffect, useRef } from 'react';
import { useSearchParams, Outlet } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from 'react-query';
import { Loader2 } from 'lucide-react';
import { useSeedanceSEO } from '../../hooks/useSEO';
import VideoCard from '../../components/Seedance/VideoCard';
import { seedanceAPI } from '../../services/seedanceApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useSidebarPanel } from '../../contexts/SidebarContext';
import SeedancePanel from '../../components/Sidebar/SeedancePanel';

const SeedanceList = () => {
    useSidebarPanel(SeedancePanel);
    useSeedanceSEO();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const sentinelRef = useRef(null);

    // 直接从 URL searchParams 读取 filter 状态（Sidebar 负责写入）
    const category    = searchParams.get('category') || 'all';
    const sort        = searchParams.get('sort')     || 'newest';
    const searchQuery = searchParams.get('q')        || '';

    // 预加载分类（供 Sidebar 的 SeedanceFilters 使用）
    useQuery(
        'seedance-categories',
        () => seedanceAPI.getCategories(),
        { staleTime: 60000 }
    );

    const buildParams = useCallback((page) => {
        const params = { page, limit: 24, sort };
        if (category !== 'all') params.category = category;
        if (searchQuery) params.search = searchQuery;
        return params;
    }, [category, sort, searchQuery]);

    const {
        data,
        isLoading,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery(
        ['seedance', category, sort, searchQuery],
        ({ pageParam = 1 }) => seedanceAPI.getPrompts(buildParams(pageParam)),
        {
            getNextPageParam: (lastPage) => {
                const { page, totalPages } = lastPage?.data?.pagination || {};
                return page < totalPages ? page + 1 : undefined;
            },
            keepPreviousData: true,
            staleTime: 30000,
        }
    );

    const prompts = data?.pages?.flatMap(p => p?.data?.prompts || []) || [];
    const total   = data?.pages?.[0]?.data?.pagination?.total || 0;

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

    const handleLike = async (id) => {
        try { await seedanceAPI.toggleLike(id); }
        catch { toast.error(t('seedance.actions.loginRequired')); }
    };

    const handleFavorite = async (id) => {
        try { await seedanceAPI.toggleFavorite(id); }
        catch { toast.error(t('seedance.actions.loginRequired')); }
    };

    return (
        <>
<div className="seedance-page">
                <div style={{ padding: '0.25rem 1rem 0' }}>
                    <span className="gallery-results-info">
                        {total} video prompts
                        {isFetching && !isFetchingNextPage && (
                            <Loader2 size={13} className="animate-spin" style={{ display: 'inline', marginLeft: '0.5rem' }} />
                        )}
                    </span>
                </div>

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
                    <div className="seedance-grid" style={{ padding: '1rem' }}>
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
            </div>
            <Outlet />
        </>
    );
};

export default SeedanceList;
