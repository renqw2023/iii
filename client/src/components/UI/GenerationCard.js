import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ArrowDownToLine, Maximize2, Play, RefreshCw, RotateCcw, Share2, Trash2, Volume2, VolumeX, X } from 'lucide-react';

const ASPECT_RATIO_MAP = {
  '1:1': [1, 1],
  '4:3': [4, 3],
  '3:4': [3, 4],
  '16:9': [16, 9],
  '9:16': [9, 16],
  '21:9': [21, 9],
};

const ICON_BTN = {
  borderRadius: 8, border: 'none', cursor: 'pointer',
  backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  color: '#fff', padding: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const GenerationCard = ({ job, isActive, onRetry, onDownload, onCopyUrl, onDismiss, onDelete, onUseIdea }) => {
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Videos generated with audio start unmuted; plain videos start muted
  const [muted, setMuted] = useState(!job.generateAudio);
  const videoRef = useRef(null);

  // ESC 关闭 lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightboxOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  const handleMouseEnterCard = () => {
    setHovered(true);
    if (job.mediaType === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const handleMouseLeaveCard = () => {
    setHovered(false);
    if (job.mediaType === 'video' && videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleFullscreen = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
    else if (v.mozRequestFullScreen) v.mozRequestFullScreen();
  };
  const [w, h] = ASPECT_RATIO_MAP[job.aspectRatio] || [16, 9];
  const paddingPct = `${((h / w) * 100).toFixed(2)}%`;

  const cardStyle = {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  };

  const innerStyle = {
    position: 'relative',
    width: '100%',
    paddingBottom: paddingPct,
  };

  const contentStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  /* ── Loading ── */
  if (job.status === 'loading') {
    const progress = job.progress || 0;
    const circumference = 2 * Math.PI * 45;
    const dashArray = `${Math.max(progress, 2) * (circumference / 100)} ${circumference}`;

    return (
      <div style={cardStyle}>
        <div style={innerStyle}>
          <div style={{
            ...contentStyle,
            background: 'linear-gradient(135deg, #f7f4ed, #ede8de, #f7f4ed)',
            backgroundSize: '200% 200%',
            animation: 'shimmer 2s ease infinite',
          }}>
            <div style={{ position: 'relative', width: 56, height: 56, marginBottom: 10 }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} fill="none">
                <circle cx="50" cy="50" r="45" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
                <circle
                  cx="50" cy="50" r="45"
                  stroke="#111827" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={dashArray}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray 0.7s ease' }}
                />
              </svg>
              <span style={{
                position: 'absolute', inset: 0,
                display: 'grid', placeItems: 'center',
                fontSize: 13, fontWeight: 700, color: '#111827',
              }}>
                {progress}%
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0, textAlign: 'center', padding: '0 12px' }}>
              {progress >= 80 ? '高峰时段，需要更长时间…' : 'Generating…'}
            </p>
            <p style={{
              fontSize: 11, color: '#9ca3af', margin: '6px 12px 0',
              textAlign: 'center',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {job.prompt}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (job.status === 'error') {
    return (
      <div style={cardStyle}>
        <div style={innerStyle}>
          <div style={{ ...contentStyle, padding: 16, gap: 8 }}>
            <AlertCircle size={28} style={{ color: '#ef4444', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#374151', fontWeight: 500, textAlign: 'center', margin: 0 }}>
              {job.errorMessage || '生成失败'}
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>积分已返还</p>
            {isActive && onRetry && (
              <button
                onClick={onRetry}
                style={{
                  marginTop: 4,
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8,
                  backgroundColor: '#111827', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >
                <RefreshCw size={12} /> Retry
              </button>
            )}
          </div>
        </div>
        {isActive && onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 22, height: 22, borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  /* ── Success ── */
  const isVideo   = job.mediaType === 'video';
  const imageUrl  = job.result?.imageUrl || job.imageUrl;
  const videoUrl  = job.result?.videoUrl || job.videoUrl;
  return (
    <div
      style={cardStyle}
      onMouseEnter={handleMouseEnterCard}
      onMouseLeave={handleMouseLeaveCard}
    >
      <div style={innerStyle}>
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
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
            {/* Play button — visible when not playing */}
            {!playing && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Play size={18} color="#fff" style={{ marginLeft: 2 }} />
                </div>
              </div>
            )}
            {/* VIDEO badge — always visible */}
            <div style={{
              position: 'absolute', top: 8, left: 8,
              backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
              borderRadius: 6, padding: '2px 7px',
              fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
              pointerEvents: 'none',
            }}>
              ▶ VIDEO{job.generateAudio ? ' 🔊' : ''}
            </div>
          </>
        ) : (
          <img
            src={imageUrl}
            alt={job.prompt}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 300ms ease',
          pointerEvents: hovered ? 'auto' : 'none',
        }}>
          {/* Left-top: mute toggle (video) or Regenerate (image history) */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6 }}>
            {isVideo && (
              <button
                onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
                title={muted ? 'Unmute' : 'Mute'}
                style={ICON_BTN}
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}
            {!isActive && !isVideo && onUseIdea && (
              <button onClick={onUseIdea} title="Regenerate" style={ICON_BTN}>
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* Right-top: Fullscreen/Zoom + Delete/Dismiss */}
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 5 }}>
            {isVideo && (
              <button onClick={handleFullscreen} title="Fullscreen" style={ICON_BTN}>
                <Maximize2 size={14} />
              </button>
            )}
            {!isVideo && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                title="View full size"
                style={ICON_BTN}
              >
                <Maximize2 size={14} />
              </button>
            )}
            {!isActive && onDelete && (
              <button onClick={onDelete} title="Delete" style={ICON_BTN}>
                <Trash2 size={14} />
              </button>
            )}
            {isActive && onDismiss && (
              <button onClick={onDismiss} title="Dismiss" style={ICON_BTN}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bottom bar */}
          <div style={{
            position: 'absolute', bottom: 10, left: 10, right: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 6,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 300ms ease, transform 300ms ease',
          }}>
            {/* Left: aspect ratio info */}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', flexShrink: 0 }}>
              {job.aspectRatio || '1:1'}
            </span>

            {/* Center: Use Idea CTA (image history only) */}
            {!isActive && !isVideo && onUseIdea && (
              <button
                onClick={onUseIdea}
                style={{
                  backgroundColor: '#fff', color: '#111827', borderRadius: 8,
                  border: 'none', cursor: 'pointer', padding: '6px 12px',
                  fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                  flexShrink: 0,
                }}
              >
                <RotateCcw size={11} />
                Use Idea
              </button>
            )}

            {/* Right: icon group */}
            <div style={{ display: 'flex', gap: 6 }}>
              {onDownload && (
                <button onClick={onDownload} title="Download" style={ICON_BTN}>
                  <ArrowDownToLine size={14} />
                </button>
              )}
              {onCopyUrl && (
                <button onClick={onCopyUrl} title="Copy URL" style={ICON_BTN}>
                  <Share2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Lightbox — portal to body, bypasses backdropFilter containing block ── */}
      {lightboxOpen && !isVideo && createPortal(
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Image — click stops propagation so only bg-click closes */}
          <img
            src={imageUrl}
            alt={job.prompt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 12,
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              cursor: 'default',
              userSelect: 'none',
            }}
          />

          {/* Close button — top right */}
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'fixed', top: 20, right: 20,
              width: 40, height: 40, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>

          {/* Download button — bottom right */}
          {onDownload && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              title="Download"
              style={{
                position: 'fixed', bottom: 28, right: 28,
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
              }}
            >
              <ArrowDownToLine size={15} />
              Download
            </button>
          )}

          {/* Prompt text — bottom center */}
          {job.prompt && (
            <p
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed', bottom: 28, left: '50%',
                transform: 'translateX(-50%)',
                maxWidth: '60vw',
                fontSize: 12, color: 'rgba(255,255,255,0.55)',
                margin: 0, textAlign: 'center',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {job.prompt}
            </p>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default GenerationCard;
