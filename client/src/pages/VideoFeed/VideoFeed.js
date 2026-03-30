import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from 'react-query';
import { ArrowLeft, Clapperboard, Volume2, VolumeX } from 'lucide-react';
import { seedanceAPI } from '../../services/seedanceApi';
import VideoFeedItem from './VideoFeedItem';

/**
 * Recommendation sort strategy:
 * - Page 1: sort=likes (highest likes first — quality content upfront)
 * - Page 2: sort=random (serendipity, avoid repetition)
 * - Page 3+: alternating likes / random
 */
const getSortForPage = (page) => {
  if (page === 1) return 'likes';
  return page % 2 === 0 ? 'random' : 'likes';
};

const VideoFeed = () => {
  const navigate = useNavigate();
  const sentinelRef = useRef(null);
  const feedRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Feature: author filter via ?author=xxx
  const authorFilter = searchParams.get('author') || '';

  // Global muted state — shared across all VideoFeedItems
  // Starts muted (browser autoplay policy), user can tap to unmute
  const [globalMuted, setGlobalMuted] = useState(true);
  const [soundHintDismissed, setSoundHintDismissed] = useState(false);

  const handleUnmute = useCallback(() => {
    // Imperatively unmute all videos synchronously within the user-gesture context
    // (iOS Safari requires the muted change to happen inside the click handler, not in a useEffect)
    document.querySelectorAll('video').forEach(v => { v.muted = false; });
    setGlobalMuted(false);
    setSoundHintDismissed(true);
  }, []);

  const handleToggleGlobalMute = useCallback(() => {
    setGlobalMuted(m => {
      const next = !m;
      document.querySelectorAll('video').forEach(v => { v.muted = next; });
      return next;
    });
    setSoundHintDismissed(true);
  }, []);

  // All hooks before any conditional return
  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery(
    ['seedance-video-feed', authorFilter],
    ({ pageParam = 1 }) => {
      const sort = authorFilter ? 'newest' : getSortForPage(pageParam);
      return seedanceAPI.getPrompts({
        page: pageParam,
        limit: 10,
        sort,
        ...(authorFilter ? { authorName: authorFilter } : {}),
      });
    },
    {
      getNextPageParam: (lastPage) => {
        const { page, totalPages } = lastPage?.data?.pagination || {};
        return page < totalPages ? page + 1 : undefined;
      },
      staleTime: 30000,
    }
  );

  // Reset scroll to top when author filter changes
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [authorFilter]);

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
    <div ref={feedRef} style={{
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
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
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
          <span style={{
            fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.01em',
          }}>
            Videos
          </span>
        </div>

        <div style={{ width: 38 }} />
      </div>

      {/* Sound hint — appears at top, dismisses on tap */}
      {!soundHintDismissed && !isLoading && items.length > 0 && (
        <button
          onClick={handleUnmute}
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 64px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px',
            borderRadius: 20,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            animation: 'soundPulse 2s ease-in-out infinite',
            whiteSpace: 'nowrap',
          }}
        >
          <VolumeX size={15} />
          Tap for sound
        </button>
      )}

      {/* Global mute/unmute button — always accessible top-right */}
      {soundHintDismissed && !isLoading && items.length > 0 && (
        <button
          onClick={handleToggleGlobalMute}
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 64px)',
            right: 16,
            zIndex: 60,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: globalMuted ? 'rgba(255,255,255,0.5)' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {globalMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}

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
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
            Loading videos…
          </p>
        </div>
      )}


      {/* Video items */}
      {items.map((item, i) => (
        <VideoFeedItem
          key={item._id}
          item={item}
          index={i}
          globalMuted={globalMuted}
          onRequestUnmute={handleUnmute}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1, scrollSnapAlign: 'none' }} />

      {/* Loading more */}
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
        @keyframes soundPulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.75; transform: translateX(-50%) scale(0.97); }
        }
      `}</style>
    </div>
  );
};

export default VideoFeed;
