import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Copy, Heart, ArrowLeft, Eye, Check, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import SrefCard from '../components/Sref/SrefCard';
import { srefAPI } from '../services/srefApi';
import toast from 'react-hot-toast';

const SrefDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const { data, isLoading } = useQuery(
    ['sref-detail', id],
    () => srefAPI.getById(id),
    { enabled: !!id }
  );

  const sref = data?.data?.post;
  const related = data?.data?.related || [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`--sref ${sref.srefCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied!');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleLike = async () => {
    try {
      await srefAPI.toggleLike(id);
    } catch {
      toast.error('Please log in to like');
    }
  };

  if (isLoading) {
    return (
      <div className="detail-loading">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (!sref) {
    return (
      <div className="detail-not-found">
        <h2>Style Not Found</h2>
        <button onClick={() => navigate('/explore')} className="btn-primary mt-4">
          Back to Gallery
        </button>
      </div>
    );
  }

  const imageUrls = sref.imageUrls || [];
  const videoUrls = sref.videoUrls || [];

  return (
    <>
      <Helmet>
        <title>--sref {sref.srefCode} - Style Gallery</title>
        <meta name="description" content={sref.description || sref.title} />
      </Helmet>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxSrc(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)' }}
        >
          <img
            src={lightboxSrc}
            alt="Preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
          />
        </div>
      )}

      <div className="detail-page">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/explore')}
          className="detail-back-btn"
        >
          <ArrowLeft size={18} />
          <span>Back to Gallery</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 900, margin: '0 auto' }}
        >
          {/* 标题 + sref 代码行 */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sref.title && (
              <h1 className="detail-title" style={{ marginBottom: '0.75rem' }}>
                {sref.title}
              </h1>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'monospace', fontSize: '1.1rem',
                color: 'var(--text-primary)',
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 8, padding: '0.4rem 0.9rem',
              }}>
                --sref {sref.srefCode}
              </span>
              <button onClick={handleCopy} className="detail-btn-primary" style={{ gap: '0.4rem' }}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? 'Copied!' : 'Copy sref'}</span>
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem' }}>
                <Eye size={13} /> {sref.views || 0}
                <Heart size={13} style={{ marginLeft: '0.5rem' }} /> {sref.likesCount || 0}
              </span>
            </div>
          </div>

          {/* 图片网格 */}
          {imageUrls.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: imageUrls.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: '0.75rem',
              }}>
                {imageUrls.slice(0, 4).map((url, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ borderRadius: 10, overflow: 'hidden', cursor: 'zoom-in', background: 'rgba(255,255,255,0.04)' }}
                    onClick={() => setLightboxSrc(url)}
                  >
                    <img
                      src={url}
                      alt={`--sref ${sref.srefCode} #${i + 1}`}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                      loading={i < 2 ? 'eager' : 'lazy'}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* 视频 */}
          {videoUrls.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Videos
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: videoUrls.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: '0.75rem',
              }}>
                {videoUrls.slice(0, 4).map((url, i) => (
                  <video key={i} src={url} controls loop muted playsInline
                    style={{ width: '100%', borderRadius: 10, background: '#000', display: 'block' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 风格标签 */}
          {sref.tags && sref.tags.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {sref.tags.map((tag) => (
                  <span
                    key={tag}
                    className="detail-tag"
                    onClick={() => navigate(`/explore?tag=${encodeURIComponent(tag)}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Like 按钮 */}
          <div className="detail-actions" style={{ marginBottom: '3rem' }}>
            <button onClick={handleLike} className={`detail-btn-secondary ${sref.isLiked ? 'active' : ''}`}>
              <Heart size={16} fill={sref.isLiked ? 'currentColor' : 'none'} />
              <span>{sref.isLiked ? 'Liked' : 'Like'}</span>
            </button>
          </div>
        </motion.div>

        {/* 相关推荐 */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="detail-related"
          >
            <h2 className="detail-related-title">Related Styles</h2>
            <div className="gallery-grid">
              {related.map((r) => (
                <SrefCard key={r._id} sref={r} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default SrefDetail;
