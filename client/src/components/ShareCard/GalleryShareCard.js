import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const W = 800;
const H = 1000;
const STRIP_H = 96; // bottom brand strip height

const GalleryShareCard = React.forwardRef(({ prompt }, ref) => {
  const imgSrc = prompt.previewImage || (prompt.images && prompt.images[0]) || '';
  const shareUrl = `https://iii.pics/gallery/${prompt._id}`;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: -9999,
        top: 0,
        width: W,
        height: H,
        background: '#0a0a0a',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        flexShrink: 0,
      }}
    >
      {/* Image — fills the card */}
      {imgSrc ? (
        <img
          src={imgSrc}
          crossOrigin="anonymous"
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H - STRIP_H,
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H - STRIP_H,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          }}
        />
      )}

      {/* Gradient fade into bottom strip */}
      <div
        style={{
          position: 'absolute',
          bottom: STRIP_H,
          left: 0,
          width: W,
          height: 120,
          background: 'linear-gradient(to bottom, transparent, #0a0a0a)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom brand strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: W,
          height: STRIP_H,
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          boxSizing: 'border-box',
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
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
              III.PICS
            </div>
            <div style={{ color: '#71717a', fontSize: 11, marginTop: 1 }}>
              AI Gallery &amp; Style Reference
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#71717a', fontSize: 10, marginBottom: 2 }}>扫码查看原图</div>
            <div style={{ color: '#52525b', fontSize: 10 }}>iii.pics</div>
          </div>
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              padding: 4,
              lineHeight: 0,
            }}
          >
            <QRCodeSVG value={shareUrl} size={56} bgColor="#ffffff" fgColor="#0a0a0a" />
          </div>
        </div>
      </div>
    </div>
  );
});

GalleryShareCard.displayName = 'GalleryShareCard';
export default GalleryShareCard;
