import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Compass, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_TABS = [
  { to: '/gallery',  icon: LayoutGrid, label: 'Gallery' },
  { to: '/explore',  icon: Compass,    label: 'Explore' },
];

const MobileDock = ({ onMeClick }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Me tab is "active" when on any auth-related page
  const meActive = ['/dashboard', '/favorites', '/credits', '/settings', '/browse-history', '/generate-history'].some(
    p => location.pathname.startsWith(p)
  );

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center md:hidden"
      style={{
        gap: 4,
        padding: '8px 16px',
        borderRadius: 9999,
        backgroundColor: 'rgba(10,10,18,0.65)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.05) inset',
      }}
    >
      {NAV_TABS.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to || location.pathname.startsWith(to + '/');
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
              padding: '6px 20px',
              borderRadius: 9999,
              textDecoration: 'none',
              background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
              color: active ? '#c4b5fd' : 'rgba(255,255,255,0.38)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize: 10, lineHeight: 1, fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}

      {/* Me tab — triggers profile bottom sheet */}
      <button
        onClick={onMeClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          padding: '6px 20px',
          borderRadius: 9999,
          border: 'none',
          background: meActive ? 'rgba(124,58,237,0.2)' : 'transparent',
          color: meActive ? '#c4b5fd' : 'rgba(255,255,255,0.38)',
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <User size={22} strokeWidth={meActive ? 2.2 : 1.8} />
        <span style={{ fontSize: 10, lineHeight: 1, fontWeight: meActive ? 600 : 400 }}>Me</span>
      </button>
    </nav>
  );
};

export default MobileDock;
