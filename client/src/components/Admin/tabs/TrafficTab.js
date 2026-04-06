import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Users, TrendingUp, Globe, RefreshCw, Calendar } from 'lucide-react';
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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
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
function smoothTrafPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i].x - pts[i - 1].x) * 0.35;
    d += ` C${pts[i - 1].x + cp},${pts[i - 1].y} ${pts[i].x - cp},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  return d;
}

function TrafficChart({ data, loading, period }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="w-40 h-4 rounded mb-6" />
        <Skeleton className="w-full h-48 rounded" />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl p-6 flex items-center justify-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', minHeight: 220 }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无访问数据（等待约 30 秒后刷新）</p>
      </div>
    );
  }

  const W = 700, H = 220, PADL = 52, PADR = 12, PADT = 16, PADB = 32;
  const chartW = W - PADL - PADR;
  const chartH = H - PADT - PADB;
  const maxPV = Math.max(...data.map(d => d.pv), 1);
  const maxUV = Math.max(...data.map(d => d.uv), 1);
  const maxVal = Math.max(maxPV, maxUV);

  const mkPts = (key) =>
    data.map((d, i) => ({
      x: PADL + (i / Math.max(data.length - 1, 1)) * chartW,
      y: PADT + (1 - d[key] / maxVal) * chartH,
      ...d,
    }));

  const pvPts = mkPts('pv');
  const uvPts = mkPts('uv');

  const pvLine = smoothTrafPath(pvPts);
  const uvLine = smoothTrafPath(uvPts);
  const pvArea = pvLine + ` L${pvPts[pvPts.length - 1].x},${H - PADB} L${pvPts[0].x},${H - PADB} Z`;
  const uvArea = uvLine + ` L${uvPts[uvPts.length - 1].x},${H - PADB} L${uvPts[0].x},${H - PADB} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  const step = data.length > 14 ? 5 : data.length > 7 ? 3 : 1;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0, minDist = Infinity;
    pvPts.forEach((p, i) => {
      const dist = Math.abs(p.x - mx);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    setHoveredIdx(nearest);
  };

  const hp = hoveredIdx !== null ? pvPts[hoveredIdx] : null;
  const tooltipOnLeft = hp && hp.x > W / 2;

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>PV / UV 趋势</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>最近 {period}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#6366f1' }}>
            <span className="w-4 h-0.5 rounded inline-block" style={{ background: '#6366f1' }} /> PV
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#22c55e' }}>
            <span className="w-4 h-0.5 rounded inline-block" style={{ background: '#22c55e' }} /> UV
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 220, display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="uvFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines + labels */}
        {yTicks.map(f => {
          const cy = PADT + (1 - f) * chartH;
          return (
            <g key={f}>
              <line x1={PADL} y1={cy} x2={W - PADR} y2={cy}
                stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4,4" />
              <text x={PADL - 6} y={cy + 3.5} textAnchor="end"
                fontSize="10" fill="var(--text-tertiary)">
                {fmtNum(Math.round(f * maxVal))}
              </text>
            </g>
          );
        })}

        {/* Areas */}
        <path d={pvArea} fill="url(#pvFill)" />
        <path d={uvArea} fill="url(#uvFill)" />

        {/* Lines */}
        <path d={pvLine} fill="none" stroke="#6366f1" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        <path d={uvLine} fill="none" stroke="#22c55e" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* PV dots */}
        {pvPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={hoveredIdx === i ? 5.5 : 3}
            fill="#6366f1" stroke="var(--bg-secondary)" strokeWidth="2"
            style={{ transition: 'r 0.1s' }}
          />
        ))}
        {/* UV dots */}
        {uvPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={hoveredIdx === i ? 5 : 2.5}
            fill="#22c55e" stroke="var(--bg-secondary)" strokeWidth="2"
            style={{ transition: 'r 0.1s' }}
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={pvPts[i].x} y={H - 6}
              textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">
              {d.date}
            </text>
          );
        })}

        {/* Crosshair + Tooltip */}
        {hp && (
          <g>
            <line x1={hp.x} y1={PADT} x2={hp.x} y2={H - PADB}
              stroke="#6366f1" strokeWidth="1" strokeDasharray="4,3" strokeOpacity="0.45" />
            <g transform={`translate(${tooltipOnLeft ? hp.x - 140 : hp.x + 10}, ${Math.min(hp.y - 10, H - PADB - 60)})`}>
              <rect width="130" height="52" rx="6"
                fill="var(--bg-primary)" stroke="var(--border-color)" strokeWidth="1" />
              <text x="10" y="17" fontSize="11" fontWeight="600" fill="var(--text-primary)">
                {data[hoveredIdx].date}
              </text>
              <text x="10" y="33" fontSize="11" fill="#6366f1">
                PV {fmtNum(data[hoveredIdx].pv)}
              </text>
              <text x="10" y="47" fontSize="11" fill="#22c55e">
                UV {fmtNum(data[hoveredIdx].uv)}
              </text>
            </g>
          </g>
        )}
      </svg>
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

