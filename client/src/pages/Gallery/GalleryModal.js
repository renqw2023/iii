import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Copy, Heart, Bookmark, X, ExternalLink, Eye, Share2, ZoomIn, ImagePlus, ArrowLeft } from 'lucide-react';
import TranslateButton from '../../components/UI/TranslateButton';
import { Helmet } from 'react-helmet-async';
import { galleryAPI } from '../../services/galleryApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useBrowsingHistory } from '../../hooks/useBrowsingHistory';
import { useGeneration } from '../../contexts/GenerationContext';
import ShareCardModal from '../../components/ShareCard/ShareCardModal';

const MODEL_LABELS = {
    nanobanana: 'NanoBanana Pro',
    midjourney: 'Midjourney',
    gptimage: 'GPT Image',
};

const GalleryModal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const { setPrefill } = useGeneration();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [showShareCard, setShowShareCard] = useState(false);
    const [translatedPrompt, setTranslatedPrompt] = useState(null);
    const [imgIndex, setImgIndex] = useState(0);

    const handleClose = () => {
        const returnTo = searchParams.get('returnTo') || location.state?.returnTo;
        if (returnTo) navigate(returnTo);
        else if (location.state?.fromList) navigate(-1);
        else navigate('/gallery');
    };

    useEffect(() => {
        // 不锁定 body scroll — modal 有全屏 backdrop 阻止背景交互
        // overflow:hidden 会导致 Chrome 在移除时重置 scrollY 到 0
    }, []);

    // ESC：优先关闭 lightbox，再关闭 modal
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') {
                if (lightboxOpen) { setLightboxOpen(false); return; }
                handleClose();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lightboxOpen]);

    const { data, isLoading } = useQuery(
        ['gallery-detail', id],
        () => galleryAPI.getById(id),
        { enabled: !!id }
    );

    const prompt = data?.data?.prompt;

    // 多图轮播：切换 prompt 时重置索引
    useEffect(() => { setImgIndex(0); }, [prompt?._id]);

    const images = prompt?.images?.length > 0
        ? prompt.images
        : (prompt?.previewImage ? [prompt.previewImage] : []);
    const currentImage = images[imgIndex] || '';

    const { addToHistory } = useBrowsingHistory();
    useEffect(() => {
      if (prompt?._id) {
        addToHistory({
          id: prompt._id,
          type: 'gallery',
          title: prompt.title || prompt.prompt?.substring(0, 40) || 'Gallery',
          image: prompt.previewImage || '',
          url: `/gallery/${prompt._id}`,
        });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt?._id]);

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
        try { await galleryAPI.toggleLike(id); }
        catch { toast.error(t('gallery.actions.loginRequired')); }
    };

    const handleFavorite = async () => {
        try { await galleryAPI.toggleFavorite(id); }
        catch { toast.error(t('gallery.actions.loginRequired')); }
    };

    const handleShare = () => setShowShareCard(true);

    return (
      <>
        {showShareCard && prompt && (
          <ShareCardModal type="gallery" data={prompt} onClose={() => setShowShareCard(false)} />
        )}
        {createPortal(
        <>
            {prompt && (
                <Helmet>
                    <title>{`${prompt.title || prompt.prompt?.substring(0, 50) || 'AI Prompt'} — III.PICS Gallery`}</title>
                    <meta name="description" content={prompt.description || prompt.prompt?.substring(0, 155) || 'AI image prompt — browse more on III.PICS Gallery.'} />
                    <link rel="canonical" href={`https://iii.pics/gallery/${prompt._id}`} />
                    <meta property="og:title" content={`${prompt.title || 'AI Gallery Prompt'} — III.PICS`} />
                    <meta property="og:description" content={prompt.description || prompt.prompt?.substring(0, 155) || 'AI image prompt on III.PICS Gallery.'} />
                    <meta property="og:type" content="article" />
                    <meta property="og:url" content={`https://iii.pics/gallery/${prompt._id}`} />
                    {prompt.previewImage && <meta property="og:image" content={prompt.previewImage} />}
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="900" />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:site" content="@iii_pics" />
                    <meta name="twitter:title" content={`${prompt.title || 'AI Prompt'} — III.PICS`} />
                    <meta name="twitter:description" content={prompt.description || prompt.prompt?.substring(0, 155) || 'AI image prompt on III.PICS Gallery.'} />
                    {prompt.previewImage && <meta name="twitter:image" content={prompt.previewImage} />}
                    <script type="application/ld+json">{JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'ImageObject',
                        name: prompt.title || prompt.prompt?.substring(0, 60) || 'AI Gallery Prompt',
                        description: prompt.description || prompt.prompt?.substring(0, 200) || '',
                        contentUrl: prompt.previewImage || '',
                        url: `https://iii.pics/gallery/${prompt._id}`,
                        keywords: prompt.tags?.join(', ') || '',
                        creator: { '@type': 'Organization', name: 'III.PICS' },
                    })}</script>
                </Helmet>
            )}

            {/* Lightbox */}
            {lightboxOpen && currentImage && (
                <div className="dmodal-lightbox" onClick={() => setLightboxOpen(false)}>
                    <motion.img
                        src={currentImage}
                        alt={prompt.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setLightboxOpen(false)}
                        style={{
                            position: 'fixed', top: 20, right: 20,
                            background: 'rgba(255,255,255,0.12)', border: 'none',
                            borderRadius: '50%', width: 40, height: 40,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#fff', zIndex: 1,
                        }}
                    >
                        <X size={20} />
                    </button>
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
                    {/* ── Left: image 轮播（点击放大）── */}
                    <div
                        className="dmodal-left"
                        style={{ cursor: currentImage ? 'zoom-in' : 'default' }}
                        onClick={() => currentImage && setLightboxOpen(true)}
                        title={currentImage ? 'Click to zoom' : undefined}
                    >
                        {/* Mobile floating back + share buttons over image */}
                        <div className="dmodal-mobile-float">
                            <button className="dmodal-float-btn" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
                                <ArrowLeft size={20} />
                            </button>
                            <button className="dmodal-float-btn" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                                <Share2 size={18} />
                            </button>
                        </div>
                        {isLoading ? (
                            <div className="dmodal-loading">
                                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#6366f1', borderRadius: '50%' }} />
                            </div>
                        ) : currentImage ? (
                            <>
                                <img src={currentImage} alt={prompt.title} style={{ pointerEvents: 'none' }} />

                                {/* 左箭头 */}
                                {images.length > 1 && imgIndex > 0 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setImgIndex(i => i - 1); }}
                                        style={{
                                            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                                            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                                            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: '#fff', fontSize: 20, zIndex: 2,
                                        }}
                                    >‹</button>
                                )}

                                {/* 右箭头 */}
                                {images.length > 1 && imgIndex < images.length - 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setImgIndex(i => i + 1); }}
                                        style={{
                                            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                                            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: '#fff', fontSize: 20, zIndex: 2,
                                        }}
                                    >›</button>
                                )}

                                {/* 底部圆点指示器 */}
                                {images.length > 1 && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                                            display: 'flex', gap: 5, zIndex: 2,
                                        }}
                                    >
                                        {images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setImgIndex(i)}
                                                style={{
                                                    width: i === imgIndex ? 16 : 6, height: 6, borderRadius: 3,
                                                    background: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                                                    border: 'none', padding: 0, cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* zoom hint（仅单图时显示，多图时底部已有圆点） */}
                                {images.length <= 1 && (
                                    <div style={{
                                        position: 'absolute', bottom: 12, right: 12,
                                        background: 'rgba(0,0,0,0.55)', borderRadius: 8,
                                        padding: '0.3rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', pointerEvents: 'none',
                                    }}>
                                        <ZoomIn size={12} /> Zoom
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="dmodal-left-placeholder">
                                <span style={{ fontSize: '4rem', opacity: 0.3 }}>🎨</span>
                            </div>
                        )}
                    </div>

                    {/* ── Right: info ── */}
                    <div className="dmodal-right">
                        <div className="dmodal-right-header">
                            <div className="dmodal-right-header-left">
                                {prompt && (
                                    <span className="detail-model-badge" style={{ margin: 0 }}>
                                        {MODEL_LABELS[prompt.model] || prompt.model}
                                    </span>
                                )}
                                {prompt?.sourceAuthor && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                        {prompt.sourceAuthor.startsWith('@') ? prompt.sourceAuthor : `@${prompt.sourceAuthor}`}
                                    </span>
                                )}
                            </div>
                            <button className="dmodal-close-btn" onClick={handleClose} title="Close (ESC)">
                                <X size={18} />
                            </button>
                        </div>

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
                                    <h1 className="dmodal-title">{prompt.title}</h1>

                                    <div className="dmodal-stats">
                                        <span className="dmodal-stat"><Eye size={13} /> {prompt.views || 0} views</span>
                                        <span className="dmodal-stat"><Heart size={13} /> {prompt.likesCount || 0} likes</span>
                                        <span className="dmodal-stat"><Copy size={13} /> {prompt.copyCount || 0} copies</span>
                                    </div>

                                    <div className="dmodal-prompt-box">
                                        <div className="dmodal-prompt-header">
                                            <span>Prompt</span>
                                            <div className="flex items-center gap-2">
                                                <TranslateButton
                                                    text={prompt.prompt}
                                                    onTranslated={(t) => setTranslatedPrompt(t)}
                                                />
                                                <button onClick={handleCopy} className="detail-copy-btn">
                                                    <Copy size={13} /><span>Copy</span>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="dmodal-prompt-text">
                                            {translatedPrompt || prompt.prompt}
                                        </p>
                                    </div>

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

                                    {prompt.sourceUrl && (
                                        <div className="dmodal-source">
                                            <ExternalLink size={13} />
                                            <span>Source:</span>
                                            <a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer">
                                                {(() => {
                                                    try {
                                                        const host = new URL(prompt.sourceUrl).hostname.replace('www.', '');
                                                        if (host === 'x.com' || host === 'twitter.com') return 'X';
                                                        return host;
                                                    } catch {
                                                        return 'View Source';
                                                    }
                                                })()}
                                            </a>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {prompt && (
                            <div className="dmodal-right-footer">
                                <button className="dmodal-btn-primary" onClick={handleCopy}>
                                    <Copy size={16} />
                                    {t('gallery.detail.copyPrompt')}
                                </button>
                                {currentImage && (
                                    <button
                                        className="dmodal-btn-primary dmodal-btn-ref"
                                        onClick={() => { setPrefill({ referenceImageUrl: currentImage }); handleClose(); }}
                                        title={t('gallery.detail.useAsReference')}
                                    >
                                        <ImagePlus size={16} />
                                        <span className="dmodal-btn-ref-label">{t('gallery.detail.useAsReference')}</span>
                                    </button>
                                )}
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
        )}
      </>
    );
};

export default GalleryModal;
