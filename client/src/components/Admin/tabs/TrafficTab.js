import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Users, TrendingUp, Globe, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../../services/api';

/* ─── Helpers ─────────────────────────────────────────────────── */
function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ─── Skeleton ────────────────────────────────────────────────── */
function Skeleton({ className, style }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: 'var(--bg-tertiary)', ...style }}
    />
  );
}

/* ─── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, accent, icon: Icon, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
        <Skeleton className="w-24 h-7 rounded mb-1" />
        <Skeleton className="w-16 h-3 rounded" />
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-all hover:scale-[1.01]"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: accent + '0a', transform: 'translate(30%,-30%)' }}
      />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: accent + '18' }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{fmtNum(value)}</p>
      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      {sub && <p className="text-xs" style={{ color: accent }}>{sub}</p>}
    </div>
  );
}

/* ─── PV/UV Chart ─────────────────────────────────────────────── */
function TrafficChart({ data, loading, period }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="w-40 h-4 rounded mb-6" />
        <Skeleton className="w-full h-28 rounded" />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl p-6 flex items-center justify-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', minHeight: 180 }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无访问数据（等待约 30 秒后刷新）</p>
      </div>
    );
  }

  const W = 700, H = 120, PADX = 16, PADY = 12;
  const maxPV = Math.max(...data.map(d => d.pv), 1);
  const maxUV = Math.max(...data.map(d => d.uv), 1);
  const maxVal = Math.max(maxPV, maxUV);

  const mkPoints = (key) =>
    data.map((d, i) => ({
      x: PADX + (i / Math.max(data.length - 1, 1)) * (W - PADX * 2),
      y: H - PADY - (d[key] / maxVal) * (H - PADY * 2),
      ...d,
    }));

  const pvPts = mkPoints('pv');
  const uvPts = mkPoints('uv');

  const toPolyline = pts => pts.map(p => `${p.x},${p.y}`).join(' ');
  const toArea = (pts, color) =>
    `M${pts[0].x},${H} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${H} Z`;

  const step = data.length > 14 ? 5 : (data.length > 7 ? 3 : 1);
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>PV / UV 趋势</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>最近 {period}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-xs" style={{ color: '#6366f1' }}>
            <span className="w-3 h-0.5 rounded inline-block" style={{ background: '#6366f1' }} /> PV
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
            <span className="w-3 h-0.5 rounded inline-block" style={{ background: '#22c55e' }} /> UV
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="uvFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(f => (
          <line
            key={f}
            x1={PADX} y1={PADY + (1 - f) * (H - PADY * 2)}
            x2={W - PADX} y2={PADY + (1 - f) * (H - PADY * 2)}
            stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4,4"
          />
        ))}
        <path d={toArea(pvPts)} fill="url(#pvFill)" />
        <polyline points={toPolyline(pvPts)} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={toArea(uvPts)} fill="url(#uvFill)" />
        <polyline points={toPolyline(uvPts)} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5,3" />
      </svg>

      <div className="flex justify-between mt-3 px-1">
        {xLabels.map((d, i) => (
          <p key={i} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{d.date}</p>
        ))}
      </div>
    </div>
  );
}

/* ─── Top Pages Table ─────────────────────────────────────────── */
function TopPages({ pages, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="w-32 h-4 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <Skeleton className="flex-1 h-3 rounded" />
            <Skeleton className="w-10 h-3 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const max = pages?.[0]?.count || 1;

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Pages</p>
      {!pages?.length ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无数据</p>
      ) : (
        <div className="space-y-3">
          {pages.map((p, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)', maxWidth: '75%' }}>{p.path}</span>
                <span className="text-xs font-semibold ml-2" style={{ color: '#6366f1' }}>{fmtNum(p.count)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${Math.round((p.count / max) * 100)}%`, background: '#6366f1' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Top IPs List ────────────────────────────────────────────── */
function TopIPs({ ips, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="w-24 h-4 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between mb-3">
            <Skeleton className="w-28 h-3 rounded" />
            <Skeleton className="w-8 h-3 rounded" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top IPs</p>
      {!ips?.length ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无数据</p>
      ) : (
        <div className="space-y-2">
          {ips.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded text-xs flex items-center justify-center font-bold flex-shrink-0"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                >
                  {i + 1}
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{item.ip}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>{fmtNum(item.count)} hits</span>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{fmtDate(item.lastSeen)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── TrafficTab ─────────────────────────────────────────────── */
export default function TrafficTab() {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (p = period, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getTraffic({ period: p });
      setData(res.data?.data || null);
    } catch {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    load(period);
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>访客流量</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>全站访问统计（包含未登录用户）</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period toggle */}
          {['7d', '30d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: period === p ? '#6366f1' : 'var(--bg-secondary)',
                color: period === p ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => load(period, true)}
            disabled={refreshing}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            title="刷新"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}>
          {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="今日 PV" value={summary.todayPV} sub="Page Views" accent="#6366f1" icon={Eye} loading={loading} />
        <KpiCard label="今日 UV" value={summary.todayUV} sub="Unique IPs" accent="#22c55e" icon={Users} loading={loading} />
        <KpiCard label="本周 PV" value={summary.weekPV} sub="7-day Views" accent="#f59e0b" icon={TrendingUp} loading={loading} />
        <KpiCard label="本周 UV" value={summary.weekUV} sub="7-day Unique" accent="#ec4899" icon={Globe} loading={loading} />
      </div>

      {/* Chart */}
      <TrafficChart data={data?.chart} loading={loading} period={period} />

      {/* Bottom 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPages pages={data?.topPages} loading={loading} />
        <TopIPs ips={data?.topIPs} loading={loading} />
      </div>
    </div>
  );
}
