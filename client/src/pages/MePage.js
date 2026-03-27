import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Heart, Clock, Settings, LogOut, ChevronRight, User, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserAvatar } from '../utils/avatarUtils';

const MENU_ITEMS = [
  { icon: Coins,     label: 'Credits',          to: '/credits' },
  { icon: Heart,     label: 'Favorites',        to: '/favorites' },
  { icon: Clock,     label: 'Browse History',   to: '/browse-history' },
  { icon: History,   label: 'Generate History', to: '/generate-history' },
  { icon: Settings,  label: 'Settings',         to: '/settings' },
];

const MePage = () => {
  const { user, isAuthenticated, logout, openLoginModal } = useAuth();
  const navigate = useNavigate();

  const totalCredits = (user?.freeCredits || 0) + (user?.credits || 0);

  const handleSignOut = () => {
    logout();
    navigate('/gallery');
  };

  return (
    <div style={{
      minHeight: '100svh',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      background: 'var(--page-bg)',
      color: 'var(--text-primary)',
    }}>
      {isAuthenticated && user ? (
        <>
          {/* Profile header */}
          <div style={{
            background: 'linear-gradient(160deg, rgba(124,58,237,0.2) 0%, rgba(79,70,229,0.1) 60%, transparent 100%)',
            padding: '52px 20px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid var(--border-color)',
          }}>
            <img
              src={getUserAvatar(user)}
              alt={user.username}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(124,58,237,0.35)',
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>{user.username}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{user.email}</div>
            </div>
            <div style={{
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 20,
              padding: '6px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Coins size={14} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa' }}>
                {totalCredits.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>credits</span>
            </div>
          </div>

          {/* Menu list */}
          <div style={{ marginTop: 8 }}>
            {MENU_ITEMS.map(({ icon: Icon, label, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 20px',
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
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 20px',
              width: '100%',
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: 15,
              cursor: 'pointer',
              textAlign: 'left',
              marginTop: 8,
            }}
          >
            <LogOut size={20} style={{ flexShrink: 0 }} />
            <span>Sign Out</span>
          </button>
        </>
      ) : (
        /* Guest state */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '80px 24px 40px',
          gap: 16,
        }}>
          <div style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={36} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Sign in to your account</div>
            <div style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 6 }}>
              Access favorites, credits, history and more
            </div>
          </div>
          <button
            onClick={openLoginModal}
            style={{
              padding: '12px 36px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff',
              border: 'none',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default MePage;
