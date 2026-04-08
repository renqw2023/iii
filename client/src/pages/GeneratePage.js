/**
 * GeneratePage — Standalone AI Generation page (/generate)
 *
 * Full feature parity with Img2PromptPanel (Image + Video tabs).
 * Two-column layout: left = form, right = live results + history.
 * Mounted under Layout (sidebar + mesh bg) to match project style.
 *
 * Source panel (Img2PromptPanel) is NOT modified.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Wand2, Loader2, X, Plus, Copy, Check, ChevronDown,
  ChevronLeft, ChevronRight, Zap, Film, Image as ImageIcon,
  Clock, RefreshCw, Trash2, ArrowDownToLine, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGeneration } from '../contexts/GenerationContext';
import { generateAPI } from '../services/generateApi';
import { generationHistoryAPI } from '../services/generationHistoryApi';
import GenerationCard from '../components/UI/GenerationCard';

/* ── shared constants ── */
const MUTED   = 'rgba(0,0,0,0.04)';
const MUTED_H = 'rgba(0,0,0,0.07)';
const REVERSE_COST = 2;

const RATIOS_IMG   = ['1:1', '4:3', '3:4', '16:9'];
const RESOLUTIONS  = ['2K', '4K'];

const REVERSE_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash',   badge: null   },
  { id: 'gemini-2.5-flash',       name: 'Gemini 2.5 Flash', badge: 'Fast' },
];

const VIDEO_RESOLUTIONS = ['480p', '720p', '1080p'];
const VIDEO_RATIOS_T2V  = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'];
const VIDEO_RATIOS_I2V  = ['adaptive', '16:9', '4:3', '1:1', '3:4', '9:16', '21:9'];

const SEEDANCE_PER_SEC = { '480p': 3.15, '720p': 6.75, '1080p': 15 };
const WAN_VIDEO_RATES  = { '480p': 13, '720p': 13, '1080p': 22 };
const VEO_PER_SEC = {
  'veo-3-1':      { noAudio: 30, audio: 58 },
  'veo-3-1-fast': { noAudio: 15, audio: 22 },
  'veo-3-1-lite': { '720p': { noAudio: 5, audio: 8 }, '1080p': { noAudio: 8, audio: 13 } },
};

const WAN_SUB_MODES = [
  { key: 't2v',       label: 'Text → Video',  modelKey: 'wan2-7-t2v',       needsImage: false, needsVideo: false, comingSoon: false },
  { key: 'i2v',       label: 'Image → Video', modelKey: 'wan2-7-i2v',       needsImage: true,  needsVideo: false, comingSoon: false },
  { key: 'r2v',       label: 'Ref + Video',   modelKey: 'wan2-7-r2v',       needsImage: true,  needsVideo: false, comingSoon: false },
  { key: 'videoedit', label: 'Video Edit',    modelKey: 'wan2-7-videoedit', needsImage: false, needsVideo: true,  comingSoon: false },
];

const VIDEO_MODELS = [
  { key: 'seedance-1-5-pro', name: 'Seedance 1.5', badge: null,   comingSoon: false },
  { key: 'seedance-2-0-pro', name: 'Seedance 2.0', badge: 'Soon', comingSoon: true  },
  { key: 'wan2-7',           name: 'Wan 2.7',       badge: 'New',  comingSoon: false },
  { key: 'veo-3-1-lite',     name: 'Veo 3.1 Lite', badge: 'New',  comingSoon: false },
  { key: 'veo-3-1-fast',     name: 'Veo 3.1 Fast', badge: null,   comingSoon: false },
  { key: 'veo-3-1',          name: 'Veo 3.1',       badge: 'HD',   comingSoon: false },
];

