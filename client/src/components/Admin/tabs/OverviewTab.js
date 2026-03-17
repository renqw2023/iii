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
function RegistrationChart({ data, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="w-40 h-4 rounded mb-6" />
        <Skeleton className="w-full h-16 rounded" />
        <div className="flex justify-between mt-3">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="w-8 h-3 rounded" />)}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(d => d.count), 1);
  const W = 560, H = 72, PADX = 12, PADY = 8;

  const points = data.map((d, i) => {
    const x = PADX + (i / (data.length - 1)) * (W - PADX * 2);
    const y = H - PADY - (d.count / max) * (H - PADY * 2);
    return { x, y, ...d };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  // Area fill path
  const area = `M${points[0].x},${H} ` + points.map(p => `L${p.x},${p.y}`).join(' ') + ` L${points[points.length - 1].x},${H} Z`;

  const totalNew = data.reduce((s, d) => s + d.count, 0);

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Registrations</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>{totalNew}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>total new users</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line
            key={f}
            x1={PADX} y1={PADY + (1 - f) * (H - PADY * 2)}
            x2={W - PADX} y2={PADY + (1 - f) * (H - PADY * 2)}
            stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4,4"
          />
        ))}
        {/* Area */}
        <path d={area} fill="url(#chartFill)" />
        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#6366f1" stroke="var(--bg-secondary)" strokeWidth="2" />
        ))}
      </svg>

      <div className="flex justify-between mt-3">
        {data.map((d, i) => (
          <div key={i} className="text-center">
            <p className="text-xs font-medium" style={{ color: d.count > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
              {d.count}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{d.date.slice(5)}</p>
          </div>
        ))}
      </div>
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
