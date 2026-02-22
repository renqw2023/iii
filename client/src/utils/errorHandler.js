import toast from 'react-hot-toast';
import config from '../config';

/**
 * 错误类型枚举
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  TIMEOUT: 'TIMEOUT',
  FILE_UPLOAD: 'FILE_UPLOAD',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN'
};

/**
 * 错误严重程度
 */
export const ERROR_SEVERITY = {
  LOW: 'LOW',       // 用户可以继续使用，只是某个功能不可用
  MEDIUM: 'MEDIUM', // 影响用户体验，但不阻塞主要功能
  HIGH: 'HIGH',     // 严重影响用户使用
  CRITICAL: 'CRITICAL' // 系统级错误，需要立即处理
};

/**
 * 错误处理器类
 */
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * 分析错误类型
   */
  analyzeError(error) {
    if (!error) {
      return {
        type: ERROR_TYPES.UNKNOWN,
        severity: ERROR_SEVERITY.LOW,
        message: '未知错误'
      };
    }

    // 网络错误
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        type: ERROR_TYPES.NETWORK,
        severity: ERROR_SEVERITY.HIGH,
        message: config.errorMessages.networkError,
        suggestion: '请检查网络连接后重试'
      };
    }

    const status = error.response?.status;
    const errorData = error.response?.data;

    switch (status) {
      case 400:
        return {
          type: ERROR_TYPES.VALIDATION,
          severity: ERROR_SEVERITY.LOW,
          message: errorData?.message || config.errorMessages.validationError,
          details: errorData?.errors,
          suggestion: '请检查输入信息是否正确'
        };

      case 401:
        return {
          type: ERROR_TYPES.AUTHENTICATION,
          severity: ERROR_SEVERITY.MEDIUM,
          message: errorData?.message || config.errorMessages.unauthorized,
          suggestion: '请重新登录后再试',
          action: 'LOGIN_REQUIRED'
        };

      case 403:
        return {
          type: ERROR_TYPES.AUTHORIZATION,
          severity: ERROR_SEVERITY.MEDIUM,
          message: errorData?.message || config.errorMessages.forbidden,
          suggestion: '您没有权限执行此操作'
        };

      case 404:
        return {
          type: ERROR_TYPES.NOT_FOUND,
          severity: ERROR_SEVERITY.LOW,
          message: errorData?.message || config.errorMessages.notFound,
          suggestion: '请确认访问的资源是否存在'
        };

      case 413:
        return {
          type: ERROR_TYPES.FILE_UPLOAD,
          severity: ERROR_SEVERITY.LOW,
          message: errorData?.message || config.errorMessages.fileTooLarge,
          suggestion: '请选择更小的文件后重试'
        };

      case 429:
        return {
          type: ERROR_TYPES.RATE_LIMIT,
          severity: ERROR_SEVERITY.MEDIUM,
          message: errorData?.message || '操作过于频繁，请稍后再试',
          suggestion: '请等待一段时间后再进行操作',
          retryAfter: errorData?.retryAfter || 60
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ERROR_TYPES.SERVER,
          severity: ERROR_SEVERITY.HIGH,
          message: errorData?.message || config.errorMessages.serverError,
          suggestion: '服务器暂时不可用，请稍后重试'
        };

      default:
        return {
          type: ERROR_TYPES.UNKNOWN,
          severity: ERROR_SEVERITY.MEDIUM,
          message: errorData?.message || '发生了未知错误',
          suggestion: '请稍后重试，如果问题持续存在请联系技术支持'
        };
    }
  }

  /**
   * 处理错误并显示用户友好的提示
   */
  handleError(error, options = {}) {
    const {
      showToast = true,
      logError = true,
      context = '',
      customMessage = null,
      onRetry = null
    } = options;

    const errorInfo = this.analyzeError(error);
    
    // 记录错误
    if (logError) {
      this.logError(error, errorInfo, context);
    }

    // 显示用户提示
    if (showToast) {
      this.showErrorToast(errorInfo, customMessage, onRetry);
    }

    // 特殊处理
    this.handleSpecialCases(errorInfo);

    return errorInfo;
  }

  /**
   * 显示错误Toast
   */
  showErrorToast(errorInfo, customMessage, onRetry) {
    const message = customMessage || errorInfo.message;
    
    const toastOptions = {
      duration: this.getToastDuration(errorInfo.severity),
      style: {
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        color: '#991B1B',
      },
      icon: this.getErrorIcon(errorInfo.type),
    };

    // 如果有重试功能，显示带重试按钮的Toast
    if (onRetry && errorInfo.type === ERROR_TYPES.NETWORK) {
      toast.error(
        (t) => (
          <div className="flex flex-col gap-2">
            <div>{message}</div>
            {errorInfo.suggestion && (
              <div className="text-sm text-slate-600">{errorInfo.suggestion}</div>
            )}
            <button
              onClick={() => {
                toast.dismiss(t.id);
                onRetry();
              }}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
            >
              重试
            </button>
          </div>
        ),
        toastOptions
      );
    } else {
      // 普通错误Toast
      const content = errorInfo.suggestion 
        ? `${message}\n${errorInfo.suggestion}`
        : message;
      
      toast.error(content, toastOptions);
    }
  }

  /**
   * 获取Toast持续时间
   */
  getToastDuration(severity) {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return 3000;
      case ERROR_SEVERITY.MEDIUM:
        return 5000;
      case ERROR_SEVERITY.HIGH:
        return 8000;
      case ERROR_SEVERITY.CRITICAL:
        return 10000;
      default:
        return 4000;
    }
  }

  /**
   * 获取错误图标
   */
  getErrorIcon(type) {
    switch (type) {
      case ERROR_TYPES.NETWORK:
        return '🌐';
      case ERROR_TYPES.AUTHENTICATION:
        return '🔐';
      case ERROR_TYPES.AUTHORIZATION:
        return '🚫';
      case ERROR_TYPES.VALIDATION:
        return '⚠️';
      case ERROR_TYPES.NOT_FOUND:
        return '🔍';
      case ERROR_TYPES.SERVER:
        return '🔧';
      case ERROR_TYPES.TIMEOUT:
        return '⏱️';
      case ERROR_TYPES.FILE_UPLOAD:
        return '📁';
      case ERROR_TYPES.RATE_LIMIT:
        return '🚦';
      default:
        return '❌';
    }
  }

  /**
   * 处理特殊情况
   */
  handleSpecialCases(errorInfo) {
    switch (errorInfo.action) {
      case 'LOGIN_REQUIRED':
        // 延迟跳转到登录页面
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 2000);
        break;
      
      default:
        break;
    }
  }

  /**
   * 记录错误
   */
  logError(error, errorInfo, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      },
      errorInfo,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // 添加到本地日志
    this.errorLog.unshift(logEntry);
    
    // 保持日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // 开发环境下打印到控制台
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Handler - ${errorInfo.type}`);
      console.error('Original Error:', error);
      console.log('Error Info:', errorInfo);
      console.log('Context:', context);
      console.groupEnd();
    }

    // 生产环境下发送到监控服务
    if (process.env.NODE_ENV === 'production' && errorInfo.severity === ERROR_SEVERITY.CRITICAL) {
      this.reportToMonitoring(logEntry);
    }
  }

  /**
   * 发送错误报告到监控服务
   */
  reportToMonitoring(logEntry) {
    // 这里可以集成第三方监控服务，如 Sentry
    console.log('Reporting to monitoring service:', logEntry);
  }

  /**
   * 获取错误日志
   */
  getErrorLog() {
    return this.errorLog;
  }

  /**
   * 清除错误日志
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * 创建用户友好的错误消息
   */
  createUserFriendlyMessage(error, action = '') {
    const errorInfo = this.analyzeError(error);
    
    let message = errorInfo.message;
    
    if (action) {
      const actionMap = {
        'login': '登录',
        'register': '注册',
        'upload': '上传文件',
        'save': '保存',
        'delete': '删除',
        'update': '更新',
        'load': '加载数据'
      };
      
      const actionText = actionMap[action] || action;
      message = `${actionText}失败：${message}`;
    }
    
    return {
      message,
      suggestion: errorInfo.suggestion,
      type: errorInfo.type,
      severity: errorInfo.severity
    };
  }
}

// 创建全局错误处理器实例
const errorHandler = new ErrorHandler();

// 导出便捷方法
export const handleError = (error, options) => errorHandler.handleError(error, options);
export const createUserFriendlyMessage = (error, action) => errorHandler.createUserFriendlyMessage(error, action);
export const getErrorLog = () => errorHandler.getErrorLog();
export const clearErrorLog = () => errorHandler.clearErrorLog();

export default errorHandler;