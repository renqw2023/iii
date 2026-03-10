/**
 * Img2PromptPanel — 右侧生成面板（精确对标 MeiGen.ai，阶段29整合版）
 *
 * Tab 1 "Reverse" — 拖入图片 → 反推 Prompt（GPT-4o Vision，扣 2 积分）
 * Tab 2 "Generate" — 输入 Prompt → 文生图（Gemini Flash / DALL·E 3，扣 5/8 积分）
 *
 * 拖拽机制：
 *   - 拖入 { image, prompt } (GalleryCard)
 *     → Tab1: 使用 image 反推       Tab2: 直接填入 prompt 文本
 *   - 拖入本地文件
 *     → Tab1: 上传反推              Tab2: 不支持
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Copy, Check, Loader2, Image as ImageIcon, Plus,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Zap, ExternalLink, Wand2, Download, Link,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { generateAPI } from '../../services/generateApi';

const MUTED   = 'rgba(0,0,0,0.04)';
const MUTED_H = 'rgba(0,0,0,0.07)';
const REVERSE_COST = 2;

const RATIOS = ['1:1', '4:3', '3:4', '16:9'];
const RESOLUTIONS = ['2K', '4K'];

const FAQ_LINKS = [
  { label: 'How does Reverse Prompt work?', href: '/help' },
  { label: 'How many credits do I need?',   href: '/credits' },
];

/* ── SparklesIcon (MeiGen 原版双星 SVG) ── */
const SparklesIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M11.85 4.22L11.72 3.24C11.69 3 11.49 2.83 11.25 2.83C11.01 2.83 10.81 3 10.78 3.24L10.65 4.22C10.27 7.08 8.01 9.34 5.14 9.72L4.16 9.85C3.93 9.89 3.75 10.09 3.75 10.33C3.75 10.56 3.93 10.77 4.16 10.8L5.14 10.93C8.01 11.31 10.27 13.57 10.65 16.43L10.78 17.41C10.81 17.65 11.01 17.83 11.25 17.83C11.49 17.83 11.69 17.65 11.72 17.41L11.85 16.43C12.23 13.57 14.49 11.31 17.36 10.93L18.34 10.8C18.57 10.77 18.75 10.56 18.75 10.33C18.75 10.09 18.57 9.89 18.34 9.85L17.36 9.72C14.49 9.34 12.23 7.08 11.85 4.22Z"
          stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);

