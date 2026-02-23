import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(_error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    this.setState({
      error,
      errorInfo
    });

    // 在开发环境下打印详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught an Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }

    // 在生产环境下可以发送错误报告到监控服务
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error, errorInfo) => {
    // 这里可以集成错误监控服务，如 Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // 发送到错误监控服务
    console.log('Error Report:', errorReport);
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`);
    const body = encodeURIComponent(
      `Error ID: ${errorId}\n` +
      `错误信息: ${error?.message || 'Unknown error'}\n` +
      `页面URL: ${window.location.href}\n` +
      `时间: ${new Date().toLocaleString()}\n` +
      `浏览器: ${navigator.userAgent}\n\n` +
      `请描述您在遇到此错误前的操作步骤：\n\n`
    );
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* 错误图标 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6"
              >
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </motion.div>

              {/* 错误标题 */}
              <h1 className="text-3xl font-bold text-slate-800 mb-4">
                Oops, something went wrong
              </h1>

              {/* 错误描述 */}
              <p className="text-slate-600 mb-6 leading-relaxed">
                很抱歉，页面遇到了意外错误。我们已经记录了这个问题，
                <br />技术团队会尽快修复。您可以尝试以下操作：
              </p>

              {/* 错误ID */}
              {errorId && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-500 mb-1">错误ID（用于技术支持）</p>
                  <code className="text-sm font-mono text-slate-700 bg-white px-2 py-1 rounded">
                    {errorId}
                  </code>
                </div>
              )}

              {/* 开发环境下显示详细错误信息 */}
              {isDevelopment && error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.3 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left"
                >
                  <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                    <Bug className="w-4 h-4 mr-2" />
                    开发调试信息
                  </h3>
                  <pre className="text-xs text-red-700 overflow-auto max-h-32">
                    {error.message}
                  </pre>
                </motion.div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={this.handleRetry}
                  className="btn btn-primary flex items-center justify-center px-6 py-3"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  重试
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={this.handleGoHome}
                  className="btn btn-secondary flex items-center justify-center px-6 py-3"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Back to Home
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={this.handleReportBug}
                  className="btn btn-outline flex items-center justify-center px-6 py-3"
                >
                  <Bug className="w-5 h-5 mr-2" />
                  报告问题
                </motion.button>
              </div>

              {/* 友好提示 */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  如果问题持续存在，请联系我们的技术支持团队
                  <br />
                  <a 
                    href="mailto:support@example.com" 
                    className="text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    support@example.com
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;