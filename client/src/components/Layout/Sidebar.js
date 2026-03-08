/**
 * Sidebar — 全局侧边栏壳
 *
 * 结构：
 *   Header  : Logo + 折叠按钮
 *   Nav     : Home / Search / History / Favorites
 *   Panel   : 由各页面通过 useSidebarPanel() 注入；默认 DefaultPanel
 *   Bottom  : 邀请卡（普通页）+ 用户头像 + Credits
 */
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Home, Search, Clock, Heart, ChevronLeft, ChevronRight, Zap, Gift } from 'lucide-react';
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

const Sidebar = () => {
  const { collapsed, toggleCollapsed, SidebarPanel } = useSidebar();
  const { isAuthenticated, user, openSearch, openLoginModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: creditsData } = useQuery(
    ['credits-balance'],
    creditsAPI.getBalance,
    { enabled: isAuthenticated, staleTime: 60_000 }
  );
  const credits = creditsData?.data?.balance ?? 0;

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

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        width: collapsed ? 64 : 240,
        background: 'var(--bg-secondary)',
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
        {/* Invite card — non-filter pages, expanded */}
        {!collapsed && !isFilterPage && (
          <Link to="/dashboard" className="block p-3 rounded-xl no-underline"
                style={{
                  background: `linear-gradient(var(--bg-secondary), var(--bg-secondary)) padding-box,
                               linear-gradient(135deg, #f472b6, #6366f1) border-box`,
                  border: '1px solid transparent',
                }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Share III.PICS</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Invite friends, +200 credits each</p>
              </div>
              <Gift size={16} style={{ color: '#f472b6', flexShrink: 0 }} />
            </div>
          </Link>
        )}

        {/* User row */}
        {isAuthenticated && user ? (
          <div className={`flex items-center gap-2 px-1 ${collapsed ? 'justify-center' : ''}`}>
            <Link to="/dashboard" title="Dashboard">
              <img
                src={getUserAvatar(user)} alt={user.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
                onError={e => { e.target.src = '/Circle/01.png'; }}
              />
            </Link>
            {!collapsed && (
              <Link to="/credits" className="flex items-center gap-1 no-underline"
                    style={{
                      backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)',
                      borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                <Zap size={12} />{credits}
              </Link>
            )}
          </div>
        ) : (
          !collapsed && (
            <button onClick={openLoginModal}
                    className="w-full text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
              Sign In
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
