import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Heart, Eye, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { galleryAPI } from '../../services/galleryApi';
import toast from 'react-hot-toast';

const MODEL_COLORS = {
    nanobanana: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'NanoBanana Pro' },
    midjourney: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Midjourney' },
    gptimage: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'GPT Image' },
    other: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Other' },
};

const GalleryCard = ({ prompt, onLike, onFavorite }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const modelInfo = MODEL_COLORS[prompt.model] || MODEL_COLORS.other;

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
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ y: -4 }}
            className="gallery-card group cursor-pointer"
            onClick={() => navigate(`/gallery/${prompt._id}`)}
        >
            {/* 预览图 */}
            <div className="gallery-card-image">
                {prompt.previewImage ? (
                    <img
                        src={prompt.previewImage}
                        alt={prompt.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                        <span className="text-4xl opacity-30">🎨</span>
                    </div>
                )}

                {/* 悬浮操作层 */}
                <div className="gallery-card-overlay">
                    <button
                        onClick={handleCopy}
                        className="gallery-action-btn"
                        title={t('gallery.actions.copy')}
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={handleLike}
                        className={`gallery-action-btn ${prompt.isLiked ? 'text-red-400' : ''}`}
                        title={t('gallery.actions.like')}
                    >
                        <Heart size={16} fill={prompt.isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={handleFavorite}
                        className={`gallery-action-btn ${prompt.isFavorited ? 'text-yellow-400' : ''}`}
                        title={t('gallery.actions.favorite')}
                    >
                        <Bookmark size={16} fill={prompt.isFavorited ? 'currentColor' : 'none'} />
                    </button>
                </div>

                {/* 模型标签 */}
                <span className={`gallery-model-badge ${modelInfo.bg} ${modelInfo.text}`}>
                    {modelInfo.label}
                </span>
            </div>

            {/* 卡片信息 */}
            <div className="gallery-card-info">
                <h3 className="gallery-card-title">{prompt.title}</h3>
                <p className="gallery-card-prompt">{prompt.prompt}</p>

                <div className="gallery-card-meta">
                    {prompt.sourceAuthor && (
                        <span className="gallery-card-author">
                            @{prompt.sourceAuthor}
                        </span>
                    )}
                    <div className="gallery-card-stats">
                        <span className="flex items-center gap-1">
                            <Heart size={12} /> {prompt.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye size={12} /> {prompt.views || 0}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default GalleryCard;
