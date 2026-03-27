import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Download, Link, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import GalleryShareCard from './GalleryShareCard';
import SrefShareCard from './SrefShareCard';

export default function ShareCardModal({ type, data, onClose }) {
  const cardRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const shareUrl = type === 'sref'
    ? `https://iii.pics/explore/${data._id}`
    : `https://iii.pics/gallery/${data._id}`;

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
            <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0 }}>Share Card</p>
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
            type === 'gallery' ? (
              /* Gallery skeleton: tall image area + thin brand strip */
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, background: '#111', position: 'relative', overflow: 'hidden' }}>
                  <div className="shimmer-sweep" />
                </div>
                <div style={{ height: '10%', background: '#0a0a0a', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: '#1c1c1e' }} />
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#1c1c1e' }} />
                  <div style={{ width: 36, height: 36, borderRadius: 4, background: '#1c1c1e' }} />
                  <div className="shimmer-sweep" />
                </div>
              </div>
            ) : (
              /* Sref skeleton: 2×2 grid + text lines */
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: '0 0 65%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2, position: 'relative', overflow: 'hidden' }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ background: '#111', position: 'relative', overflow: 'hidden' }}>
                      <div className="shimmer-sweep" style={{ animationDelay: `${i * 0.15}s` }} />
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, background: '#0f0f0f', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: 10, width: '45%', borderRadius: 4, background: '#1c1c1e' }} />
                  <div style={{ height: 22, width: '70%', borderRadius: 6, background: '#1c1c1e' }} />
                  <div style={{ height: 10, width: '55%', borderRadius: 4, background: '#1c1c1e', marginTop: 4 }} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {[40, 55, 45].map((w, i) => (
                      <div key={i} style={{ height: 18, width: `${w}px`, borderRadius: 4, background: '#1c1c1e' }} />
                    ))}
                  </div>
                  <div className="shimmer-sweep" />
                </div>
              </div>
            )
          )}
          {error && !loading && (
            <p style={{ color: '#71717a', fontSize: 13, margin: 0 }}>Generation failed — please try again</p>
          )}
          {previewUrl && !loading && (
            <img
              src={previewUrl}
              alt="share card preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCopyLink}
            style={{
              background: '#1c1c1e',
              border: '1px solid #27272a',
              borderRadius: 10,
              padding: '12px 0',
              color: copied ? '#a78bfa' : '#71717a',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: 52,
              flexShrink: 0,
              transition: 'color 0.2s',
            }}
            title="Copy link"
          >
            {copied ? <Check size={16} /> : <Link size={16} />}
          </button>
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
              flex: 1,
              transition: 'opacity 0.2s',
            }}
          >
            <Download size={16} />
            Download Image (1600×2000px)
          </button>
        </div>

        <p style={{ color: '#3f3f46', fontSize: 11, textAlign: 'center', margin: 0 }}>
          Save and share to Instagram, Pinterest, or anywhere you like
        </p>
      </motion.div>
      </div>

      {/* Hidden card templates — rendered off-screen for html2canvas to capture */}
      {type === 'gallery'
        ? <GalleryShareCard ref={cardRef} prompt={data} />
        : <SrefShareCard ref={cardRef} sref={data} />
      }

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .shimmer-sweep {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.045) 40%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.045) 60%, transparent 100%);
          animation: shimmer 1.8s ease-in-out infinite;
        }
      `}</style>
    </>,
    document.body
  );
}
