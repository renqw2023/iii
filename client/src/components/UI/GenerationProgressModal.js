/**
 * GenerationProgressModal — 生成进度浮层
 * React Portal，挂载到 document.body
 * 三态：loading | error | success
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, RefreshCw, Download, Link, CheckCircle2, Zap } from 'lucide-react';

const GenerationProgressModal = ({
  isOpen,
  onClose,
  status,
  progress = 0,
  result,
  errorMessage,
  onRetry,
  onDownload,
  onCopyUrl,
}) => {
  if (typeof document === 'undefined') return null;

  const canClose = status === 'success' || status === 'error';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={canClose ? onClose : undefined}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 9998,
              cursor: canClose ? 'pointer' : 'default',
            }}
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              width: '90vw',
              maxWidth: 440,
              borderRadius: 24,
              overflow: 'hidden',
              background: '#fff',
              boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
            }}
          >
            {/* Close button — only when closeable */}
            {canClose && (
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.07)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
              >
                <X size={15} color="#6b7280" />
              </button>
            )}

            {/* ── LOADING STATE ── */}
            {status === 'loading' && (
              <div style={{
                padding: '44px 32px 40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                background: 'linear-gradient(180deg, rgba(249,247,241,0.98) 0%, #fff 100%)',
              }}>
                {/* Ring progress */}
                <div style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `conic-gradient(#111827 ${Math.max(progress, 3) * 3.6}deg, rgba(17,24,39,0.10) 0deg)`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.07)',
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{progress}%</span>
                  </div>
                </div>

                {/* Pulsing dots */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: '#111827',
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        opacity: 0.3,
                      }}
                    />
                  ))}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
                    Generating your image...
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                    We're preparing your result.<br />This may take up to 30 seconds.
                  </p>
                </div>
              </div>
            )}

            {/* ── ERROR STATE ── */}
            {status === 'error' && (
              <div style={{
                padding: '40px 32px 36px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                background: 'linear-gradient(180deg, rgba(255,249,249,0.98) 0%, #fff 100%)',
              }}>
                {/* Error icon */}
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239,68,68,0.10)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ef4444',
                }}>
                  <AlertCircle size={28} />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
                    Generation failed
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                    {errorMessage || 'Service is busy right now. Try again or switch to another model.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
                  <button
                    onClick={onRetry}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 12,
                      border: 'none',
                      backgroundColor: '#111827',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                    }}
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 12,
                      border: '1.5px solid rgba(0,0,0,0.12)',
                      backgroundColor: 'transparent',
                      color: '#374151',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Try another model
                  </button>
                </div>
              </div>
            )}

            {/* ── SUCCESS STATE ── */}
            {status === 'success' && result?.imageUrl && (
              <div>
                {/* Image area */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={result.imageUrl}
                    alt="Generated"
                    style={{
                      width: '100%',
                      display: 'block',
                      maxHeight: 320,
                      objectFit: 'cover',
                    }}
                  />
                  {/* Bottom gradient overlay on image */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '0 14px 12px',
                    gap: 8,
                  }}>
                    {/* Success badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: 'rgba(34,197,94,0.90)',
                      borderRadius: 8,
                      padding: '3px 9px',
                    }}>
                      <CheckCircle2 size={12} color="#fff" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>Generation complete</span>
                    </div>
                    {/* Model badge */}
                    {result.modelName && (
                      <div style={{
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        borderRadius: 8,
                        padding: '3px 9px',
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.85)',
                        fontWeight: 500,
                      }}>
                        {result.modelName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div style={{ padding: '14px 16px 16px', backgroundColor: '#fff' }}>
                  {/* Referral reward */}
                  {result.referralRewardMessage && (
                    <div style={{
                      marginBottom: 12,
                      padding: '9px 12px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(99,102,241,0.08)',
                      color: '#4f46e5',
                      fontSize: 12,
                      lineHeight: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <Zap size={13} style={{ flexShrink: 0 }} />
                      {result.referralRewardMessage}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={onDownload}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 10,
                        border: '1.5px solid rgba(0,0,0,0.12)',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: '#374151',
                        fontWeight: 500,
                      }}
                    >
                      <Download size={13} /> Download
                    </button>
                    <button
                      onClick={onCopyUrl}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 10,
                        border: '1.5px solid rgba(0,0,0,0.12)',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: '#374151',
                        fontWeight: 500,
                      }}
                    >
                      <Link size={13} /> Copy URL
                    </button>
                    <button
                      onClick={onClose}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 10,
                        border: 'none',
                        backgroundColor: '#111827',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default GenerationProgressModal;
