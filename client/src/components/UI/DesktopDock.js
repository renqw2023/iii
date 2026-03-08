/**
 * DesktopDock — 桌面端底部浮动导航胶囊
 *
 * 仅在桌面端（md+）显示，移动端隐藏（移动端由 MobileDock 负责）。
 * 用于 Layout 路由（顶部 Header 被隐藏时），让用户能在各内容页间跳转。
 *
 * 对标 MeiGen.ai 底部浮动胶囊设计：
 *   ┌──────────────────────────────────────────────┐
 *   │  🏠   ◫   🖼   🎬   ✨                      │
 *   └──────────────────────────────────────────────┘
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Image, Clapperboard, Sparkles } from 'lucide-react';

const DOCK_ITEMS = [
  {
    to: '/',
    icon: Home,
    label: 'Home',
    exact: true,
  },
  {
    to: '/explore',
    icon: Layers,
    label: 'Sref Styles',
    exact: false,
  },
  {
    to: '/gallery',
    icon: Image,
    label: 'AI Gallery',
    exact: false,
  },
  {
    to: '/seedance',
    icon: Clapperboard,
    label: 'Seedance Videos',
    exact: false,
  },
  {
    to: '/img2prompt',
    icon: Sparkles,
    label: 'Image → Prompt',
    exact: false,
  },
];

const DesktopDock = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-1 px-2 py-2"
      style={{
        borderRadius: 18,
        backgroundColor: 'var(--bg-secondary)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {DOCK_ITEMS.map(({ to, icon: Icon, label, exact }) => {
        const active = exact
          ? location.pathname === to
          : location.pathname.startsWith(to);

        return (
          <Link
            key={to}
            to={to}
            title={label}
            className="flex items-center justify-center transition-all duration-150"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: active
                ? 'var(--gallery-filter-active-bg, rgba(99,102,241,0.10))'
                : 'transparent',
              color: active
                ? 'var(--accent-primary, #6366f1)'
                : 'var(--text-tertiary)',
            }}
            onMouseEnter={e => {
              if (!active) e.currentTarget.style.backgroundColor = 'var(--gallery-filter-hover-bg, rgba(0,0,0,0.05))';
            }}
            onMouseLeave={e => {
              if (!active) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
          </Link>
        );
      })}
    </nav>
  );
};

export default DesktopDock;
