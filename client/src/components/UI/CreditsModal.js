/**
 * CreditsModal — 积分购买定价弹窗（阶段28）
 *
 * 对标 MeiGen.ai 定价 Modal：
 * - rounded-3xl 全屏 Modal，max-w-[1200px]
 * - 关闭按钮：absolute -right-14 毛玻璃圆角
 * - 渐变 mesh header
 * - 4套餐卡片（Free/Starter/Pro/Ultimate），hover:-translate-y-1
 */
import React, { useEffect } from 'react';
import { X, Check, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    subtitle: '免费开始',
    price: 0,
    priceLabel: '¥0',
    priceSub: '无需信用卡',
    credits: '每日 40 积分',
    creditsSub: '每日刷新',
    ctaLabel: '当前套餐',
    ctaDisabled: true,
    features: [
      '每日刷新 40 积分',
      '最多生成 20 张图片',
      '标准分辨率',
      '社区访问权',
    ],
    cardBg: '#F9F9F9',
    cardBgDark: 'rgba(255,255,255,0.04)',
    cardBorder: '#E3E3E3',
  },
  {
    id: 'starter',
    name: 'Starter',
    subtitle: '轻量创作',
    price: 79,
    priceLabel: '¥79',
    priceSub: '一次性付款',
    credits: '1,000 积分',
    creditsSub: '永不过期',
    ctaLabel: '选 Starter',
    ctaDisabled: false,
    features: [
      '1,000 积分礼包',
      '无限浏览历史',
      '收藏夹功能',
      '优先客服支持',
    ],
    cardBg: '#F9F9F9',
    cardBgDark: 'rgba(255,255,255,0.04)',
    cardBorder: '#E3E3E3',
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: '专业创作',
    price: 159,
    priceLabel: '¥159',
    priceSub: '一次性付款',
    credits: '2,200 积分',
    creditsSub: '永不过期',
    ctaLabel: '选 Pro',
    ctaDisabled: false,
    featured: true,
    features: [
      '2,200 积分礼包',
      '优先生成队列',
      '批量操作模式',
      '高清导出',
      '优先客服支持',
    ],
    cardBg: 'linear-gradient(135deg, #f0f0ff 0%, #f9f0ff 100%)',
    cardBgDark: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 100%)',
    cardBorder: '#c4b5fd',
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    subtitle: '旗舰全能',
    price: 399,
    priceLabel: '¥399',
    priceSub: '一次性付款',
    credits: '5,000 积分',
    creditsSub: '永不过期',
    ctaLabel: '选 Ultimate',
    ctaDisabled: false,
    features: [
      '5,000 积分礼包',
      '优先生成队列',
      '批量操作模式',
      '4K 超清生成',
      '专属客服通道',
      '新功能抢先体验',
    ],
    cardBg: '#F9F9F9',
    cardBgDark: 'rgba(255,255,255,0.04)',
    cardBorder: '#E3E3E3',
  },
];

const CreditsModal = ({ open, onClose }) => {
  const { isAuthenticated, openLoginModal } = useAuth();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const handlePlanClick = (plan) => {
    if (plan.ctaDisabled) return;
    if (!isAuthenticated) { onClose(); openLoginModal(); return; }
    // TODO: 接入 Stripe checkout
    window.location.href = `/credits?plan=${plan.id}`;
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Dialog */}
      <div
        className="relative w-full overflow-visible"
        style={{
          maxWidth: 1200,
          maxHeight: '90vh',
          borderRadius: 24,
          backgroundColor: 'var(--bg-primary)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease-out',
        }}
      >
        {/* Close button — outside the card */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors duration-150"
          style={{
            top: 0, right: -56,
            width: 40, height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(100,100,100,0.5)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(100,100,100,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(100,100,100,0.5)'; }}
        >
          <X size={18} />
        </button>

        {/* Scrollable content */}
        <div style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ padding: 24 }}>

            {/* Header with gradient mesh */}
            <div className="relative overflow-hidden"
                 style={{ borderRadius: 12, padding: '28px 24px', backgroundColor: 'var(--bg-secondary)', marginBottom: 20 }}>
              <div className="absolute inset-0" style={{
                background: `
                  radial-gradient(80% 120% at 95% 20%, rgba(184,112,255,0.18) 0%, transparent 50%),
                  radial-gradient(60% 80% at 75% 80%, rgba(255,166,77,0.15) 0%, transparent 45%),
                  radial-gradient(50% 100% at 85% 50%, rgba(41,130,255,0.12) 0%, transparent 40%)
                `,
                pointerEvents: 'none',
              }} />
              <div className="relative text-center">
                <h2 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  解锁更多积分
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0 }}>
                  一次付款永久有效，按你的节奏创作精美 AI 图像
                </p>
              </div>
            </div>

            {/* Plan grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}>
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className="relative overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1"
                  style={{
                    borderRadius: 20,
                    border: `1px solid ${plan.cardBorder}`,
                    background: plan.cardBg,
                    padding: 24,
                  }}
                >
                  {/* Featured badge */}
                  {plan.featured && (
                    <div className="absolute top-4 right-4"
                         style={{
                           backgroundColor: '#6366f1',
                           color: '#fff',
                           fontSize: 11,
                           fontWeight: 700,
                           borderRadius: 20,
                           padding: '2px 10px',
                           letterSpacing: '0.05em',
                         }}>
                      推荐
                    </div>
                  )}

                  {/* Plan name */}
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {plan.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{plan.subtitle}</p>

                  {/* Price */}
                  <div style={{ marginTop: 20, marginBottom: 4 }}>
                    <div className="flex items-baseline gap-1">
                      <span style={{ fontSize: 14, color: 'var(--text-primary)', position: 'relative', top: -4 }}>¥</span>
                      <span style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>
                        {plan.price}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{plan.priceSub}</p>
                  </div>

                  {/* Credits */}
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {plan.credits}
                    </span>
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{plan.creditsSub}</p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handlePlanClick(plan)}
                    disabled={plan.ctaDisabled}
                    className="w-full flex items-center justify-center transition-all duration-150"
                    style={{
                      height: 44,
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 20,
                      cursor: plan.ctaDisabled ? 'default' : 'pointer',
                      border: plan.ctaDisabled ? '1px solid #E3E3E3' : 'none',
                      backgroundColor: plan.ctaDisabled ? 'transparent'
                        : plan.featured ? '#6366f1'
                        : 'var(--text-primary)',
                      color: plan.ctaDisabled ? '#999'
                        : '#fff',
                    }}
                  >
                    {plan.ctaDisabled ? (
                      plan.ctaLabel
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap size={14} />
                        {plan.ctaLabel}
                      </span>
                    )}
                  </button>

                  {/* Features */}
                  <div className="flex flex-col gap-2">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-center" style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 20 }}>
              积分永不过期 · 安全支付 · 随时可用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsModal;
