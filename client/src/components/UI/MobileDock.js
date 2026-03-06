import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Clock, Coins, Compass } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DOCK_ITEMS = [
  { to: '/',         icon: Home,    label: '首页',   auth: false },
  { to: '/explore',  icon: Compass, label: '探索',   auth: false },
  { to: '/favorites',icon: Heart,   label: '收藏',   auth: true  },
  { to: '/history',  icon: Clock,   label: '历史',   auth: false },
  { to: '/credits',  icon: Coins,   label: '积分',   auth: true  },
];

const MobileDock = () => {
  const location = useLocation();
  const { isAuthenticated, openLoginModal } = useAuth();

  return (
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 md:hidden"
      style={{
        height: 60,
        borderRadius: 20,
        backgroundColor: 'var(--bg-header, rgba(15,15,25,0.85))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      {DOCK_ITEMS.map(({ to, icon: Icon, label, auth }) => {
        const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
        const handleClick = auth && !isAuthenticated ? openLoginModal : undefined;

        if (auth && !isAuthenticated) {
          return (
            <button
              key={to}
              onClick={handleClick}
              className="flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-2xl transition-all"
              style={{
                minWidth: 52,
                color: 'var(--text-tertiary, rgba(255,255,255,0.35))',
              }}
            >
              <Icon size={20} />
              <span className="text-[10px] leading-none">{label}</span>
            </button>
          );
        }

        return (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-2xl transition-all"
            style={{
              minWidth: 52,
              backgroundColor: active ? 'rgba(99,102,241,0.18)' : 'transparent',
              color: active ? 'var(--accent-primary, #6366f1)' : 'var(--text-tertiary, rgba(255,255,255,0.45))',
            }}
          >
            <Icon size={20} fill={active && to === '/favorites' ? 'currentColor' : 'none'} />
            <span className="text-[10px] leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileDock;
