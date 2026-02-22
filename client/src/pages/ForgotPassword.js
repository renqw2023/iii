import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { enhancedAuthAPI } from '../services/enhancedApi';
import { useTranslation, Trans } from 'react-i18next';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // 前端验证
    if (!email.trim()) {
      setErrors({ email: t('forgotPassword.error.emailRequired') });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: t('forgotPassword.error.emailInvalid') });
      return;
    }

    setIsLoading(true);
    try {
      await enhancedAuthAPI.forgotPassword({ email });
      setIsEmailSent(true);
      toast.success(t('forgotPassword.success.emailSent'));
    } catch (error) {
      console.error('发送重置密码邮件失败:', error);
      const errorMessage = error.response?.data?.message || t('forgotPassword.error.sendFailed');
      setErrors({ email: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await enhancedAuthAPI.forgotPassword({ email });
      toast.success(t('forgotPassword.success.emailResent'));
    } catch (error) {
      console.error('重新发送失败:', error);
      toast.error(t('forgotPassword.error.resendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('forgotPassword.emailSent.title')}
              </h2>
              <p className="text-gray-600 mb-6">
                <Trans
                  i18nKey="forgotPassword.emailSent.description"
                  values={{ email }}
                  components={{
                    1: <span className="font-medium text-gray-900" />
                  }}
                />
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? t('forgotPassword.emailSent.sending') : t('forgotPassword.emailSent.resendButton')}
                </button>
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  {t('forgotPassword.emailSent.backToLogin')}
                </Link>
              </div>
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
              <Mail className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('forgotPassword.title')}
            </h2>
            <p className="text-gray-600 mb-8">
              {t('forgotPassword.description')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('forgotPassword.emailLabel')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none relative block w-full px-4 py-3 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors`}
                placeholder={t('forgotPassword.emailPlaceholder')}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? t('forgotPassword.sending') : t('forgotPassword.sendButton')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <Link
              to="/login"
              className="flex items-center justify-center text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;