/* ── Shared sub-components ── */
const SparklesIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M11.85 4.22L11.72 3.24C11.69 3 11.49 2.83 11.25 2.83C11.01 2.83 10.81 3 10.78 3.24L10.65 4.22C10.27 7.08 8.01 9.34 5.14 9.72L4.16 9.85C3.93 9.89 3.75 10.09 3.75 10.33C3.75 10.56 3.93 10.77 4.16 10.8L5.14 10.93C8.01 11.31 10.27 13.57 10.65 16.43L10.78 17.41C10.81 17.65 11.01 17.83 11.25 17.83C11.49 17.83 11.69 17.65 11.72 17.41L11.85 16.43C12.23 13.57 14.49 11.31 17.36 10.93L18.34 10.8C18.57 10.77 18.75 10.56 18.75 10.33C18.75 10.09 18.57 9.89 18.34 9.85L17.36 9.72C14.49 9.34 12.23 7.08 11.85 4.22Z"
          stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);

const LABEL_STYLE = { fontSize: 11, color: '#9ca3af', margin: '0 0 6px 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' };

const SEL_BTN = (active, disabled = false) => ({
  flex: 1, height: 30, borderRadius: 8,
  border: `1.5px solid ${active ? '#6366f1' : 'rgba(0,0,0,0.10)'}`,
  backgroundColor: active ? 'rgba(99,102,241,0.08)' : 'transparent',
  color: disabled ? '#d1d5db' : active ? '#6366f1' : '#6b7280',
  fontSize: 12, fontWeight: active ? 600 : 400,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 150ms', opacity: disabled ? 0.5 : 1,
});

const FrameZone = ({ label, preview, onFile, onClear }) => {
  const ref = useRef(null);
  return (
    <div style={{ flex: 1, flexShrink: 0 }}>
      <p style={{ ...LABEL_STYLE, margin: '0 0 4px 2px' }}>{label}</p>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
             onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      {preview ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', paddingBottom: '56.25%', backgroundColor: '#000' }}>
          <img src={preview} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={onClear} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={10} />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} style={{ width: '100%', paddingBottom: '56.25%', position: 'relative', borderRadius: 10, border: '1.5px dashed rgba(0,0,0,0.12)', backgroundColor: MUTED, cursor: 'pointer' }}>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#9ca3af' }}>
            <Plus size={16} /><span style={{ fontSize: 10, fontWeight: 500 }}>Upload</span>
          </span>
        </button>
      )}
    </div>
  );
};

