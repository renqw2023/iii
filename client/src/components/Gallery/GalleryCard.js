import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Heart, Eye, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { galleryAPI } from '../../services/galleryApi';
import toast from 'react-hot-toast';

const MODEL_COLORS = {
    nanobanana: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'NanoBanana Pro' },
    midjourney: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Midjourney' },
    gptimage: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'GPT Image' },
    other: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Other' },
};

const ROW_HEIGHT = 8; // must match grid-auto-rows in gallery.css
const ROW_GAP = 8;    // card bottom spacing accounted into span

const GalleryCard = ({ prompt, onLike, onFavorite }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const modelInfo = MODEL_COLORS[prompt.model] || MODEL_COLORS.other;
    const [imageLoaded, setImageLoaded] = useState(false);
    const cardRef = useRef(null);
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
        rootMargin: '200px 0px', // 提前 200px 开始加载
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

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(prompt.prompt);
            galleryAPI.recordCopy(prompt._id);
            toast.success(t('gallery.actions.copySuccess'));
        } catch {
            toast.error(t('gallery.actions.copyFailed'));
        }
    };

    const handleLike = (e) => {
        e.stopPropagation();
        onLike?.(prompt._id);
    };

    const handleFavorite = (e) => {
        e.stopPropagation();
        onFavorite?.(prompt._id);
    };

    return (
        <motion.div
            ref={(el) => { cardRef.current = el; ref(el); }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            style={{ gridRowEnd: `span ${gridSpan}` }}
            className="gallery-card group cursor-pointer"
            onClick={() => navigate(`/gallery/${prompt._id}`)}
        >
            {/* 预览图区域 — 自然比例，无固定 aspect-ratio */}
            <div className="gallery-card-image">
                {inView && prompt.previewImage ? (
                    <img
                        src={prompt.previewImage}
                        alt={prompt.title}
                        loading="lazy"
                        onLoad={handleImageLoad}
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            opacity: imageLoaded ? 1 : 0,
                            transition: 'opacity 0.4s ease-in',
                        }}
                    />
                ) : (
                    <div style={{ aspectRatio: '4/3' }} className="w-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                        <span className="text-4xl opacity-30">🎨</span>
                    </div>
                )}

                {/* 底部渐变遮罩 hover overlay */}
                {imageLoaded && (
                <div className="gallery-card-overlay">
                    {/* 左侧：作者 */}
                    {prompt.sourceAuthor && (
                        <span className="gallery-card-author-overlay">
                            @{prompt.sourceAuthor}
                        </span>
                    )}

                    {/* 右侧：stats + 操作按钮 */}
                    <div className="gallery-overlay-right">
                        <span className="gallery-card-stats-overlay">
                            <Heart size={11} /> {prompt.likesCount || 0}
                            <Eye size={11} style={{ marginLeft: '0.4rem' }} /> {prompt.views || 0}
                        </span>
                        <div className="gallery-overlay-actions">
                            <button
                                onClick={handleCopy}
                                className="gallery-action-btn"
                                title={t('gallery.actions.copy')}
                            >
                                <Copy size={14} />
                            </button>
                            <button
                                onClick={handleLike}
                                className={`gallery-action-btn ${prompt.isLiked ? 'text-red-400' : ''}`}
                                title={t('gallery.actions.like')}
                            >
                                <Heart size={14} fill={prompt.isLiked ? 'currentColor' : 'none'} />
                            </button>
                            <button
                                onClick={handleFavorite}
                                className={`gallery-action-btn ${prompt.isFavorited ? 'text-yellow-400' : ''}`}
                                title={t('gallery.actions.favorite')}
                            >
                                <Bookmark size={14} fill={prompt.isFavorited ? 'currentColor' : 'none'} />
                            </button>
                        </div>
                    </div>
                </div>
                )}

                {/* 模型标签 — 左上角，常驻显示 */}
                {imageLoaded && (
                <span className={`gallery-model-badge ${modelInfo.bg} ${modelInfo.text}`}>
                    {modelInfo.label}
                </span>
                )}
            </div>
        </motion.div>
    );
};

export default GalleryCard;
