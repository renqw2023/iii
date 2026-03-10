/**
 * DesktopDock — 桌面端底部浮动导航胶囊（阶段28升级版）
 *
 * 对标 MeiGen.ai：h-16, gap-4, rounded-2xl, shadow-2xl, border-foreground/10
 * img2prompt 改为触发右侧面板（不跳转路由）
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Image, Clapperboard } from 'lucide-react';

// MeiGen 自定义 Sparkles SVG（双星图标）
const SparklesIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.8525 4.21651L11.7221 3.2387C11.6906 3.00226 11.4889 2.82568 11.2504 2.82568C11.0118 2.82568 10.8102 3.00226 10.7786 3.23869L10.6483 4.21651C10.2658 7.0847 8.00939 9.34115 5.14119 9.72358L4.16338 9.85396C3.92694 9.88549 3.75037 10.0872 3.75037 10.3257C3.75037 10.5642 3.92694 10.7659 4.16338 10.7974L5.14119 10.9278C8.00938 11.3102 10.2658 13.5667 10.6483 16.4349L10.7786 17.4127C10.8102 17.6491 11.0118 17.8257 11.2504 17.8257C11.4889 17.8257 11.6906 17.6491 11.7221 17.4127L11.8525 16.4349C12.2349 13.5667 14.4913 11.3102 17.3595 10.9278L18.3374 10.7974C18.5738 10.7659 18.7504 10.5642 18.7504 10.3257C18.7504 10.0872 18.5738 9.88549 18.3374 9.85396L17.3595 9.72358C14.4913 9.34115 12.2349 7.0847 11.8525 4.21651Z"
      stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"
    />
    <path
      d="M4.6519 14.7568L4.82063 14.2084C4.84491 14.1295 4.91781 14.0757 5.00037 14.0757C5.08292 14.0757 5.15582 14.1295 5.1801 14.2084L5.34883 14.7568C5.56525 15.4602 6.11587 16.0108 6.81925 16.2272L7.36762 16.3959C7.44652 16.4202 7.50037 16.4931 7.50037 16.5757C7.50037 16.6582 7.44652 16.7311 7.36762 16.7554L6.81926 16.9241C6.11587 17.1406 5.56525 17.6912 5.34883 18.3946L5.1801 18.9429C5.15582 19.0218 5.08292 19.0757 5.00037 19.0757C4.91781 19.0757 4.84491 19.0218 4.82063 18.9429L4.65191 18.3946C4.43548 17.6912 3.88486 17.1406 3.18147 16.9241L2.63311 16.7554C2.55421 16.7311 2.50037 16.6582 2.50037 16.5757C2.50037 16.4931 2.55421 16.4202 2.63311 16.3959L3.18148 16.2272C3.88486 16.0108 4.43548 15.4602 4.6519 14.7568Z"
      stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"
    />
  </svg>
);

const ROUTE_ITEMS = [
  { to: '/',          icon: Home,        label: 'Home',            exact: true },
  { to: '/explore',   icon: Layers,      label: 'Sref Styles',     exact: false },
  { to: '/gallery',   icon: Image,       label: 'AI Gallery',      exact: false },
  { to: '/seedance',  icon: Clapperboard,label: 'Seedance Videos', exact: false },
];

const DockIcon = ({ active, children, title, onClick, isButton }) => {
  const base = {
    width: 40,
    height: 40,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 150ms, color 150ms',
    backgroundColor: active ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.04)',
    color: active ? 'var(--accent-primary, #6366f1)' : 'var(--text-secondary)',
    border: 'none',
    padding: 0,
  };

  const handleMouseEnter = (e) => {
    if (!active) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)';
  };
  const handleMouseLeave = (e) => {
    if (!active) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
  };

  if (isButton) {
    return (
      <button title={title} style={base} onClick={onClick}
              onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </button>
    );
  }

  return (
    <div title={title} style={base} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  );
};

const DesktopDock = ({ onImg2PromptClick }) => {
  const location = useLocation();

  const isImg2PromptActive = location.pathname.startsWith('/img2prompt');

  return (
    <nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center"
      style={{
        height: 64,
        gap: 8,
        padding: '12px 12px',
        borderRadius: 16,
        backgroundColor: 'var(--bg-primary)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      {ROUTE_ITEMS.map(({ to, icon: Icon, label, exact }) => {
        const active = exact
          ? location.pathname === to
          : location.pathname.startsWith(to);

        return (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <DockIcon active={active} title={label}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            </DockIcon>
          </Link>
        );
      })}

      {/* img2prompt — triggers right panel */}
      <DockIcon
        active={isImg2PromptActive}
        title="Image → Prompt"
        isButton
        onClick={onImg2PromptClick}
      >
        <SparklesIcon
          size={20}
          color={isImg2PromptActive ? 'var(--accent-primary, #6366f1)' : 'var(--text-secondary)'}
          strokeWidth={isImg2PromptActive ? 1.8 : 1.5}
        />
      </DockIcon>

    </nav>
  );
};

export default DesktopDock;
