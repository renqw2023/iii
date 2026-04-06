import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, BarChart2 } from 'lucide-react';
import { adminAPI } from '../../../services/api';

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt = (n) =>
  n == null ? '$0.00' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ─── Skeleton ────────────────────────────────────────────────── */
function Skeleton({ className, style }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: 'var(--bg-tertiary)', ...style }}
    />
  );
}

/* ─── Summary Card ────────────────────────────────────────────── */
function SummaryCard({ label, value, sub, accent, icon: Icon, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-16 h-4 rounded" />
        </div>
        <Skeleton className="w-28 h-7 rounded mb-1" />
        <Skeleton className="w-20 h-3 rounded" />
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
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accent + '18' }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      {sub != null && (
        <p className="text-xs" style={{ color: accent }}>{sub}</p>
      )}
    </div>
  );
}

/* ─── Plan Breakdown Card ─────────────────────────────────────── */
function PlanCard({ plan, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="w-24 h-4 rounded mb-3" />
        <Skeleton className="w-32 h-8 rounded mb-2" />
        <Skeleton className="w-16 h-3 rounded mb-4" />
        <Skeleton className="w-full h-2 rounded" />
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${plan.color}30`,
        borderTop: `3px solid ${plan.color}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.planName}</p>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: plan.color + '18', color: plan.color }}
        >
          ${plan.price}
        </span>
      </div>
      <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{fmt(plan.revenue)}</p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>{plan.orders} orders</p>
      {/* Progress bar */}
      <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${plan.pct}%`, background: plan.color }}
        />
      </div>
      <p className="text-xs mt-1.5 text-right" style={{ color: plan.color }}>{plan.pct}% of revenue</p>
    </div>
  );
}

/* ─── Revenue Chart ───────────────────────────────────────────── */
function smoothRevPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i].x - pts[i - 1].x) * 0.35;
    d += ` C${pts[i - 1].x + cp},${pts[i - 1].y} ${pts[i].x - cp},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  return d;
}

function fmtYRev(v) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  if (v === 0) return '$0';
  return `$${v.toFixed(v < 10 ? 2 : 0)}`;
}

