import React from 'react';
import { CheckCircle, Coins, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PurchaseSuccessModal = ({ open, onClose, creditsAdded = 0, newBalance = 0 }) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              backgroundColor: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Flex centering wrapper — keeps framer-motion transform free for animation */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{
                width: 360, maxWidth: 'calc(100vw - 32px)',
                borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
                pointerEvents: 'auto',
              }}
            >
              {/* Gradient header */}
              <div style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #9333ea 100%)',
                padding: '36px 32px 28px',
                textAlign: 'center',
                position: 'relative',
              }}>
                <button
                  onClick={onClose}
                  style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 28, height: 28, borderRadius: 8,
                    border: 'none', backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={15} />
                </button>

                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ marginBottom: 16 }}
                >
                  <CheckCircle size={56} color="#fff" strokeWidth={1.5} />
                </motion.div>

                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>
                  Payment Successful
                </p>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                  +{creditsAdded.toLocaleString()}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                  credits added to your account
                </p>
              </div>

              {/* Body */}
              <div style={{ backgroundColor: '#fff', padding: '24px 32px 28px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: '#f5f3ff', borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Coins size={18} style={{ color: '#7c3aed' }} />
                    <span style={{ fontSize: 14, color: '#6b7280' }}>New balance</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#4f46e5' }}>
                    {newBalance.toLocaleString()} credits
                  </span>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    display: 'block', width: '100%', padding: '13px',
                    borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#fff', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', marginBottom: 10,
                  }}
                >
                  Start Creating →
                </button>

                <Link
                  to="/orders"
                  onClick={onClose}
                  style={{
                    display: 'block', textAlign: 'center',
                    fontSize: 13, color: '#9ca3af', textDecoration: 'none',
                  }}
                >
                  View Order History →
                </Link>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PurchaseSuccessModal;
