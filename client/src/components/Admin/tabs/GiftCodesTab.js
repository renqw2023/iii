import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Copy, Check, XCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { creditsAPI } from '../../../services/creditsApi';

const S = {
  card: { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  btn: (primary) => ({
    padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
    background: primary ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--bg-primary)',
    color: primary ? '#fff' : 'var(--text-secondary)',
    border: primary ? 'none' : '1px solid var(--border-color)',
    transition: 'opacity 150ms',
  }),
};

function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      color: isActive ? '#10b981' : '#ef4444',
    }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function GiftCodesTab() {
  // Generate form
  const [form, setForm] = useState({ credits: 500, count: 1, maxUses: 1, expiresAt: '', note: '' });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [copied, setCopied] = useState(false);

  // Code list
  const [codes, setCodes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(null);
  const [error, setError] = useState('');
  const [genError, setGenError] = useState('');

  const loadCodes = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await creditsAPI.adminGetGiftCodes(p, 15);
      setCodes(res.data.codes || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
      setPages(res.data.pages || 1);
    } catch {
      setError('Failed to load codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCodes(1); }, [loadCodes]);

  const handleGenerate = async () => {
    setGenError('');
    if (!form.credits || form.credits < 1) { setGenError('Credits must be ≥ 1'); return; }
    setGenerating(true);
    try {
      const payload = {
        credits: Number(form.credits),
        count: Number(form.count),
        maxUses: Number(form.maxUses),
        note: form.note,
        expiresAt: form.expiresAt || undefined,
      };
      const res = await creditsAPI.adminGenerateCodes(payload);
      setGenerated(res.data.codes || []);
      loadCodes(1);
    } catch (e) {
      setGenError(e.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generated.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeactivate = async (code) => {
    setDeactivating(code);
    try {
      await creditsAPI.adminDeactivateCode(code);
      setCodes(prev => prev.map(c => c.code === code ? { ...c, isActive: false } : c));
    } catch { /* ignore */ }
    finally { setDeactivating(null); }
  };

  return (
    <div style={{ maxWidth: 760 }}>

      {/* ── Generate form ── */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Gift size={16} style={{ color: '#6366f1' }} />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Generate Gift Codes</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <p style={S.label}>Credits per code</p>
            <input type="number" min="1" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} style={S.input} />
          </div>
          <div>
            <p style={S.label}>Quantity (max 100)</p>
            <input type="number" min="1" max="100" value={form.count} onChange={e => setForm(f => ({ ...f, count: e.target.value }))} style={S.input} />
          </div>
          <div>
            <p style={S.label}>Max uses per code</p>
            <input type="number" min="1" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} style={S.input} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <p style={S.label}>Expires at (optional)</p>
            <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} style={S.input} />
          </div>
          <div>
            <p style={S.label}>Internal note</p>
            <input type="text" placeholder="e.g. Marketing Q1" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={S.input} />
          </div>
        </div>

        {genError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{genError}</p>}

        <button onClick={handleGenerate} disabled={generating} style={{ ...S.btn(true), opacity: generating ? 0.6 : 1 }}>
          {generating ? 'Generating…' : `Generate ${form.count} Code${form.count > 1 ? 's' : ''}`}
        </button>
      </div>

      {/* ── Generated results ── */}
      {generated.length > 0 && (
        <div style={{ ...S.card, background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              {generated.length} code{generated.length > 1 ? 's' : ''} generated
            </p>
            <button onClick={handleCopyAll} style={{ ...S.btn(false), display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px' }}>
              {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {generated.map(c => (
              <span key={c} style={{
                fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
                padding: '4px 10px', borderRadius: 8,
                background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                border: '1px solid rgba(99,102,241,0.2)',
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Code list ── */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>All Gift Codes</h2>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({total} total)</span>
          </div>
          <button onClick={() => loadCodes(page)} disabled={loading} style={{ ...S.btn(false), padding: '6px 12px' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 40, borderRadius: 8, background: 'var(--bg-primary)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
          </div>
        ) : codes.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No codes yet</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Code', 'Credits', 'Used', 'Status', 'Note', ''].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map(c => (
                  <tr key={c.code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 8px', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{c.code}</td>
                    <td style={{ padding: '8px 8px', color: '#6366f1', fontWeight: 600 }}>{c.credits}</td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-secondary)' }}>{c.usedCount}/{c.maxUses}</td>
                    <td style={{ padding: '8px 8px' }}><StatusBadge isActive={c.isActive} /></td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-tertiary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.note || '—'}</td>
                    <td style={{ padding: '8px 8px' }}>
                      {c.isActive && (
                        <button
                          onClick={() => handleDeactivate(c.code)}
                          disabled={deactivating === c.code}
                          title="Deactivate"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: deactivating === c.code ? 0.5 : 1 }}
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                <button onClick={() => loadCodes(page - 1)} disabled={page <= 1} style={{ ...S.btn(false), padding: '6px 10px', opacity: page <= 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Page {page} / {pages}</span>
                <button onClick={() => loadCodes(page + 1)} disabled={page >= pages} style={{ ...S.btn(false), padding: '6px 10px', opacity: page >= pages ? 0.4 : 1 }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
