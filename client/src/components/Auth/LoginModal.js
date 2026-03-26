import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { X, Mail, Lock, Eye, EyeOff, LogIn, Zap, Send, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const LoginModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { login, loginWithGoogle, loading } = useAuth();
  const [tab, setTab] = useState('password'); // 'password' | 'magic'
  const [form, setForm] = useState({ email: '', password: '' });
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Reset state when reopened
  useEffect(() => {
    if (isOpen) {
      setError('');
      setMagicSent(false);
      setMagicEmail('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError(t('auth.login.emailAndPasswordRequired'));
      return;
    }
    const result = await login({ email: form.email, password: form.password });
    if (result.success) {
      onClose();
    } else {
      setError(result.message || t('auth.loginFailed'));
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    const inviteCode = new URLSearchParams(window.location.search).get('ref')
      || new URLSearchParams(window.location.search).get('invite')
      || '';
    const result = await loginWithGoogle(credentialResponse.credential, inviteCode);
    if (result.success) {
      onClose();
    } else {
      setError(result.message || t('auth.login.googleFailed'));
    }
  };

  const handleGoogleError = () => {
    setError(t('auth.login.googleCancelled'));
  };

  const handleMagicLinkSend = async (e) => {
    e.preventDefault();
    if (!magicEmail) { setError(t('auth.login.magicEmailRequired')); return; }
    setError('');
    setMagicLoading(true);
    try {
      await axios.post('/api/auth/magic-link/request', { email: magicEmail });
      setMagicSent(true);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.login.sendFailed'));
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-sm rounded-2xl shadow-2xl p-8"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mb-5 text-center">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('auth.welcomeBack')}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('auth.login.subtitle')}</p>
            </div>

            {/* Google Login */}
            {GOOGLE_CLIENT_ID && (
              <>
                <div className="flex justify-center mb-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    locale={i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US'}
                    width="280"
                  />
                </div>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('auth.login.or')}</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                </div>
              </>
            )}

            {/* Tabs */}
            <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: '1px solid var(--border-color)' }}>
              {[
                { id: 'password', label: t('auth.login.tabPassword'), icon: Lock },
                { id: 'magic', label: t('auth.login.tabMagic'), icon: Zap },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setError(''); setMagicSent(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: tab === id ? 'var(--accent-primary)' : 'transparent',
                    color: tab === id ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {/* Password login */}
            {tab === 'password' && (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                  <input
                    type="email"
                    name="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-colors"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-tertiary)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}
                >
                  <LogIn size={15} />
                  {loading ? t('auth.login.signingIn') : t('auth.login.signInWithEmail')}
                </button>
              </form>
            )}

            {/* Magic Link */}
            {tab === 'magic' && (
              <>
                {magicSent ? (
                  <div className="text-center py-4">
                    <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
                    <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{t('auth.login.magicSent')}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {t('auth.login.magicSentDesc', { email: magicEmail })}
                    </p>
                    <button
                      onClick={() => setMagicSent(false)}
                      className="mt-4 text-xs underline"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {t('auth.login.resend')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLinkSend} className="space-y-3">
                    <p className="text-xs text-center mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {t('auth.login.magicDesc')}
                    </p>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                      <input
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={magicEmail}
                        onChange={(e) => { setMagicEmail(e.target.value); setError(''); }}
                        autoComplete="email"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                    <button
                      type="submit"
                      disabled={magicLoading}
                      className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity flex items-center justify-center gap-2"
                      style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', opacity: magicLoading ? 0.7 : 1 }}
                    >
                      <Send size={15} />
                      {magicLoading ? t('auth.login.sending') : t('auth.login.sendLoginLink')}
                    </button>
                  </form>
                )}
              </>
            )}

            <div className="mt-4 text-center space-y-1">
              {tab === 'password' && (
                <Link to="/forgot-password" onClick={onClose} className="text-xs block transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                  {t('auth.login.forgot')}
                </Link>
              )}
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('auth.login.noAccount')}{' '}
                <Link to="/register" onClick={onClose} style={{ color: 'var(--accent-primary)' }}>
                  {t('auth.login.signUp')}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
