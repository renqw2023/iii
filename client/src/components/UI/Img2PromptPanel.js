/**
 * Img2PromptPanel — 右侧生成面板（对标 MeiGen.ai 精确复刻）
 *
 * 实测布局（MeiGen 1440×900）：
 * - aside: fixed top-4 bottom-4 right-4 z-40, width=320px
 * - inner: rounded-22px bg-white/0.95 backdrop-blur(8px) p-16px
 * - Header: h-28px "Generate" + X close
 * - Card1 (反推): h-64px rounded-14px bg-muted/50 hover cursor-pointer
 * - Card2 (上传): h-64px rounded-14px border-dashed
 * - Card3 (描述): rounded-14px p-16px bg-muted/50 h-200px textarea
 * - 比例行: [◀][3:4][▶] X/4 indicator + [2K] resolution pill
 * - FAQ 手风琴: toggle + 展开内容
 * - 模型行: announcement pill + model selector
 * - 生成按钮: h-44px rounded-14px bg-#1B1B1B ⚡N credit count
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, Copy, Check, Loader2, Image as ImageIcon, Plus,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Zap,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

/* ── 常量 ── */
const MUTED     = 'rgba(0,0,0,0.04)';
const MUTED_H   = 'rgba(0,0,0,0.07)';

const RATIOS = ['1:1', '4:3', '3:4', '16:9'];
const RESOLUTIONS = ['2K', '4K'];

const FAQ_ITEMS = [
  {
    q: 'How does Reverse Prompt work?',
    a: 'Upload any image and our AI (GPT-4o Vision) will analyze it and generate a detailed Midjourney-compatible prompt that describes the image style, subject, lighting, and composition.',
  },
  {
    q: 'What image formats are supported?',
    a: 'We support JPEG, PNG, and WebP images up to 10MB. For best results, use high-resolution images with clear visual elements.',
  },
  {
    q: 'How many credits does it cost?',
    a: 'Each Reverse Prompt generation costs 1 credit. Free users get 40 credits refreshed daily. Paid plans include credits that never expire.',
  },
];

