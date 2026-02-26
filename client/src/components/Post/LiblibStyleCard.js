import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { enhancedPostAPI } from '../../services/enhancedApi';
import { useAuth } from '../../contexts/AuthContext';
import './LiblibStyleCard.css';

const ROW_HEIGHT = 8; // must match grid-auto-rows in gallery.css
const ROW_GAP = 8;

const LiblibStyleCard = ({ post }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [likesCount, setLikesCount] = useState(() => {
    const raw = Number(post?.likesCount || 0);
    return isNaN(raw) || raw < 0 ? 0 : Math.floor(raw);
  });
  const [isLiking, setIsLiking] = useState(false);

  // CSS Grid masonry span calculation (mirrors GalleryCard logic)
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
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error(t('postCard.errors.loginRequired')); return; }
    if (isLiking) return;
    setIsLiking(true);
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    try {
      await enhancedPostAPI.likePost(post._id);
    } catch {
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard?.writeText(url).then(() => toast.success(t('postCard.messages.linkCopied')));
  };

  const getStyleTag = () => {
    const sp = post?.styleParams;
    if (!sp) return null;
    return sp.version ? `v${sp.version}` : sp.style || sp.aspect || 'MJ';
  };

  if (!post || typeof post !== 'object') return null;

  // 获取图片 URL
  const firstMedia = post?.media?.[0];
  let imageUrl = null;
  if (firstMedia) {
    imageUrl = (firstMedia.type === 'video' && firstMedia.thumbnail)
      ? firstMedia.thumbnail
      : firstMedia.url;
  }

  const styleTag = getStyleTag();

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      style={{ gridRowEnd: `span ${gridSpan}` }}
      className="liblib-card"
    >
      <Link to={`/post/${post._id || 'unknown'}`} className="block">
        {/* 图片区域 — 自然高度，无固定尺寸 */}
        <div className="liblib-card-image">
          {imageUrl ? (
            <img src={imageUrl} alt={post.title} loading="lazy" onLoad={handleImageLoad} />
          ) : (
            <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2rem', opacity: 0.3 }}>🎨</span>
            </div>
          )}

          {/* 风格标签 */}
          {styleTag && <span className="liblib-style-tag">{styleTag}</span>}

          {/* Hover overlay */}
          <div className="liblib-card-overlay">
            <span className="liblib-overlay-author">
              {post?.author?.username ? `@${post.author.username}` : ''}
            </span>
            <div className="liblib-overlay-right">
              <span className="liblib-overlay-stats">
                <Heart size={11} /> {likesCount}
                <Eye size={11} style={{ marginLeft: '0.3rem' }} /> {post.views || 0}
              </span>
              <div className="liblib-overlay-actions">
                <button
                  onClick={handleLike}
                  className={`liblib-action-btn ${isLiked ? 'liked' : ''}`}
                  title={t('postCard.like')}
                >
                  <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={handleShare}
                  className="liblib-action-btn"
                  title={t('postCard.share')}
                >
                  <Share2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default LiblibStyleCard;
