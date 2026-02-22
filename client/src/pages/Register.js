import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { enhancedAuthAPI } from '../services/enhancedApi';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [validationStatus, setValidationStatus] = useState({
    username: { checking: false, valid: null, message: '' },
    email: { checking: false, valid: null, message: '' },
    password: { valid: null, message: '' },
    confirmPassword: { valid: null, message: '' }
  });
  const [debounceTimers, setDebounceTimers] = useState({});

  const { register, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 清理定时器
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
    };
  }, [debounceTimers]);

  // 防抖检查用户名
  const debouncedCheckUsername = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setValidationStatus(prev => ({
        ...prev,
        username: { checking: false, valid: false, message: t('validation.username.minLength') }
      }));
      return;
    }

    if (username.length > 20) {
      setValidationStatus(prev => ({
        ...prev,
        username: { checking: false, valid: false, message: t('validation.username.maxLength') }
      }));
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setValidationStatus(prev => ({
        ...prev,
        username: { checking: false, valid: false, message: t('validation.username.format') }
      }));
      return;
    }

    setValidationStatus(prev => ({
      ...prev,
      username: { checking: true, valid: null, message: t('validation.checking') }
    }));

    try {
      const response = await enhancedAuthAPI.checkUsername(username);
      setValidationStatus(prev => ({
        ...prev,
        username: {
          checking: false,
          valid: response.data.available,
          message: response.data.message
        }
      }));
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        username: {
          checking: false,
          valid: false,
          message: error.response?.data?.message || t('validation.username.checkFailed')
        }
      }));
    }
  }, [t]);

  // 防抖检查邮箱
  const debouncedCheckEmail = useCallback(async (email) => {
    if (!email) {
      setValidationStatus(prev => ({
        ...prev,
        email: { checking: false, valid: false, message: t('validation.email.required') }
      }));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationStatus(prev => ({
        ...prev,
        email: { checking: false, valid: false, message: t('validation.email.invalid') }
      }));
      return;
    }

    setValidationStatus(prev => ({
      ...prev,
      email: { checking: true, valid: null, message: t('validation.checking') }
    }));

    try {
      const response = await enhancedAuthAPI.checkEmail(email);
      setValidationStatus(prev => ({
        ...prev,
        email: {
          checking: false,
          valid: response.data.available,
          message: response.data.message
        }
      }));
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        email: {
          checking: false,
          valid: false,
          message: error.response?.data?.message || t('validation.email.checkFailed')
        }
      }));
    }
  }, [t]);

  // 验证密码
  const validatePassword = useCallback((password) => {
    if (!password) {
      return { valid: false, message: t('validation.password.required') };
    }
    if (password.length < 6) {
      return { valid: false, message: t('validation.password.minLength') };
    }
    return { valid: true, message: t('validation.password.valid') };
  }, [t]);

  // 验证确认密码
  const validateConfirmPassword = useCallback((password, confirmPassword) => {
    if (!confirmPassword) {
      return { valid: false, message: t('validation.confirmPassword.required') };
    }
    if (password !== confirmPassword) {
      return { valid: false, message: t('validation.confirmPassword.mismatch') };
    }
    return { valid: true, message: t('validation.confirmPassword.valid') };
  }, [t]);

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

    // 实时验证
    if (name === 'username') {
      // 清除之前的定时器
      if (debounceTimers.username) {
        clearTimeout(debounceTimers.username);
      }
      
      // 设置新的防抖定时器
      const timer = setTimeout(() => {
        debouncedCheckUsername(value);
      }, 500);
      
      setDebounceTimers(prev => ({
        ...prev,
        username: timer
      }));
    } else if (name === 'email') {
      // 清除之前的定时器
      if (debounceTimers.email) {
        clearTimeout(debounceTimers.email);
      }
      
      // 设置新的防抖定时器
      const timer = setTimeout(() => {
        debouncedCheckEmail(value);
      }, 500);
      
      setDebounceTimers(prev => ({
        ...prev,
        email: timer
      }));
    } else if (name === 'password') {
      const passwordValidation = validatePassword(value);
      setValidationStatus(prev => ({
        ...prev,
        password: passwordValidation
      }));
      
      // 如果确认密码已输入，重新验证确认密码
      if (formData.confirmPassword) {
        const confirmValidation = validateConfirmPassword(value, formData.confirmPassword);
        setValidationStatus(prev => ({
          ...prev,
          confirmPassword: confirmValidation
        }));
      }
    } else if (name === 'confirmPassword') {
      const confirmValidation = validateConfirmPassword(formData.password, value);
      setValidationStatus(prev => ({
        ...prev,
        confirmPassword: confirmValidation
      }));
    }
  };

  // 验证状态指示器组件
  const ValidationIndicator = ({ status, className = '' }) => {
    if (status.checking) {
      return (
        <div className={`flex items-center text-blue-600 ${className}`}>
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
          <span className="text-sm">{status.message}</span>
        </div>
      );
    }
    
    if (status.valid === true) {
      return (
        <div className={`flex items-center text-green-600 ${className}`}>
          <Check className="w-4 h-4 mr-1" />
          <span className="text-sm">{status.message}</span>
        </div>
      );
    }
    
    if (status.valid === false) {
      return (
        <div className={`flex items-center text-red-600 ${className}`}>
          <X className="w-4 h-4 mr-1" />
          <span className="text-sm">{status.message}</span>
        </div>
      );
    }
    
    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    // 检查实时验证状态
    if (!validationStatus.username.valid) {
      newErrors.username = validationStatus.username.message || t('validation.username.invalid');
    }

    if (!validationStatus.email.valid) {
      newErrors.email = validationStatus.email.message || t('validation.email.invalid');
    }

    if (!validationStatus.password.valid) {
      newErrors.password = validationStatus.password.message || t('validation.password.invalid');
    }

    if (!validationStatus.confirmPassword.valid) {
      newErrors.confirmPassword = validationStatus.confirmPassword.message || t('validation.confirmPassword.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    if (result.success) {
      // 如果需要邮箱验证，跳转到验证页面
      if (result.data?.needVerification) {
        navigate('/verify-email', { 
          state: { 
            userId: result.data.userId, 
            email: result.data.email,
            emailSendFailed: result.data.emailSendFailed || false
          },
          replace: true 
        });
      } else {
        // 如果不需要验证（邮件服务未启用），直接跳转到首页
        navigate('/', { replace: true });
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
            {t('register.title')}
          </h2>
          <p className="mt-2 text-slate-600">
            {t('register.subtitle')}
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
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                {t('register.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${
                    validationStatus.username.valid === false 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : validationStatus.username.valid === true 
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                      : ''
                  }`}
                  placeholder={t('register.usernamePlaceholder')}
                />
                {validationStatus.username.checking && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
                )}
                {validationStatus.username.valid === true && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                )}
                {validationStatus.username.valid === false && (
                  <X className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                )}
              </div>
              {validationStatus.username.message && (
                <ValidationIndicator status={validationStatus.username} className="mt-1" />
              )}
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                {t('register.email')}
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
                  className={`input pl-10 pr-10 ${
                    validationStatus.email.valid === false 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : validationStatus.email.valid === true 
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                      : ''
                  }`}
                  placeholder={t('register.emailPlaceholder')}
                />
                {validationStatus.email.checking && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
                )}
                {validationStatus.email.valid === true && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                )}
                {validationStatus.email.valid === false && (
                  <X className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                )}
              </div>
              {validationStatus.email.message && (
                <ValidationIndicator status={validationStatus.email} className="mt-1" />
              )}
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                {t('register.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pl-10 pr-20 ${
                    validationStatus.password.valid === false 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : validationStatus.password.valid === true 
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                      : ''
                  }`}
                  placeholder={t('register.passwordPlaceholder')}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {validationStatus.password.valid === true && (
                    <Check className="text-green-500 w-4 h-4" />
                  )}
                  {validationStatus.password.valid === false && (
                    <X className="text-red-500 w-4 h-4" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {validationStatus.password.message && (
                <ValidationIndicator status={validationStatus.password} className="mt-1" />
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                {t('register.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input pl-10 pr-20 ${
                    validationStatus.confirmPassword.valid === false 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : validationStatus.confirmPassword.valid === true 
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                      : ''
                  }`}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {validationStatus.confirmPassword.valid === true && (
                    <Check className="text-green-500 w-4 h-4" />
                  )}
                  {validationStatus.confirmPassword.valid === false && (
                    <X className="text-red-500 w-4 h-4" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {validationStatus.confirmPassword.message && (
                <ValidationIndicator status={validationStatus.confirmPassword} className="mt-1" />
              )}
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-slate-700">
                {t('register.agreeToTerms')}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500 mx-1">
                  {t('register.termsOfService')}
                </Link>
                {t('register.and')}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500 mx-1">
                  {t('register.privacyPolicy')}
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-base font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t('register.registering')}
                </div>
              ) : (
                t('register.createAccount')
              )}
            </button>

            <div className="text-center">
              <span className="text-slate-600">{t('register.login.text')}</span>
              <Link
                to="/login"
                className="ml-1 font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                {t('register.login.link')}
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;