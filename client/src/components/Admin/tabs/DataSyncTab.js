import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Play, Square, AlertCircle, CheckCircle, Clock, Loader, AlertTriangle } from 'lucide-react';
import { adminAPI } from '../../../services/api';

// ─── Helpers ─────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(start, end) {
  if (!start || !end) return '';
  const secs = Math.round((new Date(end) - new Date(start)) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}m${s}s`;
}

// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status, running }) {
  if (running || status === 'running') {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
        <Loader size={11} className="animate-spin" />
        Running
      </span>
    );
  }
  if (!status || status === 'never') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: 'rgba(107,114,128,0.15)', color: 'var(--text-tertiary)' }}>
        Never synced
      </span>
    );
  }
  if (status === 'success') {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
        <CheckCircle size={11} />
        Success
      </span>
    );
  }
  if (status === 'partial') {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308' }}>
        <AlertTriangle size={11} />
        Partial
      </span>
    );
  }
  if (status === 'stopped') {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: 'rgba(107,114,128,0.15)', color: 'var(--text-secondary)' }}>
        <Square size={11} />
        Stopped
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
      <AlertCircle size={11} />
      Error
    </span>
  );
}

// ─── Sref Progress Bar ─────────────────────────────────────────

function SrefProgressBar({ progress }) {
  if (!progress || !progress.running) return null;
  const pct = progress.totalDetails > 0
    ? Math.round((progress.processedDetails / progress.totalDetails) * 100)
    : 0;
  const discoverPct = progress.totalPages > 0
    ? Math.round((progress.currentPage / progress.totalPages) * 100)
    : 0;

  return (
    <div className="mt-3 space-y-2">
      {progress.phase === 'discover' ? (
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            <span>Discovering pages...</span>
            <span>{progress.currentPage}/{progress.totalPages} pages</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${discoverPct}%`, background: '#6366f1' }} />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            <span>Processing details...</span>
            <span>{progress.processedDetails}/{progress.totalDetails} ({pct}%)</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: '#6366f1' }} />
          </div>
        </div>
      )}
      <div className="flex gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <span className="text-green-400">+{progress.newCount} new</span>
        <span style={{ color: 'var(--text-secondary)' }}>~{progress.updatedCount} updated</span>
        {progress.errorCount > 0 && <span className="text-red-400">✕{progress.errorCount} errors</span>}
      </div>
    </div>
  );
}

// ─── Source Card ──────────────────────────────────────────────

