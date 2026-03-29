import React, { useRef, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from 'react-query';
import { ArrowLeft, Clapperboard } from 'lucide-react';
import { seedanceAPI } from '../../services/seedanceApi';
import VideoFeedItem from './VideoFeedItem';

const VideoFeed = () => {
  const navigate = useNavigate();
  const sentinelRef = useRef(null);

  // All hooks must be called before any conditional return
  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery(
    ['seedance-video-feed'],
    ({ pageParam = 1 }) => seedanceAPI.getPrompts({ page: pageParam, limit: 10, sort: 'newest' }),
    {
      getNextPageParam: (lastPage) => {
        const { page, totalPages } = lastPage?.data?.pagination || {};
        return page < totalPages ? page + 1 : undefined;
      },
      staleTime: 30000,
    }
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Desktop redirect — after all hooks
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return <Navigate to="/seedance" replace />;
  }

  const items = data?.pages?.flatMap(p => p?.data?.prompts || []) || [];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      overflowY: 'scroll',
      scrollSnapType: 'y mandatory',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      {/* Top bar — fixed overlay */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        display: 'flex', alignItems: 'center',
        padding: `calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px`,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            pointerEvents: 'auto',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#fff', display: 'flex', alignItems: 'center',
            padding: '4px 8px 4px 0',
          }}
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}>
          <Clapperboard size={16} stroke="rgba(255,255,255,0.8)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.01em' }}>
            Videos
          </span>
        </div>

        <div style={{ width: 38 }} />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{
          height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, scrollSnapAlign: 'start',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.15)',
            borderTopColor: '#fff',
            animation: 'feedSpin 0.8s linear infinite',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Loading videos…</p>
        </div>
      )}

      {/* Video items */}
      {items.map((item, i) => (
        <VideoFeedItem key={item._id} item={item} index={i} />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1, scrollSnapAlign: 'none' }} />

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div style={{
          height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
          scrollSnapAlign: 'none',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.15)',
            borderTopColor: 'rgba(255,255,255,0.6)',
            animation: 'feedSpin 0.8s linear infinite',
          }} />
        </div>
      )}

      <style>{`
        @keyframes feedSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default VideoFeed;
