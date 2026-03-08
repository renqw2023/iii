/**
 * Img2PromptPanel — 右侧滑出生成面板（阶段28 精确复刻 MeiGen）
 *
 * 实测值：
 * - aside: fixed top-4 bottom-4 right-4 z-40, width=320px
 * - inner: rounded-[22px] bg-white/95 backdrop-blur(8px) p-4
 * - Card1 (反推): h-16 rounded-[14px] bg-muted/50 hover:bg-muted/70 cursor-pointer
 * - Card2 (上传): h-16 rounded-[14px] border-dashed border-muted-foreground/20
 * - Card3 (描述): rounded-[14px] p-4 bg-muted/50 h-~200px
 * - CTA: h-11 rounded-[14px] bg-foreground (#1B1B1B) text-white hover:-translate-y-0.5
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Copy, Check, Loader2, Image as ImageIcon, Plus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

/* ── Muted bg: matches MeiGen's bg-muted/50 ≈ rgba(0,0,0,0.04) in light mode ── */
const MUTED = 'rgba(0,0,0,0.04)';
const MUTED_HOVER = 'rgba(0,0,0,0.07)';

const Img2PromptPanel = ({ open, onClose }) => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile]       = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [result, setResult]   = useState('');
  const [copied, setCopied]   = useState(false);
  const [prompt, setPrompt]   = useState('');

  useEffect(() => {
    if (!open) {
      setPreview(null); setFile(null); setResult('');
      setCopied(false); setIsDragging(false); setPrompt('');
    }
  }, [open]);

  const handleFile = (f) => {
    if (!f?.type?.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setFile(f); setResult('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!file) { toast.error('Please upload an image first'); return; }
    setIsLoading(true); setResult('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/tools/img2prompt', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setResult(res.data.prompt);
      updateUser({ credits: res.data.creditsLeft });
      toast.success('Prompt generated! 1 credit used');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    const text = result || prompt;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    /* Slide-in panel — exact MeiGen: fixed top-4 bottom-4 right-4, w=320px */
    <div
      style={{
        position: 'fixed', top: 16, bottom: 16, right: 16,
        width: 320, zIndex: 100,
        transform: open ? 'translateX(0)' : 'translateX(calc(100% + 16px))',
        transition: 'transform 0.2s ease-out',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Inner container — rounded-3xl ≈ 22px, bg-card/95, backdrop-blur(8px), p-4 */}
      <div
        style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          padding: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 12, paddingLeft: 4, paddingRight: 2, flexShrink: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>
            Generate
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              backgroundColor: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af', transition: 'background-color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; e.currentTarget.style.color = '#6b7280'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
                      scrollbarWidth: 'thin', paddingRight: 2 }}>

          {/* Card 1 — 反推提示词 / Reverse Prompt */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 64, borderRadius: 14, padding: '0 12px',
              backgroundColor: preview ? MUTED : MUTED,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'background-color 150ms', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED_HOVER; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = MUTED; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Custom image-reverse icon */}
              <svg viewBox="0 0 24 24" fill="none" width={14} height={14} style={{ color: '#9ca3af', flexShrink: 0 }}>
                <path d="M19 8C20.6569 8 22 6.65685 22 5C22 3.34315 20.6569 2 19 2C17.3431 2 16 3.34315 16 5C16 6.65685 17.3431 8 19 8Z"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V10"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>Reverse Prompt</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Drag image to reverse-engineer prompt</p>
              </div>
            </div>

            {/* Stacked image preview (MeiGen style) */}
            <div style={{ position: 'relative', width: 48, height: 36, overflow: 'visible', flexShrink: 0 }}>
              {preview ? (
                <>
                  <img src={preview} alt="" style={{
                    position: 'absolute', width: 32, height: 32, borderRadius: 6,
                    objectFit: 'cover', right: 4, bottom: -2, zIndex: 0,
                    transform: 'rotate(-12deg)', transition: 'transform 200ms ease-out',
                  }} />
                  <img src={preview} alt="" style={{
                    position: 'absolute', width: 32, height: 32, borderRadius: 6,
                    objectFit: 'cover', right: -2, bottom: -4, zIndex: 1,
                    transition: 'transform 200ms ease-out',
                  }} />
                </>
              ) : (
                <>
                  <div style={{
                    position: 'absolute', width: 32, height: 32, borderRadius: 6,
                    backgroundColor: 'rgba(0,0,0,0.08)', right: 4, bottom: -2, zIndex: 0,
                    transform: 'rotate(-12deg)',
                  }} />
                  <div style={{
                    position: 'absolute', width: 32, height: 32, borderRadius: 6,
                    backgroundColor: 'rgba(0,0,0,0.05)', right: -2, bottom: -4, zIndex: 1,
                  }} />
                </>
              )}
            </div>
          </div>

          {/* Card 2 — Upload reference image */}
          <div
            style={{
              height: 64, borderRadius: 14, padding: '0 12px',
              border: `1px dashed ${isDragging ? 'rgba(99,102,241,0.6)' : 'rgba(0,0,0,0.15)'}`,
              backgroundColor: isDragging ? 'rgba(99,102,241,0.04)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'border-color 150ms, background-color 150ms', flexShrink: 0,
            }}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onMouseEnter={e => { if (!isDragging) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)'; }}
            onMouseLeave={e => { if (!isDragging) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; }}
          >
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                   style={{ display: 'none' }}
                   onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>
                  Drag or upload reference image
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Optional</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 150ms', flexShrink: 0,
                color: '#6b7280',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Card 3 — Prompt description textarea */}
          <div style={{ borderRadius: 14, padding: 16, backgroundColor: MUTED, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Prompt Description</span>
              {(result || prompt) && (
                <button onClick={handleCopy}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                                 borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11,
                                 backgroundColor: copied ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)',
                                 color: copied ? '#16a34a' : '#6b7280', transition: 'all 150ms' }}>
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <textarea
              value={result || prompt}
              onChange={(e) => { if (!result) setPrompt(e.target.value); }}
              placeholder="Drag a card to apply popular prompts, or type here…"
              style={{
                width: '100%', minHeight: 130, border: 'none', outline: 'none',
                backgroundColor: 'transparent', resize: 'none',
                fontSize: 13, lineHeight: 1.6, color: '#374151',
                fontFamily: 'inherit',
              }}
              readOnly={!!result}
            />
          </div>

          {/* Divider + generate button area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>1 credit per generation</span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
          </div>

          {/* CTA — h-11 rounded-[14px] bg-foreground (#1B1B1B) hover:-translate-y-0.5 */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !file}
            style={{
              height: 44, borderRadius: 14, border: 'none',
              backgroundColor: '#1B1B1B', color: '#fff',
              fontSize: 15, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: isLoading || !file ? 'not-allowed' : 'pointer',
              opacity: isLoading || !file ? 0.5 : 1,
              transition: 'transform 150ms, opacity 150ms',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (!isLoading && file) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {isLoading ? (
              <><Loader2 size={15} className="animate-spin" />Generating...</>
            ) : (
              <><Upload size={14} />Generate Prompt</>
            )}
          </button>

          {!isAuthenticated && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0 }}>
              <button onClick={openLoginModal}
                      style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer',
                               padding: 0, textDecoration: 'underline', fontSize: 12 }}>
                Sign in
              </button>
              {' '}to use this feature (1 credit each)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Img2PromptPanel;
