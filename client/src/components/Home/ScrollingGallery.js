import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { srefAPI } from '../../services/srefApi';

const SCROLL_STYLES = `
  @keyframes scrollUpA {
    0%   { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  @keyframes scrollUpB {
    0%   { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  .sg-col-a {
    animation: scrollUpA 70s linear infinite;
    will-change: transform;
  }
  .sg-col-b {
    animation: scrollUpB 90s linear infinite -27s;
    will-change: transform;
  }
  .sg-col-a:hover,
  .sg-col-b:hover {
    animation-play-state: paused;
  }
  .sg-card {
    position: relative;
    overflow: hidden;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 4px;
  }
  .sg-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }
  .sg-card:hover img {
    transform: scale(1.04);
  }
  .sg-card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .sg-card:hover .sg-card-overlay {
    opacity: 1;
  }
  .sg-card-overlay span {
    color: #fff;
    font-size: 11px;
    font-family: monospace;
    letter-spacing: 0.04em;
    padding: 4px 8px;
    background: rgba(0,0,0,0.4);
    border-radius: 4px;
    max-width: 90%;
    text-align: center;
    word-break: break-all;
  }
`;

function SkeletonCard({ height }) {
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 8,
        marginBottom: 8,
        background: 'linear-gradient(90deg, #1e293b 25%, #263348 50%, #1e293b 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  );
}

const ScrollingGallery = () => {
  const navigate = useNavigate();
  const colARef = useRef(null);
  const colBRef = useRef(null);

  const { data, isLoading } = useQuery(
    ['hero-sref-scroll'],
    () => srefAPI.getPosts({ page: 1, limit: 40, sort: 'newest' }),
    { staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const posts = data?.data?.posts || data?.data?.data || [];

  // Split into two columns: even indices → colA, odd indices → colB
  const colA = posts.filter((_, i) => i % 2 === 0);
  const colB = posts.filter((_, i) => i % 2 !== 0);

  const handleCardClick = (post) => {
    navigate('/explore/' + post._id);
  };

  const renderCard = (post) => (
    <div
      key={post._id}
      className="sg-card"
      style={{ aspectRatio: '1 / 1' }}
      onClick={() => handleCardClick(post)}
    >
      <img
        src={post.previewImage}
        alt={`--sref ${post.srefCode || ''}`}
        loading="lazy"
      />
      <div className="sg-card-overlay">
        <span>--sref {post.srefCode}</span>
      </div>
    </div>
  );

  if (isLoading || posts.length === 0) {
    const skeletonHeights = [180, 220, 160, 200, 190, 170];
    return (
      <div style={{ display: 'flex', gap: 8, height: '100%', padding: '0 8px' }}>
        <div style={{ flex: 1 }}>
          {skeletonHeights.slice(0, 3).map((h, i) => (
            <SkeletonCard key={i} height={h} />
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {skeletonHeights.slice(3).map((h, i) => (
            <SkeletonCard key={i} height={h} />
          ))}
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // Duplicate each column for seamless infinite loop
  const colAItems = [...colA, ...colA];
  const colBItems = [...colB, ...colB];

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        gap: 4,
        height: '100%',
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{SCROLL_STYLES}</style>

      {/* Top gradient mask */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(to bottom, #08000f 0%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      {/* Bottom gradient mask */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(to top, #08000f 0%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Column A */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div ref={colARef} className="sg-col-a">
          {colAItems.map((post, i) => (
            <div key={`a-${i}-${post._id}`}>{renderCard(post)}</div>
          ))}
        </div>
      </div>

      {/* Column B — phase-shifted via animation-delay for parallax */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div ref={colBRef} className="sg-col-b">
          {colBItems.map((post, i) => (
            <div key={`b-${i}-${post._id}`}>{renderCard(post)}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollingGallery;
