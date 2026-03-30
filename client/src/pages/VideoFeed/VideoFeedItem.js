import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, Bookmark, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGeneration } from '../../contexts/GenerationContext';
import { seedanceAPI, getVideoSrc, getThumbnailSrc } from '../../services/seedanceApi';
import RotatingDisc from './RotatingDisc';
import PromptSheet from './PromptSheet';
import toast from 'react-hot-toast';

const ActionBtn = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
      padding: '2px 0', WebkitTapHighlightColor: 'transparent',
    }}
  >
    {children}
  </button>
);

const ActionCount = ({ n }) => (
  <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
    {n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n}
  </span>
);

/**
 * VideoFeedItem — single full-screen video card (TikTok style)
 * Props:
 *   item        — seedance prompt object from API
 *   index       — position in feed (used for disc color seed)
 *   globalMuted — controlled by VideoFeed parent; synced to video.muted
 *   onRequestUnmute — callback to parent to unmute globally
 */
const VideoFeedItem = ({ item, index, globalMuted, onRequestUnmute }) => {
  const { isAuthenticated, openLoginModal } = useAuth();
  const { setPrefill } = useGeneration();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const globalMutedRef = useRef(globalMuted);

  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(item.isLiked || false);
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);
  const [favorited, setFavorited] = useState(item.isFavorited || false);
  const [favoritesCount, setFavoritesCount] = useState(item.favoritesCount || 0);
  const [promptSheetOpen, setPromptSheetOpen] = useState(false);

  const videoSrc = getVideoSrc(item.videoUrl);
  const thumbSrc = item.thumbnailUrl ? getThumbnailSrc(item.thumbnailUrl) : null;

  // Sync globalMuted → ref (for IntersectionObserver) + video element
  useEffect(() => {
    globalMutedRef.current = globalMuted;
    const video = videoRef.current;
    if (video) video.muted = globalMuted;
  }, [globalMuted]);

  // IntersectionObserver: autoplay when 80% visible
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.muted = globalMutedRef.current; // use ref — avoids stale closure
          video.play().catch(() => {
            // If unmuted autoplay blocked → play muted silently
            video.muted = true;
            video.play().catch(() => {});
          });
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.8 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally omit globalMuted — sync via the effect above

  const handleTapVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Like — uses seedance embedded likes (shown as public count)
  const handleLike = useCallback(async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { openLoginModal(); return; }
    const prev = liked;
    setLiked(!prev);
    setLikesCount(c => prev ? c - 1 : c + 1);
    try {
      const res = await seedanceAPI.toggleLike(item._id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch {
      setLiked(prev);
      setLikesCount(c => prev ? c + 1 : c - 1);
      toast.error('Failed to like');
    }
  }, [isAuthenticated, liked, item._id, openLoginModal]);

  // Favorite — uses seedance embedded favorites (persists in user's collection)
  const handleFavorite = useCallback(async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { openLoginModal(); return; }
    const prev = favorited;
    const prevCount = favoritesCount;
    setFavorited(!prev);
    setFavoritesCount(c => prev ? c - 1 : c + 1);
    try {
      const res = await seedanceAPI.toggleFavorite(item._id);
      // API returns { favorited, favoritesCount }
      if (res.data.favorited !== undefined) setFavorited(res.data.favorited);
      if (res.data.favoritesCount !== undefined) setFavoritesCount(res.data.favoritesCount);
      toast.success(res.data.favorited ? 'Saved to favorites' : 'Removed from favorites', { duration: 1500 });
    } catch {
      setFavorited(prev);
      setFavoritesCount(prevCount);
      toast.error('Failed to save');
    }
  }, [isAuthenticated, favorited, favoritesCount, item._id, openLoginModal]);

  // Author avatar / name click → author filtered feed
  const handleAuthorClick = useCallback((e) => {
    e.stopPropagation();
    if (!item.authorName) return;
    navigate(`/video/author/${encodeURIComponent(item.authorName)}`);
  }, [navigate, item.authorName]);

  // Rotating disc → Generate Video (with prompt prefill)
  // Fix: use tab:'video' to trigger video generation tab in Img2PromptPanel
  const handleUsePrompt = useCallback((e) => {
    e.stopPropagation();
    setPrefill({
      prompt: item.prompt || item.title || '',
      tab: 'video',           // ← triggers video tab switch in Img2PromptPanel (line 1001-1004)
      modelId: 'seedance-1-5-pro',
    });
    toast.success('Prompt loaded → Generate Video panel', { duration: 3000, icon: '✨' });
    navigate('/generate-history');
  }, [setPrefill, navigate, item.prompt, item.title]);

  const displayTitle = item.title || 'Untitled';
  const authorInitial = (item.authorName || 'A')[0].toUpperCase();
  const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

  return (
    <div
      ref={containerRef}
      onClick={handleTapVideo}
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        flexShrink: 0,
        background: '#111',
        overflow: 'hidden',
        scrollSnapAlign: 'start',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Blurred background — fills bars left by 16:9 videos in portrait container.
          Uses the thumbnail (not a second video element) for minimal memory cost.
          GPU-accelerated via translateZ(0). Invisible behind 9:16 videos. */}
      {thumbSrc && (
        <div style={{
          position: 'absolute',
          inset: '-8%',          // oversized to hide blur soft edges
          backgroundImage: `url(${thumbSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(22px)',
          transform: 'translateZ(0)', // GPU layer
          opacity: 0.55,
        }} />
      )}

      {/* Video element — contain shows full frame; blurred bg fills any letterbox bars */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={thumbSrc || undefined}
        loop
        muted={globalMuted}
        playsInline
        preload="metadata"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain',
        }}
      />

      {/* Bottom gradient vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0.1) 60%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Right action column ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 12,
          bottom: `calc(32px + ${SAFE_BOTTOM})`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}
      >
        {/* Author avatar → author feed */}
        <button
          onClick={handleAuthorClick}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
          title={item.authorName ? `Videos by @${item.authorName}` : undefined}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            backgroundColor: '#6366f1',
            border: '2.5px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 700, color: '#fff',
            letterSpacing: '-0.5px', flexShrink: 0,
          }}>
            {authorInitial}
          </div>
        </button>

        {/* Like (Heart) */}
        <ActionBtn onClick={handleLike}>
          <Heart
            size={30}
            fill={liked ? '#ef4444' : 'none'}
            stroke={liked ? '#ef4444' : '#fff'}
            strokeWidth={1.8}
          />
          <ActionCount n={likesCount} />
        </ActionBtn>

        {/* Favorite (Bookmark) — syncs to user favorites */}
        <ActionBtn onClick={handleFavorite}>
          <Bookmark
            size={28}
            fill={favorited ? '#818cf8' : 'none'}
            stroke={favorited ? '#818cf8' : '#fff'}
            strokeWidth={1.8}
          />
          <ActionCount n={favoritesCount} />
        </ActionBtn>

        {/* Generate Video shortcut — rotating disc with affordance */}
        <button
          onClick={handleUsePrompt}
          title="Use this prompt to generate a video"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Animated gradient ring signals interactivity */}
          <div style={{
            padding: 3,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #a78bfa, #f59e0b)',
            backgroundSize: '200% 200%',
            animation: 'discGlow 2.5s linear infinite',
          }}>
            <RotatingDisc thumbnailUrl={thumbSrc} isPlaying={isPlaying} seed={index} />
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <Sparkles size={8} />
            Generate
          </span>
        </button>
      </div>

      {/* ── Bottom info bar ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 80,
          padding: `0 16px calc(28px + ${SAFE_BOTTOM}) 16px`,
        }}
      >
        {/* Title — click → prompt sheet */}
        <button
          onClick={e => { e.stopPropagation(); setPromptSheetOpen(true); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            textAlign: 'left', width: '100%', WebkitTapHighlightColor: 'transparent',
            marginBottom: 5,
          }}
        >
          <p style={{
            margin: 0,
            fontSize: 15, fontWeight: 700, color: '#fff',
            lineHeight: 1.35,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            textDecoration: 'underline',
            textDecorationColor: 'rgba(255,255,255,0.3)',
            textUnderlineOffset: 3,
          }}>
            {displayTitle}
          </p>
        </button>

        {/* Author — click → author feed */}
        {item.authorName && (
          <button
            onClick={handleAuthorClick}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              marginBottom: 8, WebkitTapHighlightColor: 'transparent',
            }}
          >
            <p style={{
              margin: 0,
              fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}>
              @{item.authorName}
            </p>
          </button>
        )}

        {/* Prompt preview — tap → full prompt sheet */}
        {item.prompt && (
          <button
            onClick={e => { e.stopPropagation(); setPromptSheetOpen(true); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              textAlign: 'left', width: '100%', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <p style={{
              margin: 0,
              fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {item.prompt.slice(0, 80)}{item.prompt.length > 80 ? '…' : ''}
            </p>
          </button>
        )}
      </div>

      {/* Full prompt sheet */}
      <PromptSheet
        prompt={item.prompt}
        title={item.title}
        open={promptSheetOpen}
        onClose={() => setPromptSheetOpen(false)}
      />

      {/* Disc glow animation */}
      <style>{`
        @keyframes discGlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default VideoFeedItem;
