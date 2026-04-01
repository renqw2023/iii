import React from 'react';
import { useNavigate } from 'react-router-dom';

const GRID_STYLES = `
  .lgrid-wrap {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }
  @media (max-width: 1024px) { .lgrid-wrap { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px)  { .lgrid-wrap { grid-template-columns: repeat(2, 1fr); } }

  .lgrid-card {
    position: relative;
    border-radius: 0.5rem;
    overflow: hidden;
    background: #1e293b;
    cursor: pointer;
    aspect-ratio: 1 / 1;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .lgrid-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .lgrid-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s;
  }
  .lgrid-card:hover img { transform: scale(1.05); }
  .lgrid-card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.60);
    display: flex;
    align-items: flex-end;
    padding: 0.6rem;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .lgrid-card:hover .lgrid-card-overlay { opacity: 1; }
  .lgrid-card-label {
    font-size: 0.72rem;
    color: #e2e8f0;
    font-family: monospace;
    background: rgba(0,0,0,0.5);
    padding: 2px 6px;
    border-radius: 3px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lgrid-skeleton {
    background: linear-gradient(90deg, #1e293b 25%, #263348 50%, #1e293b 75%);
    background-size: 200% 100%;
    animation: lgridShimmer 1.4s infinite;
    border-radius: 0.5rem;
    aspect-ratio: 1 / 1;
  }
  @keyframes lgridShimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

/**
 * Shared gallery grid for landing pages
 * @param {Object[]} items
 * @param {'sref'|'gallery'|'seedance'} type
 * @param {boolean} isLoading
 */
const LandingGalleryGrid = ({ items = [], type = 'gallery', isLoading = false }) => {
  const navigate = useNavigate();

  const getImageUrl = (item) => item.previewImage || item.imageUrl || item.thumbnailUrl || '';
  const getLabel    = (item) => {
    if (type === 'sref')     return `--sref ${item.srefCode || ''}`;
    if (type === 'seedance') return item.title || item.prompt?.substring(0, 40) || '';
    return item.prompt?.substring(0, 40) || item.title || '';
  };
  const getHref = (item) => {
    if (type === 'sref')     return `/explore/${item._id}`;
    if (type === 'seedance') return `/seedance/${item._id}`;
    return `/gallery/${item._id}`;
  };

  if (isLoading) {
    return (
      <div className="lgrid-wrap">
        <style>{GRID_STYLES}</style>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="lgrid-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="lgrid-wrap">
      <style>{GRID_STYLES}</style>
      {items.map((item) => (
        <div
          key={item._id}
          className="lgrid-card"
          onClick={() => navigate(getHref(item))}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate(getHref(item))}
          aria-label={getLabel(item)}
        >
          <img
            src={getImageUrl(item)}
            alt={getLabel(item)}
            loading="lazy"
            decoding="async"
          />
          <div className="lgrid-card-overlay">
            <span className="lgrid-card-label">{getLabel(item)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LandingGalleryGrid;
