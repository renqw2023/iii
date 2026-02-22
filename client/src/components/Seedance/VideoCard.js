import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Copy, Heart, Eye, Bookmark } from 'lucide-react';
import { seedanceAPI } from '../../services/seedanceApi';
import toast from 'react-hot-toast';

const VideoCard = ({ prompt, onLike, onFavorite }) => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.3 }
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
        }
    }, [isHovering, isInView]);

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(prompt.prompt);
            seedanceAPI.recordCopy(prompt._id);
            toast.success('提示词已复制！');
        } catch {
            toast.error('复制失败');
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
            ref={containerRef}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ y: -4 }}
            className="video-card group cursor-pointer"
            onClick={() => navigate(`/seedance/${prompt._id}`)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 视频预览 */}
            <div className="video-card-media">
                {isInView && prompt.videoUrl ? (
                    <video
                        ref={videoRef}
                        src={prompt.videoUrl}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
                        <Play size={32} className="text-white/30" />
                    </div>
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
                    <button onClick={handleCopy} className="gallery-action-btn" title="复制提示词">
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={handleLike}
                        className={`gallery-action-btn ${prompt.isLiked ? 'text-red-400' : ''}`}
                        title="点赞"
                    >
                        <Heart size={16} fill={prompt.isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={handleFavorite}
                        className={`gallery-action-btn ${prompt.isFavorited ? 'text-yellow-400' : ''}`}
                        title="收藏"
                    >
                        <Bookmark size={16} fill={prompt.isFavorited ? 'currentColor' : 'none'} />
                    </button>
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
