import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Copy, Heart, Eye } from 'lucide-react';
import FavoriteButton from '../UI/FavoriteButton';
import { useTranslation } from 'react-i18next';
import { seedanceAPI, getVideoSrc, getThumbnailSrc } from '../../services/seedanceApi';
import toast from 'react-hot-toast';

const VideoCard = ({ prompt, onLike, onFavorite }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const videoRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [thumbLoaded, setThumbLoaded] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const containerRef = useRef(null);

    // 缩略图 URL：优先使用 thumbnailUrl（Twitter 缩略图），否则无缩略图
    const thumbnailSrc = prompt.thumbnailUrl ? getThumbnailSrc(prompt.thumbnailUrl) : '';

    // 视频 URL（通过代理处理 CORS）
    const videoSrc = getVideoSrc(prompt.videoUrl);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.1, rootMargin: '500px 0px' }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Auto-play on hover (only if in viewport)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isHovering && isInView) {
            video.play().catch(() => { });
        } else {
            video.pause();
            video.currentTime = 0;
            setVideoReady(false);
        }
    }, [isHovering, isInView]);

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(prompt.prompt);
            seedanceAPI.recordCopy(prompt._id);
            toast.success(t('seedance.actions.copySuccess'));
        } catch {
            toast.error(t('seedance.actions.copyFailed'));
        }
    };

    const handleLike = (e) => {
        e.stopPropagation();
        onLike?.(prompt._id);
    };

    const handleMouseMove = (e) => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.background = `radial-gradient(circle 160px at ${x}px ${y}px, rgba(99,102,241,0.15), transparent 70%), var(--bg-card)`;
    };

    const handleMouseLeaveHalo = () => {
        if (containerRef.current) containerRef.current.style.background = 'var(--bg-card)';
    };

    return (
        <motion.div
            ref={containerRef}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ y: -4 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeaveHalo}
            className="video-card group cursor-pointer"
            onClick={() => navigate(`/seedance/${prompt._id}`, { state: { fromList: true } })}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 视频预览 */}
            <div className="video-card-media">
                {/* 骨架屏 / 渐变占位 — 当无缩略图时始终显示 */}
                {!thumbLoaded && (
                    <div className="video-card-skeleton">
                        <Play size={28} className="video-skeleton-icon" />
                    </div>
                )}

                {/* 缩略图层 — 如果有 thumbnailUrl 则显示 */}
                {thumbnailSrc && (
                    <img
                        src={thumbnailSrc}
                        alt={prompt.title}
                        className={`video-card-poster ${thumbLoaded ? 'loaded' : ''} ${isHovering && videoReady ? 'hidden' : ''}`}
                        onLoad={() => setThumbLoaded(true)}
                        loading="lazy"
                    />
                )}

                {/* 视频层 — 使用 preload="metadata" 获取首帧作为 poster 替代 */}
                {isInView && prompt.videoUrl && (
                    <video
                        ref={videoRef}
                        src={isHovering ? videoSrc : undefined}
                        muted
                        loop
                        playsInline
                        preload="none"
                        poster={thumbnailSrc || undefined}
                        className={`video-card-video ${isHovering && videoReady ? 'playing' : ''}`}
                        onCanPlay={() => setVideoReady(true)}
                    />
                )}

                {/* 无缩略图时，用 preload=metadata 的隐藏 video 获取首帧 */}
                {isInView && !thumbnailSrc && prompt.videoUrl && !isHovering && (
                    <video
                        src={videoSrc}
                        muted
                        playsInline
                        preload="metadata"
                        className="video-card-poster-video"
                        onLoadedData={() => {
                            setThumbLoaded(true);
                        }}
                    />
                )}

                {/* 播放图标叠层 */}
                {!isHovering && (
                    <div className="video-play-overlay">
                        <div className="video-play-icon">
                            <Play size={24} fill="white" />
                        </div>
                    </div>
                )}

                {/* 悬浮操作 */}
                <div className={`video-card-actions ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
                    <button onClick={handleCopy} className="gallery-action-btn" title={t('seedance.actions.copy')}>
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={handleLike}
                        className={`gallery-action-btn ${prompt.isLiked ? 'text-red-400' : ''}`}
                        title={t('seedance.actions.like')}
                    >
                        <Heart size={16} fill={prompt.isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <FavoriteButton
                        targetType="seedance"
                        targetId={prompt._id}
                        className="gallery-action-btn"
                        size={16}
                    />
                </div>

                {/* 分类标签 */}
                <span className="video-category-badge">
                    🎬 {prompt.category || 'Video'}
                </span>
            </div>

            {/* 卡片信息 */}
            <div className="video-card-info">
                <h3 className="video-card-title">{prompt.title}</h3>
                <div className="video-card-stats">
                    <span className="flex items-center gap-1">
                        <Heart size={12} /> {prompt.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye size={12} /> {prompt.views || 0}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default VideoCard;
