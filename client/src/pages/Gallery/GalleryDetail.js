import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Copy, Heart, Bookmark, ArrowLeft, ExternalLink, Eye, Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import GalleryCard from '../../components/Gallery/GalleryCard';
import { galleryAPI } from '../../services/galleryApi';
import toast from 'react-hot-toast';

const MODEL_LABELS = {
    nanobanana: 'NanoBanana Pro',
    midjourney: 'Midjourney',
    gptimage: 'GPT Image',
};

const GalleryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery(
        ['gallery-detail', id],
        () => galleryAPI.getById(id),
        { enabled: !!id }
    );

    const prompt = data?.data?.prompt;
    const related = data?.data?.related || [];

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt.prompt);
            galleryAPI.recordCopy(id);
            toast.success('提示词已复制到剪贴板！');
        } catch {
            toast.error('复制失败');
        }
    };

    const handleLike = async () => {
        try {
            await galleryAPI.toggleLike(id);
            toast.success(prompt.isLiked ? '已取消点赞' : '已点赞');
        } catch {
            toast.error('请先登录');
        }
    };

    const handleFavorite = async () => {
        try {
            await galleryAPI.toggleFavorite(id);
            toast.success(prompt.isFavorited ? '已取消收藏' : '已添加收藏');
        } catch {
            toast.error('请先登录');
        }
    };

    const handleShare = async () => {
        try {
            await navigator.share({
                title: prompt.title,
                url: window.location.href,
            });
        } catch {
            navigator.clipboard.writeText(window.location.href);
            toast.success('链接已复制');
        }
    };

    if (isLoading) {
        return (
            <div className="detail-loading">
                <div className="animate-pulse space-y-4">
                    <div className="h-64 bg-white/5 rounded-xl" />
                    <div className="h-8 bg-white/5 rounded w-2/3" />
                    <div className="h-32 bg-white/5 rounded" />
                </div>
            </div>
        );
    }

    if (!prompt) {
        return (
            <div className="detail-not-found">
                <h2>Prompt Not Found</h2>
                <button onClick={() => navigate('/gallery')} className="btn-primary mt-4">
                    Back to Gallery
                </button>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{prompt.title} - AI Prompts Gallery</title>
                <meta name="description" content={prompt.prompt?.substring(0, 160)} />
            </Helmet>

            <div className="detail-page">
                {/* 返回按钮 */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/gallery')}
                    className="detail-back-btn"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Gallery</span>
                </motion.button>

                <div className="detail-layout">
                    {/* 左侧：预览图 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="detail-preview"
                    >
                        {prompt.previewImage ? (
                            <img
                                src={prompt.previewImage}
                                alt={prompt.title}
                                className="detail-preview-image"
                            />
                        ) : (
                            <div className="detail-preview-placeholder">
                                <span className="text-6xl">🎨</span>
                            </div>
                        )}
                    </motion.div>

                    {/* 右侧：信息 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="detail-info"
                    >
                        {/* 模型标签 */}
                        <div className="detail-model-badge">
                            {MODEL_LABELS[prompt.model] || prompt.model}
                        </div>

                        {/* 标题 */}
                        <h1 className="detail-title">{prompt.title}</h1>

                        {/* 统计 */}
                        <div className="detail-stats">
                            <span className="flex items-center gap-1">
                                <Eye size={14} /> {prompt.views || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                                <Heart size={14} /> {prompt.likesCount || 0} likes
                            </span>
                            <span className="flex items-center gap-1">
                                <Copy size={14} /> {prompt.copyCount || 0} copies
                            </span>
                        </div>

                        {/* 提示词文本 */}
                        <div className="detail-prompt-box">
                            <div className="detail-prompt-header">
                                <span>Prompt</span>
                                <button onClick={handleCopy} className="detail-copy-btn">
                                    <Copy size={14} />
                                    <span>Copy</span>
                                </button>
                            </div>
                            <p className="detail-prompt-text">{prompt.prompt}</p>
                        </div>

                        {/* 操作按钮 */}
                        <div className="detail-actions">
                            <button onClick={handleCopy} className="detail-btn-primary">
                                <Copy size={16} />
                                <span>一键复制</span>
                            </button>
                            <button
                                onClick={handleLike}
                                className={`detail-btn-secondary ${prompt.isLiked ? 'active' : ''}`}
                            >
                                <Heart size={16} fill={prompt.isLiked ? 'currentColor' : 'none'} />
                                <span>{prompt.isLiked ? '已点赞' : '点赞'}</span>
                            </button>
                            <button
                                onClick={handleFavorite}
                                className={`detail-btn-secondary ${prompt.isFavorited ? 'active' : ''}`}
                            >
                                <Bookmark size={16} fill={prompt.isFavorited ? 'currentColor' : 'none'} />
                                <span>{prompt.isFavorited ? '已收藏' : '收藏'}</span>
                            </button>
                            <button onClick={handleShare} className="detail-btn-icon">
                                <Share2 size={16} />
                            </button>
                        </div>

                        {/* 分类标签 */}
                        {prompt.tags && prompt.tags.length > 0 && (
                            <div className="detail-tags">
                                {prompt.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="detail-tag"
                                        onClick={() => navigate(`/gallery?tag=${tag}`)}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* 来源 */}
                        {prompt.sourceUrl && (
                            <div className="detail-source">
                                <ExternalLink size={14} />
                                <span>Source: </span>
                                <a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer">
                                    {prompt.sourcePlatform || 'External'}
                                </a>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* 相关推荐 */}
                {related.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="detail-related"
                    >
                        <h2 className="detail-related-title">Related Prompts</h2>
                        <div className="gallery-grid">
                            {related.map((r) => (
                                <GalleryCard key={r._id} prompt={r} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </>
    );
};

export default GalleryDetail;
