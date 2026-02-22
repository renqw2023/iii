import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { useTranslation } from 'react-i18next';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      return;
    }
    
    // 验证token有效性
    const verifyToken = async () => {
      try {
        await authAPI.verifyResetToken({ token });
        setIsTokenValid(true);
      } catch (error) {
        console.error('Token验证失败:', error);
        setIsTokenValid(false);
      }
    };
    
    verifyToken();
  }, [token]);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) {
      errors.push(t('resetPassword.validation.minLength'));
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push(t('resetPassword.validation.lowercase'));
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push(t('resetPassword.validation.uppercase'));
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push(t('resetPassword.validation.number'));
    }
    return errors;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // 前端验证
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = t('resetPassword.error.passwordRequired');
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors[0];
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('resetPassword.error.confirmRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('resetPassword.error.passwordMismatch');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword({
        token,
        password: formData.password
      });
      
      setIsSuccess(true);
      toast.success(t('resetPassword.success.message'));
      
      // 3秒后跳转到登录页面
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('重置密码失败:', error);
      const errorMessage = error.response?.data?.message || t('resetPassword.error.resetFailed');
      toast.error(errorMessage);
      
      if (error.response?.status === 400) {
        setIsTokenValid(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Token无效或不存在
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('resetPassword.invalidToken.title')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('resetPassword.invalidToken.description')}
              </p>
              <div className="space-y-4">
                <Link
                  to="/forgot-password"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  {t('resetPassword.invalidToken.requestAgain')}
                </Link>
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  {t('resetPassword.invalidToken.backToLogin')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 重置成功页面
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('resetPassword.success.title')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('resetPassword.success.description')}
              </p>
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {t('resetPassword.success.loginNow')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Token验证中
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('resetPassword.verifying')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
              <Lock className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('resetPassword.title')}
            </h2>
            <p className="text-gray-600 mb-8">
              {t('resetPassword.description')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('resetPassword.newPassword')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-4 py-3 pr-12 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors`}
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('resetPassword.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-4 py-3 pr-12 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors`}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? t('resetPassword.resetting') : t('resetPassword.resetButton')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {t('resetPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;