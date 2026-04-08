import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Wand2, Loader2, X, Plus, Copy, Check,
  ChevronLeft, ChevronRight, Zap, Image as ImageIcon, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGeneration } from '../../contexts/GenerationContext';
import { generateAPI } from '../../services/generateApi';
import {
  MUTED, MUTED_H, REVERSE_COST,
  RATIOS_IMG, RESOLUTIONS, REVERSE_MODELS,
  LABEL_STYLE, SparklesIcon,
} from './constants';

/* ═══════════════════════════════════════════
   Tab A — Generate Image
═══════════════════════════════════════════ */
const ImageGenTab = ({ onGenerated }) => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();
  const { addGeneration, updateGeneration } = useGeneration();

  const reverseFileInputRef = useRef(null);
  const refFileInputRef     = useRef(null);
  const modelDropdownRef    = useRef(null);

  const [reverseFile,    setReverseFile]    = useState(null);
  const [reversePreview, setReversePreview] = useState(null);
  const [isDragging1,    setIsDragging1]    = useState(false);

  const [refImages,   setRefImages]   = useState([]);
  const [isDragging2, setIsDragging2] = useState(false);
  const MAX_REF = 4;

  const [isAnalyzing,      setIsAnalyzing]      = useState(false);
  const [result,           setResult]           = useState('');
  const [prompt,           setPrompt]           = useState('');
  const [copied,           setCopied]           = useState(false);

  const [selectedRevModel,  setSelectedRevModel]  = useState(REVERSE_MODELS[0].id);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const [genModels,        setGenModels]        = useState([]);
  const [selectedGenModel, setSelectedGenModel] = useState(null);

  const [ratioIdx,   setRatioIdx]   = useState(2);
  const [resolution, setResolution] = useState('2K');

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

  useEffect(() => {
    const handler = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleReverseFile = (f) => {
    if (!f?.type?.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setReverseFile(f); setResult('');
    const reader = new FileReader();
    reader.onload = (e) => setReversePreview(e.target.result);
    reader.readAsDataURL(f);
  };

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

  const runAnalyze = useCallback(async (fileObj, imageUrl) => {
    if (!isAuthenticated) { openLoginModal(); return; }
    setIsAnalyzing(true); setResult('');
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
      toast.error(err.response?.data?.message || 'Analysis failed, please try again');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAuthenticated, openLoginModal, updateUser, selectedRevModel]);

  const handleCard1Drop = useCallback((e) => {
    e.preventDefault(); setIsDragging1(false);
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.image) {
          if (!isAuthenticated) { openLoginModal(); return; }
          setReversePreview(parsed.image); setReverseFile(null);
          runAnalyze(null, parsed.image); return;
        }
      } catch (_) { /* ignore */ }
      return;
    }
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleReverseFile(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, openLoginModal, runAnalyze]);

  const handleCard2Drop = useCallback((e) => {
    e.preventDefault(); setIsDragging2(false);
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.image) {
          const url = parsed.image;
          setRefImages(prev => {
            if (prev.length >= MAX_REF) { toast.error(`Maximum ${MAX_REF} reference images`); return prev; }
            if (prev.some(r => r.url === url || r.preview === url)) return prev;
            return [...prev, { preview: url, b64: null, mime: null, url }];
          });
        }
      } catch (_) { /* ignore */ }
      return;
    }
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    files.forEach(f => addRefFile(f));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refImages.length]);

  const handleCard3Drop = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = MUTED;
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.prompt) { setPrompt(parsed.prompt); toast.success('Prompt filled from gallery card'); }
        else if (parsed.image) toast('Drop to "Reverse Prompt" card to analyze this image', { icon: '💡' });
      } catch (_) { /* ignore */ }
    }
  }, []);

  const handleCopy = async () => {
    const text = result || prompt;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateImage = () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    const promptText = (result || prompt).trim();
    if (!promptText) { toast.error('Please analyze an image or type a prompt first'); return; }
    if (!selectedGenModel) { toast.error('No generation model available'); return; }

    const jobId = Date.now().toString();
    const genModel = genModels.find(m => m.id === selectedGenModel);
    addGeneration({
      id: jobId, status: 'loading', progress: 8,
      prompt: promptText, modelId: selectedGenModel,
      modelName: genModel?.name,
      aspectRatio: RATIOS_IMG[ratioIdx], mediaType: 'image',
      result: null, errorMessage: '', startedAt: new Date(),
    });

    onGenerated?.();

    generateAPI.generateImage({
      prompt: promptText,
      modelId: selectedGenModel,
      aspectRatio: RATIOS_IMG[ratioIdx],
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
      toast.error(err.response?.status === 403 ? '4K requires a paid plan — purchase credits first' : msg);
    });
  };

  const credits     = user?.credits ?? 0;
  const freeCredits = user?.freeCredits ?? 0;
  const canAnalyze  = !isAnalyzing && !!reverseFile;
  const canGenerate = !!(result || prompt).trim() && !!selectedGenModel;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Card 1 — Reverse Prompt */}
      <input ref={reverseFileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
             style={{ display: 'none' }}
             onChange={e => e.target.files[0] && handleReverseFile(e.target.files[0])} />
      <div
        onClick={() => reverseFileInputRef.current?.click()}
        onDrop={handleCard1Drop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging1(true); }}
        onDragLeave={() => setIsDragging1(false)}
        style={{ height: 64, borderRadius: 14, padding: '0 12px', backgroundColor: isDragging1 ? 'rgba(99,102,241,0.06)' : MUTED, border: isDragging1 ? '1px dashed rgba(99,102,241,0.5)' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 150ms' }}
        onMouseEnter={e => { if (!isDragging1) e.currentTarget.style.backgroundColor = MUTED_H; }}
        onMouseLeave={e => { if (!isDragging1) e.currentTarget.style.backgroundColor = MUTED; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
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
              <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, backgroundColor: '#e8eaf6', right: 4, bottom: -2, zIndex: 0, transform: 'rotate(-12deg)', overflow: 'hidden' }}>
                <svg viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" fill="#c5cae9" /><circle cx="22" cy="10" r="4" fill="#9fa8da" /><polygon points="0,22 12,10 20,18 26,13 32,20 32,32 0,32" fill="#7986cb" /></svg>
              </div>
              <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: 6, backgroundColor: '#ede7f6', right: -2, bottom: -4, zIndex: 1, overflow: 'hidden' }}>
                <svg viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" fill="#e8eaf6" /><circle cx="16" cy="12" r="5" fill="#b39ddb" /><path d="M6 28 Q6 20 16 20 Q26 20 26 28" fill="#9575cd" /></svg>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card 2 — Reference images */}
      <input ref={refFileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
             style={{ display: 'none' }}
             onChange={e => e.target.files[0] && addRefFile(e.target.files[0])} />
      {refImages.length === 0 ? (
        <div
          onClick={() => refFileInputRef.current?.click()}
          onDrop={handleCard2Drop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging2(true); }}
          onDragLeave={() => setIsDragging2(false)}
          style={{ height: 64, borderRadius: 14, padding: '0 12px', backgroundColor: isDragging2 ? 'rgba(99,102,241,0.06)' : MUTED, border: isDragging2 ? '1px dashed rgba(99,102,241,0.5)' : '1.5px dashed rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 150ms' }}
          onMouseEnter={e => { if (!isDragging2) e.currentTarget.style.backgroundColor = MUTED_H; }}
          onMouseLeave={e => { if (!isDragging2) e.currentTarget.style.backgroundColor = MUTED; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={14} style={{ color: '#9ca3af' }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: 0 }}>Add Reference Image</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Up to {MAX_REF} images · drag Gallery card here</p>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); refFileInputRef.current?.click(); }}
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}>
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <div
          style={{ minHeight: 64, borderRadius: 14, padding: '10px 12px', border: `1px dashed ${isDragging2 ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.25)'}`, backgroundColor: isDragging2 ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.03)', transition: 'all 150ms' }}
          onDrop={handleCard2Drop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging2(true); }}
          onDragLeave={() => setIsDragging2(false)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {refImages.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                <img src={img.preview} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', display: 'block' }} />
                <button onClick={() => setRefImages(prev => prev.filter((_, i) => i !== idx))}
                  style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <X size={9} />
                </button>
              </div>
            ))}
            {refImages.length < MAX_REF && (
              <button onClick={() => refFileInputRef.current?.click()}
                style={{ width: 40, height: 40, borderRadius: 8, border: '1px dashed rgba(99,102,241,0.4)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', transition: 'all 150ms', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.06)'; e.currentTarget.style.color = '#6366f1'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
                <Plus size={14} />
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#6366f1', margin: '6px 0 0', paddingLeft: 2 }}>
            {refImages.length}/{MAX_REF} · Will be sent with prompt
          </p>
        </div>
      )}

      {/* Card 3 — Prompt textarea */}
      <div
        style={{ borderRadius: 14, padding: 16, backgroundColor: MUTED, transition: 'background-color 150ms' }}
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
        {isAnalyzing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 100, color: '#9ca3af' }}>
            <Loader2 size={14} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Analyzing image…</span>
          </div>
        ) : (
          <textarea
            value={result || prompt}
            onChange={(e) => { if (!result) setPrompt(e.target.value); }}
            placeholder="Drag any gallery image here to auto-generate its prompt, or type manually…"
            style={{ width: '100%', minHeight: 100, border: 'none', outline: 'none', backgroundColor: 'transparent', resize: 'none', fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'inherit' }}
            readOnly={!!result}
          />
        )}
      </div>

      {/* Ratio + Resolution row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flex: 1 }}>
          <button onClick={() => setRatioIdx(i => (i - 1 + RATIOS_IMG.length) % RATIOS_IMG.length)}
            style={{ width: 30, height: 30, border: '1px solid rgba(0,0,0,0.10)', borderRadius: '8px 0 0 8px', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'background-color 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}>
            <ChevronLeft size={13} />
          </button>
          <div style={{ flex: 1, height: 30, border: '1px solid rgba(0,0,0,0.10)', borderLeft: 'none', borderRight: 'none', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{RATIOS_IMG[ratioIdx]}</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{ratioIdx + 1}/{RATIOS_IMG.length}</span>
          </div>
          <button onClick={() => setRatioIdx(i => (i + 1) % RATIOS_IMG.length)}
            style={{ width: 30, height: 30, border: '1px solid rgba(0,0,0,0.10)', borderRadius: '0 8px 8px 0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'background-color 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}>
            <ChevronRight size={13} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
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

      {/* Analyze row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div ref={modelDropdownRef} style={{ flex: 1, position: 'relative' }}>
          <button onClick={() => setModelDropdownOpen(v => !v)}
            style={{ width: '100%', height: 34, borderRadius: 10, backgroundColor: modelDropdownOpen ? 'rgba(99,102,241,0.07)' : MUTED, border: `1.5px solid ${modelDropdownOpen ? 'rgba(99,102,241,0.35)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', cursor: 'pointer', transition: 'all 150ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <SparklesIcon size={11} />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(27,27,27,0.75)' }}>
                {REVERSE_MODELS.find(m => m.id === selectedRevModel)?.name ?? 'Gemini 3 Flash'}
              </span>
            </div>
            <ChevronDown size={11} style={{ color: '#9ca3af', transform: modelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms' }} />
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
        <button
          onClick={() => { if (!isAuthenticated) { openLoginModal(); return; } if (!reverseFile) { toast.error('Please upload an image first'); return; } runAnalyze(reverseFile, null); }}
          disabled={!canAnalyze}
          style={{ height: 34, padding: '0 14px', borderRadius: 10, border: 'none', flexShrink: 0, backgroundColor: canAnalyze ? '#6366f1' : 'rgba(0,0,0,0.08)', color: canAnalyze ? '#fff' : '#9ca3af', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, cursor: canAnalyze ? 'pointer' : 'not-allowed', transition: 'all 150ms' }}
          onMouseEnter={e => { if (canAnalyze) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
          {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <SparklesIcon size={12} />}
          {isAnalyzing ? 'Analyzing…' : 'Analyze'}
          {!isAnalyzing && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, padding: '1px 5px', fontSize: 10 }}>
              <Zap size={9} style={{ color: '#FFDBA4' }} />{REVERSE_COST}
            </span>
          )}
        </button>
      </div>

      <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

      {/* Gen model pills */}
      <div>
        <p style={LABEL_STYLE}>Generation Model</p>
        {genModels.length === 0 ? (
          <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>No models configured</p>
        ) : (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {genModels.map(m => (
              <button key={m.id} onClick={() => setSelectedGenModel(m.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 99, border: `1.5px solid ${selectedGenModel === m.id ? '#6366f1' : 'rgba(0,0,0,0.1)'}`, backgroundColor: selectedGenModel === m.id ? 'rgba(99,102,241,0.08)' : 'transparent', color: selectedGenModel === m.id ? '#6366f1' : '#374151', fontSize: 11, fontWeight: selectedGenModel === m.id ? 600 : 400, cursor: 'pointer', transition: 'all 150ms' }}>
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

      {/* Generate Image button */}
      <button
        onClick={handleGenerateImage}
        disabled={!canGenerate}
        style={{ height: 44, borderRadius: 14, border: 'none', backgroundColor: '#1B1B1B', color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: canGenerate ? 'pointer' : 'not-allowed', opacity: canGenerate ? 1 : 0.45, transition: 'transform 150ms, opacity 150ms' }}
        onMouseEnter={e => { if (canGenerate) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
        <Wand2 size={15} /><span>Generate Image</span>
        {selectedGenModel && genModels.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 7px' }}>
            <Zap size={10} style={{ color: '#FFDBA4' }} />
            <span style={{ fontSize: 12 }}>{(() => { const base = genModels.find(m => m.id === selectedGenModel)?.creditCost ?? null; return base != null ? base + (resolution === '4K' ? 5 : 0) : '?'; })()}</span>
          </div>
        )}
      </button>

      {!isAuthenticated ? (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0 }}>
          <button onClick={openLoginModal} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}>Sign in</button>{' '}to use this feature
        </p>
      ) : (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0 }}>
          Free: <strong style={{ color: '#fbbf24' }}>{freeCredits}</strong>{' '}·{' '}Credits: <strong style={{ color: '#6b7280' }}>{credits}</strong>
        </p>
      )}
    </div>
  );
};

export default ImageGenTab;
