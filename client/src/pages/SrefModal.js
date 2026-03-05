import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Copy, Heart, X, Eye, Check, Loader2, Play } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { srefAPI } from '../services/srefApi';
import toast from 'react-hot-toast';

const SrefModal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [copied, setCopied] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [activeIdx, setActiveIdx] = useState(0);

    const handleClose = () => {
        if (location.state?.fromList) navigate(-1);
        else navigate('/explore');
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { data, isLoading } = useQuery(
        ['sref-detail', id],
        () => srefAPI.getById(id),
        { enabled: !!id }
    );

    const sref = data?.data?.post;
    const imageUrls = sref?.imageUrls || [];
    const videoUrls = sref?.videoUrls || [];

    // Build unified media list: images first, then videos
    const mediaItems = [
        ...imageUrls.map((url) => ({ type: 'image', url })),
        ...videoUrls.map((url) => ({ type: 'video', url })),
    ];
    const hasThumbs = mediaItems.length > 1;
    const active = mediaItems[activeIdx] || null;

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
        try { await srefAPI.toggleLike(id); }
        catch { toast.error('Please log in to like'); }
    };

    return createPortal(
        <>
            {sref && (
                <Helmet>
                    <title>--sref {sref.srefCode} - Style Gallery</title>
                    <meta name="description" content={sref.description || sref.title} />
                    {sref.previewImage && <meta property="og:image" content={sref.previewImage} />}
                </Helmet>
            )}

            {/* Lightbox */}
            {lightboxSrc && (
                <div className="dmodal-lightbox" onClick={() => setLightboxSrc(null)}>
                    <img src={lightboxSrc} alt="Preview" />
                </div>
            )}

            <div className="dmodal-backdrop" onClick={handleClose} />

            <div className="dmodal-container">
                <motion.div
                    className="dmodal-panel"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── Left: media viewer ── */}
                    <div className="dmodal-left">
                        {isLoading ? (
                            <div className="dmodal-loading">
                                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#8b5cf6', borderRadius: '50%' }} />
                            </div>
                        ) : mediaItems.length === 0 ? (
                            /* No media at all */
                            sref?.previewImage ? (
                                <img
                                    className="dmodal-single-img"
                                    src={sref.previewImage}
                                    alt={sref.title}
                                    onClick={() => setLightboxSrc(sref.previewImage)}
                                />
                            ) : (
                                <div className="dmodal-left-placeholder">
                                    <span style={{ fontSize: '4rem', opacity: 0.3 }}>🎨</span>
                                </div>
                            )
                        ) : mediaItems.length === 1 ? (
                            /* Single media — fill left panel */
                            active?.type === 'video' ? (
                                <video
                                    src={active.url}
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <img
                                    className="dmodal-single-img"
                                    src={active?.url}
                                    alt={`--sref ${sref?.srefCode}`}
                                    onClick={() => setLightboxSrc(active?.url)}
                                />
                            )
                        ) : (
                            /* Multiple media — main view + thumbnail strip */
                            <div className="dmodal-left-gallery">
                                {/* Main view */}
                                <div className="dmodal-main-view">
                                    {active?.type === 'video' ? (
                                        <video
                                            key={active.url}
                                            src={active.url}
                                            controls
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            key={active?.url}
                                            src={active?.url}
                                            alt={`--sref ${sref?.srefCode}`}
                                            onClick={() => setLightboxSrc(active?.url)}
                                        />
                                    )}
                                </div>

                                {/* Thumbnail strip */}
                                {hasThumbs && (
                                    <div className="dmodal-thumbs">
                                        {mediaItems.map((item, i) => (
                                            <div
                                                key={i}
                                                className={`dmodal-thumb ${i === activeIdx ? 'active' : ''}`}
                                                onClick={() => setActiveIdx(i)}
                                            >
                                                {item.type === 'image' ? (
                                                    <img src={item.url} alt={`thumb ${i}`} />
                                                ) : (
                                                    <>
                                                        <video src={item.url} muted playsInline preload="metadata"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <div className="dmodal-thumb-video-icon">
                                                            <Play size={14} fill="white" />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Right: info ── */}
                    <div className="dmodal-right">
                        {/* Header */}
                        <div className="dmodal-right-header">
                            <div className="dmodal-right-header-left">
                                <span style={{
                                    fontFamily: 'monospace', fontSize: '0.95rem',
                                    color: 'var(--text-primary)',
                                    background: 'rgba(139,92,246,0.15)',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                    borderRadius: 8, padding: '0.25rem 0.65rem',
                                }}>
                                    {sref ? `--sref ${sref.srefCode}` : '—'}
                                </span>
                            </div>
                            <button className="dmodal-close-btn" onClick={handleClose} title="Close (ESC)">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="dmodal-right-body">
                            {isLoading ? (
                                <div className="dmodal-loading">
                                    <Loader2 size={24} className="animate-spin" />
                                    <span>Loading...</span>
                                </div>
                            ) : !sref ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    <p>Style not found.</p>
                                    <button onClick={handleClose} className="detail-btn-primary" style={{ marginTop: '1rem' }}>Close</button>
                                </div>
                            ) : (
                                <>
                                    {sref.title && <h1 className="dmodal-title">{sref.title}</h1>}

                                    <div className="dmodal-stats">
                                        <span className="dmodal-stat"><Eye size={13} /> {sref.views || 0} views</span>
                                        <span className="dmodal-stat"><Heart size={13} /> {sref.likesCount || 0} likes</span>
                                        {mediaItems.length > 0 && (
                                            <span className="dmodal-stat" style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>
                                                {activeIdx + 1} / {mediaItems.length}
                                            </span>
                                        )}
                                    </div>

                                    {sref.description && (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                                            {sref.description}
                                        </p>
                                    )}

                                    {/* Tags */}
                                    {sref.tags?.length > 0 && (
                                        <div className="dmodal-tags">
                                            {sref.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="detail-tag"
                                                    onClick={() => { handleClose(); navigate(`/explore?tag=${encodeURIComponent(tag)}`); }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {sref && (
                            <div className="dmodal-right-footer">
                                <button className="dmodal-btn-primary" onClick={handleCopy}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy --sref'}
                                </button>
                                <button
                                    className={`dmodal-btn-icon ${sref.isLiked ? 'liked' : ''}`}
                                    onClick={handleLike}
                                    title={sref.isLiked ? 'Liked' : 'Like'}
                                >
                                    <Heart size={18} fill={sref.isLiked ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </>,
        document.body
    );
};

export default SrefModal;
