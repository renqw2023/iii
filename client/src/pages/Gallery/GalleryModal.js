import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Copy, Heart, Bookmark, X, ExternalLink, Eye, Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { galleryAPI } from '../../services/galleryApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const MODEL_LABELS = {
    nanobanana: 'NanoBanana Pro',
    midjourney: 'Midjourney',
    gptimage: 'GPT Image',
};

const GalleryModal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const handleClose = () => {
        if (location.state?.fromList) navigate(-1);
        else navigate('/gallery');
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
        ['gallery-detail', id],
        () => galleryAPI.getById(id),
        { enabled: !!id }
    );

    const prompt = data?.data?.prompt;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt.prompt);
            galleryAPI.recordCopy(id);
            toast.success(t('gallery.actions.copySuccess'));
        } catch {
            toast.error(t('gallery.actions.copyFailed'));
        }
    };

    const handleLike = async () => {
        try {
            await galleryAPI.toggleLike(id);
        } catch {
            toast.error(t('gallery.actions.loginRequired'));
        }
    };

    const handleFavorite = async () => {
        try {
            await galleryAPI.toggleFavorite(id);
        } catch {
            toast.error(t('gallery.actions.loginRequired'));
        }
    };

    const handleShare = async () => {
        try {
            await navigator.share({ title: prompt.title, url: window.location.href });
        } catch {
            navigator.clipboard.writeText(window.location.href);
            toast.success(t('gallery.actions.linkCopied'));
        }
    };

    return createPortal(
        <>
            {prompt && (
                <Helmet>
                    <title>{prompt.title} - AI Prompts Gallery</title>
                    <meta name="description" content={prompt.prompt?.substring(0, 160)} />
                    {prompt.previewImage && <meta property="og:image" content={prompt.previewImage} />}
                </Helmet>
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
                    {/* ── Left: image ── */}
                    <div className="dmodal-left">
                        {isLoading ? (
                            <div className="dmodal-loading">
                                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#6366f1', borderRadius: '50%' }} />
                            </div>
                        ) : prompt?.previewImage ? (
                            <img src={prompt.previewImage} alt={prompt.title} />
                        ) : (
                            <div className="dmodal-left-placeholder">
                                <span style={{ fontSize: '4rem', opacity: 0.3 }}>🎨</span>
                            </div>
                        )}
                    </div>

                    {/* ── Right: info ── */}
                    <div className="dmodal-right">
                        {/* Header */}
                        <div className="dmodal-right-header">
                            <div className="dmodal-right-header-left">
                                {prompt && (
                                    <span className="detail-model-badge" style={{ margin: 0 }}>
                                        {MODEL_LABELS[prompt.model] || prompt.model}
                                    </span>
                                )}
                                {prompt?.sourceAuthor && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                        @{prompt.sourceAuthor}
                                    </span>
                                )}
                            </div>
                            <button className="dmodal-close-btn" onClick={handleClose} title="Close (ESC)">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="dmodal-right-body">
                            {isLoading ? (
                                <div className="dmodal-loading">
                                    <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border-color)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
                                    <span>Loading...</span>
                                </div>
                            ) : !prompt ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    <p>Prompt not found.</p>
                                    <button onClick={handleClose} className="detail-btn-primary" style={{ marginTop: '1rem' }}>Close</button>
                                </div>
                            ) : (
                                <>
                                    {/* Title */}
                                    <h1 className="dmodal-title">{prompt.title}</h1>

                                    {/* Stats */}
                                    <div className="dmodal-stats">
                                        <span className="dmodal-stat"><Eye size={13} /> {prompt.views || 0} views</span>
                                        <span className="dmodal-stat"><Heart size={13} /> {prompt.likesCount || 0} likes</span>
                                        <span className="dmodal-stat"><Copy size={13} /> {prompt.copyCount || 0} copies</span>
                                    </div>

                                    {/* Prompt text */}
                                    <div className="dmodal-prompt-box">
                                        <div className="dmodal-prompt-header">
                                            <span>Prompt</span>
                                            <button onClick={handleCopy} className="detail-copy-btn">
                                                <Copy size={13} />
                                                <span>Copy</span>
                                            </button>
                                        </div>
                                        <p className="dmodal-prompt-text">{prompt.prompt}</p>
                                    </div>

                                    {/* Tags */}
                                    {prompt.tags?.length > 0 && (
                                        <div className="dmodal-tags">
                                            {prompt.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="detail-tag"
                                                    onClick={() => { handleClose(); navigate(`/gallery?tag=${tag}`); }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Source */}
                                    {prompt.sourceUrl && (
                                        <div className="dmodal-source">
                                            <ExternalLink size={13} />
                                            <span>Source:</span>
                                            <a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer">
                                                {prompt.sourcePlatform || 'External'}
                                            </a>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {prompt && (
                            <div className="dmodal-right-footer">
                                <button className="dmodal-btn-primary" onClick={handleCopy}>
                                    <Copy size={16} />
                                    {t('gallery.detail.copyPrompt')}
                                </button>
                                <button
                                    className={`dmodal-btn-icon ${prompt.isLiked ? 'liked' : ''}`}
                                    onClick={handleLike}
                                    title={prompt.isLiked ? t('gallery.actions.liked') : t('gallery.actions.like')}
                                >
                                    <Heart size={18} fill={prompt.isLiked ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    className={`dmodal-btn-icon ${prompt.isFavorited ? 'favorited' : ''}`}
                                    onClick={handleFavorite}
                                    title={prompt.isFavorited ? t('gallery.actions.favorited') : t('gallery.actions.favorite')}
                                >
                                    <Bookmark size={18} fill={prompt.isFavorited ? 'currentColor' : 'none'} />
                                </button>
                                <button className="dmodal-btn-icon" onClick={handleShare} title="Share">
                                    <Share2 size={18} />
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

export default GalleryModal;
