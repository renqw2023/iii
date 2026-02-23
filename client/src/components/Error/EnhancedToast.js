import React from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  ExternalLink,
  Copy,
  Clock
} from 'lucide-react';

/**
 * 增强的Toast组件
 * 提供更丰富的交互和视觉效果
 */
const EnhancedToast = ({
  t,
  type = 'info',
  title,
  message,
  action,
  onAction,
  actionText = t('common.actions.action'),
  showCopy = false,
  showDismiss = true,
  autoClose = true,
  errorId,
  retryCount = 0,
  maxRetries = 3
}) => {
  // 获取图标和颜色配置
  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          colors: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            icon: 'text-green-500',
            title: 'text-green-800',
            message: 'text-green-700',
            button: 'bg-green-600 hover:bg-green-700'
          }
        };
      case 'error':
        return {
          icon: AlertCircle,
          colors: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: 'text-red-500',
            title: 'text-red-800',
            message: 'text-red-700',
            button: 'bg-red-600 hover:bg-red-700'
          }
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          colors: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: 'text-yellow-500',
            title: 'text-yellow-800',
            message: 'text-yellow-700',
            button: 'bg-yellow-600 hover:bg-yellow-700'
          }
        };
      case 'info':
      default:
        return {
          icon: Info,
          colors: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-500',
            title: 'text-blue-800',
            message: 'text-blue-700',
            button: 'bg-blue-600 hover:bg-blue-700'
          }
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  // 复制错误ID到剪贴板
  const handleCopyErrorId = async () => {
    if (errorId) {
      try {
        await navigator.clipboard.writeText(errorId);
        toast.success('Error ID copied', { duration: 2000 });
      } catch (err) {
        console.error('Failed to copy error ID:', err);
      }
    }
  };

  // 复制消息内容
  const handleCopyMessage = async () => {
    const content = `${title ? title + '\n' : ''}${message}`;
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Message copied', { duration: 2000 });
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // 处理操作按钮点击
  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    if (autoClose) {
      toast.dismiss(t.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        ${config.colors.bg} ${config.colors.border} border rounded-xl shadow-lg
        p-4 max-w-md w-full pointer-events-auto
      `}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${config.colors.icon}`} />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          {title && (
            <h3 className={`text-sm font-semibold ${config.colors.title} mb-1`}>
              {title}
            </h3>
          )}

          {/* 消息 */}
          <p className={`text-sm ${config.colors.message} leading-relaxed`}>
            {message}
          </p>

          {/* 错误ID */}
          {errorId && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">Error ID:</span>
              <code className="text-xs font-mono bg-white px-2 py-1 rounded border">
                {errorId}
              </code>
              <button
                onClick={handleCopyErrorId}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title={t('common.actions.copyErrorId')}
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* 重试信息 */}
          {type === 'error' && retryCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Retried {retryCount}/{maxRetries} times</span>
            </div>
          )}

          {/* 操作按钮区域 */}
          {(action || showCopy) && (
            <div className="mt-3 flex items-center gap-2">
              {/* 主要操作按钮 */}
              {action && (
                <button
                  onClick={handleAction}
                  className={`
                    ${config.colors.button} text-white text-xs px-3 py-1.5 rounded-lg
                    transition-colors duration-200 flex items-center gap-1
                  `}
                >
                  {action === 'retry' && <RefreshCw className="w-3 h-3" />}
                  {action === 'link' && <ExternalLink className="w-3 h-3" />}
                  {actionText}
                </button>
              )}

              {/* 复制按钮 */}
              {showCopy && (
                <button
                  onClick={handleCopyMessage}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title={t('common.actions.copyMessage')}
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Close按钮 */}
        {showDismiss && (
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 增强的Toast工具函数
 */
export const enhancedToast = {
  // 成功提示
  success: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <EnhancedToast
          t={t}
          type="success"
          message={message}
          {...options}
        />
      ),
      {
        duration: options.duration || 4000,
        position: options.position || 'top-right'
      }
    );
  },

  // 错误提示
  error: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <EnhancedToast
          t={t}
          type="error"
          message={message}
          showCopy={true}
          {...options}
        />
      ),
      {
        duration: options.duration || 6000,
        position: options.position || 'top-right'
      }
    );
  },

  // 警告提示
  warning: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <EnhancedToast
          t={t}
          type="warning"
          message={message}
          {...options}
        />
      ),
      {
        duration: options.duration || 5000,
        position: options.position || 'top-right'
      }
    );
  },

  // 信息提示
  info: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <EnhancedToast
          t={t}
          type="info"
          message={message}
          {...options}
        />
      ),
      {
        duration: options.duration || 4000,
        position: options.position || 'top-right'
      }
    );
  },

  // 带重试功能的错误提示
  errorWithRetry: (message, onRetry, options = {}) => {
    return toast.custom(
      (t) => (
        <EnhancedToast
          t={t}
          type="error"
          message={message}
          action="retry"
          actionText={t('common.actions.retry')}
          onAction={onRetry}
          autoClose={false}
          showCopy={true}
          {...options}
        />
      ),
      {
        duration: Infinity,
        position: options.position || 'top-right'
      }
    );
  },

  // 网络错误专用提示
  networkError: (onRetry, options = {}) => {
    return enhancedToast.errorWithRetry(
      '网络连接失败，请检查网络设置后重试',
      onRetry,
      {
        title: '网络错误',
        ...options
      }
    );
  },

  // 服务器错误专用提示
  serverError: (errorId, options = {}) => {
    return enhancedToast.error(
      '服务器暂时不可用，我们正在努力修复',
      {
        title: '服务器错误',
        errorId,
        ...options
      }
    );
  },

  // 权限错误专用提示
  permissionError: (message = '您没有权限执行此操作', options = {}) => {
    return enhancedToast.warning(message, {
      title: '权限不足',
      action: 'link',
      actionText: '了解更多',
      onAction: () => window.open('/help#permissions'),
      ...options
    });
  },

  // 验证错误专用提示
  validationError: (errors, options = {}) => {
    const errorList = Array.isArray(errors) ? errors : [errors];
    const message = errorList.join('\n');
    
    return enhancedToast.warning(message, {
      title: '输入验证失败',
      ...options
    });
  }
};

export default EnhancedToast;