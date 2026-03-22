import React, { useCallback, useEffect, useRef } from 'react';
import { useSearchParams, Outlet } from 'react-router-dom';
import { useInfiniteQuery } from 'react-query';
import { Loader2 } from 'lucide-react';
import { useGallerySEO } from '../../hooks/useSEO';
import GalleryCard from '../../components/Gallery/GalleryCard';
import { galleryAPI } from '../../services/galleryApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useSidebarPanel } from '../../contexts/SidebarContext';
import GalleryPanel from '../../components/Sidebar/GalleryPanel';

const GalleryList = () => {
    useSidebarPanel(GalleryPanel);
    useGallerySEO();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const sentinelRef = useRef(null);

    // 直接从 URL searchParams 读取 filter 状态（Sidebar 负责写入）
    const model       = searchParams.get('model')  || 'all';
    const activeTag   = searchParams.get('tag')    || 'all';
    const sort        = searchParams.get('sort')   || 'newest';
    const searchQuery = searchParams.get('q')      || '';

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
        if (searchQuery) params.search = searchQuery;
        return params;
    }, [model, activeTag, sort, searchQuery]);

    const {
        data,
        isLoading,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery(
        ['gallery', model, activeTag, sort, searchQuery],
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

    const prompts = data?.pages?.flatMap(p => p?.data?.prompts || []) || [];
    const total = data?.pages?.[0]?.data?.pagination?.total || 0;

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
        try { await galleryAPI.toggleLike(id); }
        catch { toast.error(t('gallery.actions.loginRequired')); }
    };

    const handleFavorite = async (id) => {
        try { await galleryAPI.toggleFavorite(id); }
        catch { toast.error(t('gallery.actions.loginRequired')); }
    };

    return (
        <>
            <div className="gallery-page">
                <div className="gallery-stage">
                    <div className="gallery-stage-header">
                    <span className="gallery-results-info">
                        {total} prompts
                        {isFetching && !isFetchingNextPage && (
                            <Loader2 size={13} className="animate-spin" style={{ display: 'inline', marginLeft: '0.5rem' }} />
                        )}
                    </span>
                </div>

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
                    <div className="gallery-grid gallery-stage-grid">
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
            </div>
            <Outlet />
        </>
    );
};

export default GalleryList;
