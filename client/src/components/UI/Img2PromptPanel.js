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

// 反推 Prompt 可用模型列表
const REVERSE_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash',      provider: 'Google', badge: null   },
  { id: 'gemini-2.5-flash',       name: 'Gemini 2.5 Flash',    provider: 'Google', badge: 'Fast' },
];

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
   Tab 1 — Reverse Prompt（图生文 → 文生图）
═══════════════════════════════════════════════ */
const ReverseTab = ({ onClose }) => {
  const { isAuthenticated, updateUser, openLoginModal } = useAuth();
  const { user } = useAuth();
  const reverseFileInputRef = useRef(null);  // Card 1 — 反推用图
  const refFileInputRef     = useRef(null);  // Card 2 — 参考图
  const modelDropdownRef    = useRef(null);
  const resultRef           = useRef(null);

  // ── 反推图片状态（Card 1）──
  const [reverseFile,    setReverseFile]    = useState(null);
  const [reversePreview, setReversePreview] = useState(null);
  const [isDragging1,    setIsDragging1]    = useState(false);

  // ── 参考图状态（Card 2）──
  const [refImageFile,  setRefImageFile]  = useState(null);
  const [refImageB64,   setRefImageB64]   = useState(null);
  const [refMimeType,   setRefMimeType]   = useState(null);
  const [refPreview,    setRefPreview]    = useState(null);
  const [isDragging2,   setIsDragging2]   = useState(false);

  const [isLoading,         setIsLoading]         = useState(false);
  const [result,            setResult]            = useState('');
  const [copied,            setCopied]            = useState(false);
  const [prompt,            setPrompt]            = useState('');
  const [ratioIdx,          setRatioIdx]          = useState(2);
  const [resolution,        setResolution]        = useState('2K');
  const [selectedRevModel,  setSelectedRevModel]  = useState(REVERSE_MODELS[0].id);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // ── 生图状态 ──
  const [genModels,        setGenModels]        = useState([]);
  const [selectedGenModel, setSelectedGenModel] = useState(null);
  const [isGenerating,     setIsGenerating]     = useState(false);
  const [genResult,        setGenResult]        = useState(null);

  // 拉取生图模型列表
  useEffect(() => {
    generateAPI.getModels()
      .then(list => {
        const available = list.filter(m => !m.comingSoon);
        setGenModels(available);
        const preferred = available.find(m => m.id === 'gemini3-pro') ?? available[0];
        if (preferred) setSelectedGenModel(preferred.id);
      })
      .catch(() => {});
  }, []);

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Card 1 — 反推图片处理
  const handleReverseFile = (f) => {
    if (!f?.type?.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setReverseFile(f); setResult('');
    const reader = new FileReader();
    reader.onload = (e) => setReversePreview(e.target.result);
    reader.readAsDataURL(f);
  };

  // Card 2 — 参考图处理（读取为 base64 供生图 API 使用）
  const handleRefFile = (f) => {
    if (!f?.type?.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setRefImageFile(f);
    setRefMimeType(f.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setRefPreview(dataUrl);
      // 去掉 data:image/xxx;base64, 前缀，只保留 base64 数据
      setRefImageB64(dataUrl.split(',')[1]);
    };
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
        formData.append('model', selectedRevModel);
        res = await axios.post('/api/tools/img2prompt', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.post('/api/tools/img2prompt', { imageUrl, model: selectedRevModel }, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
      }
      setResult(res.data.prompt);
      updateUser({ credits: res.data.creditsLeft, freeCredits: res.data.freeCreditsLeft });
      toast.success(`Prompt generated! ${REVERSE_COST} credits used`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed, please try again');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, openLoginModal, updateUser, selectedRevModel]);

  // Card 1 onDrop — JSON 有 image → 反推；File → 设置反推图
  const handleCard1Drop = useCallback((e) => {
    e.preventDefault();
    setIsDragging1(false);
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.image) {
          if (!isAuthenticated) { openLoginModal(); return; }
          setReversePreview(parsed.image);
          setReverseFile(null);
          runGenerate(null, parsed.image);
          return;
        }
      } catch (_) { /* ignore */ }
      return;
    }
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleReverseFile(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, openLoginModal, runGenerate]);

  // Card 2 onDrop — 只处理 File，存为参考图；忽略 JSON
  const handleCard2Drop = useCallback((e) => {
    e.preventDefault();
    setIsDragging2(false);
    // 只处理文件，不处理 JSON（JSON 是 Gallery 卡片，不适合作参考图）
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleRefFile(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Card 3 onDrop — 只处理 JSON 中的 prompt 字段，填入文本框；不处理 File
  const handleCard3Drop = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = MUTED;
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.prompt) {
          setPrompt(parsed.prompt);
          toast.success('Prompt filled from gallery card');
        }
        // 有 image 但无 prompt：提示用户拖到 Card 1
        else if (parsed.image) {
          toast('Drop to "Reverse Prompt" card to analyze this image', { icon: '💡' });
        }
      } catch (_) { /* ignore */ }
    }
    // 不处理文件（文件应拖到 Card 1 或 Card 2）
  }, []);

  const handleCopy = async () => {
    const text = result || prompt;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // ── 文生图 ──
  const handleGenerateImage = async () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    const promptText = (result || prompt).trim();
    if (!promptText) { toast.error('Please analyze an image or type a prompt first'); return; }
    if (!selectedGenModel) { toast.error('No generation model available'); return; }
    setIsGenerating(true);
    setGenResult(null);
    try {
      const data = await generateAPI.generateImage({
        prompt: promptText,
        modelId: selectedGenModel,
        aspectRatio: RATIOS[ratioIdx],
        ...(refImageB64 ? { referenceImageData: refImageB64, referenceImageMime: refMimeType } : {}),
      });
      setGenResult(data);
      updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft });
      const genModel = genModels.find(m => m.id === selectedGenModel);
      toast.success(`Image generated! ${genModel?.creditCost ?? '?'} credits used`);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed, please try again');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!genResult?.imageUrl) return;
    const a = document.createElement('a');
    a.href = genResult.imageUrl;
    a.download = `generated_${Date.now()}.png`;
    a.click();
  };

  const handleCopyUrl = async () => {
    if (!genResult?.imageUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${genResult.imageUrl}`);
    toast.success('URL copied');
  };

  const credits = user?.credits ?? 0;
  const freeCredits = user?.freeCredits ?? 0;
  const canAnalyze = !isLoading && !!reverseFile;
  const canGenerateImage = !isGenerating && !!(result || prompt).trim() && !!selectedGenModel;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', paddingRight: 2 }}>

      {/* Card 1 — Reverse Prompt（hidden file input for reverse image） */}
      <input ref={reverseFileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
             style={{ display: 'none' }}
             onChange={(e) => e.target.files[0] && handleReverseFile(e.target.files[0])} />
      <div
        onClick={() => reverseFileInputRef.current?.click()}
        onDrop={handleCard1Drop}
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
          {reversePreview ? (
            <>
              <img src={reversePreview} alt="" style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, objectFit: 'cover', right: 4, bottom: -2, zIndex: 0, transform: 'rotate(-12deg)' }} />
              <img src={reversePreview} alt="" style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, objectFit: 'cover', right: -2, bottom: -4, zIndex: 1 }} />
            </>
          ) : (
            <>
              <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.08)', right: 4, bottom: -2, zIndex: 0, transform: 'rotate(-12deg)' }} />
              <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.05)', right: -2, bottom: -4, zIndex: 1 }} />
            </>
          )}
        </div>
      </div>

      {/* Card 2 — Upload reference image（独立 file input，独立 drop 区域） */}
      <input ref={refFileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
             style={{ display: 'none' }}
             onChange={(e) => e.target.files[0] && handleRefFile(e.target.files[0])} />
      <div
        style={{
          height: 64, borderRadius: 14, padding: '0 12px',
          border: `1px dashed ${isDragging2 ? 'rgba(99,102,241,0.6)' : 'rgba(0,0,0,0.15)'}`,
          backgroundColor: isDragging2 ? 'rgba(99,102,241,0.04)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
        }}
        onClick={() => refFileInputRef.current?.click()}
        onDrop={handleCard2Drop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging2(true); }}
        onDragLeave={() => setIsDragging2(false)}
        onMouseEnter={e => { if (!isDragging2) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)'; }}
        onMouseLeave={e => { if (!isDragging2) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {refPreview ? (
            <img src={refPreview} alt="ref" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <ImageIcon size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
          )}
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>
              {refImageFile ? refImageFile.name.slice(0, 22) + (refImageFile.name.length > 22 ? '…' : '') : 'Drag or upload reference image'}
            </p>
            <p style={{ fontSize: 11, color: refImageFile ? '#6366f1' : '#9ca3af', margin: 0 }}>
              {refImageFile ? 'Will be sent with prompt' : 'Optional · sent to generation model'}
            </p>
          </div>
        </div>
        {refImageFile ? (
          <button onClick={(e) => { e.stopPropagation(); setRefImageFile(null); setRefImageB64(null); setRefMimeType(null); setRefPreview(null); }}
            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
            <X size={13} />
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); refFileInputRef.current?.click(); }}
            style={{ width: 36, height: 36, borderRadius: 8, border: 'none', backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 150ms', flexShrink: 0, color: '#6b7280' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}>
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Card 3 — Prompt textarea（只接收 JSON prompt，不处理文件或图片） */}
      <div
        style={{ borderRadius: 14, padding: 16, backgroundColor: MUTED, flexShrink: 0, transition: 'background-color 150ms' }}
        onDrop={handleCard3Drop}
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

      {/* ── Step 1: Analyze ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Vision model dropdown */}
        <div ref={modelDropdownRef} style={{ flex: 1, position: 'relative' }}>
          <button
            onClick={() => setModelDropdownOpen(v => !v)}
            style={{
              width: '100%', height: 34, borderRadius: 10,
              backgroundColor: modelDropdownOpen ? 'rgba(99,102,241,0.07)' : MUTED,
              border: `1.5px solid ${modelDropdownOpen ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 10px', cursor: 'pointer', transition: 'all 150ms',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <SparklesIcon size={11} />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(27,27,27,0.75)' }}>
                {REVERSE_MODELS.find(m => m.id === selectedRevModel)?.name ?? 'Gemini 3 Flash'}
              </span>
            </div>
            <ChevronDown size={11} style={{ color: '#9ca3af', transition: 'transform 150ms', transform: modelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
          {modelDropdownOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden' }}>
              {REVERSE_MODELS.map(m => {
                const active = m.id === selectedRevModel;
                return (
                  <button key={m.id} onClick={() => { setSelectedRevModel(m.id); setModelDropdownOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 11px', border: 'none', cursor: 'pointer', backgroundColor: active ? 'rgba(99,102,241,0.06)' : '#fff', transition: 'background-color 100ms' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = active ? 'rgba(99,102,241,0.06)' : '#fff'; }}>
                    <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#6366f1' : '#374151' }}>{m.name}</span>
                    {m.badge && <span style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 5px' }}>{m.badge}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {/* Analyze button */}
        <button
          onClick={() => { if (!isAuthenticated) { openLoginModal(); return; } if (!reverseFile) { toast.error('Please upload an image first'); return; } runGenerate(reverseFile, null); }}
          disabled={!canAnalyze}
          style={{
            height: 34, padding: '0 14px', borderRadius: 10, border: 'none', flexShrink: 0,
            backgroundColor: canAnalyze ? '#6366f1' : 'rgba(0,0,0,0.08)',
            color: canAnalyze ? '#fff' : '#9ca3af',
            fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5,
            cursor: canAnalyze ? 'pointer' : 'not-allowed',
            transition: 'all 150ms',
          }}
          onMouseEnter={e => { if (canAnalyze) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <SparklesIcon size={12} />}
          {isLoading ? 'Analyzing…' : 'Analyze'}
          {!isLoading && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, padding: '1px 5px', fontSize: 10 }}>
              <Zap size={9} style={{ color: '#FFDBA4' }} />{REVERSE_COST}
            </span>
          )}
        </button>
      </div>

      <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />

      {/* ── Step 2: Generate Image ── */}
      {/* Gen model pills */}
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 5px 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generation Model</p>
        {genModels.length === 0 ? (
          <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>No models configured</p>
        ) : (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {genModels.map(m => (
              <button key={m.id} onClick={() => setSelectedGenModel(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 9px', borderRadius: 99,
                  border: `1.5px solid ${selectedGenModel === m.id ? '#6366f1' : 'rgba(0,0,0,0.1)'}`,
                  backgroundColor: selectedGenModel === m.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: selectedGenModel === m.id ? '#6366f1' : '#374151',
                  fontSize: 11, fontWeight: selectedGenModel === m.id ? 600 : 400,
                  cursor: 'pointer', transition: 'all 150ms',
                }}>
                <span>{m.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 5, padding: '1px 4px', fontSize: 10, color: '#6b7280' }}>
                  <Zap size={8} style={{ color: '#f59e0b' }} />{m.creditCost}
                </span>
                {m.badge && <span style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 4px' }}>{m.badge}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generate Image button — main CTA */}
      <button
        onClick={handleGenerateImage}
        disabled={!canGenerateImage}
        style={{
          height: 44, borderRadius: 14, border: 'none',
          backgroundColor: '#1B1B1B', color: '#fff',
          fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: canGenerateImage ? 'pointer' : 'not-allowed',
          opacity: canGenerateImage ? 1 : 0.45,
          transition: 'transform 150ms, opacity 150ms', flexShrink: 0,
        }}
        onMouseEnter={e => { if (canGenerateImage) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {isGenerating ? (
          <><Loader2 size={14} className="animate-spin" />Generating…</>
        ) : (
          <>
            <Wand2 size={15} />
            <span>Generate Image</span>
            {selectedGenModel && genModels.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 7px' }}>
                <Zap size={10} style={{ color: '#FFDBA4' }} />
                <span style={{ fontSize: 12 }}>{genModels.find(m => m.id === selectedGenModel)?.creditCost ?? '?'}</span>
              </div>
            )}
          </>
        )}
      </button>

      {/* Balance hint */}
      {!isAuthenticated ? (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
          <button onClick={openLoginModal} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}>Sign in</button>{' '}to use this feature
        </p>
      ) : (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
          Free: <strong style={{ color: '#fbbf24' }}>{freeCredits}</strong>
          {' '}·{' '}
          Credits: <strong style={{ color: '#6b7280' }}>{credits}</strong>
        </p>
      )}

      {/* ── Generated image result ── */}
      {genResult && (
        <div
          ref={resultRef}
          style={{ flexShrink: 0, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', animation: 'fadeIn 0.3s ease-out' }}
        >
          <img src={genResult.imageUrl} alt="Generated" style={{ width: '100%', display: 'block' }} />
          <div style={{ display: 'flex', gap: 6, padding: 8, backgroundColor: MUTED }}>
            <button onClick={handleDownload}
              style={{ flex: 1, height: 32, borderRadius: 8, border: '1px solid rgba(0,0,0,0.10)', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, color: '#374151', fontWeight: 500, transition: 'background-color 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED_H; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}>
              <Download size={12} /> Download
            </button>
            <button onClick={handleCopyUrl}
              style={{ flex: 1, height: 32, borderRadius: 8, border: '1px solid rgba(0,0,0,0.10)', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, color: '#374151', fontWeight: 500, transition: 'background-color 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED_H; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}>
              <Link size={12} /> Copy URL
            </button>
          </div>
        </div>
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
        if (list.length > 0) {
          // 优先选 Gemini 3 Pro，其次选第一个非 comingSoon 的模型
          const preferred = list.find(m => m.id === 'gemini3-pro' && !m.comingSoon)
            ?? list.find(m => !m.comingSoon)
            ?? list[0];
          setSelectedModel(preferred.id);
        }
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
      updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft });
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
  const freeCredits = user?.freeCredits ?? 0;
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
          Free: <strong style={{ color: '#fbbf24' }}>{freeCredits}</strong>
          {' '}·{' '}
          Credits: <strong style={{ color: '#6b7280' }}>{credits}</strong>
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
