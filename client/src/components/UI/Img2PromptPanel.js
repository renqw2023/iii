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
  ChevronLeft, ChevronRight, ChevronDown,
  Zap, Wand2,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { generateAPI } from '../../services/generateApi';
import { useGeneration } from '../../contexts/GenerationContext';

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
const ReverseTab = ({ onClose: _onClose, onStartGeneration, prefillJob, onPrefillConsumed }) => {
  const { isAuthenticated, updateUser, openLoginModal } = useAuth();
  const { user } = useAuth();
  const { addGeneration, updateGeneration } = useGeneration();
  const reverseFileInputRef = useRef(null);  // Card 1 — 反推用图
  const refFileInputRef     = useRef(null);  // Card 2 — 参考图
  const modelDropdownRef    = useRef(null);

  // ── 反推图片状态（Card 1）──
  const [reverseFile,    setReverseFile]    = useState(null);
  const [reversePreview, setReversePreview] = useState(null);
  const [isDragging1,    setIsDragging1]    = useState(false);

  // ── 参考图状态（Card 2）── 支持多图（最多 4 张）
  // 每项: { preview: string, b64: string|null, mime: string|null, url: string|null }
  const [refImages,   setRefImages]   = useState([]);
  const [isDragging2, setIsDragging2] = useState(false);
  const MAX_REF = 4;

  const [isLoading,         setIsLoading]         = useState(false);
  const [result,            setResult]            = useState('');
  const [copied,            setCopied]            = useState(false);
  const [prompt,            setPrompt]            = useState('');
  const [ratioIdx,          setRatioIdx]          = useState(2);
  const [resolution,        setResolution]        = useState('2K');
  const [selectedRevModel,  setSelectedRevModel]  = useState(REVERSE_MODELS[0].id);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // ── 生图模型 ──
  const [genModels,        setGenModels]        = useState([]);
  const [selectedGenModel, setSelectedGenModel] = useState(null);

  // 拉取生图模型列表
  useEffect(() => {
    generateAPI.getModels()
      .then(list => {
        const available = list.filter(m => !m.comingSoon);
        setGenModels(available);
        const preferred = available.find(m => m.id === 'gemini3-flash') ?? available[0];
        if (preferred) setSelectedGenModel(preferred.id);
      })
      .catch(() => {});
  }, []);


  // 消费 prefillJob：prompt 填入文本框；referenceImageUrl 填入参考图
  useEffect(() => {
    if (!prefillJob) return;
    if (prefillJob.prompt) {
      setPrompt(prefillJob.prompt);
    }
    if (prefillJob.referenceImageUrl) {
      setRefImages([{ preview: prefillJob.referenceImageUrl, b64: null, mime: null, url: prefillJob.referenceImageUrl }]);
    }
    onPrefillConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillJob]);

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

  // Card 2 — 添加参考图（支持多图，最多 MAX_REF 张）
  const addRefFile = (f) => {
    if (!f?.type?.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (refImages.length >= MAX_REF) { toast.error(`Maximum ${MAX_REF} reference images`); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setRefImages(prev => [...prev, { preview: dataUrl, b64: dataUrl.split(',')[1], mime: f.type, url: null }]);
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

  // Card 2 onDrop — 两种来源都支持：
  //   ① Gallery/Sref 卡片拖入（application/json，含 image URL）
  //   ② 本地文件从 OS 拖入（FileList）
  const handleCard2Drop = useCallback((e) => {
    e.preventDefault();
    setIsDragging2(false);

    // ① 优先处理 Gallery 卡片拖拽（JSON 含 image URL）
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.image) {
          const url = parsed.image;
          setRefImages(prev => {
            if (prev.length >= MAX_REF) { toast.error(`Maximum ${MAX_REF} reference images`); return prev; }
            if (prev.some(r => r.url === url || r.preview === url)) return prev; // 去重
            return [...prev, { preview: url, b64: null, mime: null, url }];
          });
        }
      } catch (_) { /* ignore */ }
      return;
    }

    // ② 本地文件拖入
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    files.forEach(f => addRefFile(f));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refImages.length]);

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

  // ── 文生图 → 跳转到 /generate-history ──
  const handleGenerateImage = () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    const promptText = (result || prompt).trim();
    if (!promptText) { toast.error('Please analyze an image or type a prompt first'); return; }
    if (!selectedGenModel) { toast.error('No generation model available'); return; }

    const jobId = Date.now().toString();
    const genModel = genModels.find(m => m.id === selectedGenModel);
    addGeneration({
      id: jobId,
      status: 'loading',
      progress: 8,
      prompt: promptText,
      modelId: selectedGenModel,
      modelName: genModel?.name,
      aspectRatio: RATIOS[ratioIdx],
      result: null,
      errorMessage: '',
      startedAt: new Date(),
    });

    onStartGeneration?.();

    generateAPI.generateImage({
      prompt: promptText,
      modelId: selectedGenModel,
      aspectRatio: RATIOS[ratioIdx],
      resolution,
      ...(refImages[0]?.b64
        ? { referenceImageData: refImages[0].b64, referenceImageMime: refImages[0].mime }
        : refImages[0]?.url ? { referenceImageUrl: refImages[0].url } : {}),
    }).then(data => {
      updateGeneration(jobId, { status: 'success', progress: 100, result: data });
      updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft });
      const creditCost = (genModel?.creditCost ?? 0) + (resolution === '4K' ? 5 : 0);
      toast.success(`Image generated! ${creditCost} credits used`);
    }).catch(err => {
      const msg = err.response?.data?.message || 'Generation failed, please try again';
      updateGeneration(jobId, { status: 'error', errorMessage: msg });
      if (err.response?.status === 403) {
        toast.error('4K requires a paid plan — purchase credits first');
      } else {
        toast.error(msg);
      }
    });
  };

  const credits = user?.credits ?? 0;
  const freeCredits = user?.freeCredits ?? 0;
  const canAnalyze = !isLoading && !!reverseFile;
  const canGenerateImage = !!(result || prompt).trim() && !!selectedGenModel;

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
              {/* Back card — landscape placeholder */}
              <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, backgroundColor: '#e8eaf6', right: 4, bottom: -2, zIndex: 0, transform: 'rotate(-12deg)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                <svg viewBox="0 0 32 32" width="32" height="32" style={{ position: 'absolute', bottom: 0 }}>
                  <rect width="32" height="32" fill="#c5cae9" />
                  <circle cx="22" cy="10" r="4" fill="#9fa8da" />
                  <polygon points="0,22 12,10 20,18 26,13 32,20 32,32 0,32" fill="#7986cb" />
                </svg>
              </div>
              {/* Front card — portrait placeholder */}
              <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, backgroundColor: '#ede7f6', right: -2, bottom: -4, zIndex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 32 32" width="32" height="32">
                  <rect width="32" height="32" fill="#e8eaf6" />
                  <circle cx="16" cy="12" r="5" fill="#b39ddb" />
                  <path d="M6 28 Q6 20 16 20 Q26 20 26 28" fill="#9575cd" />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card 2 — Upload reference image（支持多图，最多 MAX_REF 张） */}
      <input ref={refFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
             style={{ display: 'none' }}
             onChange={(e) => { [...e.target.files].forEach(f => addRefFile(f)); e.target.value = ''; }} />

      {refImages.length === 0 ? (
        /* ── 空态：dashed 边框 ── */
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
            <ImageIcon size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>Drop or upload reference</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>optional</p>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); refFileInputRef.current?.click(); }}
            style={{ width: 36, height: 36, borderRadius: 8, border: 'none', backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 150ms', flexShrink: 0, color: '#6b7280' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}>
            <Plus size={16} />
          </button>
        </div>
      ) : (
        /* ── 有图态：缩略图横排 + + 按钮 ── */
        <div
          style={{
            minHeight: 64, borderRadius: 14, padding: '10px 12px',
            border: `1px dashed ${isDragging2 ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.25)'}`,
            backgroundColor: isDragging2 ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.03)',
            transition: 'all 150ms', flexShrink: 0,
          }}
          onDrop={handleCard2Drop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging2(true); }}
          onDragLeave={() => setIsDragging2(false)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {refImages.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                <img src={img.preview} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => setRefImages(prev => prev.filter((_, i) => i !== idx))}
                  style={{
                    position: 'absolute', top: -5, right: -5,
                    width: 16, height: 16, borderRadius: '50%', border: 'none',
                    backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, lineHeight: 1, padding: 0,
                  }}
                >
                  <X size={9} />
                </button>
              </div>
            ))}
            {refImages.length < MAX_REF && (
              <button
                onClick={() => refFileInputRef.current?.click()}
                style={{ width: 40, height: 40, borderRadius: 8, border: '1px dashed rgba(99,102,241,0.4)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', transition: 'all 150ms', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.color = '#6366f1'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#9ca3af'; }}
              >
                <Plus size={14} />
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#6366f1', margin: '6px 0 0', paddingLeft: 2 }}>
            {refImages.length}/{MAX_REF} · Will be sent with prompt
          </p>
        </div>
      )}

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
          {RESOLUTIONS.map(res => {
            const locked = res === '4K' && !user?.hasPurchasedBefore;
            return (
              <button key={res}
                onClick={() => locked ? toast('4K requires a paid plan — purchase credits first', { icon: '🔒' }) : setResolution(res)}
                title={locked ? 'Requires paid plan' : undefined}
                style={{ height: 30, padding: '0 10px', borderRadius: 8, border: `1px solid ${resolution === res ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.10)'}`, backgroundColor: resolution === res ? '#fff' : 'transparent', fontSize: 12, fontWeight: resolution === res ? 500 : 400, color: locked ? '#c4b5fd' : resolution === res ? '#374151' : '#9ca3af', cursor: locked ? 'not-allowed' : 'pointer', transition: 'all 150ms', opacity: locked ? 0.65 : 1 }}>
                {res}{res === '4K' ? (locked ? ' 🔒' : ' +5') : ''}
              </button>
            );
          })}
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
        <>
            <Wand2 size={15} />
            <span>Generate Image</span>
            {selectedGenModel && genModels.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 7px' }}>
                <Zap size={10} style={{ color: '#FFDBA4' }} />
                <span style={{ fontSize: 12 }}>{(() => { const base = genModels.find(m => m.id === selectedGenModel)?.creditCost ?? null; return base != null ? base + (resolution === '4K' ? 5 : 0) : '?'; })()}</span>
              </div>
            )}
          </>
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
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Tab 2 — Generate Video
═══════════════════════════════════════════════ */
const VIDEO_RESOLUTIONS = ['480p', '720p', '1080p'];
const VIDEO_RATIOS_T2V  = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'];
const VIDEO_RATIOS_I2V  = ['adaptive', '16:9', '4:3', '1:1', '3:4', '9:16', '21:9'];

// Per-second credit rates (30% margin; 1 credit ≈ ¥0.0674)
const PER_SEC_RATES = { '480p': 3.15, '720p': 6.75, '1080p': 15 };
const getVideoCost = (res, dur, audio = false) => {
  const base = Math.round((PER_SEC_RATES[res] ?? 15) * Number(dur));
  return audio ? Math.round(base * 1.3) : base;
};

const VIDEO_MODELS = [
  { key: 'seedance-1-5-pro', name: 'Seedance 1.5 Pro', badge: null,   comingSoon: false },
  { key: 'seedance-2-0-pro', name: 'Seedance 2.0 Pro', badge: 'Soon', comingSoon: true  },
];

// Small frame-image upload zone component
const FrameZone = ({ label, preview, onFile, onClear }) => {
  const ref = useRef(null);
  return (
    <div style={{ flex: 1, flexShrink: 0 }}>
      <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      {preview ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', paddingBottom: '56.25%', backgroundColor: '#000' }}>
          <img src={preview} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={onClear} style={{
            position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}><X size={10} /></button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} style={{
          width: '100%', paddingBottom: '56.25%', position: 'relative',
          borderRadius: 10, border: '1.5px dashed rgba(0,0,0,0.12)',
          backgroundColor: MUTED, cursor: 'pointer',
        }}>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#9ca3af' }}>
            <Plus size={16} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>Upload</span>
          </span>
        </button>
      )}
    </div>
  );
};

