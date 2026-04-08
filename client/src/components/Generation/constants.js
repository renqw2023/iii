/* ─────────────────────────────────────────────────────────────
   Generation — shared constants, style helpers, and icons
   Used by: ImageGenTab, VideoGenTab, ResultsPanel, GeneratePage,
            and Img2PromptPanel (panel side-drawer)
───────────────────────────────────────────────────────────── */
import React from 'react';

/* ── colours ── */
export const MUTED   = 'rgba(0,0,0,0.04)';
export const MUTED_H = 'rgba(0,0,0,0.07)';

/* ── credit costs ── */
export const REVERSE_COST = 2;

/* ── image generation ── */
export const RATIOS_IMG  = ['1:1', '4:3', '3:4', '16:9'];
export const RESOLUTIONS = ['2K', '4K'];

export const REVERSE_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash',   badge: null   },
  { id: 'gemini-2.5-flash',       name: 'Gemini 2.5 Flash', badge: 'Fast' },
];

/* ── video generation ── */
export const VIDEO_RESOLUTIONS  = ['480p', '720p', '1080p'];
export const VIDEO_RATIOS_T2V   = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'];
export const VIDEO_RATIOS_I2V   = ['adaptive', '16:9', '4:3', '1:1', '3:4', '9:16', '21:9'];

export const SEEDANCE_PER_SEC = { '480p': 3.15, '720p': 6.75, '1080p': 15 };
export const WAN_VIDEO_RATES  = { '480p': 13, '720p': 13, '1080p': 22 };
export const VEO_PER_SEC = {
  'veo-3-1':      { noAudio: 30, audio: 58 },
  'veo-3-1-fast': { noAudio: 15, audio: 22 },
  'veo-3-1-lite': { '720p': { noAudio: 5, audio: 8 }, '1080p': { noAudio: 8, audio: 13 } },
};

export const WAN_SUB_MODES = [
  { key: 't2v',       label: 'Text → Video',  modelKey: 'wan2-7-t2v',       needsImage: false, needsVideo: false, comingSoon: false },
  { key: 'i2v',       label: 'Image → Video', modelKey: 'wan2-7-i2v',       needsImage: true,  needsVideo: false, comingSoon: false },
  { key: 'r2v',       label: 'Ref + Video',   modelKey: 'wan2-7-r2v',       needsImage: true,  needsVideo: false, comingSoon: false },
  { key: 'videoedit', label: 'Video Edit',    modelKey: 'wan2-7-videoedit', needsImage: false, needsVideo: true,  comingSoon: false },
];

export const VIDEO_MODELS = [
  { key: 'seedance-1-5-pro', name: 'Seedance 1.5', badge: null,   comingSoon: false },
  { key: 'seedance-2-0-pro', name: 'Seedance 2.0', badge: 'Soon', comingSoon: true  },
  { key: 'wan2-7',           name: 'Wan 2.7',       badge: 'New',  comingSoon: false },
  { key: 'veo-3-1-lite',     name: 'Veo 3.1 Lite', badge: 'New',  comingSoon: false },
  { key: 'veo-3-1-fast',     name: 'Veo 3.1 Fast', badge: null,   comingSoon: false },
  { key: 'veo-3-1',          name: 'Veo 3.1',       badge: 'HD',   comingSoon: false },
];

/* ── style helpers ── */
export const LABEL_STYLE = {
  fontSize: 11, color: '#9ca3af', margin: '0 0 6px 2px',
  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
};

export const SEL_BTN = (active, disabled = false) => ({
  flex: 1, height: 30, borderRadius: 8,
  border: `1.5px solid ${active ? '#6366f1' : 'rgba(0,0,0,0.10)'}`,
  backgroundColor: active ? 'rgba(99,102,241,0.08)' : 'transparent',
  color: disabled ? '#d1d5db' : active ? '#6366f1' : '#6b7280',
  fontSize: 12, fontWeight: active ? 600 : 400,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 150ms', opacity: disabled ? 0.5 : 1,
});

/* ── shared SVG icon ── */
export const SparklesIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M11.85 4.22L11.72 3.24C11.69 3 11.49 2.83 11.25 2.83C11.01 2.83 10.81 3 10.78 3.24L10.65 4.22C10.27 7.08 8.01 9.34 5.14 9.72L4.16 9.85C3.93 9.89 3.75 10.09 3.75 10.33C3.75 10.56 3.93 10.77 4.16 10.8L5.14 10.93C8.01 11.31 10.27 13.57 10.65 16.43L10.78 17.41C10.81 17.65 11.01 17.83 11.25 17.83C11.49 17.83 11.69 17.65 11.72 17.41L11.85 16.43C12.23 13.57 14.49 11.31 17.36 10.93L18.34 10.8C18.57 10.77 18.75 10.56 18.75 10.33C18.75 10.09 18.57 9.89 18.34 9.85L17.36 9.72C14.49 9.34 12.23 7.08 11.85 4.22Z"
      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
    />
  </svg>
);
