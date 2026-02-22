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
  Film
} from 'lucide-react';
import NotificationDropdown from '../UI/NotificationDropdown';
import LanguageSwitcher from '../UI/LanguageSwitcher';
import Logo from '../UI/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar } from '../../utils/avatarUtils';

const Header = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
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
    { path: '/gallery', label: 'Gallery', icon: Image },
    { path: '/seedance', label: 'Seedance', icon: Film },
    { path: '/prompts', label: t('nav.prompts'), icon: Lightbulb },
    { path: '/explore', label: t('nav.explore'), icon: Palette },
    ...(isAuthenticated ? [
      { path: '/create', label: t('nav.create'), icon: Palette },
      { path: '/create-prompt', label: t('nav.createPrompt'), icon: Lightbulb },
      { path: '/dashboard', label: t('nav.dashboard'), icon: User },
    ] : [])
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
      <div className="w-full">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Logo size="md" showText={true} linkToHome={true} />

          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive(item.path)
                    ? 'bg-primary-50 text-primary-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 右侧操作区 */}
          <div className="flex items-center space-x-4">
            {/* 语言切换器 */}
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                {/* 通知按钮 */}
                <NotificationDropdown />

                {/* 用户菜单 */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-50 transition-all duration-200"
                  >
                    <img
                      src={getUserAvatar(user)}
                      alt={user?.username || t('navigation.header.userMenu')}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
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
                        className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 py-2"
                      >
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="font-medium text-slate-900">{user?.username}</p>
                          <p className="text-sm text-slate-500">{user?.email}</p>
                        </div>

                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>{t('navigation.header.menu.profile')}</span>
                        </Link>

                        <Link
                          to="/favorites"
                          className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Heart className="w-4 h-4" />
                          <span>{t('navigation.header.menu.favorites')}</span>
                        </Link>

                        <Link
                          to="/settings"
                          className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>{t('navigation.header.menu.settings')}</span>
                        </Link>

                        <hr className="my-2 border-slate-100" />

                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
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

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-slate-100 py-4"
            >
              <nav className="space-y-2 px-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive(item.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
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