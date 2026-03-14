import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Heart, Eye, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import FavoriteButton from '../UI/FavoriteButton';
import '../Post/LiblibStyleCard.css';

const ROW_HEIGHT = 8;
const ROW_GAP = 8;

const SrefCard = ({ sref }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`--sref ${sref.srefCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success('Copied!');
    } catch {
      toast.error('Copy failed');
    }
  };

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
            src={sref.previewImage}
            alt={`--sref ${sref.srefCode}`}
            loading="lazy"
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
              {/* 左列：sref code + CTA */}
              <div className="liblib-action-left">
                <span className="liblib-sref-code">--sref {sref.srefCode}</span>
                <button className="liblib-cta-btn" onClick={handleCopy}>
                  {copied
                    ? <><Check size={11} style={{ marginRight: '0.3rem' }} /> Copied!</>
                    : <><Copy size={11} style={{ marginRight: '0.3rem' }} /> Copy Code</>
                  }
                </button>
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
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SrefCard;
