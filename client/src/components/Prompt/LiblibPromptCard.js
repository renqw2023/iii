import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { promptAPI } from '../../services/enhancedApi';
import { useAuth } from '../../contexts/AuthContext';
import './LiblibPromptCard.css';

const ROW_HEIGHT = 8; // must match grid-auto-rows in gallery.css
const ROW_GAP = 8;

const LiblibPromptCard = ({ prompt }) => {
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(prompt?.isLiked || false);
  const [likesCount, setLikesCount] = useState(() => {
    const raw = Number(prompt?.likesCount || 0);
    return isNaN(raw) || raw < 0 ? 0 : Math.floor(raw);
  });
  const [copyCount, setCopyCount] = useState(prompt?.copyCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  // CSS Grid masonry span calculation (mirrors LiblibStyleCard / GalleryCard logic)
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

  const handleLike = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    if (isLiking) return;
    setIsLiking(true);
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiking(false);
  };

  const handleCopy = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.prompt || prompt.content || '');
      await promptAPI.copyPrompt(prompt._id);
      setCopyCount(prev => prev + 1);
      toast.success('Prompt copied!');
    } catch { toast.error('Copy failed'); }
  };

  const getDifficultyColor = (d) => ({
    beginner: 'rgba(34,197,94,0.7)',
    intermediate: 'rgba(234,179,8,0.7)',
    advanced: 'rgba(239,68,68,0.7)',
  }[d] || 'rgba(148,163,184,0.5)');

  const getCategoryIcon = (c) => ({
    character: '👤', landscape: '🏞️', architecture: '🏛️',
    abstract: '🎨', fantasy: '🧙', scifi: '🚀',
    portrait: '📸', animal: '🐾', object: '📦',
  }[c] || '📝');

  if (!prompt || typeof prompt !== 'object') return null;

  const firstMedia = prompt?.media?.[0];
  const imageUrl = firstMedia ? (firstMedia.thumbnail || firstMedia.url) : null;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      style={{ gridRowEnd: `span ${gridSpan}` }}
      className="liblib-prompt-card"
    >
      <Link to={`/prompt/${prompt._id}`} className="liblib-prompt-card__link">
        {/* 图片区域 — 自然高度 */}
        <div className="liblib-prompt-card__image-container">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={prompt.title}
              className="liblib-prompt-card__image"
              loading="lazy"
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="liblib-prompt-card__placeholder">
              <div className="liblib-prompt-card__placeholder-icon">
                {getCategoryIcon(prompt.category)}
              </div>
              <div className="liblib-prompt-card__placeholder-text">
                {prompt.category || 'Prompt'}
              </div>
            </div>
          )}

          {/* 左上角标签 */}
          <div className="liblib-prompt-card__tags">
            <span className="liblib-prompt-card__prompt-tag">PROMPT</span>
            {prompt.difficulty && (
              <span
                className="liblib-prompt-card__difficulty-tag"
                style={{ background: getDifficultyColor(prompt.difficulty) }}
              >
                {prompt.difficulty.toUpperCase()}
              </span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="liblib-prompt-card__overlay">
            <span className="liblib-prompt-card__author">
              {prompt?.author?.username ? `@${prompt.author.username}` : ''}
            </span>
            <div className="liblib-prompt-card__overlay-right">
              <span className="liblib-prompt-card__stats">
                <Heart size={11} /> {likesCount}
                <Eye size={11} style={{ marginLeft: '0.3rem' }} /> {prompt.views || 0}
                <Copy size={11} style={{ marginLeft: '0.3rem' }} /> {copyCount}
              </span>
              <div className="liblib-prompt-card__actions">
                <button
                  onClick={handleLike}
                  className={`liblib-prompt-card__action-btn ${isLiked ? 'liked' : ''}`}
                >
                  <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                <button onClick={handleCopy} className="liblib-prompt-card__action-btn">
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default LiblibPromptCard;
