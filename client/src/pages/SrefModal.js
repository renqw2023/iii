import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Copy, Heart, X, Eye, Check, Loader2, Play, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { srefAPI } from '../services/srefApi';
import toast from 'react-hot-toast';

const SrefModal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [copied, setCopied] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [activeIdx, setActiveIdx] = useState(0);
    // 滚轮节流：避免单次滚轮事件触发多次切换
    const wheelTimerRef = useRef(null);
    const mediaLeftRef = useRef(null);

    const handleClose = () => {
        if (location.state?.fromList) navigate(-1);
        else navigate('/explore');
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const { data, isLoading } = useQuery(
        ['sref-detail', id],
        () => srefAPI.getById(id),
        { enabled: !!id }
    );

    const sref = data?.data?.post;
    const imageUrls = sref?.imageUrls || [];
    const videoUrls = sref?.videoUrls || [];

    // 图片在前，视频在后
    const mediaItems = [
        ...imageUrls.map((url) => ({ type: 'image', url })),
        ...videoUrls.map((url) => ({ type: 'video', url })),
    ];
    const total = mediaItems.length;
    const hasThumbs = total > 1;
    const active = mediaItems[activeIdx] || null;

    // 切换到上一个/下一个（循环）
    const goPrev = useCallback(() => {
        setActiveIdx((i) => (i - 1 + total) % total);
    }, [total]);

    const goNext = useCallback(() => {
        setActiveIdx((i) => (i + 1) % total);
    }, [total]);

    // 键盘事件：ESC 关闭（lightbox 优先）/ ← → 切换
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') {
                if (lightboxSrc) { setLightboxSrc(null); return; }
                handleClose();
                return;
            }
            if (!hasThumbs) return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lightboxSrc, hasThumbs, goPrev, goNext]);

    // 鼠标滚轮切换（左侧媒体区域）
    const handleWheel = useCallback((e) => {
        if (!hasThumbs) return;
        // 如果右侧文字区域在滚动就不拦截（只拦截左侧媒体区域）
        e.preventDefault();
        // 节流：100ms 内只响应一次
        if (wheelTimerRef.current) return;
        wheelTimerRef.current = setTimeout(() => { wheelTimerRef.current = null; }, 280);
        if (e.deltaY > 0 || e.deltaX > 0) goNext();
        else goPrev();
    }, [hasThumbs, goPrev, goNext]);

    // 将 wheel 事件绑到左侧 div（passive:false 才能 preventDefault）
    useEffect(() => {
        const el = mediaLeftRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`--sref ${sref.srefCode}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Copied!');
        } catch {
            toast.error('Copy failed');
        }
    };

    const handleLike = async () => {
        try { await srefAPI.toggleLike(id); }
        catch { toast.error('Please log in to like'); }
    };

    return createPortal(
        <>
            {sref && (
                <Helmet>
                    <title>--sref {sref.srefCode} - Style Gallery</title>
                    <meta name="description" content={sref.description || sref.title} />
                    {sref.previewImage && <meta property="og:image" content={sref.previewImage} />}
                </Helmet>
            )}

            {/* Lightbox */}
            {lightboxSrc && (
                <div className="dmodal-lightbox" onClick={() => setLightboxSrc(null)}>
                    <motion.img
                        src={lightboxSrc}
                        alt="Preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setLightboxSrc(null)}
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
                    {/* lightbox 内也支持左右切换图片 */}
                    {hasThumbs && mediaItems[activeIdx]?.type === 'image' && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); goPrev(); setLightboxSrc(mediaItems[(activeIdx - 1 + total) % total]?.url); }}
                                style={{ position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                <ChevronLeft size={22} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); goNext(); setLightboxSrc(mediaItems[(activeIdx + 1) % total]?.url); }}
                                style={{ position: 'fixed', right: 72, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                <ChevronRight size={22} />
                            </button>
                        </>
                    )}
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
                    {/* ── Left: media viewer ── */}
                    <div className="dmodal-left" ref={mediaLeftRef} style={{ position: 'relative' }}>
                        {isLoading ? (
                            <div className="dmodal-loading">
                                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#8b5cf6', borderRadius: '50%' }} />
                            </div>
                        ) : mediaItems.length === 0 ? (
                            sref?.previewImage ? (
                                <img
                                    className="dmodal-single-img"
                                    src={sref.previewImage}
                                    alt={sref.title}
                                    onClick={() => setLightboxSrc(sref.previewImage)}
                                />
                            ) : (
                                <div className="dmodal-left-placeholder">
                                    <span style={{ fontSize: '4rem', opacity: 0.3 }}>🎨</span>
                                </div>
                            )
                        ) : mediaItems.length === 1 ? (
                            /* 单媒体 */
                            active?.type === 'video' ? (
                                <video
                                    src={active.url}
                                    controls autoPlay loop muted playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <>
                                    <img
                                        className="dmodal-single-img"
                                        src={active?.url}
                                        alt={`--sref ${sref?.srefCode}`}
                                        onClick={() => setLightboxSrc(active?.url)}
                                        style={{ cursor: 'zoom-in' }}
                                    />
                                    <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '0.3rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', pointerEvents: 'none' }}>
                                        <ZoomIn size={12} /> Zoom
                                    </div>
                                </>
                            )
                        ) : (
                            /* 多媒体 — 主视图 + 缩略图条 */
                            <div className="dmodal-left-gallery">
                                {/* 主视图 */}
                                <div className="dmodal-main-view" style={{ position: 'relative' }}>
                                    {active?.type === 'video' ? (
                                        <video
                                            key={active.url}
                                            src={active.url}
                                            controls autoPlay loop muted playsInline
                                        />
                                    ) : (
                                        <>
                                            <img
                                                key={active?.url}
                                                src={active?.url}
                                                alt={`--sref ${sref?.srefCode}`}
                                                onClick={() => setLightboxSrc(active?.url)}
                                                style={{ cursor: 'zoom-in' }}
                                            />
                                            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '0.3rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', pointerEvents: 'none' }}>
                                                <ZoomIn size={12} /> Zoom
                                            </div>
                                        </>
                                    )}

                                    {/* 左右切换箭头（主视图内） */}
                                    <button
                                        className="dmodal-nav-arrow dmodal-nav-prev"
                                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                                        title="Previous (←)"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        className="dmodal-nav-arrow dmodal-nav-next"
                                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                                        title="Next (→)"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>

                                {/* 缩略图条 */}
                                <div className="dmodal-thumbs">
                                    {mediaItems.map((item, i) => (
                                        <div
                                            key={i}
                                            className={`dmodal-thumb ${i === activeIdx ? 'active' : ''}`}
                                            onClick={() => setActiveIdx(i)}
                                        >
                                            {item.type === 'image' ? (
                                                <img src={item.url} alt={`thumb ${i}`} />
                                            ) : (
                                                <>
                                                    <video src={item.url} muted playsInline preload="metadata"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <div className="dmodal-thumb-video-icon">
                                                        <Play size={14} fill="white" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 多媒体时右上角显示进度提示 */}
                        {hasThumbs && !isLoading && (
                            <div style={{
                                position: 'absolute', top: 12, left: 12, zIndex: 2,
                                background: 'rgba(0,0,0,0.55)', borderRadius: 8,
                                padding: '0.25rem 0.6rem', color: 'rgba(255,255,255,0.8)',
                                fontSize: '0.72rem', pointerEvents: 'none',
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                            }}>
                                {activeIdx + 1} / {total}
                                <span style={{ opacity: 0.6, marginLeft: 4 }}>· scroll to switch</span>
                            </div>
                        )}
                    </div>

                    {/* ── Right: info ── */}
                    <div className="dmodal-right">
                        <div className="dmodal-right-header">
                            <div className="dmodal-right-header-left">
                                <span style={{
                                    fontFamily: 'monospace', fontSize: '0.95rem',
                                    color: 'var(--text-primary)',
                                    background: 'rgba(139,92,246,0.15)',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                    borderRadius: 8, padding: '0.25rem 0.65rem',
                                }}>
                                    {sref ? `--sref ${sref.srefCode}` : '—'}
                                </span>
                            </div>
                            <button className="dmodal-close-btn" onClick={handleClose} title="Close (ESC)">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="dmodal-right-body">
                            {isLoading ? (
                                <div className="dmodal-loading">
                                    <Loader2 size={24} className="animate-spin" />
                                    <span>Loading...</span>
                                </div>
                            ) : !sref ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    <p>Style not found.</p>
                                    <button onClick={handleClose} className="detail-btn-primary" style={{ marginTop: '1rem' }}>Close</button>
                                </div>
                            ) : (
                                <>
                                    {sref.title && <h1 className="dmodal-title">{sref.title}</h1>}

                                    <div className="dmodal-stats">
                                        <span className="dmodal-stat"><Eye size={13} /> {sref.views || 0} views</span>
                                        <span className="dmodal-stat"><Heart size={13} /> {sref.likesCount || 0} likes</span>
                                    </div>

                                    {sref.description && (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                                            {sref.description}
                                        </p>
                                    )}

                                    {sref.tags?.length > 0 && (
                                        <div className="dmodal-tags">
                                            {sref.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="detail-tag"
                                                    onClick={() => { handleClose(); navigate(`/explore?tag=${encodeURIComponent(tag)}`); }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {sref && (
                            <div className="dmodal-right-footer">
                                <button className="dmodal-btn-primary" onClick={handleCopy}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy --sref'}
                                </button>
                                <button
                                    className={`dmodal-btn-icon ${sref.isLiked ? 'liked' : ''}`}
                                    onClick={handleLike}
                                    title={sref.isLiked ? 'Liked' : 'Like'}
                                >
                                    <Heart size={18} fill={sref.isLiked ? 'currentColor' : 'none'} />
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

export default SrefModal;
