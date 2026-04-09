/**
 * Img2PromptPanel — right-side AI Generation slide-out panel
 *
 * Tab 1 "Image"  — Reverse Prompt + Generate Image  (ReverseTab)
 * Tab 2 "Video"  — Generate Video                   (PanelVideoTab)
 * Tab 3 "JSON"   — JSON Prompt Builder               (JsonPromptTab)
 *
 * Refactored Stage 81: tab components extracted to Generation/ directory.
 */
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MUTED } from '../Generation/constants';
import ReverseTab    from '../Generation/ReverseTab';
import PanelVideoTab from '../Generation/PanelVideoTab';
import JsonPromptTab from '../Generation/JsonPromptTab';

const Img2PromptPanel = ({ open, onClose, onStartGeneration, prefillJob, onPrefillConsumed }) => {
  const [tab, setTab] = useState('reverse'); // 'reverse' | 'generate' | 'json'

  // Reset to first tab on close
  useEffect(() => {
    if (!open) setTab('reverse');
  }, [open]);

  // prefillJob tab routing
  useEffect(() => {
    if (prefillJob?.tab === 'video') setTab('generate');
    if (prefillJob?.tab === 'json')  setTab('json');
    // 'reverse' (default) and undefined stay on Image tab
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
        <div style={{ display: 'flex', gap: 3, padding: '3px', backgroundColor: MUTED, borderRadius: 10, flexShrink: 0 }}>
          <button style={TAB_STYLE(tab === 'reverse')}  onClick={() => setTab('reverse')}>Image</button>
          <button style={TAB_STYLE(tab === 'generate')} onClick={() => setTab('generate')}>Video</button>
          <button style={TAB_STYLE(tab === 'json')}     onClick={() => setTab('json')}>JSON</button>
        </div>

        {/* Tab content */}
        {tab === 'reverse'
          ? <ReverseTab
              onClose={onClose}
              onStartGeneration={onStartGeneration}
              prefillJob={prefillJob}
              onPrefillConsumed={onPrefillConsumed}
            />
          : tab === 'generate'
            ? <PanelVideoTab
                onStartGeneration={onStartGeneration}
                prefillJob={prefillJob}
                onPrefillConsumed={onPrefillConsumed}
              />
            : <JsonPromptTab
                onGenerated={onStartGeneration}
                prefillJob={prefillJob}
                onPrefillConsumed={onPrefillConsumed}
              />
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
