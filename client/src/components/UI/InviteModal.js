/**
 * InviteModal — 邀请好友弹窗（精确复刻 MeiGen.ai）
 *
 * 实测值：
 * - Dialog: max-w-md (512px), rounded-2xl (18px), p-6, bg white
 * - Close btn: absolute -right-12 top-0, size-9 (36px), rounded-xl, bg rgba(115,115,115,0.5) backdrop-blur
 * - Header card: rounded-xl p-4 bg-muted/30, gradient mesh + animate-pulse overlay
 * - Benefits: space-y-4 mb-6, each gap-3, icon size-5
 * - URL row: p-3 rounded-xl bg-muted/50, border border-border, Link2 icon + input + copy btn
 * - Copy btn: bg #1B1B1B color white rounded-[10px] px-4 h-8 text-sm font-medium
 */
import React, { useState, useEffect } from 'react';
import { X, Zap, Crown, Gift, Link2, Copy, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const InviteModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const inviteUrl = user?.inviteCode
    ? `${window.location.origin}/register?ref=${user.inviteCode}`
    : `${window.location.origin}/register`;

  const usedCount = user?.inviteUsedCount ?? 0;
  const maxCount = 10;

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const BENEFITS = [
    {
      icon: Zap,
      color: '#eab308',
      bg: 'rgba(234,179,8,0.1)',
      title: 'You get +200 credits',
      desc: 'Every time a friend signs up with your link',
    },
    {
      icon: Crown,
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.1)',
      title: 'Friend gets +200 credits',
      desc: 'Bonus credits added instantly on registration',
    },
    {
      icon: Gift,
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.1)',
      title: 'No limit on referrals',
      desc: 'Keep sharing and keep earning credits',
    },
  ];

  return (
    /* Overlay */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      {/* Wrapper for absolute close button */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 512 }}>

        {/* Close button — absolute -right-12 top-0 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 0, right: -48,
            width: 36, height: 36, borderRadius: 12,
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
          <X size={16} />
        </button>

        {/* Dialog */}
        <div
          style={{
            borderRadius: 18,
            backgroundColor: '#fff',
            boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
            padding: 24,
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          {/* Header card — gradient mesh */}
          <div
            style={{
              position: 'relative',
              borderRadius: 14,
              padding: 16,
              backgroundColor: 'rgba(0,0,0,0.03)',
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            {/* Gradient mesh background */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `
                radial-gradient(80% 120% at 90% 10%, rgba(244,114,182,0.25) 0%, transparent 50%),
                radial-gradient(60% 80% at 10% 90%, rgba(99,102,241,0.20) 0%, transparent 45%),
                radial-gradient(50% 100% at 50% 50%, rgba(234,179,8,0.10) 0%, transparent 60%)
              `,
            }} />
            {/* Pulse overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(circle at 70% 30%, rgba(244,114,182,0.15) 0%, transparent 60%)',
              animation: 'pulse 3s ease-in-out infinite',
            }} />

            <div style={{ position: 'relative' }}>
              {/* Gift icon in bordered circle */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.1)',
                backgroundColor: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10,
              }}>
                <Gift size={18} style={{ color: '#f472b6' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>
                Share &amp; Earn Credits
              </h2>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 0 }}>
                Invite friends to III.PICS and both of you earn bonus credits
              </p>
            </div>
          </div>

          {/* Benefits list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {BENEFITS.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: bg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', margin: 0 }}>{title}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Usage count */}
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
            Your link has been used by{' '}
            <strong style={{ color: '#111827' }}>{usedCount}/{maxCount}</strong>{' '}
            friends
          </p>

          {/* URL row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: 12, borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.08)',
            marginBottom: 16,
          }}>
            <Link2 size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <input
              readOnly
              value={inviteUrl}
              style={{
                flex: 1, border: 'none', outline: 'none',
                backgroundColor: 'transparent',
                fontSize: 13, color: '#374151', fontFamily: 'inherit',
                minWidth: 0,
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                flexShrink: 0,
                backgroundColor: copied ? 'rgba(34,197,94,0.9)' : '#1B1B1B',
                color: '#fff',
                borderRadius: 10,
                height: 32, padding: '0 16px',
                fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background-color 150ms',
              }}
              onMouseEnter={e => { if (!copied) e.currentTarget.style.backgroundColor = '#363636'; }}
              onMouseLeave={e => { if (!copied) e.currentTarget.style.backgroundColor = '#1B1B1B'; }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0 }}>
            By sharing, you agree to our{' '}
            <a href="/terms" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms</a>
            {' '}and{' '}
            <a href="/privacy" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
