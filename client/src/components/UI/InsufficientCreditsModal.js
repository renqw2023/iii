import React from 'react';
import { X, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const PLANS = [
  { id: 'starter',  name: 'Starter',  price: 9.99,  credits: 1000 },
  { id: 'pro',      name: 'Pro',      price: 19.99, credits: 2200 },
  { id: 'ultimate', name: 'Ultimate', price: 49.99, credits: 6000 },
];

const InsufficientCreditsModal = ({ open, onClose, currentModel, freeCredits = 0, paidCredits = 0 }) => {
  const totalAvail = freeCredits + paidCredits;
  const cost = currentModel?.creditCost ?? 0;
  const shortfall = Math.max(0, cost - totalAvail);

  const handleBuy = async (planId) => {
    try {
      const res = await axios.post('/api/payments/create-checkout', { planId }, { headers: getAuthHeaders() });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start checkout');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              position: 'fixed', top: '50%', left: '50%', zIndex: 10000,
              transform: 'translate(-50%, -50%)',
              width: 380, maxWidth: 'calc(100vw - 32px)',
              borderRadius: 20, overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              padding: '20px 24px 16px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: 'rgba(245,158,11,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertTriangle size={18} style={{ color: '#d97706' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#78350f' }}>Not enough credits</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>Top up to continue generating</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', padding: 2 }}>
                <X size={16} />
              </button>
            </div>

            {/* Balance info */}
            <div style={{ padding: '16px 24px 12px' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8, marginBottom: 12,
              }}>
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Free daily</p>
                  <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: '#374151' }}>{freeCredits}</p>
                </div>
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Permanent</p>
                  <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: '#374151' }}>{paidCredits}</p>
                </div>
                <div style={{ backgroundColor: '#fef2f2', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Need more</p>
                  <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>+{shortfall}</p>
                </div>
              </div>

              {currentModel && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: '#f5f3ff', borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    Cost for <strong style={{ color: '#374151' }}>{currentModel.name}</strong>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={13} style={{ color: '#f59e0b' }} fill="#f59e0b" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}>{cost}</span>
                  </div>
                </div>
              )}

              {/* Plan cards */}
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Add Credits
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => handleBuy(plan.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 14px', borderRadius: 12,
                      border: '1.5px solid #e5e7eb',
                      backgroundColor: '#fafafa', cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#6366f1';
                      e.currentTarget.style.backgroundColor = '#f5f3ff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{plan.name}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9ca3af' }}>
                        <Zap size={10} style={{ color: '#f59e0b', verticalAlign: 'middle' }} fill="#f59e0b" />
                        {' '}{plan.credits.toLocaleString()} credits
                      </p>
                    </div>
                    <span style={{
                      fontSize: 15, fontWeight: 700, color: '#fff',
                      backgroundColor: '#4f46e5', borderRadius: 8, padding: '4px 12px',
                    }}>
                      ${plan.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '8px 24px 20px', textAlign: 'center' }}>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9ca3af' }}
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InsufficientCreditsModal;
