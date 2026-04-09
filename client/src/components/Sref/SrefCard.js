import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, ExternalLink, Zap, ImagePlus, Braces } from 'lucide-react';
import FavoriteButton from '../UI/FavoriteButton';
import { useGeneration } from '../../contexts/GenerationContext';
import '../Post/LiblibStyleCard.css';

const ROW_HEIGHT = 8;
const ROW_GAP = 8;

const AI_BTN = {
  display: 'flex', alignItems: 'center', gap: 3,
  padding: '3px 7px', borderRadius: 20, border: 'none', cursor: 'pointer',
  fontSize: 10, fontWeight: 600, color: '#fff',
  backgroundColor: 'rgba(255,255,255,0.18)',
  transition: 'background-color 120ms',
};

const SrefCard = ({ sref, initialFavorited = false }) => {
  const navigate = useNavigate();
  const { setPrefill } = useGeneration();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredThumb, setHoveredThumb] = useState(null);
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const [gridSpan, setGridSpan] = useState(38);
  const naturalSize = useRef(null);

  const calcSpan = useCallback((colWidth) => {
    const { w, h } = naturalSize.current || {};
    if (w > 0 && h > 0 && colWidth > 0) {
      const renderedH = Math.round((h / w) * colWidth);
      setGridSpan(Math.ceil((renderedH + ROW_GAP) / ROW_HEIGHT));
    }
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const colWidth = entries[0]?.contentRect?.width;
      if (colWidth && naturalSize.current) calcSpan(colWidth);
    });
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, [calcSpan]);

  const handleImageLoad = (e) => {
    setImageLoaded(true);
    const img = e.currentTarget;
    if (img && cardRef.current) {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > 0 && h > 0) {
        naturalSize.current = { w, h };
        calcSpan(cardRef.current.offsetWidth);
      }
    }
  };

  const handleAIAction = useCallback((e, type, imageUrl) => {
    e.stopPropagation();
    if (type === 'reverse')   setPrefill({ tab: 'reverse', imageUrl });
    if (type === 'reference') setPrefill({ tab: 'reverse', addReferenceUrl: imageUrl });
    if (type === 'json')      setPrefill({ tab: 'json',    imageUrl });
  }, [setPrefill]);

  const handleThumbDragStart = useCallback((e, imgUrl) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ image: imgUrl }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragStart = useCallback((e) => {
    if (sref.previewImage) {
      e.dataTransfer.setData('application/json', JSON.stringify({ image: sref.previewImage }));
      e.dataTransfer.effectAllowed = 'copy';
    }
  }, [sref.previewImage]);

  const handleMouseMove = useCallback((e) => {
    const el = cardRef.current;
    if (!el || !glowRef.current) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    glowRef.current.style.background =
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.10) 0%, transparent 60%)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.background = 'none';
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      draggable={!!sref.previewImage}
      onDragStart={handleDragStart}
      style={{ gridRowEnd: `span ${gridSpan}` }}
      className="liblib-card"
      onClick={() => navigate(`/explore/${sref._id}`, { state: { fromList: true } })}
    >
      <div className="liblib-card-image" style={{ cursor: 'pointer' }}>
        {/* Spotlight glow */}
        <div ref={glowRef} className="liblib-spotlight" />

        {sref.previewImage ? (
          <img
            draggable={false}
            src={sref.previewImage}
            alt={`--sref ${sref.srefCode}`}
            loading="lazy"
            decoding="async"
            onLoad={handleImageLoad}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.4s ease-in' }}
          />
        ) : (
          <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2rem', opacity: 0.3 }}>🎨</span>
          </div>
        )}

        {/* Hover overlay */}
        {imageLoaded && (
          <div className="liblib-card-overlay">
            <div className="liblib-card-action-bar">
              {/* 左列：sref code */}
              <div className="liblib-action-left">
                <span className="liblib-sref-code">--sref {sref.srefCode}</span>
              </div>
              {/* 右列：stats + Favorite */}
              <div className="liblib-overlay-right">
                <span className="liblib-overlay-stats">
                  <Heart size={11} /> {sref.likesCount || 0}
                  <Eye size={11} style={{ marginLeft: '0.3rem' }} /> {sref.views || 0}
                </span>
                <div className="liblib-overlay-actions">
                  <FavoriteButton
                    targetType="sref"
                    targetId={sref._id}
                    initialFavorited={initialFavorited}
                    className="liblib-action-btn"
                    size={13}
                  />
                  {sref.sourceUrl && (
                    <button
                      className="liblib-action-btn"
                      title="View on X"
                      onClick={e => { e.stopPropagation(); window.open(sref.sourceUrl, '_blank', 'noopener,noreferrer'); }}
                    >
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* AI action buttons */}
            {sref.previewImage && (
              <div style={{ display: 'flex', gap: 4, padding: '0 8px 6px' }}>
                <button style={AI_BTN} onClick={e => handleAIAction(e, 'reverse', sref.previewImage)}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.30)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'; }}>
                  <Zap size={10} /> Reverse
                </button>
                <button style={AI_BTN} onClick={e => handleAIAction(e, 'reference', sref.previewImage)}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.30)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'; }}>
                  <ImagePlus size={10} /> Ref
                </button>
                <button style={AI_BTN} onClick={e => handleAIAction(e, 'json', sref.previewImage)}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.30)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'; }}>
                  <Braces size={10} /> JSON
                </button>
              </div>
            )}

            {/* Multi-image thumbnail strip */}
            {sref.images?.length > 1 && (
              <div style={{ display: 'flex', gap: 4, padding: '0 8px 8px', overflowX: 'auto' }}
                onClick={e => e.stopPropagation()}>
                {sref.images.map((filename, i) => {
                  const imgUrl = `/output/sref_${sref.srefCode}/images/${filename}`;
                  return (
                    <div
                      key={i}
                      draggable
                      onDragStart={e => handleThumbDragStart(e, imgUrl)}
                      onMouseEnter={() => setHoveredThumb(i)}
                      onMouseLeave={() => setHoveredThumb(null)}
                      style={{ position: 'relative', flexShrink: 0, cursor: 'grab' }}
                    >
                      <img
                        draggable={false}
                        src={imgUrl}
                        alt={`sref ${sref.srefCode} image ${i + 1}`}
                        style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 6,
                          border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                      {hoveredThumb === i && (
                        <div style={{
                          position: 'absolute', bottom: 'calc(100% + 4px)', left: 0,
                          display: 'flex', gap: 2, padding: '3px 4px',
                          backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 8,
                          zIndex: 10, whiteSpace: 'nowrap',
                        }}>
                          <button style={{ ...AI_BTN, padding: '2px 5px', fontSize: 9 }}
                            onClick={e => handleAIAction(e, 'reverse', imgUrl)}>
                            <Zap size={9} />
                          </button>
                          <button style={{ ...AI_BTN, padding: '2px 5px', fontSize: 9 }}
                            onClick={e => handleAIAction(e, 'reference', imgUrl)}>
                            <ImagePlus size={9} />
                          </button>
                          <button style={{ ...AI_BTN, padding: '2px 5px', fontSize: 9 }}
                            onClick={e => handleAIAction(e, 'json', imgUrl)}>
                            <Braces size={9} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SrefCard;
