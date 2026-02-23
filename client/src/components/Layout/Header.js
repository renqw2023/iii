import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Heart,
  Lightbulb,
  Palette,
  Image,
  Film,
  Sun,
  Moon
} from 'lucide-react';
import NotificationDropdown from '../UI/NotificationDropdown';
import LanguageSwitcher from '../UI/LanguageSwitcher';
import Logo from '../UI/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserAvatar } from '../../utils/avatarUtils';

const Header = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: t('nav.home'), icon: null },
    { path: '/gallery', label: t('nav.gallery', 'Gallery'), icon: Image },
    { path: '/seedance', label: t('nav.seedance', 'Seedance'), icon: Film },
    { path: '/prompts', label: t('nav.prompts'), icon: Lightbulb },
    { path: '/explore', label: t('nav.explore'), icon: Palette },
    ...(isAuthenticated ? [
      { path: '/create', label: t('nav.create'), icon: Palette },
      { path: '/create-prompt', label: t('nav.createPrompt'), icon: Lightbulb },
      { path: '/dashboard', label: t('nav.dashboard'), icon: User },
    ] : [])
  ];

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b shadow-sm"
      style={{
        backgroundColor: 'var(--bg-header)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="w-full">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Logo size="md" showText={true} linkToHome={true} />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  style={{
                    color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive(item.path) ? 'var(--gallery-filter-active-bg)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Language switcher */}
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationDropdown />

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 p-1 rounded-lg transition-all duration-200"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <img
                      src={getUserAvatar(user)}
                      alt={user?.username || t('navigation.header.userMenu')}
                      className="w-8 h-8 rounded-full object-cover border-2 shadow-sm"
                      style={{ borderColor: 'var(--border-color)' }}
                      onError={(e) => {
                        e.target.src = '/Circle/01.png';
                      }}
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 backdrop-blur-md rounded-xl shadow-lg py-2"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
                          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
                        </div>

                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-2 px-4 py-2 transition-colors duration-200"
                          style={{ color: 'var(--text-secondary)' }}
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>{t('navigation.header.menu.profile')}</span>
                        </Link>

                        <Link
                          to="/favorites"
                          className="flex items-center space-x-2 px-4 py-2 transition-colors duration-200"
                          style={{ color: 'var(--text-secondary)' }}
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Heart className="w-4 h-4" />
                          <span>{t('navigation.header.menu.favorites')}</span>
                        </Link>

                        <Link
                          to="/settings"
                          className="flex items-center space-x-2 px-4 py-2 transition-colors duration-200"
                          style={{ color: 'var(--text-secondary)' }}
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>{t('navigation.header.menu.settings')}</span>
                        </Link>

                        <hr style={{ margin: '0.5rem 0', borderColor: 'var(--border-color)' }} />

                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-red-500 hover:bg-red-500/10 transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('navigation.logout')}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="btn btn-ghost"
                >
                  {t('navigation.login')}
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  {t('navigation.register')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden py-4"
              style={{ borderTop: '1px solid var(--border-color)' }}
            >
              <nav className="space-y-2 px-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200"
                      style={{
                        color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        backgroundColor: isActive(item.path) ? 'var(--gallery-filter-active-bg)' : 'transparent',
                      }}
                    >
                      {Icon && <Icon className="w-5 h-5" />}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;