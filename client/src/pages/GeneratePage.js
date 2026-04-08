/**
 * GeneratePage — Standalone AI Generation page (/generate)
 *
 * Two-column layout: left = form tabs, right = live results + history.
 * Tab components live in components/Generation/ for reuse with Img2PromptPanel.
 */
import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { MUTED } from '../components/Generation/constants';
import ImageGenTab  from '../components/Generation/ImageGenTab';
import VideoGenTab  from '../components/Generation/VideoGenTab';
import ResultsPanel from '../components/Generation/ResultsPanel';

const TAB_STYLE = (active) => ({
  flex: 1, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: active ? 600 : 400,
  backgroundColor: active ? '#fff' : 'transparent',
  color: active ? '#111827' : '#9ca3af',
  transition: 'all 150ms',
  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
});

const GeneratePage = () => {
  const [tab, setTab] = useState('image');
  const [refreshCount, setRefreshCount] = useState(0);

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
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── LEFT: Form ── */}
          <div style={{
            width: 360, flexShrink: 0,
            borderRight: '1px solid rgba(0,0,0,0.06)',
            overflowY: 'auto', padding: '16px 16px 24px', scrollbarWidth: 'thin',
          }}>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 4, padding: '4px', backgroundColor: MUTED, borderRadius: 10, marginBottom: 14 }}>
              <button style={TAB_STYLE(tab === 'image')} onClick={() => setTab('image')}>Generate Image</button>
              <button style={TAB_STYLE(tab === 'video')} onClick={() => setTab('video')}>Generate Video</button>
            </div>

            {tab === 'image'
              ? <ImageGenTab  onGenerated={() => setRefreshCount(c => c + 1)} />
              : <VideoGenTab  onGenerated={() => setRefreshCount(c => c + 1)} />
            }
          </div>

          {/* ── RIGHT: Results ── */}
          <div style={{
            flex: 1, minWidth: 0,
            overflowY: 'auto', padding: '16px 20px 24px', scrollbarWidth: 'thin',
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