const VideoTab = ({ onStartGeneration, prefillJob, onPrefillConsumed }) => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();
  const { addGeneration, updateGeneration } = useGeneration();

  const [prompt, setPrompt]           = useState('');
  const [modelKey, setModelKey]       = useState('seedance-1-5-pro');
  const [mode, setMode]               = useState('text'); // 'text' | 'first_frame' | 'first_last'
  const [firstFile, setFirstFile]     = useState(null);
  const [lastFile, setLastFile]       = useState(null);
  const [firstPreview, setFirstPreview] = useState(null);
  const [lastPreview, setLastPreview]   = useState(null);
  const [duration, setDuration]       = useState(5);
  const [resolution, setResolution]   = useState('720p');
  const [ratio, setRatio]             = useState('16:9');
  const [generateAudio, setGenerateAudio] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [isDragging, setIsDragging]   = useState(false);

  useEffect(() => {
    if (prefillJob?.prompt) { setPrompt(prefillJob.prompt); onPrefillConsumed?.(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillJob]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const json = e.dataTransfer.getData('application/json');
    if (json) { try { const p = JSON.parse(json); if (p.prompt) { setPrompt(p.prompt); toast.success('Prompt filled from gallery card'); } } catch (_) {} }
  }, []);

  const setFrame = (which, file) => {
    const url = URL.createObjectURL(file);
    if (which === 'first') { setFirstFile(file); setFirstPreview(url); }
    else                   { setLastFile(file);  setLastPreview(url);  }
  };
  const clearFrame = (which) => {
    if (which === 'first') { setFirstFile(null); setFirstPreview(null); }
    else                   { setLastFile(null);  setLastPreview(null);  }
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!prompt.trim()) { toast.error('Please enter a prompt'); return; }
    if (mode === 'first_frame'  && !firstFile) { toast.error('Please upload the first frame image'); return; }
    if (mode === 'first_last'   && (!firstFile || !lastFile)) { toast.error('Please upload both first and last frame images'); return; }

    setUploading(true);
    let firstFrameUrl = null;
    let lastFrameUrl  = null;

    try {
      if (firstFile) {
        const res = await generateAPI.uploadVideoFrame(firstFile);
        firstFrameUrl = res.url;
      }
      if (lastFile) {
        const res = await generateAPI.uploadVideoFrame(lastFile);
        lastFrameUrl = res.url;
      }
    } catch (err) {
      toast.error('Frame image upload failed: ' + (err.response?.data?.message || err.message));
      setUploading(false);
      return;
    }
    setUploading(false);

    const jobId = Date.now().toString();
    addGeneration({
      id: jobId, status: 'loading', progress: 8,
      prompt: prompt.trim(), modelId: modelKey,
      modelName: VIDEO_MODELS.find(m => m.key === modelKey)?.name,
      aspectRatio: ratio === 'adaptive' ? '16:9' : ratio,
      mediaType: 'video', generateAudio, result: null, errorMessage: '', startedAt: new Date(),
    });

    onStartGeneration?.();

    generateAPI.generateVideo({
      prompt: prompt.trim(), modelKey, duration, resolution, ratio,
      generateAudio, firstFrameUrl, lastFrameUrl,
    }).then(data => {
      updateGeneration(jobId, { status: 'success', progress: 100, result: { videoUrl: data.videoUrl }, videoUrl: data.videoUrl });
      updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft });
      toast.success(`Video generated! ${data.creditCost ?? currentCost} credits used`);
    }).catch(err => {
      updateGeneration(jobId, { status: 'error', errorMessage: err.response?.data?.message || err.message || 'Video generation failed' });
      toast.error(err.response?.data?.message || err.message || 'Video generation failed');
    });
  };

  const credits     = user?.credits ?? 0;
  const freeCredits = user?.freeCredits ?? 0;
  const currentCost = getVideoCost(resolution, duration, generateAudio);
  const canGenerate = !!prompt.trim() && !uploading;
  const ratioList   = (mode === 'text') ? VIDEO_RATIOS_T2V : VIDEO_RATIOS_I2V;

  const SEL_BTN = (active, disabled = false) => ({
    flex: 1, height: 30, borderRadius: 8,
    border: `1.5px solid ${active ? '#6366f1' : 'rgba(0,0,0,0.10)'}`,
    backgroundColor: active ? 'rgba(99,102,241,0.08)' : 'transparent',
    color: disabled ? '#d1d5db' : active ? '#6366f1' : '#6b7280',
    fontSize: 12, fontWeight: active ? 600 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms', opacity: disabled ? 0.5 : 1,
  });

  const LABEL = { fontSize: 11, color: '#9ca3af', margin: '0 0 6px 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', paddingRight: 2 }}>

      {/* Model */}
      <div style={{ flexShrink: 0 }}>
        <p style={LABEL}>Model</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {VIDEO_MODELS.map(m => (
            <button key={m.key} onClick={() => !m.comingSoon && setModelKey(m.key)}
              title={m.comingSoon ? 'Coming Soon' : undefined}
              style={{ ...SEL_BTN(modelKey === m.key && !m.comingSoon, m.comingSoon), flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <span>{m.name}</span>
              {m.badge && <span style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 4px' }}>{m.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ flexShrink: 0 }}>
        <p style={LABEL}>Mode</p>
        <div style={{ display: 'flex', gap: 4, padding: '3px', backgroundColor: MUTED, borderRadius: 10 }}>
          {[
            { key: 'text',        label: 'Text to Video' },
            { key: 'first_frame', label: '1st Frame' },
            { key: 'first_last',  label: '1st + Last' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setMode(key); if (key === 'text') { setRatio('16:9'); setGenerateAudio(false); } else setRatio('adaptive'); }}
              style={{ flex: 1, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11,
                fontWeight: mode === key ? 600 : 400,
                backgroundColor: mode === key ? '#fff' : 'transparent',
                color: mode === key ? '#111827' : '#9ca3af',
                boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame upload zones */}
      {mode !== 'text' && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <FrameZone label="First Frame" preview={firstPreview}
            onFile={f => setFrame('first', f)} onClear={() => clearFrame('first')} />
          {mode === 'first_last' && (
            <FrameZone label="Last Frame" preview={lastPreview}
              onFile={f => setFrame('last', f)} onClear={() => clearFrame('last')} />
          )}
        </div>
      )}

      {/* Prompt */}
      <div style={{ borderRadius: 14, padding: 12,
        backgroundColor: isDragging ? 'rgba(99,102,241,0.05)' : MUTED,
        border: `1.5px ${isDragging ? 'dashed rgba(99,102,241,0.5)' : 'solid transparent'}`,
        flexShrink: 0, transition: 'all 150ms' }}
        onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}>
        <p style={{ fontSize: 11, color: isDragging ? '#6366f1' : '#9ca3af', margin: '0 0 6px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isDragging ? '✦ Drop to fill prompt' : 'Prompt'}
        </p>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the video… or drag a Gallery card here"
          style={{ width: '100%', minHeight: 72, border: 'none', outline: 'none', backgroundColor: 'transparent', resize: 'none', fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'inherit' }} />
      </div>

      {/* Duration slider */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <p style={{ ...LABEL, margin: 0 }}>Duration</p>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{duration}s</span>
        </div>
        <input type="range" min={4} max={12} step={1} value={duration} onChange={e => setDuration(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 10, color: '#d1d5db' }}>4s</span>
          <span style={{ fontSize: 10, color: '#d1d5db' }}>12s</span>
        </div>
      </div>

      {/* Resolution */}
      <div style={{ flexShrink: 0 }}>
        <p style={LABEL}>Resolution</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {VIDEO_RESOLUTIONS.map(r => (
            <button key={r} onClick={() => setResolution(r)} style={SEL_BTN(resolution === r)}>
              {r}
              <span style={{ fontSize: 10, color: resolution === r ? '#8b92d9' : '#d1d5db', marginLeft: 2 }}>
                {getVideoCost(r, duration, generateAudio)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div style={{ flexShrink: 0 }}>
        <p style={LABEL}>Aspect Ratio</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {ratioList.map(r => (
            <button key={r} onClick={() => setRatio(r)}
              style={{ ...SEL_BTN(ratio === r), flex: 'none', padding: '0 10px', minWidth: 0 }}>
              {r === 'adaptive' ? '⟳ Auto' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Audio toggle — only available for i2v modes (API limitation) */}
      <div style={{ display: mode === 'text' ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '2px 0' }}>
        <div>
          <p style={{ ...LABEL, margin: 0 }}>Generate Audio</p>
          <p style={{ fontSize: 10, color: '#d1d5db', margin: '2px 0 0' }}>+30% credits</p>
        </div>
        <button onClick={() => setGenerateAudio(a => !a)} style={{
          width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          backgroundColor: generateAudio ? '#6366f1' : 'rgba(0,0,0,0.12)',
          transition: 'background-color 200ms', position: 'relative', flexShrink: 0,
        }}>
          <span style={{
            position: 'absolute', top: 3, left: generateAudio ? 21 : 3,
            width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
            transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />

      {/* Generate button */}
      <button onClick={handleGenerate} disabled={!canGenerate}
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
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
        {uploading ? (
          <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /><span>Uploading…</span></>
        ) : (
          <>
            <Wand2 size={15} />
            <span>Generate Video</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 7px' }}>
              <Zap size={10} style={{ color: '#FFDBA4' }} />
              <span style={{ fontSize: 12 }}>{currentCost}</span>
            </div>
          </>
        )}
      </button>

      {/* Balance */}
      {!isAuthenticated ? (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
          <button onClick={openLoginModal} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}>Sign in</button>{' '}to generate videos
        </p>
      ) : (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
          Free: <strong style={{ color: '#fbbf24' }}>{freeCredits}</strong>{' '}·{' '}Credits: <strong style={{ color: '#6b7280' }}>{credits}</strong>
        </p>
      )}

    </div>
  );
};

/* ═══════════════════════════════════════════════
   Main Panel
═══════════════════════════════════════════════ */
const Img2PromptPanel = ({ open, onClose, onStartGeneration, prefillJob, onPrefillConsumed }) => {
  const [tab, setTab] = useState('reverse'); // 'reverse' | 'generate'

  useEffect(() => {
    if (!open) setTab('reverse');
  }, [open]);

  // prefillJob → tab:'video' → switch to video tab; otherwise stay on reverse tab
  useEffect(() => {
    if (prefillJob?.tab === 'video') setTab('generate');
  }, [prefillJob]);

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
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>AI Generation</h2>
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
            Generate Image
          </button>
          <button style={TAB_STYLE(tab === 'generate')} onClick={() => setTab('generate')}>
            Generate Video
          </button>
        </div>

        {/* Tab content */}
        {tab === 'reverse'
          ? <ReverseTab onClose={onClose} onStartGeneration={onStartGeneration} prefillJob={prefillJob} onPrefillConsumed={onPrefillConsumed} />
          : <VideoTab onStartGeneration={onStartGeneration} prefillJob={prefillJob} onPrefillConsumed={onPrefillConsumed} />
        }

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Img2PromptPanel;
