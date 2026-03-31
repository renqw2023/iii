import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Zap, Coins, RotateCcw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import { creditsAPI } from '../services/creditsApi';

const PLAN_META = {
  free:     { color: '#6b7280', accent: '#f59e0b', label: 'Free',     gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)' },
  starter:  { color: '#3b82f6', accent: '#3b82f6', label: 'Starter',  gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  pro:      { color: '#6366f1', accent: '#6366f1', label: 'Pro',      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  ultimate: { color: '#f59e0b', accent: '#f59e0b', label: 'Ultimate', gradient: 'linear-gradient(135deg, #f59e0b, #fb923c)' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function Subscription() {
  const navigate = useNavigate();

  const { data: plan, isLoading: planLoading } = useQuery(
    ['current-plan'],
    () => creditsAPI.getCurrentPlan().then(r => r.data),
    { staleTime: 60_000, onError: () => toast.error('Failed to load plan info') }
  );

  const { data: balance, isLoading: balanceLoading } = useQuery(
    ['credits-balance'],
    () => creditsAPI.getBalance().then(r => r.data.data),
    { staleTime: 30_000 }
  );

  const loading = planLoading || balanceLoading;

  const isFree = !plan || plan.planId === 'free';
  const meta = PLAN_META[plan?.planId || 'free'] || PLAN_META.free;

  // Credit stats
  const freeCredits   = balance?.freeCredits ?? 0;
  const paidCredits   = balance?.credits ?? 0;
  const dailyFree     = balance?.dailyFreeAmount ?? 40;
  const totalPurchased = plan?.totalPurchased || 0;

  // Progress: free = freeCredits/dailyFree, paid = paidCredits/totalPurchased
  const remaining     = isFree ? freeCredits : paidCredits;
  const total         = isFree ? dailyFree   : totalPurchased;
  const pct           = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const depleted      = remaining === 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--gallery-filter-hover-bg,#f1f5f9)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft size={18} />
        </button>
        <CreditCard size={22} style={{ color: 'var(--text-primary)' }} />
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          My Plan
        </h1>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="h-56 rounded-2xl animate-pulse"
             style={{ backgroundColor: 'var(--gallery-filter-hover-bg,#f1f5f9)' }} />
      )}

      {/* Plan card */}
      {!loading && (
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            background: meta.gradient,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circle */}
          <div style={{
            position: 'absolute', right: -32, top: -32,
            width: 140, height: 140, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }} />

          {/* Top row: plan name + status badge */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm font-medium" style={{ opacity: 0.8 }}>Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <Zap size={20} fill="rgba(255,255,255,0.9)" style={{ color: 'rgba(255,255,255,0.9)' }} />
                <span className="text-2xl font-bold">{meta.label}</span>
              </div>
              {plan?.purchasedAt && (
                <p className="text-xs mt-1" style={{ opacity: 0.7 }}>
                  Purchased {formatDate(plan.purchasedAt)}
                </p>
              )}
              {isFree && (
                <p className="text-xs mt-1" style={{ opacity: 0.7 }}>
                  Free tier — resets daily
                </p>
              )}
            </div>

            {/* Status badge */}
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
              style={{
                backgroundColor: depleted ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.2)',
                border: depleted ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.3)',
                color: depleted ? '#fca5a5' : '#fff',
              }}
            >
              {depleted
                ? <><AlertCircle size={11} /> Depleted</>
                : <><span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }} /> Active</>
              }
            </span>
          </div>

          {/* Credits display */}
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium" style={{ opacity: 0.75 }}>
                {isFree ? 'Daily free credits remaining' : 'Permanent credits remaining'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Coins size={18} />
                <span className="text-3xl font-bold">{remaining.toLocaleString()}</span>
                <span className="text-sm font-medium" style={{ opacity: 0.75 }}>
                  / {total.toLocaleString()}
                </span>
              </div>
            </div>
            <span className="text-3xl font-bold" style={{ opacity: 0.9 }}>{pct}%</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                borderRadius: 99,
                backgroundColor: depleted ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.85)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {isFree && (
            <p className="text-xs mt-2" style={{ opacity: 0.65 }}>
              <RotateCcw size={10} style={{ display: 'inline', marginRight: 4 }} />
              Resets to {dailyFree} credits every day at midnight UTC+8
            </p>
          )}
        </div>
      )}

      {/* Upgrade / Add more CTA */}
      {!loading && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          {isFree ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Unlock permanent credits
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  One-time purchase · Never expire · 4K unlocks at Pro+
                </p>
              </div>
              <Link
                to="/credits"
                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#1B1B1B' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#363636'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1B1B1B'}
              >
                Upgrade
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {depleted ? 'Your credits are depleted' : 'Need more credits?'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {plan?.ordersCount > 1
                    ? `${plan.ordersCount} purchases totalling ${totalPurchased.toLocaleString()} credits`
                    : 'Top up anytime — credits never expire'}
                </p>
              </div>
              <Link
                to="/credits"
                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: depleted ? '#ef4444' : '#1B1B1B' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = depleted ? '#dc2626' : '#363636'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = depleted ? '#ef4444' : '#1B1B1B'}
              >
                Add Credits
              </Link>
            </div>
          )}
        </div>
      )}

      {/* View orders link */}
      {!loading && (
        <p className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <Link
            to="/orders"
            style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            View order history →
          </Link>
        </p>
      )}
    </div>
  );
}