/* ═══════════════════════════════════════════════
   Tab 1 — Reverse Prompt（图生文）
═══════════════════════════════════════════════ */
const ReverseTab = ({ onClose }) => {
  const { isAuthenticated, updateUser, openLoginModal } = useAuth();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [preview,     setPreview]     = useState(null);
  const [file,        setFile]        = useState(null);
  const [isDragging1, setIsDragging1] = useState(false);
  const [isDragging3, setIsDragging3] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [result,      setResult]      = useState('');
  const [copied,      setCopied]      = useState(false);
  const [prompt,      setPrompt]      = useState('');
  const [ratioIdx,    setRatioIdx]    = useState(2);
  const [resolution,  setResolution]  = useState('2K');
  const [faqOpen,     setFaqOpen]     = useState(false);

  const handleFile = (f) => {
    if (!f?.type?.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setFile(f); setResult('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const runGenerate = useCallback(async (fileObj, imageUrl) => {
    if (!isAuthenticated) { openLoginModal(); return; }
    setIsLoading(true); setResult('');
    try {
      const token = localStorage.getItem('token');
      let res;
      if (fileObj) {
        const formData = new FormData();
        formData.append('image', fileObj);
        res = await axios.post('/api/tools/img2prompt', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.post('/api/tools/img2prompt', { imageUrl }, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
      }
      setResult(res.data.prompt);
      updateUser({ credits: res.data.creditsLeft });
      toast.success(`Prompt generated! ${REVERSE_COST} credits used`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed, please try again');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, openLoginModal, updateUser]);

  const handleDrop = useCallback((e, setDragging) => {
    e.preventDefault();
    setDragging(false);
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.image) {
          if (!isAuthenticated) { openLoginModal(); return; }
          setPreview(parsed.image);
          setFile(null);
          runGenerate(null, parsed.image);
          return;
        }
      } catch (_) { /* ignore */ }
      toast.error('Only image drops are supported');
      return;
    }
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, openLoginModal, runGenerate]);

  const handleCopy = async () => {
    const text = result || prompt;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const credits = user?.credits ?? 0;
  const canGenerate = !isLoading && !!file;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', paddingRight: 2 }}>

      {/* Card 1 — Reverse Prompt */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={(e) => handleDrop(e, setIsDragging1)}
        onDragOver={(e) => { e.preventDefault(); setIsDragging1(true); }}
        onDragLeave={() => setIsDragging1(false)}
        style={{
          height: 64, borderRadius: 14, padding: '0 12px',
          backgroundColor: isDragging1 ? 'rgba(99,102,241,0.06)' : MUTED,
          border: isDragging1 ? '1px dashed rgba(99,102,241,0.5)' : '1px solid transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
        }}
        onMouseEnter={e => { if (!isDragging1) e.currentTarget.style.backgroundColor = MUTED_H; }}
        onMouseLeave={e => { if (!isDragging1) e.currentTarget.style.backgroundColor = MUTED; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" width={14} height={14} style={{ color: '#9ca3af', flexShrink: 0 }}>
            <path d="M19 8C20.6569 8 22 6.65685 22 5C22 3.34315 20.6569 2 19 2C17.3431 2 16 3.34315 16 5C16 6.65685 17.3431 8 19 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>Reverse Prompt</p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
              {isDragging1 ? 'Release to generate prompt…' : 'Drag image to reverse-engineer prompt'}
            </p>
          </div>
        </div>
        <div style={{ position: 'relative', width: 48, height: 36, flexShrink: 0 }}>
          {preview ? (
            <>
              <img src={preview} alt="" style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, objectFit: 'cover', right: 4, bottom: -2, zIndex: 0, transform: 'rotate(-12deg)' }} />
              <img src={preview} alt="" style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, objectFit: 'cover', right: -2, bottom: -4, zIndex: 1 }} />
            </>
          ) : (
            <>
              <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.08)', right: 4, bottom: -2, zIndex: 0, transform: 'rotate(-12deg)' }} />
              <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.05)', right: -2, bottom: -4, zIndex: 1 }} />
            </>
          )}
        </div>
      </div>

      {/* Card 2 — Upload reference */}
      <div
        style={{
          height: 64, borderRadius: 14, padding: '0 12px',
          border: `1px dashed ${isDragging3 ? 'rgba(99,102,241,0.6)' : 'rgba(0,0,0,0.15)'}`,
          backgroundColor: isDragging3 ? 'rgba(99,102,241,0.04)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
        }}
        onClick={() => fileInputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setIsDragging3(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging3(true); }}
        onDragLeave={() => setIsDragging3(false)}
        onMouseEnter={e => { if (!isDragging3) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)'; }}
        onMouseLeave={e => { if (!isDragging3) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; }}
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
        <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          style={{ width: 36, height: 36, borderRadius: 8, border: 'none', backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 150ms', flexShrink: 0, color: '#6b7280' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.09)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}>
          <Plus size={16} />
        </button>
      </div>

      {/* Card 3 — Prompt textarea */}
      <div
        style={{ borderRadius: 14, padding: 16, backgroundColor: MUTED, flexShrink: 0, transition: 'background-color 150ms' }}
        onDrop={(e) => handleDrop(e, () => {})}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.05)'; }}
        onDragLeave={(e) => { e.currentTarget.style.backgroundColor = MUTED; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Prompt Description</span>
          {(result || prompt) && (
            <button onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, backgroundColor: copied ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)', color: copied ? '#16a34a' : '#6b7280', transition: 'all 150ms' }}>
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 120, color: '#9ca3af' }}>
            <Loader2 size={14} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Analyzing image…</span>
          </div>
        ) : (
          <textarea
            value={result || prompt}
            onChange={(e) => { if (!result) setPrompt(e.target.value); }}
            placeholder="Drag any gallery image here to auto-generate its prompt, or type manually…"
            style={{ width: '100%', minHeight: 120, border: 'none', outline: 'none', backgroundColor: 'transparent', resize: 'none', fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'inherit' }}
            readOnly={!!result}
          />
        )}
      </div>

      {/* Ratio / Resolution */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div style={{ display: 'flex', flex: 1 }}>
          <button onClick={() => setRatioIdx(i => (i - 1 + RATIOS.length) % RATIOS.length)}
            style={{ width: 30, height: 30, border: '1px solid rgba(0,0,0,0.10)', borderRadius: '8px 0 0 8px', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'background-color 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}>
            <ChevronLeft size={13} />
          </button>
          <div style={{ flex: 1, height: 30, border: '1px solid rgba(0,0,0,0.10)', borderLeft: 'none', borderRight: 'none', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{RATIOS[ratioIdx]}</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{ratioIdx + 1}/{RATIOS.length}</span>
          </div>
          <button onClick={() => setRatioIdx(i => (i + 1) % RATIOS.length)}
            style={{ width: 30, height: 30, border: '1px solid rgba(0,0,0,0.10)', borderRadius: '0 8px 8px 0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'background-color 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}>
            <ChevronRight size={13} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {RESOLUTIONS.map(res => (
            <button key={res} onClick={() => setResolution(res)}
              style={{ height: 30, padding: '0 10px', borderRadius: 8, border: `1px solid ${resolution === res ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.10)'}`, backgroundColor: resolution === res ? '#fff' : 'transparent', fontSize: 12, fontWeight: resolution === res ? 500 : 400, color: resolution === res ? '#374151' : '#9ca3af', cursor: 'pointer', transition: 'all 150ms' }}>
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.07)' }} />
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{REVERSE_COST} credits per generation</span>
        <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.07)' }} />
      </div>

      {/* FAQ */}
      <div style={{ flexShrink: 0 }}>
        <button onClick={() => setFaqOpen(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px 4px' }}>
          <span style={{ fontSize: 12, fontWeight: 500 }}>FAQ</span>
          {faqOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {faqOpen && (
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FAQ_LINKS.map(({ label, href }) => (
              <a key={href} href={href}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', textDecoration: 'none', padding: '4px 4px', borderRadius: 6, transition: 'color 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#374151'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}>
                <ExternalLink size={11} style={{ flexShrink: 0 }} />
                {label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Model row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#6b7280', backgroundColor: '#f3f4f6', borderRadius: 999, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Now available ✨
        </span>
        <div style={{ flex: 1, height: 36, borderRadius: 14, backgroundColor: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SparklesIcon size={13} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(27,27,27,0.8)' }}>GPT-4o Vision</span>
          </div>
          <ChevronDown size={12} style={{ color: '#9ca3af' }} />
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={() => { if (!isAuthenticated) { openLoginModal(); return; } if (!file) { toast.error('Please upload an image first'); return; } runGenerate(file, null); }}
        disabled={!canGenerate}
        style={{
          height: 44, borderRadius: 14, border: 'none',
          backgroundColor: '#1B1B1B', color: '#fff',
          fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          opacity: canGenerate ? 1 : 0.45,
          transition: 'transform 150ms, opacity 150ms', flexShrink: 0,
        }}
        onMouseEnter={e => { if (canGenerate) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {isLoading ? (
          <><Loader2 size={14} className="animate-spin" />Analyzing…</>
        ) : (
          <>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Generate Prompt</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 7px' }}>
              <Zap size={10} style={{ color: '#FFDBA4' }} />
              <span style={{ fontSize: 12 }}>{REVERSE_COST}</span>
            </div>
          </>
        )}
      </button>

      {!isAuthenticated ? (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
          <button onClick={openLoginModal} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}>
            Sign in
          </button>{' '}to use this feature
        </p>
      ) : (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
          Balance: <strong style={{ color: '#6b7280' }}>{credits}</strong> credits
        </p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Tab 2 — Generate Image（文生图）
═══════════════════════════════════════════════ */
const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9'];

const GenerateTab = () => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();

  const [models, setModels]               = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [prompt, setPrompt]               = useState('');
  const [aspectRatio, setAspectRatio]     = useState('1:1');
  const [isLoading, setIsLoading]         = useState(false);
  const [result, setResult]               = useState(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [modelsLoaded, setModelsLoaded]   = useState(false);

  useEffect(() => {
    if (modelsLoaded) return;
    generateAPI.getModels()
      .then(list => {
        setModels(list);
        if (list.length > 0) setSelectedModel(list[0].id);
        setModelsLoaded(true);
      })
      .catch(() => {});
  }, [modelsLoaded]);

  const currentModel = models.find(m => m.id === selectedModel);

  /* 拖拽：优先读 prompt 字段（Gallery卡片），无则忽略 */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.prompt) {
          setPrompt(parsed.prompt);
          toast.success('Prompt filled from gallery card');
          return;
        }
        if (parsed.image) {
          toast('Drop to Reverse Prompt tab to analyze this image', { icon: '💡' });
          return;
        }
      } catch (_) { /* ignore */ }
    }
  }, []);

  const handleGenerate = async () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!prompt.trim()) { toast.error('Please enter a prompt'); return; }
    if (!selectedModel) { toast.error('No model available'); return; }
    setIsLoading(true); setResult(null);
    try {
      const data = await generateAPI.generateImage({ prompt, modelId: selectedModel, aspectRatio });
      setResult(data);
      updateUser({ credits: data.creditsLeft });
      toast.success(`Image generated! ${currentModel?.creditCost} credits used`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const a = document.createElement('a');
    a.href = result.imageUrl;
    a.download = `generated_${Date.now()}.png`;
    a.click();
  };

  const handleCopyUrl = async () => {
    if (!result?.imageUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${result.imageUrl}`);
    toast.success('URL copied');
  };

  const credits = user?.credits ?? 0;
  const canGenerate = !isLoading && !!prompt.trim() && !!selectedModel;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', paddingRight: 2 }}>

      {/* Model selector */}
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 6px 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</p>
        {models.length === 0 ? (
          <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>No models configured. Add GEMINI_API_KEY or OPENAI_API_KEY to server.</p>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {models.map(m => (
              <button key={m.id} onClick={() => setSelectedModel(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 99,
                  border: `1.5px solid ${selectedModel === m.id ? '#6366f1' : 'rgba(0,0,0,0.1)'}`,
                  backgroundColor: selectedModel === m.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: selectedModel === m.id ? '#6366f1' : '#374151',
                  fontSize: 12, fontWeight: selectedModel === m.id ? 600 : 400,
                  cursor: 'pointer', transition: 'all 150ms',
                }}>
                <span>{m.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 6, padding: '1px 5px', fontSize: 11, color: '#6b7280' }}>
                  <Zap size={9} style={{ color: '#f59e0b' }} />{m.creditCost}
                </span>
                {m.badge && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 4px' }}>{m.badge}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prompt box with drag support */}
      <div
        style={{
          borderRadius: 14, padding: 12,
          backgroundColor: isDragging ? 'rgba(99,102,241,0.05)' : MUTED,
          border: `1.5px ${isDragging ? 'dashed rgba(99,102,241,0.5)' : 'solid transparent'}`,
          flexShrink: 0, transition: 'all 150ms',
        }}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <p style={{ fontSize: 11, color: isDragging ? '#6366f1' : '#9ca3af', margin: '0 0 6px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isDragging ? '✦ Drop to fill prompt' : 'Prompt'}
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to create… or drag a Gallery card here"
          style={{ width: '100%', minHeight: 100, border: 'none', outline: 'none', backgroundColor: 'transparent', resize: 'none', fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'inherit' }}
        />
      </div>

      {/* Aspect ratio */}
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 6px 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aspect Ratio</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {ASPECT_RATIOS.map(r => (
            <button key={r} onClick={() => setAspectRatio(r)}
              style={{
                flex: 1, height: 30, borderRadius: 8,
                border: `1.5px solid ${aspectRatio === r ? '#6366f1' : 'rgba(0,0,0,0.10)'}`,
                backgroundColor: aspectRatio === r ? 'rgba(99,102,241,0.08)' : 'transparent',
                color: aspectRatio === r ? '#6366f1' : '#6b7280',
                fontSize: 12, fontWeight: aspectRatio === r ? 600 : 400,
                cursor: 'pointer', transition: 'all 150ms',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        style={{
          height: 44, borderRadius: 14, border: 'none',
          backgroundColor: '#1B1B1B', color: '#fff',
          fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          opacity: canGenerate ? 1 : 0.45,
          transition: 'transform 150ms, opacity 150ms', flexShrink: 0,
        }}
        onMouseEnter={e => { if (canGenerate) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {isLoading ? (
          <><Loader2 size={14} className="animate-spin" />Generating…</>
        ) : (
          <>
            <Wand2 size={15} />
            <span>Generate Image</span>
            {currentModel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 7px' }}>
                <Zap size={10} style={{ color: '#FFDBA4' }} />
                <span style={{ fontSize: 12 }}>{currentModel.creditCost}</span>
              </div>
            )}
          </>
        )}
      </button>

      {/* Auth / balance */}
      {!isAuthenticated ? (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
          <button onClick={openLoginModal} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}>
            Sign in
          </button>{' '}to generate images
        </p>
      ) : (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
          Balance: <strong style={{ color: '#6b7280' }}>{credits}</strong> credits
        </p>
      )}

      {/* Result */}
      {result && (
        <div style={{ flexShrink: 0, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', animation: 'fadeIn 0.3s ease-out' }}>
          <img src={result.imageUrl} alt="Generated" style={{ width: '100%', display: 'block' }} />
          <div style={{ display: 'flex', gap: 6, padding: 8, backgroundColor: MUTED }}>
            <button onClick={handleDownload}
              style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid rgba(0,0,0,0.10)', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, color: '#374151', fontWeight: 500, transition: 'background-color 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED_H; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}>
              <Download size={13} /> Download
            </button>
            <button onClick={handleCopyUrl}
              style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid rgba(0,0,0,0.10)', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, color: '#374151', fontWeight: 500, transition: 'background-color 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED_H; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}>
              <Link size={13} /> Copy URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Main Panel
═══════════════════════════════════════════════ */
const Img2PromptPanel = ({ open, onClose }) => {
  const [tab, setTab] = useState('reverse'); // 'reverse' | 'generate'

  useEffect(() => {
    if (!open) setTab('reverse');
  }, [open]);

  const TAB_STYLE = (active) => ({
    flex: 1, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: active ? 600 : 400,
    backgroundColor: active ? '#fff' : 'transparent',
    color: active ? '#111827' : '#9ca3af',
    transition: 'all 150ms',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  });

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
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        overflow: 'hidden', padding: 16, gap: 8,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, paddingLeft: 4, paddingRight: 2 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Generate</h2>
          <button onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', transition: 'background-color 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; e.currentTarget.style.color = '#6b7280'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, padding: '4px', backgroundColor: MUTED, borderRadius: 10, flexShrink: 0 }}>
          <button style={TAB_STYLE(tab === 'reverse')} onClick={() => setTab('reverse')}>
            Reverse Prompt
          </button>
          <button style={TAB_STYLE(tab === 'generate')} onClick={() => setTab('generate')}>
            Generate Image
          </button>
        </div>

        {/* Tab content */}
        {tab === 'reverse' ? <ReverseTab onClose={onClose} /> : <GenerateTab />}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Img2PromptPanel;
