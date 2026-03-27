import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import GalleryShareCard from './GalleryShareCard';
import SrefShareCard from './SrefShareCard';

export default function ShareCardModal({ type, data, onClose }) {
  const cardRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Give the DOM a frame to render the hidden card before capturing
    const timer = setTimeout(async () => {
      if (!cardRef.current) return;
      try {
        const canvas = await html2canvas(cardRef.current, {
          useCORS: true,
          allowTaint: true,  // fallback if CORS fails
          scale: 2,          // 2× for high-res output
          logging: false,
          backgroundColor: null,
        });
        setPreviewUrl(canvas.toDataURL('image/png'));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    if (!previewUrl) return;
    const name = type === 'sref'
      ? `iii-pics-sref-${data.srefCode}.png`
      : `iii-pics-gallery-${data._id?.slice(-6) || 'share'}.png`;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = name;
    a.click();
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.80)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal centering wrapper — flex avoids transform conflicts with framer-motion scale */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        style={{
          pointerEvents: 'auto',
          background: '#111111',
          borderRadius: 16,
          border: '1px solid #27272a',
          padding: 24,
          width: 'min(90vw, 460px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0 }}>分享卡片</p>
            <p style={{ color: '#52525b', fontSize: 12, margin: '2px 0 0' }}>
              {type === 'sref' ? `--sref ${data.srefCode}` : (data.title || 'Gallery Image')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1c1c1e',
              border: '1px solid #27272a',
              borderRadius: 8,
              padding: 6,
              cursor: 'pointer',
              color: '#71717a',
              lineHeight: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview area */}
        <div
          style={{
            background: '#0a0a0a',
            borderRadius: 10,
            border: '1px solid #1c1c1e',
            overflow: 'hidden',
            aspectRatio: '4/5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Loader2 size={28} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#52525b', fontSize: 12, margin: 0 }}>正在生成卡片…</p>
            </div>
          )}
          {error && !loading && (
            <p style={{ color: '#71717a', fontSize: 13, margin: 0 }}>生成失败，请重试</p>
          )}
          {previewUrl && !loading && (
            <img
              src={previewUrl}
              alt="share card preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          )}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={loading || error || !previewUrl}
          style={{
            background: previewUrl ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#1c1c1e',
            border: 'none',
            borderRadius: 10,
            padding: '12px 0',
            color: previewUrl ? '#fff' : '#52525b',
            fontSize: 14,
            fontWeight: 600,
            cursor: previewUrl ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'opacity 0.2s',
          }}
        >
          <Download size={16} />
          下载图片（1600×2000px）
        </button>

        <p style={{ color: '#3f3f46', fontSize: 11, textAlign: 'center', margin: 0 }}>
          保存到相册后可直接分享到小红书 / Instagram
        </p>
      </motion.div>
      </div>

      {/* Hidden card templates — rendered off-screen for html2canvas to capture */}
      {type === 'gallery'
        ? <GalleryShareCard ref={cardRef} prompt={data} />
        : <SrefShareCard ref={cardRef} sref={data} />
      }

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>,
    document.body
  );
}