function SourceCard({ src, srefProgress, onTrigger, onStop }) {
  const [triggering, setTriggering] = useState(false);
  const [srefMode, setSrefMode] = useState('incremental'); // 'incremental' | 'full'
  const log = src.lastLog;
  const isRunning = src.running;
  const isSref = src.source === 'sref';

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const opts = isSref ? { incrementalMode: srefMode === 'incremental', endPage: 34 } : undefined;
      await onTrigger(src.source, opts);
    } finally {
      setTimeout(() => setTriggering(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{src.label}</p>
          {isSref ? (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {srefMode === 'incremental' ? 'Incremental · stops when no new entries' : 'Full scan · all 34 pages · ~8h'}
            </p>
          ) : src.description ? (
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              {src.description}
            </p>
          ) : null}
        </div>
        <StatusBadge status={log?.status} running={isRunning} />
      </div>

      {/* Sref mode toggle */}
      {isSref && !isRunning && (
        <div className="flex gap-1.5 mb-3 p-1 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
          {[['incremental', 'Incremental'], ['full', 'Full Scan']].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setSrefMode(mode)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: srefMode === mode ? 'var(--bg-secondary)' : 'transparent',
                color: srefMode === mode ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: srefMode === mode ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Stats row */}
      {log && (
        <div className="flex gap-4 mb-3">
          <div className="text-center">
            <p className="text-lg font-bold text-green-400">+{log.newCount || 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>New</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>~{log.updatedCount || 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Updated</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{log.totalAfter || 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total</p>
          </div>
          {log.errorCount > 0 && (
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{log.errorCount}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Errors</p>
            </div>
          )}
        </div>
      )}

      {/* Last sync time */}
      <div className="flex items-center gap-1.5 mb-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <Clock size={11} />
        {log ? `Last sync: ${fmtDate(log.completedAt || log.startedAt)}${log.completedAt ? ` · ${fmtDuration(log.startedAt, log.completedAt)}` : ''}` : 'Never synced'}
      </div>

      {/* Sref progress bar */}
      {isSref && <SrefProgressBar progress={srefProgress} />}

      {/* Cookie warning for sref */}
      {isSref && !process.env.REACT_APP_SREF_COOKIE_SET && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl mb-3 text-xs"
          style={{ background: 'rgba(234,179,8,0.08)', color: '#eab308' }}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
          Set PROMPTSREF_COOKIE in server .env to enable crawling
        </div>
      )}

      {/* Error display */}
      {log?.errorMessages?.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
          {log.errorMessages[0].substring(0, 120)}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleTrigger}
          disabled={triggering || isRunning}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
        >
          {triggering ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
          {triggering ? 'Starting...' : 'Sync Now'}
        </button>
        {isSref && isRunning && (
          <button
            onClick={() => onStop(src.source)}
            className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <Square size={14} />
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Log Table ─────────────────────────────────────────────────

const SOURCE_LABELS = {
  nanobanana: 'Gallery',
  'seedance-github': 'Seedance GH',
  'seedance-youmind': 'Seedance YM',
  sref: 'Sref',
};

function LogTable({ logs }) {
  if (!logs.length) {
    return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No sync history yet</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            {['Time', 'Source', 'Status', 'New', 'Updated', 'Errors', 'Duration'].map(h => (
              <th key={h} className="py-3 px-3 text-left text-xs font-semibold"
                style={{ color: 'var(--text-tertiary)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td className="py-3 px-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{fmtDate(log.startedAt)}</td>
              <td className="py-3 px-3 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{SOURCE_LABELS[log.source] || log.source}</td>
              <td className="py-3 px-3"><StatusBadge status={log.status} /></td>
              <td className="py-3 px-3 text-xs text-green-400">+{log.newCount || 0}</td>
              <td className="py-3 px-3 text-xs" style={{ color: 'var(--text-secondary)' }}>~{log.updatedCount || 0}</td>
              <td className="py-3 px-3 text-xs" style={{ color: log.errorCount > 0 ? '#f87171' : 'var(--text-tertiary)' }}>{log.errorCount || 0}</td>
              <td className="py-3 px-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{fmtDuration(log.startedAt, log.completedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main DataSyncTab ─────────────────────────────────────────

export default function DataSyncTab() {
  const [sources, setSources] = useState([]);
  const [srefProgress, setSrefProgress] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const pollRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        adminAPI.getSyncStatus(),
        adminAPI.getSyncLogs({ page: logPage, limit: 20 }),
      ]);
      setSources(statusRes.data?.data || []);
      setLogs(logsRes.data?.logs || []);
      setLogTotal(logsRes.data?.total || 0);
    } catch (err) {
      console.error('sync status error:', err);
    } finally {
      setLoading(false);
    }
  }, [logPage]);

  const loadSrefProgress = useCallback(async () => {
    try {
      const res = await adminAPI.getSrefProgress();
      setSrefProgress(res.data?.data || null);
    } catch (_) {}
  }, []);

  // Initial load + auto-refresh every 8s when something is running
  useEffect(() => {
    loadStatus();
    loadSrefProgress();
  }, [loadStatus, loadSrefProgress]);

  useEffect(() => {
    const isRunning = sources.some(s => s.running);
    if (isRunning) {
      pollRef.current = setInterval(() => {
        loadStatus();
        loadSrefProgress();
      }, 8000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [sources, loadStatus, loadSrefProgress]);

  const handleTrigger = async (source, opts) => {
    try {
      const res = await adminAPI.triggerSync(source, opts);
      if (res.data?.ok) {
        showToast(`${source} sync started`);
        setTimeout(loadStatus, 1500);
        setTimeout(loadSrefProgress, 1500);
      } else {
        showToast(res.data?.message || 'Failed to start', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error triggering sync', 'error');
    }
  };

  const handleStop = async (_source) => {
    try {
      await adminAPI.stopSrefCrawl();
      showToast('Stop signal sent');
      setTimeout(loadStatus, 2000);
    } catch (err) {
      showToast('Failed to stop', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Data Sync</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Manage automatic content synchronization · NanoBanana & Seedance: daily · Sref: manual
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); loadStatus(); loadSrefProgress(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Source cards — 2-col grid */}
      {loading && sources.length === 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: 'var(--bg-secondary)', height: 180 }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sources.map(src => (
            <SourceCard
              key={src.source}
              src={src}
              srefProgress={src.source === 'sref' ? srefProgress : null}
              onTrigger={handleTrigger}
              onStop={handleStop}
            />
          ))}
        </div>
      )}

      {/* History log table */}
      <div className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sync History</h3>
        </div>
        <div className="p-2">
          <LogTable logs={logs} />
        </div>
        {/* Pagination */}
        {logTotal > 20 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{logTotal} total records</p>
            <div className="flex gap-2">
              <button
                onClick={() => setLogPage(p => Math.max(1, p - 1))}
                disabled={logPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {logPage} / {Math.ceil(logTotal / 20)}
              </span>
              <button
                onClick={() => setLogPage(p => p + 1)}
                disabled={logPage >= Math.ceil(logTotal / 20)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium"
          style={{
            background: toast.type === 'error'
              ? 'linear-gradient(135deg,#ef4444,#dc2626)'
              : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
