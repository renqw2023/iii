import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, Bookmark, Volume2, VolumeX, Sparkles } from 'lucide-react';
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

const VideoFeedItem = ({ item, index }) => {
  const { isAuthenticated, openLoginModal } = useAuth();
  const { setPrefill } = useGeneration();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  // Feature 2: default unmuted — browser may override; we handle gracefully
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(item.isLiked || false);
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);
  const [favorited, setFavorited] = useState(item.isFavorited || false);
  // Feature 3: prompt sheet
  const [promptSheetOpen, setPromptSheetOpen] = useState(false);

  const videoSrc = getVideoSrc(item.videoUrl);
  const thumbSrc = item.thumbnailUrl ? getThumbnailSrc(item.thumbnailUrl) : null;

  // IntersectionObserver: autoplay when 80% visible
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Feature 2: try unmuted first, fallback to muted if browser blocks
          video.muted = false;
          video.play().catch(() => {
            video.muted = true;
            setMuted(true);
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
  }, []);

  // Sync muted state → video element
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

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

  const handleFavorite = useCallback(async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { openLoginModal(); return; }
    const prev = favorited;
    setFavorited(!prev);
    try {
      await seedanceAPI.toggleFavorite(item._id);
    } catch {
      setFavorited(prev);
      toast.error('Failed to save');
    }
  }, [isAuthenticated, favorited, item._id, openLoginModal]);

  // Feature 1: avatar → author filtered feed
  const handleAuthorClick = useCallback((e) => {
    e.stopPropagation();
    if (!item.authorName) return;
    navigate(`/video?author=${encodeURIComponent(item.authorName)}`);
  }, [navigate, item.authorName]);

  // Feature 4: rotating disc → Generate Video with prefill
  const handleUsePrompt = useCallback((e) => {
    e.stopPropagation();
    setPrefill({
      prompt: item.prompt || item.title || '',
      mediaType: 'video',
      modelId: 'seedance-1-5-pro',
    });
    toast.success('Prompt loaded — tap Generate Video', { duration: 3000, icon: '✨' });
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
      {/* Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={thumbSrc || undefined}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
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
        {/* Feature 1: Author avatar — click → author feed */}
        <button
          onClick={handleAuthorClick}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            backgroundColor: '#6366f1',
            border: '2.5px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 700, color: '#fff',
            flexShrink: 0, letterSpacing: '-0.5px',
          }}>
            {authorInitial}
          </div>
        </button>

        {/* Like */}
        <ActionBtn onClick={handleLike}>
          <Heart
            size={30}
            fill={liked ? '#ef4444' : 'none'}
            stroke={liked ? '#ef4444' : '#fff'}
            strokeWidth={1.8}
          />
          <ActionCount n={likesCount} />
        </ActionBtn>

        {/* Favorite */}
        <ActionBtn onClick={handleFavorite}>
          <Bookmark
            size={28}
            fill={favorited ? '#818cf8' : 'none'}
            stroke={favorited ? '#818cf8' : '#fff'}
            strokeWidth={1.8}
          />
          <ActionCount n={item.favoritesCount || 0} />
        </ActionBtn>

        {/* Mute toggle */}
        <ActionBtn onClick={e => { e.stopPropagation(); setMuted(m => !m); }}>
          {muted
            ? <VolumeX size={26} stroke="rgba(255,255,255,0.55)" strokeWidth={1.8} />
            : <Volume2 size={26} stroke="#fff" strokeWidth={1.8} />
          }
        </ActionBtn>

        {/* Feature 4: Rotating disc → Generate Video */}
        <button
          onClick={handleUsePrompt}
          title="Use this prompt to generate a video"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Gold glow ring to signal interactivity */}
          <div style={{
            padding: 3,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #a78bfa, #f59e0b)',
            backgroundSize: '200% 200%',
            animation: 'discGlow 2.5s linear infinite',
          }}>
            <RotatingDisc thumbnailUrl={thumbSrc} isPlaying={isPlaying} seed={index} />
          </div>
          {/* Affordance label */}
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
          bottom: 0, left: 0,
          right: 80,
          padding: `0 16px calc(28px + ${SAFE_BOTTOM}) 16px`,
        }}
      >
        {/* Feature 3: Title — click → prompt sheet */}
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

        {/* Feature 1: Author — click → author feed */}
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

        {/* Prompt preview — also opens sheet on tap */}
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

      {/* Feature 3: Prompt Sheet */}
      <PromptSheet
        prompt={item.prompt}
        title={item.title}
        open={promptSheetOpen}
        onClose={() => setPromptSheetOpen(false)}
      />

      {/* Disc glow keyframes */}
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
