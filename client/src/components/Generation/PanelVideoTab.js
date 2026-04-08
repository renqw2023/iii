/**
 * PanelVideoTab — Tab 2 of the AI Generation panel
 * Extracted from Img2PromptPanel.js (Stage 81 refactor)
 * Constants imported from ./constants to avoid duplication
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Wand2, Loader2, X, Plus, Zap, Film } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGeneration } from '../../contexts/GenerationContext';
import { generateAPI } from '../../services/generateApi';
import {
  MUTED, SEL_BTN, LABEL_STYLE,
  VIDEO_RATIOS_T2V, VIDEO_RATIOS_I2V,
  SEEDANCE_PER_SEC, WAN_VIDEO_RATES, VEO_PER_SEC,
  WAN_SUB_MODES, VIDEO_MODELS,
} from './constants';

/* ── private upload zone helpers ── */
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
            <Film size={16} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>Upload Video</span>
          </span>
        </button>
      )}
    </div>
  );
};

const PanelVideoTab = ({ onStartGeneration, prefillJob, onPrefillConsumed }) => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();
  const { addGeneration, updateGeneration } = useGeneration();

  const [prompt, setPrompt]               = useState('');
  const [modelKey, setModelKey]           = useState('seedance-1-5-pro');
  const [wanSubMode, setWanSubMode]       = useState('t2v');
  const [mode, setMode]                   = useState('text');
  const [firstFile, setFirstFile]         = useState(null);
  const [lastFile, setLastFile]           = useState(null);
  const [firstPreview, setFirstPreview]   = useState(null);
  const [lastPreview, setLastPreview]     = useState(null);
  const [wanVideoFile, setWanVideoFile]   = useState(null);
  const [wanVideoPreview, setWanVideoPreview] = useState(null);
  const [duration, setDuration]           = useState(5);
  const [resolution, setResolution]       = useState('720p');
  const [ratio, setRatio]                 = useState('16:9');
  const [generateAudio, setGenerateAudio] = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [isDragging, setIsDragging]       = useState(false);

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
    if (wanNeedsImage && !firstFile) { toast.error('Please upload a reference image for this mode'); return; }
    if (wanNeedsVideo && !wanVideoFile) { toast.error('Please upload a video for Video Edit mode'); return; }

    setUploading(true);
    let firstFrameUrl    = null;
    let lastFrameUrl     = null;
    let uploadedVideoUrl = null;

    try {
      if (firstFile) { const res = await generateAPI.uploadVideoFrame(firstFile); firstFrameUrl = res.url; }
      if (lastFile)  { const res = await generateAPI.uploadVideoFrame(lastFile);  lastFrameUrl  = res.url; }
      if (wanVideoFile) { const res = await generateAPI.uploadVideo(wanVideoFile); uploadedVideoUrl = res.url; }
    } catch (err) {
      toast.error('File upload failed: ' + (err.response?.data?.message || err.message));
      setUploading(false);
      return;
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

    onStartGeneration?.();

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

  const getVideoCost = (res, dur, audio = false) => {
    if (VEO_PER_SEC[modelKey]) {
      const rates = VEO_PER_SEC[modelKey];
      const tier  = rates['720p'] ? (rates[res] ?? rates['720p']) : rates;
      const rate  = audio ? tier.audio : tier.noAudio;
      return Math.round(rate * Number(dur));
    }
    if (modelKey === 'wan2-7') {
      return Math.round((WAN_VIDEO_RATES[res] ?? 13) * Number(dur));
    }
    const base = Math.round((SEEDANCE_PER_SEC[res] ?? 15) * Number(dur));
    return audio ? Math.round(base * 1.3) : base;
  };

  const currentCost = getVideoCost(resolution, duration, generateAudio);

  const isVeo = modelKey === 'veo-3-1' || modelKey === 'veo-3-1-fast' || modelKey === 'veo-3-1-lite';
  const isWan = modelKey === 'wan2-7';
  const availableResolutions = (isVeo || isWan) ? ['720p', '1080p'] : ['480p', '720p', '1080p'];
  const maxDuration          = (isVeo || isWan) ? 8 : 12;
  const wanNeedsImage        = isWan && WAN_SUB_MODES.find(s => s.key === wanSubMode)?.needsImage;
  const wanNeedsVideo        = isWan && WAN_SUB_MODES.find(s => s.key === wanSubMode)?.needsVideo;
  const canGenerate          = !!prompt.trim() && !uploading;
  const ratioList            = (mode === 'text' && !wanNeedsImage) ? VIDEO_RATIOS_T2V : VIDEO_RATIOS_I2V;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', paddingRight: 2 }}>

      {/* Model */}
      <div style={{ flexShrink: 0 }}>
        <p style={LABEL_STYLE}>Model</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {VIDEO_MODELS.map(m => (
            <button key={m.key} onClick={() => {
              if (m.comingSoon) return;
              setModelKey(m.key);
              if ((m.key === 'veo-3-1' || m.key === 'veo-3-1-fast' || m.key === 'veo-3-1-lite') && resolution === '480p') {
                setResolution('720p');
              }
              if (m.key === 'veo-3-1' || m.key === 'veo-3-1-fast' || m.key === 'veo-3-1-lite' || m.key === 'wan2-7') {
                setDuration(d => Math.min(d, 8));
              }
            }}
              title={m.comingSoon ? 'Coming Soon' : undefined}
              style={{ ...SEL_BTN(modelKey === m.key && !m.comingSoon, m.comingSoon), flex: 1, minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ whiteSpace: 'nowrap' }}>{m.name}</span>
              {m.badge && <span style={{ fontSize: 8, fontWeight: 700, color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap' }}>{m.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Wan2.7 sub-mode */}
      {isWan && (
        <div style={{ flexShrink: 0 }}>
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

      {/* Mode selector — non-Wan only */}
      {!isWan && (
        <div style={{ flexShrink: 0 }}>
          <p style={LABEL_STYLE}>Mode</p>
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
      )}

      {/* Frame upload zones */}
      {(mode !== 'text' || wanNeedsImage) && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <FrameZone label={isWan ? 'Reference Image' : 'First Frame'} preview={firstPreview}
            onFile={f => setFrame('first', f)} onClear={() => clearFrame('first')} />
          {mode === 'first_last' && !isWan && (
            <FrameZone label="Last Frame" preview={lastPreview}
              onFile={f => setFrame('last', f)} onClear={() => clearFrame('last')} />
          )}
        </div>
      )}

      {/* Video upload — Wan2.7 videoedit */}
      {wanNeedsVideo && (
        <div style={{ flexShrink: 0 }}>
          <VideoZone label="Source Video" preview={wanVideoPreview}
            onFile={f => { setWanVideoFile(f); setWanVideoPreview(URL.createObjectURL(f)); }}
            onClear={() => { setWanVideoFile(null); setWanVideoPreview(null); }} />
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

      {/* Duration */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <p style={{ ...LABEL_STYLE, margin: 0 }}>Duration</p>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{duration}s</span>
        </div>
        {isVeo ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {[4, 6, 8].map(d => (
              <button key={d} onClick={() => setDuration(d)} style={SEL_BTN(duration === d)}>
                {d}s
              </button>
            ))}
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
      <div style={{ flexShrink: 0 }}>
        <p style={LABEL_STYLE}>Resolution</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {availableResolutions.map(r => (
            <button key={r} onClick={() => setResolution(r)} style={SEL_BTN(resolution === r && availableResolutions.includes(resolution))}>
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
        <p style={LABEL_STYLE}>Aspect Ratio</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {ratioList.map(r => (
            <button key={r} onClick={() => setRatio(r)}
              style={{ ...SEL_BTN(ratio === r), flex: 'none', padding: '0 10px', minWidth: 0 }}>
              {r === 'adaptive' ? '⟳ Auto' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Audio toggle */}
      <div style={{ display: (mode === 'text' && !isVeo && !wanNeedsImage) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '2px 0' }}>
        <div>
          <p style={{ ...LABEL_STYLE, margin: 0 }}>Generate Audio</p>
          <p style={{ fontSize: 10, color: '#d1d5db', margin: '2px 0 0' }}>{isVeo ? `+${getVideoCost(resolution, 1, true) - getVideoCost(resolution, 1, false)} cr/s` : '+30% credits'}</p>
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

export default PanelVideoTab;
