import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, Bookmark, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { seedanceAPI, getVideoSrc, getThumbnailSrc } from '../../services/seedanceApi';
import RotatingDisc from './RotatingDisc';
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
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(item.isLiked || false);
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);
  const [favorited, setFavorited] = useState(item.isFavorited || false);

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
          video.play().catch(() => {});
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

  const promptPreview = (item.prompt || '').slice(0, 60).trim();
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
        {/* Author avatar */}
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

        {/* Rotating disc — TikTok style, last item in right column */}
        <RotatingDisc thumbnailUrl={thumbSrc} isPlaying={isPlaying} seed={index} />
      </div>

      {/* ── Bottom info bar ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0, left: 0,
          right: 80, // leave space for right action column
          padding: `0 16px calc(28px + ${SAFE_BOTTOM}) 16px`,
        }}
      >
        {/* Title */}
        <p style={{
          margin: '0 0 5px',
          fontSize: 15, fontWeight: 700, color: '#fff',
          lineHeight: 1.35,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}>
          {displayTitle}
        </p>

        {/* Author */}
        {item.authorName && (
          <p style={{
            margin: '0 0 8px',
            fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}>
            @{item.authorName}
          </p>
        )}

        {/* Prompt preview */}
        {promptPreview && (
          <p style={{
            margin: 0,
            fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {promptPreview}{item.prompt?.length > 60 ? '…' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoFeedItem;
