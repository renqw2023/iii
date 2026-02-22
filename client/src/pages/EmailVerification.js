import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import { enhancedAuthAPI } from '../services/enhancedApi';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation, Trans } from 'react-i18next';

const EmailVerification = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();
  
  const { userId, email, emailSendFailed } = location.state || {};

  useEffect(() => {
    if (!userId || !email) {
      navigate('/register');
      return;
    }
    
    // 如果邮件发送失败，显示提示信息
    if (emailSendFailed) {
      setError(t('emailVerification.error.sendFailed'));
    }
  }, [userId, email, emailSendFailed, navigate, t]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError(t('emailVerification.error.codeRequired'));
      return;
    }

    if (code.length !== 6) {
      setError(t('emailVerification.error.codeLength'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await enhancedAuthAPI.verifyEmail({ userId, code });
      setSuccess(t('emailVerification.success.verified'));
      
      // 自动登录
      if (response.data.token) {
        setAuthData(response.data.token, response.data.user);
        
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || t('emailVerification.error.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      await enhancedAuthAPI.resendVerification({ userId });
      setSuccess(t('emailVerification.success.resent'));
      setCountdown(60); // 60秒倒计时
    } catch (error) {
      setError(error.response?.data?.message || t('emailVerification.error.resendFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  if (!userId || !email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate('/register')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('emailVerification.backToRegister')}
          </button>

          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('emailVerification.title')}</h1>
            <p className="text-gray-600">
              <Trans
                i18nKey="emailVerification.description"
                values={{ email }}
                components={{
                  1: <span className="font-medium text-gray-900" />
                }}
              />
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('emailVerification.codeLabel')}
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder={t('emailVerification.codePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                autoComplete="off"
              />
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 成功信息 */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('emailVerification.verifying') : t('emailVerification.verifyButton')}
            </button>
          </form>

          {/* 重新发送 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-3">
              {t('emailVerification.noCodeReceived')}
            </p>
            <button
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${resendLoading ? 'animate-spin' : ''}`} />
              {countdown > 0 ? t('emailVerification.resendCountdown', { seconds: countdown }) : t('emailVerification.resendButton')}
            </button>
          </div>

          {/* 提示信息 */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">{t('emailVerification.tips.title')}</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• {t('emailVerification.tips.validity')}</li>
              <li>• {t('emailVerification.tips.checkSpam')}</li>
              <li>• {t('emailVerification.tips.contactSupport')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;