function fmtTooltipRev(v) {
  if (v == null) return '$0.00';
  return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function RevenueChart({ data, loading, totalRevenue }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="w-40 h-4 rounded mb-6" />
        <Skeleton className="w-full h-48 rounded" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const W = 700, H = 220, PADL = 60, PADR = 12, PADT = 16, PADB = 32;
  const chartW = W - PADL - PADR;
  const chartH = H - PADT - PADB;
  const max = Math.max(...data.map(d => d.revenue), 0.01);

  const points = data.map((d, i) => ({
    x: PADL + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    y: PADT + (1 - d.revenue / max) * chartH,
    ...d,
  }));

  const linePath = smoothRevPath(points);
  const areaPath = linePath + ` L${points[points.length - 1].x},${H - PADB} L${points[0].x},${H - PADB} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  const step = data.length > 20 ? 7 : data.length > 10 ? 4 : data.length > 6 ? 3 : 1;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
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
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Daily Revenue</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Last 30 days</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: '#22c55e' }}>{fmt(totalRevenue)}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>period total</p>
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
          <linearGradient id="revenueChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
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
                {fmtYRev(f * max)}
              </text>
            </g>
          );
        })}

        {/* Area */}
        <path d={areaPath} fill="url(#revenueChartFill)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={hoveredIdx === i ? 5.5 : 3}
            fill="#22c55e"
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
              stroke="#22c55e" strokeWidth="1" strokeDasharray="4,3" strokeOpacity="0.5" />
            <g transform={`translate(${tooltipOnLeft ? hp.x - 118 : hp.x + 10}, ${Math.min(hp.y - 10, H - PADB - 52)})`}>
              <rect width="108" height="44" rx="6"
                fill="var(--bg-primary)" stroke="var(--border-color)" strokeWidth="1" />
              <text x="10" y="16" fontSize="11" fontWeight="600" fill="var(--text-primary)">
                {data[hoveredIdx].date.slice(5)}
              </text>
              <text x="10" y="32" fontSize="11" fill="#22c55e">
                {fmtTooltipRev(data[hoveredIdx].revenue)}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ─── Recent Orders Table ─────────────────────────────────────── */
const PLAN_COLORS = { starter: '#6366f1', pro: '#3b82f6', ultimate: '#f59e0b' };

function OrdersTable({ orders, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Skeleton className="w-32 h-4 rounded" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-28 h-3 rounded" />
            <Skeleton className="w-16 h-5 rounded-full ml-auto" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Orders</p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Last 10</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No orders yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                {['Time', 'User', 'Plan', 'Amount', 'Status', 'Session'].map(h => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const planColor = PLAN_COLORS[order.planId] || '#6366f1';
                return (
                  <tr
                    key={order._id || i}
                    style={{ borderTop: '1px solid var(--border-color)' }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{fmtDate(order.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {order.userId?.avatar ? (
                          <img
                            src={order.userId.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                          >
                            {(order.userId?.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {order.userId?.username || 'Unknown'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {order.userId?.email || ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: planColor + '18', color: planColor }}
                      >
                        {order.planName}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                        {fmt(order.amountUSD)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: order.status === 'refunded' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                          color: order.status === 'refunded' ? '#ef4444' : '#22c55e',
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                        {order.stripeSessionId ? order.stripeSessionId.slice(0, 12) + '…' : '—'}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Period Selector ─────────────────────────────────────────── */
const PERIODS = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'all', label: 'ALL' },
];

/* ─── Main RevenueTab ─────────────────────────────────────────── */
export default function RevenueTab() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getRevenue({ period: p });
      setData(res.data?.data || null);
    } catch (e) {
      setError('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  const summary = data?.summary || {};
  const planBreakdown = data?.planBreakdown || [];
  const dailyRevenue = data?.dailyRevenue || [];
  const recentOrders = data?.recentOrders || [];

  // Fill missing plans (so 3 cards always show)
  const allPlans = ['starter', 'pro', 'ultimate'];
  const planMap = Object.fromEntries(planBreakdown.map(p => [p.planId, p]));
  const planNames = { starter: 'Starter', pro: 'Pro', ultimate: 'Ultimate' };
  const planPrices = { starter: 9.99, pro: 19.99, ultimate: 49.99 };
  const planColors = { starter: '#6366f1', pro: '#3b82f6', ultimate: '#f59e0b' };
  const filledPlans = allPlans.map(id =>
    planMap[id] || { planId: id, planName: planNames[id], price: planPrices[id], color: planColors[id], orders: 0, revenue: 0, pct: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Revenue analytics for your platform
        </p>
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className="px-4 py-2 text-xs font-semibold transition-all"
              style={{
                background: period === p.id ? 'rgba(34,197,94,0.12)' : 'transparent',
                color: period === p.id ? '#22c55e' : 'var(--text-tertiary)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl p-4 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Revenue"
          value={fmt(summary.totalRevenue)}
          sub={`${summary.totalOrders || 0} orders`}
          accent="#22c55e"
          icon={DollarSign}
          loading={loading}
        />
        <SummaryCard
          label="This Month"
          value={fmt(summary.revenueThisMonth)}
          sub={`${summary.ordersThisMonth || 0} orders`}
          accent="#3b82f6"
          icon={TrendingUp}
          loading={loading}
        />
        <SummaryCard
          label="Today"
          value={fmt(summary.revenueToday)}
          sub={`${summary.ordersToday || 0} orders`}
          accent="#f59e0b"
          icon={ShoppingCart}
          loading={loading}
        />
        <SummaryCard
          label="Avg Order Value"
          value={fmt(summary.avgOrderValue)}
          sub="per purchase"
          accent="#8b5cf6"
          icon={BarChart2}
          loading={loading}
        />
      </div>

      {/* Plan breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filledPlans.map(plan => (
          <PlanCard key={plan.planId} plan={plan} loading={loading} />
        ))}
      </div>

      {/* Revenue chart */}
      <RevenueChart data={dailyRevenue} loading={loading} totalRevenue={summary.totalRevenue} />

      {/* Recent orders */}
      <OrdersTable orders={recentOrders} loading={loading} />
    </div>
  );
}
