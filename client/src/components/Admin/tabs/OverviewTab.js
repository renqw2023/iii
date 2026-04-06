import React from 'react';
import { Users, UserPlus, Activity, TrendingUp, TrendingDown, Flame } from 'lucide-react';

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
const KPI_CONFIGS = [
  { key: 'totalUsers',           label: 'Total Users',         icon: Users,        accent: '#6366f1', sub: () => null },
  { key: 'newUsersToday',        label: 'New Today',           icon: UserPlus,     accent: '#22c55e', sub: () => null },
  { key: 'activeUsers',          label: 'Active (30d)',        icon: Activity,     accent: '#f59e0b', sub: () => null },
  { key: 'totalGenerations',     label: 'Total Generations',   icon: Flame,        accent: '#ec4899', sub: () => null },
  { key: 'creditsIssuedToday',   label: 'Credits Issued',      icon: TrendingUp,   accent: '#3b82f6', sub: () => 'today' },
  { key: 'creditsConsumedToday', label: 'Credits Consumed',    icon: TrendingDown, accent: '#ef4444', sub: () => 'today' },
];

function KpiCard({ cfg, value, loading }) {
  const Icon = cfg.icon;
  const sub = cfg.sub();

  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-16 h-4 rounded" />
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
        boxShadow: 'var(--shadow-sm)',
        borderLeft: `3px solid ${cfg.accent}`,
      }}
    >
      {/* Subtle glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: cfg.accent + '0a', transform: 'translate(30%,-30%)' }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: cfg.accent + '18' }}
        >
          <Icon size={18} style={{ color: cfg.accent }} />
        </div>
        {sub && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.accent + '15', color: cfg.accent }}>
            {sub}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
        {value === undefined || value === null ? '—' : Number(value).toLocaleString()}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{cfg.label}</p>
    </div>
  );
}

/* ─── Mini Line Chart ─────────────────────────────────────────── */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i].x - pts[i - 1].x) * 0.35;
    d += ` C${pts[i - 1].x + cp},${pts[i - 1].y} ${pts[i].x - cp},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  return d;
}

function fmtYReg(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(Math.round(v));
}

function RegistrationChart({ data, loading }) {
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="w-40 h-4 rounded mb-6" />
        <Skeleton className="w-full h-48 rounded" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const W = 640, H = 220, PADL = 52, PADR = 12, PADT = 16, PADB = 32;
  const chartW = W - PADL - PADR;
  const chartH = H - PADT - PADB;
  const max = Math.max(...data.map(d => d.count), 1);
  const totalNew = data.reduce((s, d) => s + d.count, 0);

  const points = data.map((d, i) => ({
    x: PADL + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    y: PADT + (1 - d.count / max) * chartH,
    ...d,
  }));

  const linePath = smoothPath(points);
  const areaPath = linePath + ` L${points[points.length - 1].x},${H - PADB} L${points[0].x},${H - PADB} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  const step = data.length > 10 ? 4 : data.length > 6 ? 2 : 1;

  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0, minDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - mx);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    setHoveredIdx(nearest);
  };

  const hp = hoveredIdx !== null ? points[hoveredIdx] : null;
  const tooltipOnLeft = hp && hp.x > W / 2;

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Registrations</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: '#6366f1' }}>{totalNew}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>total new users</p>
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
          <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
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
                {fmtYReg(f * max)}
              </text>
            </g>
          );
        })}

        {/* Area */}
        <path d={areaPath} fill="url(#regFill)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={hoveredIdx === i ? 5.5 : 3}
            fill="#6366f1"
            stroke="var(--bg-secondary)"
            strokeWidth="2"
            style={{ transition: 'r 0.1s' }}
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={points[i].x} y={H - 6}
              textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">
              {d.date.slice(5)}
            </text>
          );
        })}

        {/* Crosshair + Tooltip */}
        {hp && (
          <g>
            <line x1={hp.x} y1={PADT} x2={hp.x} y2={H - PADB}
              stroke="#6366f1" strokeWidth="1" strokeDasharray="4,3" strokeOpacity="0.5" />
            <g transform={`translate(${tooltipOnLeft ? hp.x - 112 : hp.x + 10}, ${Math.min(hp.y - 10, H - PADB - 52)})`}>
              <rect width="102" height="44" rx="6"
                fill="var(--bg-primary)" stroke="var(--border-color)" strokeWidth="1" />
              <text x="10" y="16" fontSize="11" fontWeight="600" fill="var(--text-primary)">
                {data[hoveredIdx].date.slice(5)}
              </text>
              <text x="10" y="32" fontSize="11" fill="#6366f1">
                {data[hoveredIdx].count} new users
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ─── Quick Stats Bar ─────────────────────────────────────────── */
function QuickStatBar({ stats, loading }) {
  const items = [
    { label: 'Total Posts',   value: stats?.totalPosts,         color: '#6366f1' },
    { label: 'Total Prompts', value: stats?.totalPrompts,       color: '#8b5cf6' },
    { label: 'Total Views',   value: stats?.totalViews,         color: '#3b82f6' },
    { label: 'Total Likes',   value: stats?.totalLikes,         color: '#ec4899' },
  ];
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex items-center justify-between px-6 py-3"
          style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border-color)' : 'none' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
          {loading
            ? <Skeleton className="w-12 h-4 rounded" />
            : <span className="text-sm font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                {item.value !== undefined ? Number(item.value).toLocaleString() : '—'}
              </span>
          }
        </div>
      ))}
    </div>
  );
}

/* ─── Main Export ─────────────────────────────────────────────── */
export default function OverviewTab({ stats, loading }) {
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {KPI_CONFIGS.map(cfg => (
          <KpiCard key={cfg.key} cfg={cfg} value={stats?.[cfg.key]} loading={loading} />
        ))}
      </div>

      {/* Chart + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RegistrationChart data={stats?.dailyRegistrations} loading={loading} />
        </div>
        <div>
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Content Stats
            </p>
          </div>
          <QuickStatBar stats={stats} loading={loading} />
        </div>
      </div>
    </div>
  );
}
