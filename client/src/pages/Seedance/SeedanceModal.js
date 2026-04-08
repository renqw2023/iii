import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Copy, Heart, Bookmark, X, Eye, Share2, Film, ExternalLink, User, Languages, Loader2, Wand2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { seedanceAPI, getVideoSrc, getThumbnailSrc } from '../../services/seedanceApi';
import { favoritesAPI } from '../../services/favoritesApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useGeneration } from '../../contexts/GenerationContext';
import { useAuth } from '../../contexts/AuthContext';

const SeedanceModal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { setPrefill } = useGeneration();
    const { isAuthenticated, openLoginModal } = useAuth();
    const [localFavorited, setLocalFavorited] = useState(false);

    const [showTranslated, setShowTranslated] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [videoLoading, setVideoLoading] = useState(true);
    const [promptExpanded, setPromptExpanded] = useState(false);
    const [promptOverflows, setPromptOverflows] = useState(false);
    const promptTextRef = useRef(null);

    const handleClose = () => {
        if (location.state?.fromList) navigate(-1);
        else navigate('/seedance');
    };

    useEffect(() => {
        // 不锁定 body scroll — modal 有全屏 backdrop 阻止背景交互
        // overflow:hidden 会导致 Chrome 在移除时重置 scrollY 到 0
    }, []);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { data, isLoading } = useQuery(
        ['seedance-detail', id],
        () => seedanceAPI.getById(id),
        { enabled: !!id }
    );

    const prompt = data?.data?.prompt;

    // Similar Videos — 同 category，排除自身，最多 4 条
    const { data: similarData } = useQuery(
        ['seedance-similar', prompt?.category],
        () => seedanceAPI.getPrompts({ category: prompt.category, limit: 8, sort: 'newest' }),
        { enabled: !!prompt?.category, staleTime: 10 * 60 * 1000 }
    );
    const similarItems = (similarData?.data?.prompts || []).filter(p => p._id !== id).slice(0, 4);

    // 从 Favorites 集合查询真实收藏状态
    useEffect(() => {
        if (!isAuthenticated || !id) return;
        favoritesAPI.check('seedance', [id])
            .then(res => { setLocalFavorited(!!(res.data?.data?.[id])); })
            .catch(() => {});
    }, [id, isAuthenticated]);

    // Prompt 溢出检测：切换 prompt / 翻译时重置折叠状态并重新测量
    useEffect(() => {
        setPromptExpanded(false);
        const el = promptTextRef.current;
        if (!el) return;
        const rafId = requestAnimationFrame(() => {
            setPromptOverflows(el.scrollHeight > el.clientHeight + 2);
        });
        return () => cancelAnimationFrame(rafId);
    }, [prompt?.prompt, showTranslated, translatedText]);

    const handleCopy = async () => {
        try {
            const textToCopy = showTranslated && translatedText ? translatedText : prompt.prompt;
            await navigator.clipboard.writeText(textToCopy);
            seedanceAPI.recordCopy(id);
            toast.success(t('seedance.actions.copySuccess'));
        } catch {
            toast.error(t('seedance.actions.copyFailed'));
        }
    };

    const handleLike = async () => {
        try { await seedanceAPI.toggleLike(id); }
        catch { toast.error(t('seedance.actions.loginRequired')); }
    };

    const handleFavorite = async () => {
        if (!isAuthenticated) { openLoginModal(); return; }
        const prev = localFavorited;
        setLocalFavorited(!prev);
        try {
            if (prev) {
                await favoritesAPI.remove('seedance', id);
                toast.success(t('seedance.actions.unfavoriteSuccess'));
            } else {
                await favoritesAPI.add('seedance', id);
                toast.success(t('seedance.actions.favoriteSuccess'));
            }
        } catch (err) {
            if (err?.response?.status === 409) {
                setLocalFavorited(true);
            } else {
                setLocalFavorited(prev);
                toast.error(t('seedance.actions.favoriteFailed'));
            }
        }
    };

    const handleShare = async () => {
        try { await navigator.share({ title: prompt.title, url: window.location.href }); }
        catch {
            navigator.clipboard.writeText(window.location.href);
            toast.success(t('seedance.actions.linkCopied'));
        }
    };

    const handleTranslate = async () => {
        if (showTranslated) { setShowTranslated(false); return; }
        if (translatedText) { setShowTranslated(true); return; }
        setIsTranslating(true);
        try {
            const currentLang = i18n.language || 'zh-CN';
            const targetLang = currentLang.startsWith('zh') ? 'zh-CN' : currentLang.startsWith('ja') ? 'ja' : 'zh-CN';
            const res = await seedanceAPI.translate(id, targetLang);
            const translated = res?.data?.translated;
            if (translated) { setTranslatedText(translated); setShowTranslated(true); }
            else toast.error(t('seedance.detail.translateFailed'));
        } catch {
            toast.error(t('seedance.detail.translateFailed'));
        } finally {
            setIsTranslating(false);
        }
    };

    return createPortal(
        <>
            {prompt && (
                <Helmet>
                    <title>{prompt.title || 'Seedance Video'} — III.PICS</title>
                    <meta name="description" content={prompt.prompt?.substring(0, 155)} />
                    <link rel="canonical" href={`https://iii.pics/seedance/${id}`} />
                    <meta property="og:title" content={prompt.title || 'Seedance Video'} />
                    <meta property="og:description" content={prompt.prompt?.substring(0, 155)} />
                    <meta property="og:type" content="video.other" />
                    <meta property="og:url" content={`https://iii.pics/seedance/${id}`} />
                    <meta property="og:image" content={prompt.thumbnailUrl || prompt.previewImage || 'https://iii.pics/og-image.jpg'} />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content={prompt.title || 'Seedance Video'} />
                    <meta name="twitter:description" content={prompt.prompt?.substring(0, 155)} />
                    <meta name="twitter:image" content={prompt.thumbnailUrl || prompt.previewImage || 'https://iii.pics/og-image.jpg'} />
                    <script type="application/ld+json">{JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'VideoObject',
                        name: prompt.title || 'Seedance Video',
                        description: prompt.prompt?.substring(0, 300),
                        thumbnailUrl: prompt.thumbnailUrl || prompt.previewImage || '',
                        duration: 'PT10S',
                        publisher: {
                            '@type': 'Organization',
                            name: 'III.PICS',
                            logo: { '@type': 'ImageObject', url: 'https://iii.pics/logo192.png', width: 192, height: 192 }
                        },
                        uploadDate: prompt.createdAt,
                        contentUrl: prompt.videoUrl || '',
                        url: `https://iii.pics/seedance/${id}`,
                    })}</script>
                    <script type="application/ld+json">{JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iii.pics' },
                            { '@type': 'ListItem', position: 2, name: 'Seedance', item: 'https://iii.pics/seedance' },
                            { '@type': 'ListItem', position: 3, name: prompt.title || 'AI Video', item: `https://iii.pics/seedance/${id}` },
                        ],
                    })}</script>
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
                    {/* Seedance: video on left, info on right (same split layout) */}
                    {/* ── Left: video player ── */}
                    <div className="dmodal-left">
                        {isLoading ? (
                            <div className="dmodal-loading">
                                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#f97316', borderRadius: '50%' }} />
                            </div>
                        ) : prompt?.videoUrl ? (
                            <>
                                <video
                                    src={getVideoSrc(prompt.videoUrl)}
                                    controls
                                    autoPlay
                                    loop
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onLoadStart={() => setVideoLoading(true)}
                                    onCanPlay={() => setVideoLoading(false)}
                                    onWaiting={() => setVideoLoading(true)}
                                    onPlaying={() => setVideoLoading(false)}
                                />
                                {videoLoading && (
                                    <div className="dmodal-video-loading">
                                        <div className="dmodal-video-spinner" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="dmodal-left-placeholder">
                                <Film size={48} style={{ opacity: 0.3 }} />
                                <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>Video not available</span>
                            </div>
                        )}
                    </div>

                    {/* ── Right: info ── */}
                    <div className="dmodal-right">
                        {/* Header */}
                        <div className="dmodal-right-header">
                            <div className="dmodal-right-header-left">
                                {prompt && (
                                    <span className="detail-model-badge seedance-badge" style={{ margin: 0 }}>
                                        🎬 {prompt.category || 'Video'} · Seedance 2.0
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
                                    <Loader2 size={24} className="animate-spin" />
                                    <span>Loading...</span>
                                </div>
                            ) : !prompt ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    <p>Video prompt not found.</p>
                                    <button onClick={handleClose} className="detail-btn-primary" style={{ marginTop: '1rem' }}>Close</button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="dmodal-title">{prompt.title}</h1>

                                    <div className="dmodal-stats">
                                        {prompt.authorName && (
                                            <span className="dmodal-stat"><User size={13} /> {prompt.authorName}</span>
                                        )}
                                        <span className="dmodal-stat"><Eye size={13} /> {prompt.views || 0} views</span>
                                        <span className="dmodal-stat"><Heart size={13} /> {prompt.likesCount || 0} likes</span>
                                        <span className="dmodal-stat"><Copy size={13} /> {prompt.copyCount || 0} copies</span>
                                    </div>

                                    {/* Prompt text */}
                                    <div className="dmodal-prompt-box">
                                        <div className="dmodal-prompt-header">
                                            <span>{t('seedance.detail.prompt')}</span>
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                <button
                                                    onClick={handleTranslate}
                                                    className={`detail-translate-btn ${showTranslated ? 'active' : ''}`}
                                                    disabled={isTranslating}
                                                >
                                                    {isTranslating ? (
                                                        <><Loader2 size={12} className="animate-spin" /><span>{t('seedance.detail.translating')}</span></>
                                                    ) : (
                                                        <><Languages size={12} /><span>{showTranslated ? t('seedance.detail.originalLabel') : t('seedance.detail.translateBtn')}</span></>
                                                    )}
                                                </button>
                                                <button onClick={handleCopy} className="detail-copy-btn">
                                                    <Copy size={13} /><span>Copy</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="dmodal-prompt-text-wrap">
                                            <p
                                                ref={promptTextRef}
                                                className="dmodal-prompt-text"
                                                style={promptExpanded
                                                    ? { maxHeight: 'none', overflowY: 'visible' }
                                                    : { maxHeight: '130px', overflowY: 'hidden' }
                                                }
                                            >
                                                {showTranslated && translatedText ? translatedText : prompt.prompt}
                                            </p>
                                            {!promptExpanded && promptOverflows && (
                                                <div className="dmodal-prompt-fade" aria-hidden="true" />
                                            )}
                                        </div>
                                        {promptOverflows && (
                                            <button
                                                className="dmodal-prompt-toggle"
                                                onClick={() => setPromptExpanded(e => !e)}
                                            >
                                                {promptExpanded ? '↑ Show less' : '↓ Show more'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Author / Source links */}
                                    {(prompt.authorName || prompt.authorLink || prompt.sourceUrl) && (
                                        <div className="detail-source-row">
                                            {(prompt.authorName || prompt.authorLink) && (
                                                <a
                                                    href={prompt.authorLink || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="detail-source-btn author"
                                                    onClick={(e) => !prompt.authorLink && e.preventDefault()}
                                                >
                                                    <User size={13} />
                                                    {prompt.authorName || t('seedance.detail.author')}
                                                </a>
                                            )}
                                            {prompt.sourceUrl && (
                                                <a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer" className="detail-source-btn source">
                                                    <ExternalLink size={13} />
                                                    {t('seedance.detail.sourceLink')}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {prompt.tags?.length > 0 && (
                                        <div className="dmodal-tags">
                                            {prompt.tags.map((tag) => (
                                                <span key={tag} className="detail-tag"
                                                    onClick={() => { handleClose(); navigate(`/seedance?tags=${tag}`); }}
                                                    style={{ cursor: 'pointer' }}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Similar Videos */}
                                    {similarItems.length > 0 && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                SIMILAR VIDEOS
                                            </p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                                                {similarItems.map(v => (
                                                    <div
                                                        key={v._id}
                                                        onClick={() => navigate(`/seedance/${v._id}`, { state: { fromList: true } })}
                                                        style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '0.35rem', overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-secondary)', transition: 'transform 0.15s' }}
                                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        {v.thumbnailUrl && (
                                                            <img
                                                                src={getThumbnailSrc(v.thumbnailUrl)}
                                                                alt={v.title || ''}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                                                        <span style={{ position: 'absolute', bottom: '0.25rem', left: '0.3rem', right: '0.3rem', fontSize: '0.6rem', color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {v.category || 'video'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {prompt && (
                            <div className="dmodal-right-footer">
                                <button
                                    className="dmodal-btn-primary"
                                    onClick={() => {
                                        setPrefill({ prompt: prompt.prompt, tab: 'video' });
                                        handleClose();
                                        toast.success('Prompt filled — check Generate Video');
                                    }}
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                                >
                                    <Wand2 size={16} />
                                    Generate Video
                                </button>
                                <button className="dmodal-btn-primary" onClick={handleCopy}
                                    style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                                    <Copy size={16} />
                                    {t('seedance.detail.copyPrompt')}
                                </button>
                                <button
                                    className={`dmodal-btn-icon ${prompt.isLiked ? 'liked' : ''}`}
                                    onClick={handleLike}
                                    title={prompt.isLiked ? t('seedance.actions.liked') : t('seedance.actions.like')}
                                >
                                    <Heart size={18} fill={prompt.isLiked ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    className={`dmodal-btn-icon ${localFavorited ? 'favorited' : ''}`}
                                    onClick={handleFavorite}
                                    title={localFavorited ? t('seedance.actions.favorited') : t('seedance.actions.favorite')}
                                >
                                    <Bookmark size={18} fill={localFavorited ? 'currentColor' : 'none'} />
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

export default SeedanceModal;