const Img2PromptPanel = ({ open, onClose }) => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();
  const fileInputRef = useRef(null);

  const [preview,    setPreview]    = useState(null);
  const [file,       setFile]       = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [result,     setResult]     = useState('');
  const [copied,     setCopied]     = useState(false);
  const [prompt,     setPrompt]     = useState('');

  /* 比例 / 分辨率 */
  const [ratioIdx,    setRatioIdx]    = useState(2); // default 3:4
  const [resolution,  setResolution]  = useState('2K');

  /* FAQ */
  const [faqOpen,    setFaqOpen]    = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  /* 重置 */
  useEffect(() => {
    if (!open) {
      setPreview(null); setFile(null); setResult('');
      setCopied(false); setIsDragging(false); setPrompt('');
      setFaqOpen(false); setOpenFaqIdx(null);
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

  const credits = user?.credits ?? 0;

  return (
    <div
      style={{
        position: 'fixed', top: 16, bottom: 16, right: 16,
        width: 320, zIndex: 100,
        transform: open ? 'translateX(0)' : 'translateX(calc(100% + 16px))',
        transition: 'transform 0.2s ease-out',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Inner container */}
      <div
        style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          padding: 16,
          gap: 8,
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, paddingLeft: 4, paddingRight: 2,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Generate</h2>
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

        {/* ── Scrollable body ── */}
        <div style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
          scrollbarWidth: 'thin', paddingRight: 2,
        }}>

          {/* Card 1 — Reverse Prompt */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 64, borderRadius: 14, padding: '0 12px',
              backgroundColor: MUTED,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'background-color 150ms', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED_H; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = MUTED; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            {/* Stacked image preview */}
            <div style={{ position: 'relative', width: 48, height: 36, flexShrink: 0 }}>
              {preview ? (
                <>
                  <img src={preview} alt="" style={{
                    position: 'absolute', width: 32, height: 32, borderRadius: 6,
                    objectFit: 'cover', right: 4, bottom: -2, zIndex: 0,
                    transform: 'rotate(-12deg)',
                  }} />
                  <img src={preview} alt="" style={{
                    position: 'absolute', width: 32, height: 32, borderRadius: 6,
                    objectFit: 'cover', right: -2, bottom: -4, zIndex: 1,
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

          {/* Card 2 — Upload reference */}
          <div
            style={{
              height: 64, borderRadius: 14, padding: '0 12px',
              border: `1px dashed ${isDragging ? 'rgba(99,102,241,0.6)' : 'rgba(0,0,0,0.15)'}`,
              backgroundColor: isDragging ? 'rgba(99,102,241,0.04)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
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
                  {file ? file.name.slice(0, 22) + (file.name.length > 22 ? '…' : '') : 'Drag or upload reference image'}
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
                transition: 'background-color 150ms', flexShrink: 0, color: '#6b7280',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Card 3 — Prompt textarea */}
          <div style={{ borderRadius: 14, padding: 16, backgroundColor: MUTED, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Prompt Description</span>
              {(result || prompt) && (
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 11,
                    backgroundColor: copied ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)',
                    color: copied ? '#16a34a' : '#6b7280', transition: 'all 150ms',
                  }}
                >
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
                width: '100%', minHeight: 120, border: 'none', outline: 'none',
                backgroundColor: 'transparent', resize: 'none',
                fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'inherit',
              }}
              readOnly={!!result}
            />
          </div>

          {/* ── Ratio / Resolution row ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}>
            {/* Prev / Next arrows + ratio display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
              <button
                onClick={() => setRatioIdx(i => (i - 1 + RATIOS.length) % RATIOS.length)}
                style={{
                  width: 30, height: 30, border: '1px solid rgba(0,0,0,0.10)',
                  borderRadius: '8px 0 0 8px', backgroundColor: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', transition: 'background-color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}
              >
                <ChevronLeft size={13} />
              </button>
              <div style={{
                height: 30, padding: '0 10px', border: '1px solid rgba(0,0,0,0.10)',
                borderLeft: 'none', borderRight: 'none',
                backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, minWidth: 64,
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                  {RATIOS[ratioIdx]}
                </span>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>
                  {ratioIdx + 1}/{RATIOS.length}
                </span>
              </div>
              <button
                onClick={() => setRatioIdx(i => (i + 1) % RATIOS.length)}
                style={{
                  width: 30, height: 30, border: '1px solid rgba(0,0,0,0.10)',
                  borderRadius: '0 8px 8px 0', backgroundColor: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', transition: 'background-color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Resolution toggle */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {RESOLUTIONS.map(res => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  style={{
                    height: 30, padding: '0 10px', borderRadius: 8,
                    border: `1px solid ${resolution === res ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.10)'}`,
                    backgroundColor: resolution === res ? '#fff' : 'transparent',
                    fontSize: 12, fontWeight: resolution === res ? 500 : 400,
                    color: resolution === res ? '#374151' : '#9ca3af',
                    cursor: 'pointer', transition: 'all 150ms',
                  }}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.07)' }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>1 credit per generation</span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.07)' }} />
          </div>

          {/* ── FAQ section ── */}
          <div style={{ borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
            {/* FAQ toggle */}
            <button
              onClick={() => setFaqOpen(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 4px', border: 'none', backgroundColor: 'transparent',
                cursor: 'pointer', color: '#9ca3af',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 500 }}>FAQ</span>
              {faqOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {faqOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {FAQ_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 10, overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.07)',
                    }}
                  >
                    <button
                      onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: 8,
                        padding: '9px 12px', border: 'none',
                        backgroundColor: openFaqIdx === idx ? MUTED : 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background-color 150ms',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', lineHeight: 1.4 }}>
                        {item.q}
                      </span>
                      {openFaqIdx === idx
                        ? <ChevronUp size={12} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        : <ChevronDown size={12} style={{ color: '#9ca3af', flexShrink: 0 }} />
                      }
                    </button>
                    {openFaqIdx === idx && (
                      <div style={{ padding: '8px 12px 10px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Model row ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Announcement pill */}
            <span style={{
              fontSize: 10, color: '#6b7280',
              backgroundColor: '#f3f4f6', borderRadius: 999,
              padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              GPT-4o Vision ✨
            </span>
            {/* Model selector */}
            <button
              style={{
                flex: 1, height: 36, borderRadius: 14,
                backgroundColor: MUTED, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 12, fontWeight: 500, color: 'rgba(27,27,27,0.8)',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED_H; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = MUTED; }}
            >
              <svg viewBox="0 0 20 20" fill="none" width={13} height={13}>
                <path d="M11.85 4.22L11.72 3.24C11.69 3 11.49 2.83 11.25 2.83C11.01 2.83 10.81 3 10.78 3.24L10.65 4.22C10.27 7.08 8.01 9.34 5.14 9.72L4.16 9.85C3.93 9.89 3.75 10.09 3.75 10.33C3.75 10.56 3.93 10.77 4.16 10.8L5.14 10.93C8.01 11.31 10.27 13.57 10.65 16.43L10.78 17.41C10.81 17.65 11.01 17.83 11.25 17.83C11.49 17.83 11.69 17.65 11.72 17.41L11.85 16.43C12.23 13.57 14.49 11.31 17.36 10.93L18.34 10.8C18.57 10.77 18.75 10.56 18.75 10.33C18.75 10.09 18.57 9.89 18.34 9.85L17.36 9.72C14.49 9.34 12.23 7.08 11.85 4.22Z"
                      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
              GPT-4o Vision
            </button>
          </div>

          {/* ── Generate button ── */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !file}
            style={{
              height: 44, borderRadius: 14, border: 'none',
              backgroundColor: '#1B1B1B', color: '#fff',
              fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: isLoading || !file ? 'not-allowed' : 'pointer',
              opacity: isLoading || !file ? 0.45 : 1,
              transition: 'transform 150ms, opacity 150ms',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (!isLoading && file) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {isLoading ? (
              <><Loader2 size={14} className="animate-spin" />Generating…</>
            ) : (
              <>
                <span>Generate Prompt</span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 6, padding: '2px 7px', marginLeft: 2,
                }}>
                  <Zap size={10} style={{ color: '#FFDBA4' }} />
                  <span style={{ fontSize: 12 }}>1</span>
                </div>
              </>
            )}
          </button>

          {/* Sign-in prompt */}
          {!isAuthenticated && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
              <button
                onClick={openLoginModal}
                style={{
                  color: '#6366f1', background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12,
                }}
              >
                Sign in
              </button>
              {' '}to use this feature
            </p>
          )}

          {/* Credit balance hint */}
          {isAuthenticated && (
            <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
              Balance: <strong style={{ color: '#6b7280' }}>{credits}</strong> credits
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Img2PromptPanel;
