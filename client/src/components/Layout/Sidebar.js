/**
 * Sidebar — 全局侧边栏壳
 *
 * 结构：
 *   Header  : Logo + 折叠按钮
 *   Nav     : Home / Search / History / Favorites
 *   Panel   : 由各页面通过 useSidebarPanel() 注入；默认 DefaultPanel
 *   Bottom  : 邀请卡（普通页）+ 用户头像 + Credits
 */
import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import {
  Home, Search, Clock, Heart, ChevronLeft, ChevronRight, Zap, Gift,
  LayoutDashboard, Settings, LogOut, Languages, BookOpenText,
} from 'lucide-react';
import Logo from '../UI/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { getUserAvatar } from '../../utils/avatarUtils';
import { creditsAPI } from '../../services/creditsApi';
import DefaultPanel from '../Sidebar/DefaultPanel';

const navItemClass = (active) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 text-sm font-medium select-none
   ${active
     ? 'bg-[var(--gallery-filter-active-bg,#f1f5f9)] text-[var(--text-primary)]'
     : 'text-[var(--text-secondary)] hover:bg-[var(--gallery-filter-hover-bg,#f8fafc)] hover:text-[var(--text-primary)]'
   }`;

/* ── 积分 Hover 明细卡片组件 ── */
const CreditsHoverArea = ({ credits: data, onAddCredits }) => {
  const [cardPos, setCardPos] = useState(null);
  const triggerRef = useRef(null);
  const hideTimer  = useRef(null);

  const freeCredits = data?.freeCredits ?? 0;
  const paidCredits = data?.credits ?? 0;
  const dailyFree   = data?.dailyFreeAmount ?? 40;
  const total       = freeCredits + paidCredits;

  const freeUsed    = dailyFree - freeCredits;
  const freeUsedPct = Math.round((freeUsed / dailyFree) * 100);
  const freeLeftPct = Math.round((freeCredits / dailyFree) * 100);

  const show = () => {
    clearTimeout(hideTimer.current);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCardPos({ bottom: window.innerHeight - rect.top + 8, left: 8 });
    }
  };
  const hide = () => {
    hideTimer.current = setTimeout(() => setCardPos(null), 120);
  };

  return (
    <div onMouseEnter={show} onMouseLeave={hide}>
      {/* Trigger: Add Credits pill */}
      <button
        ref={triggerRef}
        onClick={onAddCredits}
        className="flex items-center gap-2 transition-colors duration-150"
        style={{
          backgroundColor: '#1B1B1B', color: '#fff',
          borderRadius: 8, height: 28, paddingLeft: 12, paddingRight: 4,
          fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
          cursor: 'pointer', border: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#363636'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1B1B1B'; }}
      >
        <span>Add Credits</span>
        <div className="flex items-center gap-1"
             style={{ backgroundColor: '#262626', borderRadius: 5, height: 22, padding: '0 8px' }}>
          <Zap size={10} style={{ color: '#FFDBA4' }} />
          <span style={{ fontSize: 12 }}>{total}</span>
        </div>
      </button>

      {/* Hover 明细卡片 — position:fixed 脱离 overflow:hidden 父容器 */}
      {cardPos && (
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          style={{
          position: 'fixed',
          bottom: cardPos.bottom,
          left: cardPos.left,
          zIndex: 9999,
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          padding: '14px 16px',
          width: 224,
          fontSize: 13,
        }}>
          {/* 顶行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, color: '#111', fontSize: 14 }}>Free</span>
            <button
              onClick={onAddCredits}
              style={{
                fontSize: 12, fontWeight: 600, color: '#fff',
                background: '#1B1B1B', borderRadius: 8, padding: '3px 12px',
                border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#363636'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1B1B1B'; }}
            >Upgrade</button>
          </div>

          {/* Credits 行 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#374151' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M11.85 4.22L11.72 3.24C11.69 3 11.49 2.83 11.25 2.83C11.01 2.83 10.81 3 10.78 3.24L10.65 4.22C10.27 7.08 8.01 9.34 5.14 9.72L4.16 9.85C3.93 9.89 3.75 10.09 3.75 10.33C3.75 10.56 3.93 10.77 4.16 10.8L5.14 10.93C8.01 11.31 10.27 13.57 10.65 16.43L10.78 17.41C10.81 17.65 11.01 17.83 11.25 17.83C11.49 17.83 11.69 17.65 11.72 17.41L11.85 16.43C12.23 13.57 14.49 11.31 17.36 10.93L18.34 10.8C18.57 10.77 18.75 10.56 18.75 10.33C18.75 10.09 18.57 9.89 18.34 9.85L17.36 9.72C14.49 9.34 12.23 7.08 11.85 4.22Z" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              Credits
            </span>
            <strong style={{ color: '#111' }}>{paidCredits}</strong>
          </div>

          {/* Free Daily Credits 行 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#374151' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15 }}>↺</span>
              Free Daily Credits
            </span>
            <strong style={{ color: '#111' }}>{freeCredits}/{dailyFree}</strong>
          </div>

          {/* 进度条 */}
          <div style={{ height: 6, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden', marginBottom: 8 }}>
            {freeUsedPct > 0 && (
              <div style={{ width: `${freeUsedPct}%`, height: '100%', background: '#6366f1', float: 'left',
                            borderRadius: freeLeftPct === 0 ? 99 : '99px 0 0 99px' }} />
            )}
            {freeLeftPct > 0 && (
              <div style={{ width: `${freeLeftPct}%`, height: '100%', background: '#fbbf24', float: 'left',
                            borderRadius: freeUsedPct === 0 ? 99 : '0 99px 99px 0' }} />
            )}
          </div>

          {/* 说明 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 11 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
            Daily credits used first
          </div>
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ onCreditsClick, onInviteClick }) => {
  const { collapsed, toggleCollapsed, SidebarPanel } = useSidebar();
  const { isAuthenticated, user, openSearch, openLoginModal, logout } = useAuth();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!avatarOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [avatarOpen]);

  const { data: creditsData } = useQuery(
    ['credits-balance'],
    () => creditsAPI.getBalance().then(r => r.data.data),
    { enabled: isAuthenticated, staleTime: 60_000 }
  );
  // 总可用积分 = 每日免费额度 + 永久积分
  const credits = (creditsData?.freeCredits ?? 0) + (creditsData?.credits ?? 0);

  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleFavorites = () => {
    if (!isAuthenticated) openLoginModal(); else navigate('/favorites');
  };

  // filter 页（有专属 Panel）不显示邀请卡，避免空间拥挤
  const isFilterPage = ['/explore', '/gallery', '/seedance'].some(p =>
    location.pathname.startsWith(p)
  );

  const Panel = SidebarPanel || DefaultPanel;
  const languageOptions = [
    { value: 'zh-CN', label: t('language.zh-CN', '简体中文') },
    { value: 'en-US', label: t('language.en-US', 'English') },
    { value: 'ja-JP', label: t('language.ja-JP', '日本語') },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-visible"
      style={{
        width: collapsed ? 64 : 264,
        background: 'rgba(255, 255, 255, 0.5)',
        borderRight: '1px solid var(--border-color)',
        transition: 'width 0.25s ease',
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-4 flex-shrink-0" style={{ minHeight: 60 }}>
        {!collapsed && <div className="overflow-hidden"><Logo size="sm" showText /></div>}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex-shrink-0 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--gallery-filter-hover-bg,#f1f5f9)] transition-colors"
          style={{ marginLeft: collapsed ? 'auto' : 0, marginRight: collapsed ? 'auto' : 0 }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ── Scrollable area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2" style={{ scrollbarWidth: 'thin' }}>

        {/* Nav items */}
        <nav className="space-y-0.5 mb-4">
          <Link to="/" title={collapsed ? 'Home' : undefined} className={navItemClass(isActive('/', true))}>
            <Home size={18} className="flex-shrink-0" />
            {!collapsed && <span>Home</span>}
          </Link>

          <div title={collapsed ? 'Search' : undefined} className={navItemClass(false)} onClick={openSearch}>
            <Search size={18} className="flex-shrink-0" />
            {!collapsed && <span>Search</span>}
          </div>

          <Link to="/history" title={collapsed ? 'History' : undefined} className={navItemClass(isActive('/history'))}>
            <Clock size={18} className="flex-shrink-0" />
            {!collapsed && <span>History</span>}
          </Link>

          <div title={collapsed ? 'Favorites' : undefined} className={navItemClass(isActive('/favorites'))} onClick={handleFavorites}>
            <Heart size={18} className="flex-shrink-0" />
            {!collapsed && <span>Favorites</span>}
          </div>
        </nav>

        {/* Page-specific Panel (expanded only) */}
        {!collapsed && <Panel />}
      </div>

      {/* ── Bottom ── */}
      <div className="flex-shrink-0 px-2 pb-3 space-y-2">
        {/* Invite card — expanded only */}
        {!collapsed && (
          <button
            onClick={onInviteClick}
            className="block w-full p-3 rounded-xl text-left cursor-pointer"
            style={{
              background: `linear-gradient(var(--bg-secondary), var(--bg-secondary)) padding-box,
                           linear-gradient(135deg, #f472b6, #6366f1) border-box`,
              border: '1px solid transparent',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Share III.PICS</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Invite friends, +200 credits each</p>
              </div>
              <Gift size={16} style={{ color: '#f472b6', flexShrink: 0 }} />
            </div>
          </button>
        )}

        {/* User row */}
        {isAuthenticated && user ? (
          <div className={`flex items-center gap-2 px-1 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {/* Avatar dropdown trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAvatarOpen(v => !v)}
                title="Account"
                className="flex items-center justify-center transition-colors duration-200"
                style={{
                  width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                  backgroundColor: avatarOpen ? 'rgba(0,0,0,0.06)' : 'transparent',
                }}
                onMouseEnter={e => { if (!avatarOpen) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { if (!avatarOpen) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {/* Avatar: image with dark fallback letter (MeiGen style) */}
                <div className="relative flex-shrink-0 overflow-hidden rounded-full"
                     style={{ width: 28, height: 28, backgroundColor: '#1B1B1B' }}>
                  <img
                    src={getUserAvatar(user)} alt=""
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-white font-medium"
                        style={{ fontSize: 12 }}>
                    {(user.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              </button>

              {/* Dropdown — exact MeiGen values */}
              {avatarOpen && (
                <div
                  className="absolute bottom-full mb-2 left-0 z-[200]"
                  style={{
                    width: 236,
                    borderRadius: 16,
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)',
                    padding: 8,
                    animation: 'fadeInUp 0.15s ease-out',
                  }}
                >
                  {/* User header: avatar h-9 w-9 + name + email */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px' }}>
                    <div className="relative flex-shrink-0 overflow-hidden rounded-full flex items-center justify-center"
                         style={{ width: 36, height: 36, backgroundColor: '#1B1B1B' }}>
                      <img src={getUserAvatar(user)} alt="" className="absolute inset-0 w-full h-full object-cover"
                           onError={e => { e.target.style.display = 'none'; }} />
                      <span className="text-white font-medium" style={{ fontSize: 13, position: 'relative' }}>
                        {(user.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.username}
                      </p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Separator */}
                  <div style={{ height: 1, backgroundColor: '#e5e7eb', margin: '4px -8px' }} />

                  {/* Menu items — MeiGen: gap-3 rounded-lg px-3 py-1.5 text-[13px] */}
                  {[
                    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
                    { icon: Settings,        label: 'Settings',  to: '/settings' },
                    { icon: Clock,           label: 'History',   to: '/history' },
                    { icon: Heart,           label: 'Favorites', to: '/favorites' },
                    { icon: BookOpenText,    label: 'Docs',      to: '/docs' },
                  ].map(({ icon: Icon, label, to }) => (
                    <Link
                      key={to} to={to}
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center no-underline transition-colors duration-100"
                      style={{ gap: 12, padding: '6px 12px', fontSize: 13, color: '#1B1B1B',
                               borderRadius: 10, display: 'flex', textDecoration: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <Icon size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{label}</span>
                    </Link>
                  ))}

                  <div
                    className="flex flex-col"
                    style={{
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: 10,
                      color: '#1B1B1B',
                    }}
                  >
                    <div
                      className="flex items-center"
                      style={{ gap: 12 }}
                    >
                      <Languages size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>{t('language.select', 'Select language')}</span>
                    </div>
                    <select
                      value={i18n.language}
                      onChange={(e) => i18n.changeLanguage(e.target.value)}
                      aria-label={t('language.select', 'Select language')}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        backgroundColor: '#f8fafc',
                        color: '#111827',
                        fontSize: 12,
                        padding: '6px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      {languageOptions.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Separator */}
                  <div style={{ height: 1, backgroundColor: '#e5e7eb', margin: '4px -8px' }} />

                  {/* Sign out */}
                  <button
                    onClick={() => { setAvatarOpen(false); logout(); navigate('/'); }}
                    className="flex items-center w-full transition-colors duration-100"
                    style={{ gap: 12, padding: '6px 12px', fontSize: 13, color: '#ef4444',
                             borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.07)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <LogOut size={16} style={{ flexShrink: 0 }} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Credits button + hover 明细卡片 */}
            {!collapsed && (
              <CreditsHoverArea
                credits={creditsData}
                onAddCredits={onCreditsClick}
              />
            )}
          </div>
        ) : (
          !collapsed && (
            <button onClick={openLoginModal}
                    className="w-full text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    style={{ backgroundColor: '#1B1B1B', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Sign In
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
