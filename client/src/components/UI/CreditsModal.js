/**
 * CreditsModal — 积分购买定价弹窗
 *
 * 对标目标截图实测值：
 * - Title: "Pay Once. Keep Forever"
 * - Prices: $0 / $9.9 / $19.9 / $49.9（原价 $22 / $60）
 * - CTA buttons: border-radius 50px（胶囊形），"Get Starter/Pro/Ultimate"
 * - Pro badge: "SAVE 10%" blue | Ultimate badge: "SAVE 20%" purple
 * - Features: "40 refresh credits every day", "Commercial license" 等
 * - No auto-renewal: 小灰字，CTA 按钮正下方
 * - Card borders: Free/Starter #E3E3E3 bg #F9F9F9 | Pro #147DFF bg white | Ultimate rgb(96,93,243) bg white
 */
import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const FREE_FEATURES = [
  '40 refresh credits every day',
  'Up to 20 images (image 1.5)',
  '2K resolution',
  '1 concurrent task',
  'Free background removal',
  'Commercial license',
];

const PAID_FEATURES = [
  '40 refresh credits every day',
  'Up to 4K resolution',
  '4 concurrent tasks',
  'Credits never expire',
  'Free background removal',
  'Commercial license',
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'Get Started',
    price: '0',
    currency: '$',
    priceSub: 'No credit card required',
    creditsLabel: 'Daily Credits',
    creditsSub: 'Refreshes every day',
    cta: { label: 'Current Plan', disabled: true, style: 'free' },
    noAutoRenew: false,
    features: FREE_FEATURES,
    cardStyle: { border: '#E3E3E3', bg: '#F9F9F9' },
    badge: null,
    originalPrice: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'All Features Unlocked',
    price: '9.9',
    currency: '$',
    priceSub: 'One-time payment',
    creditsLabel: '1,000 Credits',
    creditsSub: 'Up to 500 images (image 1.5)',
    cta: { label: 'Get Starter', disabled: false, style: 'starter' },
    noAutoRenew: true,
    features: PAID_FEATURES,
    cardStyle: { border: '#E3E3E3', bg: '#F9F9F9' },
    badge: null,
    originalPrice: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Most Popular',
    price: '19.9',
    currency: '$',
    priceSub: 'One-time payment',
    creditsLabel: '2,200 Credits',
    creditsSub: 'Up to 1,100 images (image 1.5)',
    cta: { label: 'Get Pro', disabled: false, style: 'pro' },
    noAutoRenew: true,
    features: PAID_FEATURES,
    cardStyle: { border: '#147DFF', bg: '#fff' },
    badge: { label: 'SAVE 10%', color: '#147DFF', bg: 'rgba(20,125,255,0.1)' },
    originalPrice: '22',
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    subtitle: 'Best Value',
    price: '49.9',
    currency: '$',
    priceSub: 'One-time payment',
    creditsLabel: '6,000 Credits',
    creditsSub: 'Up to 3,000 images (image 1.5)',
    cta: { label: 'Get Ultimate', disabled: false, style: 'ultimate' },
    noAutoRenew: true,
    features: [...PAID_FEATURES, 'Priority support'],
    cardStyle: { border: 'rgb(96,93,243)', bg: '#fff' },
    badge: { label: 'SAVE 20%', color: 'rgb(96,93,243)', bg: 'rgba(96,93,243,0.1)' },
    originalPrice: '60',
  },
];

const CTA_COLORS = {
  free:     { bg: 'transparent', color: '#9ca3af', border: '1.5px solid #e5e7eb' },
  starter:  { bg: 'rgb(20,20,20)',   color: '#fff', border: 'none' },
  pro:      { bg: 'rgb(20,125,255)', color: '#fff', border: 'none' },
  ultimate: { bg: 'rgb(96,93,243)',  color: '#fff', border: 'none' },
};