const VideoZone = ({ label, preview, onFile, onClear }) => {
  const ref = useRef(null);
  return (
    <div style={{ flex: 1, flexShrink: 0 }}>
      <p style={{ ...LABEL_STYLE, margin: '0 0 4px 2px' }}>{label}</p>
      <input ref={ref} type="file" accept="video/*" style={{ display: 'none' }}
             onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      {preview ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', paddingBottom: '56.25%', backgroundColor: '#000' }}>
          <video src={preview} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} muted />
          <button onClick={onClear} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={10} />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} style={{ width: '100%', paddingBottom: '56.25%', position: 'relative', borderRadius: 10, border: '1.5px dashed rgba(0,0,0,0.12)', backgroundColor: MUTED, cursor: 'pointer' }}>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#9ca3af' }}>
            <Film size={16} /><span style={{ fontSize: 10, fontWeight: 500 }}>Upload Video</span>
          </span>
        </button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Tab A — Generate Image
═══════════════════════════════════════════ */
const ImageTab = ({ onGenerated }) => {
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

/* ═══════════════════════════════════════════
   Tab B — Generate Video
═══════════════════════════════════════════ */
const VideoTab = ({ onGenerated }) => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();
  const { addGeneration, updateGeneration } = useGeneration();

  const [prompt, setPrompt]       = useState('');
  const [modelKey, setModelKey]   = useState('seedance-1-5-pro');
  const [wanSubMode, setWanSubMode] = useState('t2v');
  const [mode, setMode]           = useState('text');
  const [firstFile, setFirstFile] = useState(null);
  const [lastFile, setLastFile]   = useState(null);
  const [firstPreview, setFirstPreview] = useState(null);
  const [lastPreview, setLastPreview]   = useState(null);
  const [wanVideoFile, setWanVideoFile]       = useState(null);
  const [wanVideoPreview, setWanVideoPreview] = useState(null);
  const [duration, setDuration]   = useState(5);
  const [resolution, setResolution] = useState('720p');
  const [ratio, setRatio]         = useState('16:9');
  const [generateAudio, setGenerateAudio] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const getVideoCost = (res, dur, audio = false) => {
    if (VEO_PER_SEC[modelKey]) {
      const rates = VEO_PER_SEC[modelKey];
      const tier = rates['720p'] ? (rates[res] ?? rates['720p']) : rates;
      const rate = audio ? tier.audio : tier.noAudio;
      return Math.round(rate * Number(dur));
    }
    if (modelKey === 'wan2-7') return Math.round((WAN_VIDEO_RATES[res] ?? 13) * Number(dur));
    const base = Math.round((SEEDANCE_PER_SEC[res] ?? 15) * Number(dur));
    return audio ? Math.round(base * 1.3) : base;
  };

  const currentCost = getVideoCost(resolution, duration, generateAudio);
  const isVeo = ['veo-3-1', 'veo-3-1-fast', 'veo-3-1-lite'].includes(modelKey);
  const isWan = modelKey === 'wan2-7';
  const availableResolutions = (isVeo || isWan) ? ['720p', '1080p'] : ['480p', '720p', '1080p'];
  const maxDuration = (isVeo || isWan) ? 8 : 12;
  const wanNeedsImage = isWan && WAN_SUB_MODES.find(s => s.key === wanSubMode)?.needsImage;
  const wanNeedsVideo = isWan && WAN_SUB_MODES.find(s => s.key === wanSubMode)?.needsVideo;
  const canGenerate = !!prompt.trim() && !uploading;
  const ratioList = (mode === 'text' && !wanNeedsImage) ? VIDEO_RATIOS_T2V : VIDEO_RATIOS_I2V;

  const handleGenerate = async () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!prompt.trim()) { toast.error('Please enter a prompt'); return; }
    if (mode === 'first_frame' && !firstFile) { toast.error('Please upload the first frame image'); return; }
    if (mode === 'first_last' && (!firstFile || !lastFile)) { toast.error('Please upload both frame images'); return; }
    if (wanNeedsImage && !firstFile) { toast.error('Please upload a reference image for this mode'); return; }
    if (wanNeedsVideo && !wanVideoFile) { toast.error('Please upload a video for Video Edit mode'); return; }

    setUploading(true);
    let firstFrameUrl = null, lastFrameUrl = null, uploadedVideoUrl = null;
    try {
      if (firstFile) { const res = await generateAPI.uploadVideoFrame(firstFile); firstFrameUrl = res.url; }
      if (lastFile)  { const res = await generateAPI.uploadVideoFrame(lastFile);  lastFrameUrl  = res.url; }
      if (wanVideoFile) { const res = await generateAPI.uploadVideo(wanVideoFile); uploadedVideoUrl = res.url; }
    } catch (err) {
      toast.error('File upload failed: ' + (err.response?.data?.message || err.message));
      setUploading(false); return;
    }
    setUploading(false);

    const jobId = Date.now().toString();
    addGeneration({
      id: jobId, status: 'loading', progress: 8,
      prompt: prompt.trim(), modelId: modelKey,
      modelName: isWan
        ? (WAN_SUB_MODES.find(s => s.key === wanSubMode)?.label ?? 'Wan 2.7')
        : VIDEO_MODELS.find(m => m.key === modelKey)?.name,
      aspectRatio: ratio === 'adaptive' ? '16:9' : ratio,
      mediaType: 'video', generateAudio, result: null, errorMessage: '', startedAt: new Date(),
    });

    onGenerated?.();

    const actualModelKey = modelKey === 'wan2-7'
      ? (WAN_SUB_MODES.find(s => s.key === wanSubMode)?.modelKey ?? 'wan2-7-t2v')
      : modelKey;

    generateAPI.generateVideo({
      prompt: prompt.trim(), modelKey: actualModelKey, duration, resolution, ratio,
      generateAudio, firstFrameUrl, lastFrameUrl, videoUrl: uploadedVideoUrl,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Model */}
      <div>
        <p style={LABEL_STYLE}>Model</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {VIDEO_MODELS.map(m => (
            <button key={m.key}
              onClick={() => {
                if (m.comingSoon) return;
                setModelKey(m.key);
                if (['veo-3-1','veo-3-1-fast','veo-3-1-lite'].includes(m.key) && resolution === '480p') setResolution('720p');
                if (['veo-3-1','veo-3-1-fast','veo-3-1-lite','wan2-7'].includes(m.key)) setDuration(d => Math.min(d, 8));
              }}
              title={m.comingSoon ? 'Coming Soon' : undefined}
              style={{ ...SEL_BTN(modelKey === m.key && !m.comingSoon, m.comingSoon), flex: 1, minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ whiteSpace: 'nowrap' }}>{m.name}</span>
              {m.badge && <span style={{ fontSize: 8, fontWeight: 700, color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 4px' }}>{m.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Wan2.7 sub-mode */}
      {isWan && (
        <div>
          <p style={LABEL_STYLE}>Sub Mode</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {WAN_SUB_MODES.map(s => (
              <button key={s.key}
                onClick={() => !s.comingSoon && setWanSubMode(s.key)}
                title={s.comingSoon ? 'Coming Soon' : undefined}
                style={{ ...SEL_BTN(wanSubMode === s.key && !s.comingSoon, s.comingSoon), flex: 1, minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <span style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{s.label}</span>
                {s.comingSoon && <span style={{ fontSize: 8, color: '#9ca3af' }}>Soon</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode selector (non-Wan) */}
      {!isWan && (
        <div>
          <p style={LABEL_STYLE}>Mode</p>
          <div style={{ display: 'flex', gap: 4, padding: '3px', backgroundColor: MUTED, borderRadius: 10 }}>
            {[{ key: 'text', label: 'Text to Video' }, { key: 'first_frame', label: '1st Frame' }, { key: 'first_last', label: '1st + Last' }].map(({ key, label }) => (
              <button key={key}
                onClick={() => { setMode(key); if (key === 'text') { setRatio('16:9'); setGenerateAudio(false); } else setRatio('adaptive'); }}
                style={{ flex: 1, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: mode === key ? 600 : 400, backgroundColor: mode === key ? '#fff' : 'transparent', color: mode === key ? '#111827' : '#9ca3af', boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 150ms', whiteSpace: 'nowrap' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Frame / video upload */}
      {(mode !== 'text' || wanNeedsImage) && (
        <div style={{ display: 'flex', gap: 8 }}>
          <FrameZone label={isWan ? 'Reference Image' : 'First Frame'} preview={firstPreview} onFile={f => setFrame('first', f)} onClear={() => clearFrame('first')} />
          {mode === 'first_last' && !isWan && (
            <FrameZone label="Last Frame" preview={lastPreview} onFile={f => setFrame('last', f)} onClear={() => clearFrame('last')} />
          )}
        </div>
      )}
      {wanNeedsVideo && (
        <VideoZone label="Source Video" preview={wanVideoPreview}
          onFile={f => { setWanVideoFile(f); setWanVideoPreview(URL.createObjectURL(f)); }}
          onClear={() => { setWanVideoFile(null); setWanVideoPreview(null); }} />
      )}

      {/* Prompt */}
      <div
        style={{ borderRadius: 14, padding: 12, backgroundColor: isDragging ? 'rgba(99,102,241,0.05)' : MUTED, border: `1.5px ${isDragging ? 'dashed rgba(99,102,241,0.5)' : 'solid transparent'}`, transition: 'all 150ms' }}
        onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}>
        <p style={{ ...LABEL_STYLE, marginBottom: 6, color: isDragging ? '#6366f1' : '#9ca3af' }}>
          {isDragging ? '✦ Drop to fill prompt' : 'Prompt'}
        </p>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the video… or drag a Gallery card here"
          style={{ width: '100%', minHeight: 80, border: 'none', outline: 'none', backgroundColor: 'transparent', resize: 'none', fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'inherit' }} />
      </div>

      {/* Duration */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <p style={{ ...LABEL_STYLE, margin: 0 }}>Duration</p>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{duration}s</span>
        </div>
        {isVeo ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {[4, 6, 8].map(d => <button key={d} onClick={() => setDuration(d)} style={SEL_BTN(duration === d)}>{d}s</button>)}
          </div>
        ) : (
          <>
            <input type="range" min={4} max={maxDuration} step={1} value={Math.min(duration, maxDuration)} onChange={e => setDuration(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 10, color: '#d1d5db' }}>4s</span>
              <span style={{ fontSize: 10, color: '#d1d5db' }}>{maxDuration}s</span>
            </div>
          </>
        )}
      </div>

      {/* Resolution */}
      <div>
        <p style={LABEL_STYLE}>Resolution</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {availableResolutions.map(r => (
            <button key={r} onClick={() => setResolution(r)} style={SEL_BTN(resolution === r && availableResolutions.includes(resolution))}>
              {r}<span style={{ fontSize: 10, color: resolution === r ? '#8b92d9' : '#d1d5db', marginLeft: 2 }}>{getVideoCost(r, duration, generateAudio)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <p style={LABEL_STYLE}>Aspect Ratio</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {ratioList.map(r => (
            <button key={r} onClick={() => setRatio(r)} style={{ ...SEL_BTN(ratio === r), flex: 'none', padding: '0 10px', minWidth: 0 }}>
              {r === 'adaptive' ? '⟳ Auto' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Audio */}
      <div style={{ display: (mode === 'text' && !isVeo && !wanNeedsImage) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
        <div>
          <p style={{ ...LABEL_STYLE, margin: 0 }}>Generate Audio</p>
          <p style={{ fontSize: 10, color: '#d1d5db', margin: '2px 0 0' }}>
            {isVeo ? `+${getVideoCost(resolution, 1, true) - getVideoCost(resolution, 1, false)} cr/s` : '+30% credits'}
          </p>
        </div>
        <button onClick={() => setGenerateAudio(a => !a)}
          style={{ width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: generateAudio ? '#6366f1' : 'rgba(0,0,0,0.12)', transition: 'background-color 200ms', position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 3, left: generateAudio ? 21 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>

      <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

      <button onClick={handleGenerate} disabled={!canGenerate}
        style={{ height: 44, borderRadius: 14, border: 'none', backgroundColor: '#1B1B1B', color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: canGenerate ? 'pointer' : 'not-allowed', opacity: canGenerate ? 1 : 0.45, transition: 'transform 150ms, opacity 150ms' }}
        onMouseEnter={e => { if (canGenerate) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
        {uploading
          ? <><Loader2 size={15} className="animate-spin" /><span>Uploading…</span></>
          : <><Wand2 size={15} /><span>Generate Video</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 7px' }}>
                <Zap size={10} style={{ color: '#FFDBA4' }} /><span style={{ fontSize: 12 }}>{currentCost}</span>
              </div>
            </>
        }
      </button>

      {!isAuthenticated ? (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0 }}>
          <button onClick={openLoginModal} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}>Sign in</button>{' '}to generate videos
        </p>
      ) : (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0 }}>
          Free: <strong style={{ color: '#fbbf24' }}>{freeCredits}</strong>{' '}·{' '}Credits: <strong style={{ color: '#6b7280' }}>{credits}</strong>
        </p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Results Panel (right column)
═══════════════════════════════════════════ */
function recordToJob(rec) {
  const isVideo = rec.mediaType === 'video';
  return {
    id: rec._id, status: rec.status === 'error' ? 'error' : 'success', progress: 100,
    prompt: rec.prompt, modelId: rec.modelId, modelName: rec.modelName,
    aspectRatio: rec.aspectRatio || (isVideo ? '16:9' : '1:1'),
    mediaType: rec.mediaType || 'image', generateAudio: rec.generateAudio || false,
    result: isVideo ? { videoUrl: rec.videoUrl } : { imageUrl: rec.imageUrl },
    imageUrl: rec.imageUrl, videoUrl: rec.videoUrl,
    errorMessage: rec.errorMsg || '', startedAt: new Date(rec.createdAt),
  };
}

const ResultsPanel = ({ triggerRefresh }) => {
  const { isAuthenticated, updateUser } = useAuth();
  const { activeGenerations, addGeneration, updateGeneration, removeGeneration } = useGeneration();
  const navigate = useNavigate();

  const [records, setRecords]     = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async (completedJobs) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await generationHistoryAPI.getHistory({ limit: 20 });
      const newRecords = data.records || [];
      setRecords(newRecords);
      if (completedJobs?.length) {
        const dbUrls = new Set(newRecords.flatMap(r => [r.videoUrl, r.imageUrl].filter(Boolean)));
        completedJobs.forEach(g => {
          const url = g.result?.videoUrl || g.result?.imageUrl || g.videoUrl || g.imageUrl;
          if (url && dbUrls.has(url)) removeGeneration(g.id);
        });
      }
    } catch { /* silent */ } finally { setIsLoading(false); }
  }, [isAuthenticated, removeGeneration]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Refresh when triggerRefresh increments (new generation started)
  useEffect(() => { if (triggerRefresh > 0) fetchHistory(); }, [triggerRefresh, fetchHistory]);

  // Refresh when a generation succeeds
  useEffect(() => {
    const justFinished = activeGenerations.filter(g => g.status === 'success' && g._fetched !== true);
    if (justFinished.length > 0) {
      justFinished.forEach(g => updateGeneration(g.id, { _fetched: true }));
      fetchHistory(justFinished);
    }
  }, [activeGenerations, fetchHistory, updateGeneration]);

  const handleDownload = async (job) => {
    const isVideo = job.mediaType === 'video';
    const url = isVideo ? (job.result?.videoUrl || job.videoUrl) : (job.result?.imageUrl || job.imageUrl);
    if (!url) return;
    if (isVideo) { window.open(url, '_blank', 'noopener'); toast.success('Video opened in new tab — right-click to save'); return; }
    try {
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = blobUrl; a.download = `iii_${Date.now()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch { const a = document.createElement('a'); a.href = url; a.download = `iii_${Date.now()}.png`; a.click(); }
  };

  const handleCopyUrl = async (job) => {
    const isVideo = job.mediaType === 'video';
    const url = isVideo ? (job.result?.videoUrl || job.videoUrl) : (job.result?.imageUrl || job.imageUrl);
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(fullUrl);
    toast.success('URL copied');
  };

  const handleRetry = useCallback((job) => {
    removeGeneration(job.id);
    const newJobId = Date.now().toString();
    const isVideo = job.mediaType === 'video';
    if (isVideo) {
      addGeneration({ id: newJobId, status: 'loading', progress: 8, prompt: job.prompt, modelId: job.modelId, modelName: job.modelName, aspectRatio: job.aspectRatio || '16:9', mediaType: 'video', generateAudio: job.generateAudio || false, result: null, errorMessage: '', startedAt: new Date() });
      generateAPI.generateVideo({ prompt: job.prompt, modelKey: job.modelId, duration: job.duration || 5, resolution: job.resolution || '720p', ratio: job.aspectRatio || '16:9', generateAudio: job.generateAudio || false })
        .then(data => { updateGeneration(newJobId, { status: 'success', progress: 100, result: { videoUrl: data.videoUrl }, videoUrl: data.videoUrl }); if (data.creditsLeft !== undefined) updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft }); })
        .catch(err => { updateGeneration(newJobId, { status: 'error', errorMessage: err.response?.data?.message || 'Video generation failed' }); });
      return;
    }
    addGeneration({ id: newJobId, status: 'loading', progress: 8, prompt: job.prompt, modelId: job.modelId, modelName: job.modelName, aspectRatio: job.aspectRatio || '1:1', resolution: job.resolution || '2K', mediaType: 'image', result: null, errorMessage: '', startedAt: new Date() });
    generateAPI.generateImage({ modelId: job.modelId, prompt: job.prompt, aspectRatio: job.aspectRatio || '1:1', resolution: job.resolution || '2K', ...(job.referenceImageUrl ? { referenceImageUrl: job.referenceImageUrl } : {}) })
      .then(data => { updateGeneration(newJobId, { status: 'success', progress: 100, result: data }); if (data.creditsLeft !== undefined) updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft }); })
      .catch(err => { updateGeneration(newJobId, { status: 'error', errorMessage: err.response?.data?.message || 'Generation failed' }); });
  }, [addGeneration, updateGeneration, removeGeneration, updateUser]);

  const handleDelete = async (recId) => {
    try { await generationHistoryAPI.deleteRecord(recId); setRecords(prev => prev.filter(r => r._id !== recId)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const isEmpty = !isLoading && activeGenerations.length === 0 && records.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} style={{ color: '#9ca3af' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Results</span>
          {activeGenerations.length > 0 && (
            <span style={{ fontSize: 11, backgroundColor: '#6366f1', color: '#fff', borderRadius: 99, padding: '1px 7px', fontWeight: 600 }}>
              {activeGenerations.length} running
            </span>
          )}
        </div>
        <button onClick={() => navigate('/generate-history')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 12, fontWeight: 500 }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
          <ExternalLink size={12} /> All History
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {isEmpty && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10, color: '#d1d5db' }}>
            <Wand2 size={36} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, textAlign: 'center' }}>
              Your generated images & videos will appear here
            </p>
            <p style={{ fontSize: 11, color: '#d1d5db', margin: 0 }}>
              {isAuthenticated ? 'Fill in a prompt and click Generate to start' : 'Sign in to start generating'}
            </p>
          </div>
        )}

        {isLoading && records.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ borderRadius: 14, backgroundColor: '#f3f4f6', paddingBottom: '100%', position: 'relative', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        )}

        {/* Active (loading / error) generations */}
        {activeGenerations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Progress</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {activeGenerations.map(g => (
                <GenerationCard
                  key={g.id} job={g} isActive
                  onRetry={handleRetry}
                  onDownload={handleDownload}
                  onCopyUrl={handleCopyUrl}
                  onDismiss={() => removeGeneration(g.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* History cards */}
        {records.length > 0 && (
          <div>
            {activeGenerations.length > 0 && <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {records.map(rec => (
                <GenerationCard
                  key={rec._id} job={recordToJob(rec)} isActive={false}
                  onRetry={handleRetry}
                  onDownload={handleDownload}
                  onCopyUrl={handleCopyUrl}
                  onDelete={() => handleDelete(rec._id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Main Page
═══════════════════════════════════════════ */
const GeneratePage = () => {
  const [tab, setTab] = useState('image');
  const [refreshCount, setRefreshCount] = useState(0);

  const handleGenerated = () => {
    setRefreshCount(c => c + 1);
  };

  const TAB_STYLE = (active) => ({
    flex: 1, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: active ? 600 : 400,
    backgroundColor: active ? '#fff' : 'transparent',
    color: active ? '#111827' : '#9ca3af',
    transition: 'all 150ms',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', padding: 0, background: 'var(--page-bg)' }}>
      <div style={{
        margin: 16,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
        minHeight: 'calc(100vh - 32px)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
          <Wand2 size={17} style={{ color: '#6366f1' }} />
          <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>AI Generation</h1>
        </div>

        {/* Two-column body */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}>

          {/* ── LEFT: Form ── */}
          <div style={{
            width: 360,
            flexShrink: 0,
            borderRight: '1px solid rgba(0,0,0,0.06)',
            overflowY: 'auto',
            padding: '16px 16px 24px',
            scrollbarWidth: 'thin',
          }}>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 4, padding: '4px', backgroundColor: MUTED, borderRadius: 10, marginBottom: 14 }}>
              <button style={TAB_STYLE(tab === 'image')} onClick={() => setTab('image')}>Generate Image</button>
              <button style={TAB_STYLE(tab === 'video')} onClick={() => setTab('video')}>Generate Video</button>
            </div>

            {tab === 'image'
              ? <ImageTab onGenerated={handleGenerated} />
              : <VideoTab onGenerated={handleGenerated} />
            }
          </div>

          {/* ── RIGHT: Results ── */}
          <div style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            padding: '16px 20px 24px',
            scrollbarWidth: 'thin',
          }}>
            <ResultsPanel triggerRefresh={refreshCount} />
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GeneratePage;
