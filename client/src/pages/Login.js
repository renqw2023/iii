import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await login(formData);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      // 处理不同类型的错误
      switch (result.error) {
        case 'EMAIL_NOT_VERIFIED':
          // 如果邮箱未验证，跳转到验证页面
          setTimeout(() => {
            navigate('/verify-email', { 
              state: { 
                userId: result.data?.userId, 
                email: formData.email 
              },
              replace: true 
            });
          }, 2000); // 延迟跳转，让用户看到错误提示
          break;
          
        case 'INVALID_CREDENTIALS':
          // 密码错误时，清空密码字段并聚焦
          setFormData(prev => ({ ...prev, password: '' }));
          setTimeout(() => {
            document.getElementById('password')?.focus();
          }, 100);
          break;
          
        case 'ACCOUNT_LOCKED':
          // 账户锁定时，显示联系支持的选项
          setErrors({ 
            email: t('auth.accountLocked') 
          });
          break;
          
        case 'NETWORK_ERROR':
          // 网络错误时，不需要额外处理，Toast已经显示了重试按钮
          break;
          
        default:
          // 其他错误，显示通用错误信息
          setErrors({ 
            email: result.message || t('auth.loginFailed') 
          });
          break;
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Sparkles className="w-12 h-12 text-primary-500" />
              <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-lg"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold gradient-text">
            {t('auth.welcomeBack')}
          </h2>
          <p className="mt-2 text-slate-600">
            {t('auth.loginSubtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card p-8"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input pl-10 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder={t('auth.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  {t('auth.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
                >
                  {t('auth.forgotPassword.title')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-base font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t('auth.loggingIn')}
                </div>
              ) : (
                t('auth.login.submit')
              )}
            </button>

            <div className="text-center">
              <span className="text-slate-600">{t('auth.noAccount')}</span>
              <Link
                to="/register"
                className="ml-1 font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                {t('auth.register.title')}
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;