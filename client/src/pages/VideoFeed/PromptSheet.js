import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const PromptSheet = ({ prompt, title, open, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt || '');
      setCopied(true);
      toast.success('Prompt copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          zIndex: 200,
          opacity: open ? 1 : 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 201,
          background: '#1a1a2e',
          borderRadius: '20px 20px 0 0',
          padding: '0 0 calc(env(safe-area-inset-bottom, 0px) + 24px)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '75dvh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
              Video Prompt
            </p>
            {title && (
              <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>
                {title.length > 40 ? title.slice(0, 40) + '…' : title}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Prompt text — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
          <p style={{
            margin: 0,
            fontSize: 13, lineHeight: 1.7,
            color: 'rgba(255,255,255,0.82)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {prompt || 'No prompt available.'}
          </p>
        </div>

        {/* Copy button */}
        <div style={{ padding: '12px 16px 0' }}>
          <button
            onClick={handleCopy}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 0',
              borderRadius: 12,
              border: 'none', cursor: 'pointer',
              backgroundColor: copied ? '#22c55e' : 'rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: 14, fontWeight: 600,
              transition: 'background 0.2s',
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default PromptSheet;
