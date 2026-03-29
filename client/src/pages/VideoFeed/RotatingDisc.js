import React, { useEffect, useRef } from 'react';

const DISC_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

const RotatingDisc = ({ thumbnailUrl, isPlaying, seed = 0 }) => {
  const discRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);

  // Manual RAF-based rotation so we can pause/resume seamlessly
  useEffect(() => {
    const el = discRef.current;
    if (!el) return;

    const tick = () => {
      angleRef.current = (angleRef.current + 0.3) % 360;
      el.style.transform = `rotate(${angleRef.current}deg)`;
      animRef.current = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      animRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(animRef.current);
    }

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  const fallbackGradient = DISC_COLORS[seed % DISC_COLORS.length];

  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      {/* Outer ring */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }} />

      {/* Spinning disc */}
      <div
        ref={discRef}
        style={{
          width: '100%', height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          background: fallbackGradient,
        }}
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>

      {/* Center hole */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 10, height: 10,
        borderRadius: '50%',
        backgroundColor: '#000',
        border: '1.5px solid rgba(255,255,255,0.25)',
      }} />
    </div>
  );
};

export default RotatingDisc;
