import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Wand2, Loader2, X, Plus, Copy, Check,
  ImageIcon, Zap, FileJson, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGeneration } from '../../contexts/GenerationContext';
import { generateAPI } from '../../services/generateApi';
import { MUTED, MUTED_H, LABEL_STYLE } from './constants';

const JSON_COST    = 5;
const GEN_MODEL_ID = 'gemini3-pro'; // Nanobanana Pro

/* ═══════════════════════════════════════════════════
   JSON Prompt Builder Tab
   1. Optional image upload / drag-drop
   2. Text description textarea
   3. Build button → Gemini 2.5 Flash → structured JSON
   4. Result: explanation + JSON code block + copy
   5. "Generate with Nanobanana Pro" button
═══════════════════════════════════════════════════ */
const JsonPromptTab = ({ onGenerated, prefillJob = null, onPrefillConsumed = null }) => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();
  const { addGeneration, updateGeneration } = useGeneration();

  const fileInputRef = useRef(null);

  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging,   setIsDragging]   = useState(false);

  const [text,       setText]       = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [result,     setResult]     = useState(null);
  // result shape: { explanation, jsonPrompt, rawText? }
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Consume prefillJob: imageUrl → set image preview
  useEffect(() => {
    if (!prefillJob?.imageUrl) return;
    setImagePreview(prefillJob.imageUrl);
    setImageFile(null);
    setResult(null);
    onPrefillConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillJob]);

  const handleImageFile = (f) => {
    if (!f?.type?.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(f);
    setResult(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const json = e.dataTransfer.getData('application/json');
    if (json) {
      try {
        const parsed = JSON.parse(json);
        if (parsed.image) {
          setImagePreview(parsed.image); setImageFile(null); setResult(null);
          toast.success('Reference image set from gallery');
        }
      } catch (_) {}
      return;
    }
    const f = e.dataTransfer.files[0];
    if (f) handleImageFile(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuild = async () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!text.trim() && !imageFile && !imagePreview) {
      toast.error('Please enter a description or upload an image');
      return;
    }

    setIsBuilding(true); setResult(null);
    try {
      const token = localStorage.getItem('token');
      let res;

      if (imageFile) {
        const formData = new FormData();
        if (text.trim()) formData.append('text', text.trim());
        formData.append('image', imageFile);
        res = await axios.post('/api/tools/json-prompt', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
          timeout: 60000,
        });
      } else {
        // text-only or URL-based image (relative or absolute)
        const body = { text: text.trim() || 'Analyze this image and build a JSON prompt for it.' };
        if (imagePreview) {
          body.imageUrl = imagePreview;
        }
        res = await axios.post('/api/tools/json-prompt', body, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          timeout: 60000,
        });
      }

      setResult(res.data);
      updateUser({ credits: res.data.creditsLeft, freeCredits: res.data.freeCreditsLeft });
      toast.success(`JSON prompt built! ${JSON_COST} credits used`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Build failed, please retry');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = result.jsonPrompt
      ? JSON.stringify(result.jsonPrompt, null, 2)
      : result.rawText || '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('JSON copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!result?.jsonPrompt) { toast.error('Build a JSON prompt first'); return; }

    const promptText = JSON.stringify(result.jsonPrompt);
    const jobId = Date.now().toString();
    addGeneration({
      id: jobId, status: 'loading', progress: 8,
      prompt: promptText, modelId: GEN_MODEL_ID,
      modelName: 'Nanobanana Pro',
      aspectRatio: '1:1', mediaType: 'image',
      result: null, errorMessage: '', startedAt: new Date(),
    });

    onGenerated?.();
    setIsGenerating(true);

    generateAPI.generateImage({
      prompt: promptText,
      modelId: GEN_MODEL_ID,
      aspectRatio: '1:1',
      resolution: '2K',
    }).then(data => {
      updateGeneration(jobId, { status: 'success', progress: 100, result: data });
      updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft });
      toast.success(`Image generated! Credits used`);
    }).catch(err => {
      const msg = err.response?.data?.message || 'Generation failed';
      updateGeneration(jobId, { status: 'error', errorMessage: msg });
      toast.error(msg);
    }).finally(() => setIsGenerating(false));
  };

  const credits     = user?.credits ?? 0;
  const freeCredits = user?.freeCredits ?? 0;
  const canBuild    = !isBuilding && (!!text.trim() || !!imageFile || !!imagePreview);
  const canGenerate = !isGenerating && !!result?.jsonPrompt;

  const jsonText = result?.jsonPrompt
    ? JSON.stringify(result.jsonPrompt, null, 2)
    : result?.rawText || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Image upload zone (optional) */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
             style={{ display: 'none' }}
             onChange={e => e.target.files[0] && handleImageFile(e.target.files[0])} />
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !imagePreview && fileInputRef.current?.click()}
        style={{
          height: imagePreview ? 'auto' : 64, borderRadius: 14, padding: imagePreview ? '8px 12px' : '0 12px',
          backgroundColor: isDragging ? 'rgba(99,102,241,0.06)' : MUTED,
          border: isDragging ? '1px dashed rgba(99,102,241,0.5)' : '1px dashed rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: imagePreview ? 'default' : 'pointer', transition: 'all 150ms',
        }}
        onMouseEnter={e => { if (!imagePreview && !isDragging) e.currentTarget.style.backgroundColor = MUTED_H; }}
        onMouseLeave={e => { if (!imagePreview) e.currentTarget.style.backgroundColor = isDragging ? 'rgba(99,102,241,0.06)' : MUTED; }}
      >
        {imagePreview ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <img src={imagePreview} alt="ref" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#374151', margin: 0 }}>Reference image set</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Will be analyzed by AI</p>
            </div>
            <button onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setResult(null); }}
              style={{ width: 22, height: 22, borderRadius: 6, border: 'none', backgroundColor: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexShrink: 0 }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: 0 }}>Reference Image</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                  {isDragging ? 'Drop to set reference…' : 'Optional · drag gallery card or upload'}
                </p>
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}>
              <Plus size={14} />
            </button>
          </>
        )}
      </div>

      {/* Text description */}
      <div style={{ borderRadius: 14, padding: '12px 14px', backgroundColor: MUTED }}>
        <p style={{ ...LABEL_STYLE, marginBottom: 6 }}>Description</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Describe your subject, style, lighting, mood…&#10;e.g. A young woman in a white dress standing in a sunlit wheat field, golden hour, cinematic"
          style={{ width: '100%', minHeight: 90, border: 'none', outline: 'none', backgroundColor: 'transparent', resize: 'none', fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'inherit' }}
        />
      </div>

      {/* Build button */}
      <button
        onClick={handleBuild}
        disabled={!canBuild}
        style={{ height: 38, borderRadius: 12, border: 'none', backgroundColor: canBuild ? '#6366f1' : 'rgba(0,0,0,0.08)', color: canBuild ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: canBuild ? 'pointer' : 'not-allowed', opacity: canBuild ? 1 : 0.55, transition: 'all 150ms' }}
        onMouseEnter={e => { if (canBuild) e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = canBuild ? '1' : '0.55'; }}>
        {isBuilding
          ? <><Loader2 size={13} className="animate-spin" /><span>Building…</span></>
          : <><FileJson size={13} /><span>Build JSON Prompt</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, padding: '1px 5px', fontSize: 10 }}>
                <Zap size={9} style={{ color: '#FFDBA4' }} />{JSON_COST}
              </span>
            </>
        }
      </button>

      {/* Result */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Explanation */}
          {result.explanation && (
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, margin: 0, padding: '8px 12px', backgroundColor: 'rgba(99,102,241,0.04)', borderRadius: 10, borderLeft: '3px solid rgba(99,102,241,0.3)' }}>
              {result.explanation}
            </p>
          )}

          {/* JSON code block */}
          {jsonText && (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', backgroundColor: '#1e1e2e' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: 10, color: '#6e6a86', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {result.jsonPrompt ? 'JSON Prompt' : 'Raw Output'}
                </span>
                <button onClick={handleCopy}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600, backgroundColor: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', color: copied ? '#4ade80' : '#a6accd', transition: 'all 150ms' }}>
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre style={{ margin: 0, padding: '12px 14px', fontSize: 11, lineHeight: 1.7, color: '#cdd6f4', overflowX: 'auto', overflowY: 'auto', maxHeight: 280, fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {jsonText}
              </pre>
            </div>
          )}

          {/* Rebuild / Generate row */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setResult(null)}
              style={{ height: 36, width: 36, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexShrink: 0, transition: 'all 150ms' }}
              title="Clear result and rebuild"
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}>
              <RefreshCw size={13} />
            </button>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{ flex: 1, height: 36, borderRadius: 10, border: 'none', backgroundColor: '#1B1B1B', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: canGenerate ? 'pointer' : 'not-allowed', opacity: canGenerate ? 1 : 0.45, transition: 'transform 150ms, opacity 150ms' }}
              onMouseEnter={e => { if (canGenerate) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
              {isGenerating
                ? <><Loader2 size={13} className="animate-spin" /><span>Generating…</span></>
                : <><Wand2 size={13} /><span>Generate with Nanobanana Pro</span></>
              }
            </button>
          </div>
        </div>
      )}

      {/* Balance */}
      {!isAuthenticated ? (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0 }}>
          <button onClick={openLoginModal} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}>Sign in</button>{' '}to use JSON Builder
        </p>
      ) : (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0 }}>
          Free: <strong style={{ color: '#fbbf24' }}>{freeCredits}</strong>{' '}·{' '}Credits: <strong style={{ color: '#6b7280' }}>{credits}</strong>
        </p>
      )}
    </div>
  );
};

export default JsonPromptTab;
