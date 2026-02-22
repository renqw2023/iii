import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * 表单错误显示组件
 * 用于显示表单字段的验证错误、警告和成功状态
 */
const FormErrorDisplay = ({
  error,
  warning,
  success,
  info,
  className = '',
  size = 'medium', // small, medium, large
  showIcon = true,
  animate = true
}) => {
  // 确定显示的消息和类型
  const getMessageInfo = () => {
    if (error) {
      return {
        message: error,
        type: 'error',
        icon: AlertCircle,
        colors: {
          text: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-500'
        }
      };
    }
    
    if (warning) {
      return {
        message: warning,
        type: 'warning',
        icon: AlertTriangle,
        colors: {
          text: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-500'
        }
      };
    }
    
    if (success) {
      return {
        message: success,
        type: 'success',
        icon: CheckCircle,
        colors: {
          text: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-500'
        }
      };
    }
    
    if (info) {
      return {
        message: info,
        type: 'info',
        icon: Info,
        colors: {
          text: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-500'
        }
      };
    }
    
    return null;
  };

  const messageInfo = getMessageInfo();
  
  if (!messageInfo) {
    return null;
  }

  const { message, icon: Icon, colors } = messageInfo;

  // 尺寸配置
  const sizeConfig = {
    small: {
      text: 'text-xs',
      padding: 'px-2 py-1',
      icon: 'w-3 h-3',
      gap: 'gap-1'
    },
    medium: {
      text: 'text-sm',
      padding: 'px-3 py-2',
      icon: 'w-4 h-4',
      gap: 'gap-2'
    },
    large: {
      text: 'text-base',
      padding: 'px-4 py-3',
      icon: 'w-5 h-5',
      gap: 'gap-3'
    }
  };

  const config = sizeConfig[size];

  // 动画配置
  const animationProps = animate ? {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.2, ease: "easeOut" }
  } : {};

  const content = (
    <div
      className={`
        flex items-start ${config.gap} ${config.padding} 
        ${colors.bg} ${colors.border} border rounded-lg
        ${config.text} ${colors.text} ${className}
      `}
    >
      {showIcon && (
        <Icon className={`${config.icon} ${colors.icon} flex-shrink-0 mt-0.5`} />
      )}
      <span className="flex-1 leading-relaxed">{message}</span>
    </div>
  );

  if (animate) {
    return (
      <AnimatePresence mode="wait">
        <motion.div {...animationProps}>
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  return content;
};

/**
 * 表单字段错误包装器
 * 用于包装表单字段并显示相关的错误信息
 */
export const FormFieldError = ({
  children,
  error,
  warning,
  success,
  info,
  label,
  required = false,
  className = ''
}) => {
  const hasError = error;
  const hasWarning = warning && !error;
  const hasSuccess = success && !error && !warning;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
        
        {/* 字段状态指示器 */}
        {(hasSuccess || hasError || hasWarning) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {hasError && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            {hasWarning && (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            {hasSuccess && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {/* 错误消息 */}
      <FormErrorDisplay
        error={error}
        warning={warning}
        success={success}
        info={info}
        size="small"
      />
    </div>
  );
};

/**
 * 表单验证摘要组件
 * 用于在表单顶部显示所有验证错误的摘要
 */
export const FormValidationSummary = ({
  errors = {},
  warnings = {},
  title,
  className = ''
}) => {
  const { t } = useTranslation();
  const errorEntries = Object.entries(errors).filter(([_, value]) => value);
  const warningEntries = Object.entries(warnings).filter(([_, value]) => value);
  
  const displayTitle = title || t('form.validation.fixIssues');
  
  if (errorEntries.length === 0 && warningEntries.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">{displayTitle}</h3>
          
          {errorEntries.length > 0 && (
            <ul className="text-sm text-red-700 space-y-1">
              {errorEntries.map(([field, error]) => (
                <li key={field} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          )}
          
          {warningEntries.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">{t('form.validation.warnings')}：</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {warningEntries.map(([field, warning]) => (
                  <li key={field} className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FormErrorDisplay;