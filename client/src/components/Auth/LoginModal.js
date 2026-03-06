import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { X, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
  const { login, loginWithGoogle, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // ESC 关闭
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

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('请输入邮箱和密码');
      return;
    }
    const result = await login({ email: form.email, password: form.password });
    if (result.success) {
      onClose();
    } else {
      setError(result.message || '登录失败，请重试');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'Google 登录失败');
    }
  };

  const handleGoogleError = () => {
    setError('Google 登录被取消或失败，请重试');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
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
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="关闭"
            >
              <X size={18} />
            </button>

            {/* Title */}
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                欢迎回来
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                登录以访问您的账户
              </p>
            </div>

            {/* Google Login */}
            <div className="flex justify-center mb-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="continue_with"
                locale="zh-CN"
                width="280"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>或</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="邮箱地址"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="密码"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
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

              {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <LogIn size={15} />
                {loading ? '登录中...' : '使用邮箱登录'}
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-4 text-center space-y-1">
              <Link
                to="/forgot-password"
                onClick={onClose}
                className="text-xs block transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                忘记密码？
              </Link>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                没有账号？{' '}
                <Link
                  to="/register"
                  onClick={onClose}
                  style={{ color: 'var(--accent-primary)' }}
                >
                  立即注册
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
