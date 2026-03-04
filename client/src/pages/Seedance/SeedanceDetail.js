import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Copy, Heart, Bookmark, ArrowLeft, Eye, Share2, Film, ExternalLink, User, Languages, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import VideoCard from '../../components/Seedance/VideoCard';
import { seedanceAPI, getVideoSrc } from '../../services/seedanceApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const SeedanceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    // 翻译状态
    const [showTranslated, setShowTranslated] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    const { data, isLoading } = useQuery(
        ['seedance-detail', id],
        () => seedanceAPI.getById(id),
        { enabled: !!id }
    );

    const prompt = data?.data?.prompt;
    const related = data?.data?.related || [];

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
        try {
            await seedanceAPI.toggleLike(id);
        } catch {
            toast.error(t('seedance.actions.loginRequired'));
        }
    };

    const handleFavorite = async () => {
        try {
            await seedanceAPI.toggleFavorite(id);
        } catch {
            toast.error(t('seedance.actions.loginRequired'));
        }
    };

    const handleShare = async () => {
        try {
            await navigator.share({ title: prompt.title, url: window.location.href });
        } catch {
            navigator.clipboard.writeText(window.location.href);
            toast.success(t('seedance.actions.linkCopied'));
        }
    };

    // 翻译切换
    const handleTranslate = async () => {
        if (showTranslated) {
            // 切回原文
            setShowTranslated(false);
            return;
        }

        if (translatedText) {
            // 已有翻译缓存，直接切换
            setShowTranslated(true);
            return;
        }

        // 调用翻译 API
        setIsTranslating(true);
        try {
            // 根据当前语言确定目标语言
            const currentLang = i18n.language || 'zh-CN';
            const targetLang = currentLang.startsWith('zh') ? 'zh-CN' : currentLang.startsWith('ja') ? 'ja' : 'zh-CN';
            const res = await seedanceAPI.translate(id, targetLang);
            const translated = res?.data?.translated;
            if (translated) {
                setTranslatedText(translated);
                setShowTranslated(true);
            } else {
                toast.error(t('seedance.detail.translateFailed'));
            }
        } catch {
            toast.error(t('seedance.detail.translateFailed'));
        } finally {
            setIsTranslating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="detail-loading">
                <div className="animate-pulse space-y-4">
                    <div className="h-96 bg-white/5 rounded-xl" />
                    <div className="h-8 bg-white/5 rounded w-2/3" />
                    <div className="h-32 bg-white/5 rounded" />
                </div>
            </div>
        );
    }

    if (!prompt) {
        return (
            <div className="detail-not-found">
                <h2>Video Prompt Not Found</h2>
                <button onClick={() => navigate('/seedance')} className="btn-primary mt-4">
                    Back to Seedance
                </button>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{prompt.title} - Seedance 2.0</title>
                <meta name="description" content={prompt.prompt?.substring(0, 160)} />
            </Helmet>

            <div className="detail-page">
                {/* 返回按钮 */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="detail-back-btn"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Seedance</span>
                </motion.button>

                {/* 视频播放器 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="seedance-detail-video"
                >
                    {prompt.videoUrl ? (
                        <video
                            src={getVideoSrc(prompt.videoUrl)}
                            controls
                            autoPlay
                            loop
                            playsInline
                            className="seedance-video-player"
                        />
                    ) : (
                        <div className="detail-preview-placeholder">
                            <Film size={48} />
                            <p>Video not available</p>
                        </div>
                    )}
                </motion.div>

                {/* 信息区域 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="seedance-detail-info"
                >
                    {/* 分类标签 */}
                    <div className="detail-model-badge seedance-badge">
                        🎬 {prompt.category || 'Video'} · Seedance 2.0
                    </div>

                    <h1 className="detail-title">{prompt.title}</h1>

                    {/* 统计 + 作者 */}
                    <div className="detail-stats">
                        {prompt.authorName && (
                            <span className="flex items-center gap-1">
                                <User size={14} /> {prompt.authorName}
                            </span>
                        )}
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
                            <span>{t('seedance.detail.prompt')}</span>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                {/* 翻译按钮 */}
                                <button
                                    onClick={handleTranslate}
                                    className={`detail-translate-btn ${showTranslated ? 'active' : ''}`}
                                    disabled={isTranslating}
                                >
                                    {isTranslating ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            <span>{t('seedance.detail.translating')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Languages size={12} />
                                            <span>{showTranslated ? t('seedance.detail.originalLabel') : t('seedance.detail.translateBtn')}</span>
                                        </>
                                    )}
                                </button>
                                <button onClick={handleCopy} className="detail-copy-btn">
                                    <Copy size={14} />
                                    <span>Copy</span>
                                </button>
                            </div>
                        </div>
                        <p className="detail-prompt-text">
                            {showTranslated && translatedText ? translatedText : prompt.prompt}
                        </p>
                    </div>

                    {/* 来源 & 作者按钮 */}
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
                                    <User size={14} />
                                    {prompt.authorName || t('seedance.detail.author')}
                                </a>
                            )}
                            {prompt.sourceUrl && (
                                <a
                                    href={prompt.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="detail-source-btn source"
                                >
                                    <ExternalLink size={14} />
                                    {t('seedance.detail.sourceLink')}
                                </a>
                            )}
                        </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="detail-actions">
                        <button onClick={handleCopy} className="detail-btn-primary seedance-primary">
                            <Copy size={16} />
                            <span>{t('seedance.detail.copyPrompt')}</span>
                        </button>
                        <button
                            onClick={handleLike}
                            className={`detail-btn-secondary ${prompt.isLiked ? 'active' : ''}`}
                        >
                            <Heart size={16} fill={prompt.isLiked ? 'currentColor' : 'none'} />
                            <span>{prompt.isLiked ? t('seedance.actions.liked') : t('seedance.actions.like')}</span>
                        </button>
                        <button
                            onClick={handleFavorite}
                            className={`detail-btn-secondary ${prompt.isFavorited ? 'active' : ''}`}
                        >
                            <Bookmark size={16} fill={prompt.isFavorited ? 'currentColor' : 'none'} />
                            <span>{prompt.isFavorited ? t('seedance.actions.favorited') : t('seedance.actions.favorite')}</span>
                        </button>
                        <button onClick={handleShare} className="detail-btn-icon">
                            <Share2 size={16} />
                        </button>
                    </div>

                    {/* 标签 */}
                    {prompt.tags && prompt.tags.length > 0 && (
                        <div className="detail-tags">
                            {prompt.tags.map((tag) => (
                                <span key={tag} className="detail-tag" onClick={() => navigate(`/seedance?tags=${tag}`)}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* 相关视频 */}
                {related.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="detail-related"
                    >
                        <h2 className="detail-related-title">Related Videos</h2>
                        <div className="seedance-grid">
                            {related.map((r) => (
                                <VideoCard key={r._id} prompt={r} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </>
    );
};

export default SeedanceDetail;
