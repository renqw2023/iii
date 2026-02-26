import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Heart, Eye, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ROW_HEIGHT = 8;
const ROW_GAP = 8;

const SrefCard = ({ sref }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);
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

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      style={{ gridRowEnd: `span ${gridSpan}` }}
      className="liblib-card"
      onClick={() => navigate(`/explore/${sref._id}`)}
    >
      <div className="liblib-card-image" style={{ cursor: 'pointer', aspectRatio: imageLoaded ? undefined : '1/1' }}>
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

        {/* Sref 代码 badge */}
        {imageLoaded && (
          <span className="liblib-style-tag">--sref {sref.srefCode}</span>
        )}

        {/* Hover overlay */}
        {imageLoaded && (
          <div className="liblib-card-overlay">
            <div className="liblib-overlay-right">
              <span className="liblib-overlay-stats">
                <Heart size={11} /> {sref.likesCount || 0}
                <Eye size={11} style={{ marginLeft: '0.3rem' }} /> {sref.views || 0}
              </span>
              <div className="liblib-overlay-actions">
                <button
                  onClick={handleCopy}
                  className="liblib-action-btn"
                  title="Copy --sref code"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SrefCard;
