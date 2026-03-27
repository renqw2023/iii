import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const W = 800;
const H = 1000;
const GRID_H = 520; // top image grid height

const SrefShareCard = React.forwardRef(({ sref }, ref) => {
  const imgs = (sref.imageUrls || []).slice(0, 4);
  const shareUrl = `https://iii.pics/explore/${sref._id}`;
  const tags = (sref.tags || []).slice(0, 4);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: -9999,
        top: 0,
        width: W,
        height: H,
        background: '#0f0f0f',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        flexShrink: 0,
      }}
    >
      {/* Image Grid — 2×2 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: GRID_H,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: imgs.length <= 2 ? '1fr' : '1fr 1fr',
          gap: 3,
          background: '#0f0f0f',
        }}
      >
        {imgs.length > 0 ? (
          imgs.map((url, i) => (
            <img
              key={i}
              src={url}
              crossOrigin="anonymous"
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          ))
        ) : (
          /* Fallback gradient when no images */
          <div
            style={{
              gridColumn: '1 / -1',
              gridRow: '1 / -1',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            }}
          />
        )}
      </div>

      {/* Gradient fade from grid into info section */}
      <div
        style={{
          position: 'absolute',
          top: GRID_H - 60,
          left: 0,
          width: W,
          height: 60,
          background: 'linear-gradient(to bottom, transparent, #0f0f0f)',
          pointerEvents: 'none',
        }}
      />

      {/* Info Section */}
      <div
        style={{
          position: 'absolute',
          top: GRID_H,
          left: 0,
          width: W,
          height: H - GRID_H,
          background: '#0f0f0f',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '28px 40px 28px',
          boxSizing: 'border-box',
        }}
      >
        {/* sref code — hero text */}
        <div>
          <div style={{ color: '#52525b', fontSize: 12, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
            Midjourney Style Reference
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: 40,
              fontWeight: 800,
              fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
              letterSpacing: -1,
              lineHeight: 1.1,
            }}
          >
            --sref {sref.srefCode}
          </div>

          {/* Title if present */}
          {sref.title && (
            <div style={{ color: '#a1a1aa', fontSize: 15, marginTop: 10, lineHeight: 1.4 }}>
              {sref.title}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    color: '#71717a',
                    fontSize: 12,
                    background: '#1c1c1e',
                    border: '1px solid #27272a',
                    borderRadius: 4,
                    padding: '3px 10px',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: brand + QR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #1c1c1e',
            paddingTop: 20,
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✦</span>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: 1 }}>
                III.PICS
              </div>
              <div style={{ color: '#52525b', fontSize: 11, marginTop: 1 }}>
                iii.pics/explore
              </div>
            </div>
          </div>

          {/* QR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#52525b', fontSize: 10, marginBottom: 2 }}>扫码查看详情</div>
              <div style={{ color: '#3f3f46', fontSize: 10 }}>复制 sref 代码</div>
            </div>
            <div
              style={{
                background: '#fff',
                borderRadius: 6,
                padding: 4,
                lineHeight: 0,
              }}
            >
              <QRCodeSVG value={shareUrl} size={60} bgColor="#ffffff" fgColor="#0f0f0f" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SrefShareCard.displayName = 'SrefShareCard';
export default SrefShareCard;