const CreditsModal = ({ open, onClose }) => {
  const { isAuthenticated, openLoginModal } = useAuth();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const handlePlanClick = (plan) => {
    if (plan.cta.disabled) return;
    if (!isAuthenticated) { onClose(); openLoginModal(); return; }
    window.location.href = `/credits?plan=${plan.id}`;
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: 1100 }}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 0, right: -56,
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: 'rgba(115,115,115,0.5)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(115,115,115,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(115,115,115,0.5)'; }}
        >
          <X size={18} />
        </button>

        {/* Dialog */}
        <div
          style={{
            borderRadius: 22,
            backgroundColor: '#fff',
            boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          {/* Header — gradient mesh */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: '22px 22px 0 0',
            padding: '32px 24px 28px',
            backgroundColor: 'rgba(0,0,0,0.01)',
          }}>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `
                radial-gradient(80% 120% at 95% 20%, rgba(184,112,255,0.18) 0%, transparent 50%),
                radial-gradient(60% 80% at 75% 80%, rgba(255,166,77,0.15) 0%, transparent 45%),
                radial-gradient(50% 100% at 15% 50%, rgba(41,130,255,0.12) 0%, transparent 40%)
              `,
            }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: '#0E1014', margin: 0, letterSpacing: '-0.5px' }}>
                Pay Once. Keep Forever.
              </h2>
              <p style={{ fontSize: 15, color: '#6b7280', marginTop: 8, marginBottom: 0 }}>
                Unlock 4K generation, batch mode, and create stunning images on your own timeline
              </p>
            </div>
          </div>

          {/* Plan grid */}
          <div style={{ padding: '20px 24px 28px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              alignItems: 'stretch',
            }}>
              {PLANS.map(plan => {
                const ctaColor = CTA_COLORS[plan.cta.style];
                return (
                  <div
                    key={plan.id}
                    style={{
                      position: 'relative',
                      borderRadius: 20,
                      border: `1px solid ${plan.cardStyle.border}`,
                      backgroundColor: plan.cardStyle.bg,
                      transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
                      display: 'flex', flexDirection: 'column',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.10)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>

                      {/* Plan header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>
                            {plan.name}
                          </h3>
                          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>
                            {plan.subtitle}
                          </p>
                        </div>
                        {plan.badge && (
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: plan.badge.color, backgroundColor: plan.badge.bg,
                            borderRadius: 20, padding: '4px 9px',
                            letterSpacing: '0.06em', whiteSpace: 'nowrap',
                          }}>
                            {plan.badge.label}
                          </span>
                        )}
                      </div>

                      {/* Price — 原价与现价同行，保证所有卡片高度一致，按钮对齐 */}
                      <div style={{ marginBottom: 4 }}>
                        {/* 原价 + 现价 同一行 */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                          {plan.originalPrice ? (
                            <span style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>
                              {plan.currency}{plan.originalPrice}
                            </span>
                          ) : (
                            /* 占位，保持高度一致 */
                            <span style={{ fontSize: 14, visibility: 'hidden' }}>$0</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 1, lineHeight: 1 }}>
                          <span style={{ fontSize: 20, fontWeight: 600, color: '#111827', paddingTop: 4 }}>
                            {plan.currency}
                          </span>
                          <span style={{ fontSize: 44, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                            {plan.price}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>
                          {plan.priceSub}
                        </p>
                      </div>

                      {/* Credits */}
                      <div style={{ marginBottom: 20, marginTop: 12 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>
                          {plan.creditsLabel}
                        </p>
                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 0 }}>
                          {plan.creditsSub}
                        </p>
                      </div>

                      {/* CTA button — pill shape, exact match screenshot */}
                      <button
                        onClick={() => handlePlanClick(plan)}
                        disabled={plan.cta.disabled}
                        style={{
                          width: '100%', height: 44,
                          borderRadius: 50,
                          fontSize: 15, fontWeight: 600,
                          cursor: plan.cta.disabled ? 'default' : 'pointer',
                          backgroundColor: ctaColor.bg,
                          color: ctaColor.color,
                          border: ctaColor.border || 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'opacity 150ms, transform 100ms',
                          marginBottom: plan.noAutoRenew ? 6 : 20,
                          letterSpacing: '0.01em',
                        }}
                        onMouseEnter={e => {
                          if (!plan.cta.disabled) {
                            e.currentTarget.style.opacity = '0.88';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {plan.cta.label}
                      </button>

                      {/* No auto-renewal */}
                      {plan.noAutoRenew && (
                        <p style={{
                          fontSize: 10, color: '#9ca3af', margin: '0 0 16px',
                          textAlign: 'center', fontStyle: 'italic',
                        }}>
                          ✓ No auto-renewal
                        </p>
                      )}

                      {/* Divider */}
                      <div style={{ height: 1, backgroundColor: '#f3f4f6', marginBottom: 16 }} />

                      {/* Feature list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {plan.features.map((feat, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <Check size={13} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.45 }}>{feat}</span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20, marginBottom: 0 }}>
              By purchasing, you agree to our{' '}
              <a href="/terms" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsModal;
