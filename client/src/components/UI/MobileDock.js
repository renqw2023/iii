import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Compass, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TABS = [
  { to: '/gallery',  icon: LayoutGrid, label: 'Gallery', auth: false },
  { to: '/explore',  icon: Compass, label: 'Explore',  auth: false },
  { to: '/dashboard',icon: User,    label: 'Me',       auth: true  },
];

const MobileDock = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, openLoginModal } = useAuth();

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center md:hidden"
      style={{
        gap: 8,
        padding: '10px 20px',
        borderRadius: 9999,
        backgroundColor: 'rgba(14,14,22,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
      }}
    >
      {TABS.map(({ to, icon: Icon, label, auth }) => {
        const active = location.pathname === to || location.pathname.startsWith(to + '/');

        if (auth && !isAuthenticated) {
          return (
            <button
              key={to}
              onClick={openLoginModal}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '6px 18px',
                borderRadius: 9999,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              <Icon size={22} strokeWidth={1.8} />
              <span style={{ fontSize: 10, lineHeight: 1 }}>{label}</span>
            </button>
          );
        }

        return (
          <Link
            key={to}
            to={to}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '6px 18px',
              borderRadius: 9999,
              textDecoration: 'none',
              background: active ? 'rgba(124,58,237,0.18)' : 'transparent',
              color: active ? '#a78bfa' : 'rgba(255,255,255,0.38)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <Icon
              size={22}
              strokeWidth={1.8}
              fill={active ? 'rgba(124,58,237,0.25)' : 'none'}
            />
            <span style={{ fontSize: 10, lineHeight: 1 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileDock;