/* ─── Top IPs（带地理信息）────────────────────────────────────── */
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
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-5 h-5 rounded text-xs flex items-center justify-center font-bold flex-shrink-0"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{item.ip}</p>
                  {(item.country || item.city) && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {[item.country, item.city].filter(Boolean).join(' / ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
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

/* ─── Country Ranking ─────────────────────────────────────────── */
function CountryRanking({ countries, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="w-32 h-4 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <Skeleton className="w-6 h-3 rounded" />
            <Skeleton className="flex-1 h-3 rounded" />
            <Skeleton className="w-10 h-3 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const max = countries?.[0]?.count || 1;
  const total = countries?.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>来源国家</p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>仅含有地理信息的访问</p>
      {!countries?.length ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>暂无数据（新访问将自动记录）</p>
      ) : (
        <div className="space-y-3">
          {countries.map((c, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {c.country}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="font-semibold" style={{ color: '#06b6d4' }}>{fmtNum(c.count)}</span>
                  {' '}
                  <span>({Math.round((c.count / total) * 100)}%)</span>
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${Math.round((c.count / max) * 100)}%`, background: '#06b6d4' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Daily IP Log ────────────────────────────────────────────── */
function DailyIPLog() {
  const [date, setDate] = useState(todayStr());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null); // expanded IP index

  const load = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    setExpanded(null);
    try {
      const res = await adminAPI.getDailyIPs({ date: d });
      setResult(res.data?.data || null);
    } catch {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>当日 IP 访问记录</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {result ? `共 ${result.total} 个 IP，最多显示 200 条` : '选择日期查看明细'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <Calendar size={13} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={e => setDate(e.target.value)}
              className="text-xs bg-transparent outline-none"
              style={{ color: 'var(--text-primary)', width: 110 }}
            />
          </div>
          <button
            onClick={() => load(date)}
            disabled={loading}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            title="刷新"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm mb-3" style={{ color: '#ef4444' }}>{error}</p>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-6 h-3 rounded" />
              <Skeleton className="w-28 h-3 rounded" />
              <Skeleton className="w-16 h-3 rounded" />
              <Skeleton className="w-16 h-3 rounded" />
              <Skeleton className="w-10 h-3 rounded" />
            </div>
          ))}
        </div>
      ) : !result?.ips?.length ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
          {result ? '当日暂无访问记录' : '请选择日期后点击刷新'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['#', 'IP', '国家', '城市', '访问次数', '最后访问', '路径'].map(h => (
                  <th key={h} className="pb-2 pr-4 text-left font-medium" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.ips.map((item, i) => (
                <React.Fragment key={i}>
                  <tr
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-tertiary)' }}>{i + 1}</td>
                    <td className="py-2 pr-4 font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{item.ip || '—'}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--text-secondary)' }}>{item.country || '—'}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--text-secondary)' }}>{item.city || '—'}</td>
                    <td className="py-2 pr-4 font-semibold" style={{ color: '#f59e0b' }}>{item.count}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--text-tertiary)' }}>{fmtDate(item.lastSeen)}</td>
                    <td className="py-2 font-mono truncate" style={{ color: 'var(--text-tertiary)', maxWidth: 160 }}>
                      {item.paths?.[0] || '—'}
                      {item.paths?.length > 1 && (
                        <span className="ml-1 px-1 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: '#6366f1' }}>
                          +{item.paths.length - 1}
                        </span>
                      )}
                    </td>
                  </tr>
                  {expanded === i && item.paths?.length > 1 && (
                    <tr>
                      <td colSpan={7} className="pb-2 pt-1 pl-8">
                        <div className="flex flex-wrap gap-1">
                          {item.paths.map((p, pi) => (
                            <span key={pi} className="px-2 py-0.5 rounded font-mono text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
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

      {/* 3-col: TopPages / TopIPs / CountryRanking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopPages pages={data?.topPages} loading={loading} />
        <TopIPs ips={data?.topIPs} loading={loading} />
        <CountryRanking countries={data?.topCountries} loading={loading} />
      </div>

      {/* Daily IP Log */}
      <DailyIPLog />
    </div>
  );
}
