import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Settings, Clock, Coins, LogOut, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar } from '../../utils/avatarUtils';

const MENU_ITEMS = [
  { icon: Coins,    label: 'Credits',        to: '/credits' },
  { icon: Heart,    label: 'Favorites',      to: '/favorites' },
  { icon: Clock,    label: 'Browse History', to: '/browse-history' },
  { icon: Settings, label: 'Settings',       to: '/settings' },
];

const MobileProfileSheet = ({ open, onClose }) => {
  const { user, isAuthenticated, logout, openLoginModal } = useAuth();
  const navigate = useNavigate();

  const handleNav = (to) => {
    navigate(to);
    onClose();
  };

  const handleSignOut = () => {
    logout();
    onClose();
  };

  const totalCredits = (user?.freeCredits || 0) + (user?.credits || 0);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 9100,
            }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9101,
              background: 'var(--bg-card)',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -12px 48px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Profile header */}
            {isAuthenticated && user ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 20px 16px',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <img
                  src={getUserAvatar(user)}
                  alt={user.username}
                  style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
                {/* Credits badge */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Credits</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>{totalCredits.toLocaleString()}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px 20px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={26} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Sign in to access your profile</p>
                <button
                  onClick={() => { openLoginModal(); onClose(); }}
                  style={{
                    padding: '10px 28px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Menu items */}
            {isAuthenticated && MENU_ITEMS.map(({ icon: Icon, label, to }) => (
              <button
                key={to}
                onClick={() => handleNav(to)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '15px 20px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            ))}

            {/* Sign out */}
            {isAuthenticated && (
              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '15px 20px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 15,
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginTop: 4,
                }}
              >
                <LogOut size={20} style={{ flexShrink: 0 }} />
                <span>Sign Out</span>
              </button>
            )}

            {/* Safe area bottom padding */}
            <div style={{ height: 'max(16px, env(safe-area-inset-bottom))' }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MobileProfileSheet;
