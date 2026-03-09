/**
 * CreditsModal — 积分购买定价弹窗（精确复刻 MeiGen.ai）
 *
 * 实测值（1440×900 Chrome DevTools DOM inspection）：
 * - Dialog: rounded-[22px] white bg, maxWidth 1300px
 * - Header: gradient mesh radial-gradient (purple/orange/blue), p-28px/24px
 * - Cards: rounded-[24px], Free/Starter: border #E3E3E3 bg #F9F9F9
 *          Pro: border #147DFF bg white
 *          Ultimate: border rgb(96,93,243) bg white（紫色边框！不是灰色）
 * - CTA buttons: h-44px rounded-[14px]
 *   Free=gray border | Starter=rgb(20,20,20) | Pro=rgb(20,125,255) | Ultimate=rgb(96,93,243)
 * - "✓ No auto-renewal" note: shown below CTA in paid plans, gray 10px text
 * - Badges: Pro "Save $4" blue rgba(20,125,255,0.1) | Ultimate "Save $10" rgb(96,93,243)
 * - Currency: USD（西方市场）
 */
import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'Start for free',
    price: 0,
    currency: '$',
    priceSub: 'No credit card required',
    creditsLabel: 'Daily Credits',
    creditsSub: 'Refreshes every day',
    cta: { label: 'Current Plan', disabled: true, style: 'free' },
    noAutoRenew: false,
    features: [
      'Daily refresh of 40 credits',
      'Generate up to 20 images (image 1.5)',
      'Max 2K resolution',
      '1 parallel task',
      'Free for commercial use',
    ],
    cardStyle: { border: '#E3E3E3', bg: '#F9F9F9' },
    badge: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Unlock full features',
    price: 9,
    currency: '$',
    priceSub: 'One-time payment',
    creditsLabel: '1,000 Credits',
    creditsSub: 'Up to 500 images (image 1.5)',
    cta: { label: 'Buy Starter', disabled: false, style: 'starter' },
    noAutoRenew: true,
    features: [
      'Daily refresh of 40 credits',
      'Max 4K resolution',
      '4 parallel tasks',
      'Credits never expire',
      'Free background removal',
      'Free for commercial use',
    ],
    cardStyle: { border: '#E3E3E3', bg: '#F9F9F9' },
    badge: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Most popular',
    price: 19,
    originalPrice: 23,
    currency: '$',
    priceSub: 'One-time payment',
    creditsLabel: '2,200 Credits',
    creditsSub: 'Up to 1,100 images (image 1.5)',
    cta: { label: 'Buy Pro', disabled: false, style: 'pro' },
    noAutoRenew: true,
    features: [
      'Daily refresh of 40 credits',
      'Max 4K resolution',
      '4 parallel tasks',
      'Credits never expire',
      'Free background removal',
      'Free for commercial use',
    ],
    cardStyle: { border: '#147DFF', bg: '#fff' },
    badge: { label: 'Save $4', color: '#147DFF', bg: 'rgba(20,125,255,0.1)' },
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    subtitle: 'Best value',
    price: 39,
    originalPrice: 49,
    currency: '$',
    priceSub: 'One-time payment',
    creditsLabel: '6,000 Credits',
    creditsSub: 'Up to 3,000 images (image 1.5)',
    cta: { label: 'Buy Ultimate', disabled: false, style: 'ultimate' },
    noAutoRenew: true,
    features: [
      'Daily refresh of 40 credits',
      'Max 4K resolution',
      '4 parallel tasks',
      'Credits never expire',
      'Free background removal',
      'Free for commercial use',
      'Priority support',
    ],
    cardStyle: { border: 'rgb(96,93,243)', bg: '#fff' },
    badge: { label: 'Save $10', color: 'rgb(96,93,243)', bg: 'rgba(96,93,243,0.1)' },
  },
];

