import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wand2, Share2, Heart, Eye } from 'lucide-react';
import { useGeneration } from '../../contexts/GenerationContext';
import FavoriteButton from '../UI/FavoriteButton';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';


const ROW_HEIGHT = 8; // must match grid-auto-rows in gallery.css
const ROW_GAP = 8;    // card bottom spacing accounted into span

const GalleryCard = ({ prompt, initialFavorited = false, onLike, onFavorite: _onFavorite }) => {
    const navigate = useNavigate();
    const { setPrefill } = useGeneration();
    const { t } = useTranslation();
    const [imageLoaded, setImageLoaded] = useState(false);
    const cardRef = useRef(null);
    const glowRef = useRef(null);
    // Initial span reserves ~300px height; corrected on image load via natural dimensions
    const [gridSpan, setGridSpan] = useState(38);
    // Store natural dimensions so ResizeObserver can recalculate on column width change
    const naturalSize = useRef(null);

    const calcSpan = useCallback((colWidth) => {
        const { w, h } = naturalSize.current || {};
        if (w > 0 && h > 0 && colWidth > 0) {
            const renderedH = Math.round((h / w) * colWidth);
            setGridSpan(Math.ceil((renderedH + ROW_GAP) / ROW_HEIGHT));
        }
    }, []);

    // Re-calculate span whenever the card's column width changes (window resize / sidebar toggle)
    useEffect(() => {
        if (!cardRef.current) return;
        const ro = new ResizeObserver((entries) => {
            const colWidth = entries[0]?.contentRect?.width;
            if (colWidth && naturalSize.current) calcSpan(colWidth);
        });
        ro.observe(cardRef.current);
        return () => ro.disconnect();
    }, [calcSpan]);

    // 使用 react-intersection-observer 实现图片懒加载
    const { ref, inView } = useInView({
        triggerOnce: true,       // 进入视口后不再监听
        rootMargin: '500px 0px', // 提前 500px 开始加载
    });

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

    const handleUseIdea = (e) => {
        e.stopPropagation();
        setPrefill({ prompt: prompt.prompt });
    };

    const handleLike = (e) => {
        e.stopPropagation();
        onLike?.(prompt._id);
    };

    const handleShare = (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/gallery/${prompt._id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Link copied!');
        }).catch(() => {
            toast.error('Copy failed');
        });
    };

    const handleDragStart = useCallback((e) => {
        if (prompt.previewImage) {
            e.dataTransfer.setData('application/json', JSON.stringify({ image: prompt.previewImage, prompt: prompt.prompt || '' }));
            e.dataTransfer.effectAllowed = 'copy';
        }
    }, [prompt.previewImage, prompt.prompt]);

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
            ref={(el) => { cardRef.current = el; ref(el); }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            style={{ gridRowEnd: `span ${gridSpan}` }}
            className="gallery-card group cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => navigate(`/gallery/${prompt._id}`, { state: { fromList: true } })}
            draggable={!!prompt.previewImage}
            onDragStart={handleDragStart}
        >
            {/* 预览图区域 — 自然比例，无固定 aspect-ratio */}
            <div className="gallery-card-image">
                {/* Spotlight glow — follows mouse, above image, no pointer events */}
                <div ref={glowRef} className="gallery-spotlight" />

                {inView && prompt.previewImage ? (
                    <img
                        src={prompt.previewImage}
                        alt={prompt.title || prompt.prompt?.substring(0, 80) || 'AI generated image'}
                        loading="lazy"
                        decoding="async"
                        onLoad={handleImageLoad}
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            opacity: imageLoaded ? 1 : 0,
                            transition: 'opacity 0.4s ease-in, transform 0.4s ease',
                        }}
                    />
                ) : (
                    <div style={{ aspectRatio: '4/3' }} className="w-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                        <span className="text-4xl opacity-30">🎨</span>
                    </div>
                )}

                {/* 多图角标 */}
                {prompt.images?.length > 1 && (
                    <div style={{
                        position: 'absolute', bottom: 6, right: 6,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 20,
                        lineHeight: 1.5,
                        pointerEvents: 'none',
                        zIndex: 2,
                    }}>
                        1/{prompt.images.length}
                    </div>
                )}

                {/* 全卡渐变遮罩 + 底部 action-bar */}
                {imageLoaded && (
                    <div className="gallery-card-overlay">
                        <div className="gallery-card-action-bar">
                            {/* 左列：作者 + stats + CTA */}
                            <div className="gallery-action-left">
                                {prompt.sourceAuthor && (
                                    <span className="gallery-card-author-overlay">
                                        {prompt.sourceAuthor.startsWith('@') ? prompt.sourceAuthor : `@${prompt.sourceAuthor}`}
                                    </span>
                                )}
                                <span className="gallery-card-stats-overlay">
                                    <Heart size={11} /> {prompt.likesCount || 0}
                                    <Eye size={11} style={{ marginLeft: '0.35rem' }} /> {prompt.views || 0}
                                </span>
                                <button className="gallery-cta-btn" onClick={handleUseIdea}>
                                    <Wand2 size={11} style={{ marginRight: '0.3rem' }} />
                                    {t('gallery.actions.useIdea')}
                                </button>
                            </div>
                            {/* 右列：Like + Favorite */}
                            <div className="gallery-overlay-actions">
                                <button
                                    onClick={handleLike}
                                    className={`gallery-action-btn ${prompt.isLiked ? 'liked' : ''}`}
                                    title={t('gallery.actions.like', 'Like')}
                                >
                                    <Heart size={13} fill={prompt.isLiked ? 'currentColor' : 'none'} />
                                </button>
                                <FavoriteButton
                                    targetType="gallery"
                                    targetId={prompt._id}
                                    initialFavorited={initialFavorited}
                                    className="gallery-action-btn"
                                    size={13}
                                    iconType="bookmark"
                                />
                                <button
                                    className="gallery-action-btn"
                                    title="Share"
                                    onClick={handleShare}
                                >
                                    <Share2 size={13} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default GalleryCard;
