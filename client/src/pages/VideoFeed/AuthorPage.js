import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, Play, Heart } from 'lucide-react';
import { seedanceAPI, getThumbnailSrc } from '../../services/seedanceApi';

const fmt = (n) => {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

const SkeletonCell = () => (
  <div style={{
    position: 'relative',
    paddingBottom: `${(16 / 9) * 100}%`,
    background: '#1a1a1a',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%)',
      backgroundSize: '200% 100%',
      animation: 'authorSkeleton 1.4s ease-in-out infinite',
    }} />
  </div>
);

const AuthorPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery(
    ['author-videos', name],
    () => seedanceAPI.getPrompts({ authorName: name, limit: 50, sort: 'newest' }),
    { staleTime: 60_000, enabled: Boolean(name) }
  );

  const videos     = data?.data?.prompts || [];
  const total      = data?.data?.pagination?.total || videos.length;
  const totalLikes = videos.reduce((sum, v) => sum + (v.likesCount || 0), 0);
  const initial    = (name || 'A')[0].toUpperCase();

  const SAFE_TOP    = 'env(safe-area-inset-top, 0px)';
  const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

  // All thumbnail/Watch-All clicks open the filtered TikTok feed for this author
  const watchAll = () => navigate(`/video?author=${encodeURIComponent(name)}`);

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        padding: `calc(${SAFE_TOP} + 12px) 16px 12px`,
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#fff', display: 'flex', alignItems: 'center',
            padding: '4px 8px 4px 0', flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <span style={{
          flex: 1, textAlign: 'center',
          fontSize: 16, fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          padding: '0 8px',
        }}>
          @{name}
        </span>
        <div style={{ width: 38, flexShrink: 0 }} />
      </div>

      {/* ── Profile header ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '28px 20px 20px',
        gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Avatar */}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          border: '3px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 800, color: '#fff',
          letterSpacing: '-1px',
          boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
          flexShrink: 0,
        }}>
          {initial}
        </div>

        {/* Name */}
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
          @{name}
        </p>

        {/* Stats */}
        {isLoading ? (
          <div style={{ display: 'flex', gap: 32, marginTop: 4 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 48, height: 20, borderRadius: 4, background: '#252525', animation: 'authorSkeleton 1.4s ease-in-out infinite' }} />
                <div style={{ width: 40, height: 12, borderRadius: 4, background: '#1e1e1e', animation: 'authorSkeleton 1.4s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 36, marginTop: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{fmt(total)}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Videos</span>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{fmt(totalLikes)}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Likes</span>
            </div>
          </div>
        )}

        {/* Watch All button */}
        {!isLoading && videos.length > 0 && (
          <button
            onClick={watchAll}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '13px 0',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              color: '#fff',
              fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            <Play size={14} fill="#fff" stroke="none" />
            Watch All
          </button>
        )}
      </div>

      {/* ── Video grid ───────────────────────────────────────────────────── */}
      <div style={{ paddingBottom: `calc(${SAFE_BOTTOM} + 24px)` }}>

        {/* Skeleton */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: '2px' }}>
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCell key={i} />)}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, margin: '0 0 12px' }}>⚠️</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>Could not load videos</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && videos.length === 0 && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🎬</p>
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#fff' }}>No videos yet</p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              @{name} hasn't published any videos in the library
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !isError && videos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: '2px 0 0' }}>
            {videos.map((video) => {
              const thumb = video.thumbnailUrl ? getThumbnailSrc(video.thumbnailUrl) : null;
              return (
                <div
                  key={video._id}
                  onClick={watchAll}
                  title={video.title || ''}
                  style={{
                    position: 'relative',
                    paddingBottom: `${(16 / 9) * 100}%`,
                    background: '#181818',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={video.title || ''}
                      loading="lazy"
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.2)',
                    }}>
                      {initial}
                    </div>
                  )}

                  {/* Likes overlay */}
                  {video.likesCount > 0 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
                      padding: '20px 5px 4px',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <Heart size={10} fill="rgba(255,255,255,0.9)" stroke="none" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                        {fmt(video.likesCount)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes authorSkeleton {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default AuthorPage;