const CTA_COLORS = {
  free:     { bg: 'transparent', color: '#919191', border: '1px solid #E3E3E3' },
  starter:  { bg: 'rgb(20,20,20)',    color: '#fff', border: 'none' },
  pro:      { bg: 'rgb(20,125,255)',  color: '#fff', border: 'none' },
  ultimate: { bg: 'rgb(96,93,243)',   color: '#fff', border: 'none' },
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
    /* Overlay */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      {/* Dialog wrapper — for absolute close button */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 1100 }}>

        {/* Close button — absolute -right-14 top-0, exact MeiGen */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 0, right: -56,
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: 'rgba(115,115,115,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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
          {/* Header — gradient mesh, exact MeiGen values */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: '12px 12px 0 0',
            padding: '28px 24px 24px',
            backgroundColor: 'rgba(0,0,0,0.02)',
          }}>
            {/* Gradient mesh overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `
                radial-gradient(80% 120% at 95% 20%, rgba(184,112,255,0.18) 0%, transparent 50%),
                radial-gradient(60% 80% at 75% 80%, rgba(255,166,77,0.15) 0%, transparent 45%),
                radial-gradient(50% 100% at 15% 50%, rgba(41,130,255,0.12) 0%, transparent 40%)
              `,
            }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <h2 style={{ fontSize: 30, fontWeight: 700, color: '#0E1014', margin: 0 }}>
                One-time payment. Yours forever.
              </h2>
              <p style={{ fontSize: 15, color: '#6b7280', marginTop: 8, marginBottom: 0 }}>
                Unlock 4K generation, batch mode — create at your own pace
              </p>
            </div>
          </div>

          {/* Plan grid */}
          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}>
              {PLANS.map(plan => {
                const ctaColor = CTA_COLORS[plan.cta.style];
                return (
                  <div
                    key={plan.id}
                    style={{
                      position: 'relative',
                      borderRadius: 24,
                      border: `1px solid ${plan.cardStyle.border}`,
                      backgroundColor: plan.cardStyle.bg,
                      overflow: 'hidden',
                      transition: 'transform 200ms ease-out',
                      cursor: 'default',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>

                      {/* Plan header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 0 }}>
                        <div>
                          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#252525', margin: 0, lineHeight: 1 }}>
                            {plan.name}
                          </h3>
                          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 0 }}>
                            {plan.subtitle}
                          </p>
                        </div>
                        {plan.badge && (
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: plan.badge.color, backgroundColor: plan.badge.bg,
                            borderRadius: 20, padding: '3px 10px',
                            letterSpacing: '0.03em', whiteSpace: 'nowrap',
                          }}>
                            {plan.badge.label}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div style={{ marginTop: 20, marginBottom: 4 }}>
                        {plan.originalPrice && (
                          <span style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'line-through', marginRight: 6 }}>
                            {plan.currency}{plan.originalPrice}
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                          <span style={{ fontSize: 28, color: '#0E1014', position: 'relative', top: -6 }}>
                            {plan.currency}
                          </span>
                          <span style={{ fontSize: 40, fontWeight: 600, lineHeight: 1, color: '#0E1014' }}>
                            {plan.price}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4, marginBottom: 0 }}>
                          {plan.priceSub}
                        </p>
                      </div>

                      {/* Credits */}
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>
                          {plan.creditsLabel}
                        </p>
                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 0 }}>
                          {plan.creditsSub}
                        </p>
                      </div>

                      {/* CTA button */}
                      <button
                        onClick={() => handlePlanClick(plan)}
                        disabled={plan.cta.disabled}
                        style={{
                          width: '100%', height: 44,
                          borderRadius: 14,
                          fontSize: 15, fontWeight: 500,
                          cursor: plan.cta.disabled ? 'default' : 'pointer',
                          backgroundColor: ctaColor.bg,
                          color: ctaColor.color,
                          border: ctaColor.border || 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'opacity 150ms',
                          marginBottom: plan.noAutoRenew ? 6 : 20,
                        }}
                        onMouseEnter={e => { if (!plan.cta.disabled) e.currentTarget.style.opacity = '0.88'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        {plan.cta.label}
                      </button>

                      {/* No auto-renewal note — MeiGen: ✓ gray text-[10px] */}
                      {plan.noAutoRenew && (
                        <p style={{
                          fontSize: 10, color: '#9ca3af', margin: '0 0 14px',
                          display: 'flex', alignItems: 'center', gap: 4,
                          justifyContent: 'center',
                        }}>
                          <Check size={10} style={{ color: '#9ca3af' }} />
                          No auto-renewal
                        </p>
                      )}

                      {/* Divider */}
                      <div style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 16 }} />

                      {/* Feature list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {plan.features.map((feat, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <Check size={14} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 13, color: '#525252', lineHeight: 1.4 }}>{feat}</span>
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
