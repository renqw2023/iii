import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Wifi,
  Lock,
  Shield,
  Search,
  Server,
  Clock,
  Upload,
  Zap,
  RefreshCw,
  Home,
  Mail
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ERROR_TYPES, ERROR_SEVERITY } from '../../utils/errorHandler';

/**
 * 错误显示组件
 * 用于在页面中显示友好的错误状态
 */
const ErrorDisplay = ({
  error,
  title,
  message,
  suggestion,
  type = ERROR_TYPES.UNKNOWN,
  severity = ERROR_SEVERITY.MEDIUM,
  showRetry = true,
  showHome = false,
  showContact = false,
  onRetry,
  onGoHome,
  className = '',
  size = 'medium' // small, medium, large
}) => {
  const { t } = useTranslation();
  // 获取错误图标
  const getErrorIcon = () => {
    const iconProps = {
      className: `${size === 'small' ? 'w-8 h-8' : size === 'large' ? 'w-16 h-16' : 'w-12 h-12'}`
    };

    switch (type) {
      case ERROR_TYPES.NETWORK:
        return <Wifi {...iconProps} />;
      case ERROR_TYPES.AUTHENTICATION:
        return <Lock {...iconProps} />;
      case ERROR_TYPES.AUTHORIZATION:
        return <Shield {...iconProps} />;
      case ERROR_TYPES.NOT_FOUND:
        return <Search {...iconProps} />;
      case ERROR_TYPES.SERVER:
        return <Server {...iconProps} />;
      case ERROR_TYPES.TIMEOUT:
        return <Clock {...iconProps} />;
      case ERROR_TYPES.FILE_UPLOAD:
        return <Upload {...iconProps} />;
      case ERROR_TYPES.RATE_LIMIT:
        return <Zap {...iconProps} />;
      default:
        return <AlertTriangle {...iconProps} />;
    }
  };

  // 获取错误颜色主题
  const getColorTheme = () => {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case ERROR_SEVERITY.MEDIUM:
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          titleColor: 'text-orange-800',
          textColor: 'text-orange-700',
          buttonColor: 'bg-orange-600 hover:bg-orange-700'
        };
      case ERROR_SEVERITY.HIGH:
      case ERROR_SEVERITY.CRITICAL:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          textColor: 'text-red-700',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          iconBg: 'bg-slate-100',
          iconColor: 'text-slate-600',
          titleColor: 'text-slate-800',
          textColor: 'text-slate-700',
          buttonColor: 'bg-slate-600 hover:bg-slate-700'
        };
    }
  };

  // 获取默认标题
  const getDefaultTitle = () => {
    switch (type) {
      case ERROR_TYPES.NETWORK:
        return t('errorDisplay.titles.network');
      case ERROR_TYPES.AUTHENTICATION:
        return t('errorDisplay.titles.authentication');
      case ERROR_TYPES.AUTHORIZATION:
        return t('errorDisplay.titles.authorization');
      case ERROR_TYPES.NOT_FOUND:
        return t('errorDisplay.titles.notFound');
      case ERROR_TYPES.SERVER:
        return t('errorDisplay.titles.server');
      case ERROR_TYPES.TIMEOUT:
        return t('errorDisplay.titles.timeout');
      case ERROR_TYPES.FILE_UPLOAD:
        return t('errorDisplay.titles.fileUpload');
      case ERROR_TYPES.RATE_LIMIT:
        return t('errorDisplay.titles.rateLimit');
      case ERROR_TYPES.VALIDATION:
        return t('errorDisplay.titles.validation');
      default:
        return t('errorDisplay.titles.default');
    }
  };

  // 获取默认消息
  const getDefaultMessage = () => {
    switch (type) {
      case ERROR_TYPES.NETWORK:
        return t('errorDisplay.messages.network');
      case ERROR_TYPES.AUTHENTICATION:
        return t('errorDisplay.messages.authentication');
      case ERROR_TYPES.AUTHORIZATION:
        return t('errorDisplay.messages.authorization');
      case ERROR_TYPES.NOT_FOUND:
        return t('errorDisplay.messages.notFound');
      case ERROR_TYPES.SERVER:
        return t('errorDisplay.messages.server');
      case ERROR_TYPES.TIMEOUT:
        return t('errorDisplay.messages.timeout');
      case ERROR_TYPES.FILE_UPLOAD:
        return t('errorDisplay.messages.fileUpload');
      case ERROR_TYPES.RATE_LIMIT:
        return t('errorDisplay.messages.rateLimit');
      case ERROR_TYPES.VALIDATION:
        return t('errorDisplay.messages.validation');
      default:
        return t('errorDisplay.messages.default');
    }
  };

  const colorTheme = getColorTheme();
  const displayTitle = title || getDefaultTitle();
  const displayMessage = message || (error?.message) || getDefaultMessage();

  const containerSize = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const titleSize = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  const messageSize = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        ${colorTheme.bg} ${colorTheme.border} border rounded-xl 
        ${containerSize[size]} text-center ${className}
      `}
    >
      {/* 错误图标 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className={`
          inline-flex items-center justify-center 
          ${size === 'small' ? 'w-12 h-12 mb-3' : size === 'large' ? 'w-20 h-20 mb-6' : 'w-16 h-16 mb-4'}
          ${colorTheme.iconBg} ${colorTheme.iconColor} rounded-full
        `}
      >
        {getErrorIcon()}
      </motion.div>

      {/* 错误标题 */}
      <h3 className={`${titleSize[size]} font-semibold ${colorTheme.titleColor} mb-2`}>
        {displayTitle}
      </h3>

      {/* 错误消息 */}
      <p className={`${messageSize[size]} ${colorTheme.textColor} mb-4 leading-relaxed`}>
        {displayMessage}
      </p>

      {/* 建议 */}
      {suggestion && (
        <p className={`${messageSize[size]} ${colorTheme.textColor} opacity-80 mb-4`}>
          {suggestion}
        </p>
      )}

      {/* 操作按钮 */}
      {(showRetry || showHome || showContact) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRetry && onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className={`
                ${colorTheme.buttonColor} text-white px-4 py-2 rounded-lg 
                transition-colors duration-200 flex items-center justify-center
                ${size === 'small' ? 'text-sm' : 'text-base'}
              `}
            >
              <RefreshCw className={`${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
              {t('errorDisplay.buttons.retry')}
            </motion.button>
          )}

          {showHome && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGoHome || (() => window.location.href = '/')}
              className={`
                bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg 
                transition-colors duration-200 flex items-center justify-center
                ${size === 'small' ? 'text-sm' : 'text-base'}
              `}
            >
              <Home className={`${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
              {t('errorDisplay.buttons.home')}
            </motion.button>
          )}

          {showContact && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('mailto:support@example.com')}
              className={`
                bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg 
                transition-colors duration-200 flex items-center justify-center
                ${size === 'small' ? 'text-sm' : 'text-base'}
              `}
            >
              <Mail className={`${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
              {t('errorDisplay.buttons.contact')}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ErrorDisplay;