import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { enhancedToast } from '../components/Error/EnhancedToast';
import ErrorDisplay from '../components/Error/ErrorDisplay';
import { /* FormErrorDisplay, */ FormFieldError, FormValidationSummary } from '../components/Error/FormErrorDisplay'; // FormErrorDisplay暂未使用
import { ERROR_TYPES, ERROR_SEVERITY } from '../utils/errorHandler';

const ErrorDemo = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);
  const [currentError, setCurrentError] = useState(null);

  // 模拟各种Toast错误
  const showToastExamples = () => {
    // 成功提示
    enhancedToast.success('操作成功完成！', {
      title: '成功',
      duration: 3000
    });

    // 延迟显示其他提示
    setTimeout(() => {
      enhancedToast.warning('这是一个警告信息', {
        title: '注意',
        duration: 4000
      });
    }, 1000);

    setTimeout(() => {
      enhancedToast.info('这是一个信息提示', {
        title: '提示',
        duration: 4000
      });
    }, 2000);

    setTimeout(() => {
      enhancedToast.error('这是一个错误信息', {
        title: '错误',
        errorId: 'ERR_' + Date.now(),
        duration: 5000
      });
    }, 3000);
  };

  // 模拟网络错误
  const showNetworkError = () => {
    enhancedToast.networkError('网络连接失败，请检查网络设置', {
      onRetry: () => {
        enhancedToast.info('正在重试连接...');
        setTimeout(() => {
          enhancedToast.success('连接成功！');
        }, 2000);
      }
    });
  };

  // 模拟服务器错误
  const showServerError = () => {
    enhancedToast.serverError('服务器内部错误，请稍后重试', {
      errorId: 'SRV_500_' + Date.now()
    });
  };

  // 模拟权限错误
  const showPermissionError = () => {
    enhancedToast.permissionError('您没有权限执行此操作', {
      action: {
        label: '申请权限',
        onClick: () => enhancedToast.info('权限申请已提交')
      }
    });
  };

  // 模拟验证错误
  const showValidationError = () => {
    enhancedToast.validationError('表单验证失败，请检查输入内容', {
      errors: ['邮箱格式不正确', '密码长度不足8位']
    });
  };

  // 模拟表单验证
  const validateForm = () => {
    const errors = {};
    const warnings = {};
    
    if (!formData.email) {
      errors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '邮箱格式不正确';
    }
    
    if (!formData.password) {
      errors.password = '密码不能为空';
    } else if (formData.password.length < 8) {
      errors.password = '密码长度至少8位';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      warnings.password = '建议密码包含大小写字母和数字';
    }
    
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }
    
    setFormErrors({ ...errors, ...warnings });
    return Object.keys(errors).length === 0;
  };

  // 显示错误页面
  const showErrorPage = (type, severity) => {
    setCurrentError({ type, severity });
    setShowErrorDisplay(true);
  };

  // 模拟抛出JavaScript错误
  const throwError = () => {
    throw new Error('This is a test error for demonstrating ErrorBoundary');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 实时验证
    setTimeout(validateForm, 100);
  };

  if (showErrorDisplay && currentError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorDisplay
            type={currentError.type}
            severity={currentError.severity}
            title={t('errorDemo.title')}
            message="这是一个错误页面演示，展示不同类型和严重程度的错误显示效果。"
            showRetry={true}
            showGoHome={true}
            showContactSupport={true}
            onRetry={() => setShowErrorDisplay(false)}
            onGoHome={() => setShowErrorDisplay(false)}
            onContactSupport={() => {
              enhancedToast.info('已为您打开技术支持页面');
              setShowErrorDisplay(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">错误处理系统演示</h1>
          <p className="text-gray-600 mb-6">
            这个页面展示了我们全新的错误处理系统，包括友好的错误提示、表单验证和错误边界等功能。
          </p>

          {/* Toast 通知演示 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔔 Toast 通知演示</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={showToastExamples}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                基础通知
              </button>
              <button
                onClick={showNetworkError}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                网络错误
              </button>
              <button
                onClick={showServerError}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                服务器错误
              </button>
              <button
                onClick={showPermissionError}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                权限错误
              </button>
              <button
                onClick={showValidationError}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                验证错误
              </button>
            </div>
          </div>

          {/* 表单验证演示 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 表单验证演示</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <form className="space-y-4">
                <FormFieldError
                  error={formErrors.email}
                  type={formErrors.email ? 'error' : undefined}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('errorDemo.form.emailPlaceholder')}
                  />
                </FormFieldError>

                <FormFieldError
                  error={formErrors.password}
                  type={formErrors.password?.includes('建议') ? 'warning' : 'error'}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密码
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('errorDemo.form.passwordPlaceholder')}
                  />
                </FormFieldError>

                <FormFieldError
                  error={formErrors.confirmPassword}
                  type="error"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    确认密码
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('errorDemo.form.confirmPasswordPlaceholder')}
                  />
                </FormFieldError>

                <FormValidationSummary errors={formErrors} />
              </form>
            </div>
          </div>

          {/* 错误页面演示 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🚨 错误页面演示</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => showErrorPage(ERROR_TYPES.NETWORK, ERROR_SEVERITY.MEDIUM)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                网络错误页面
              </button>
              <button
                onClick={() => showErrorPage(ERROR_TYPES.SERVER, ERROR_SEVERITY.HIGH)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                服务器错误页面
              </button>
              <button
                onClick={() => showErrorPage(ERROR_TYPES.AUTHENTICATION, ERROR_SEVERITY.MEDIUM)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                认证错误页面
              </button>
              <button
                onClick={() => showErrorPage(ERROR_TYPES.PERMISSION, ERROR_SEVERITY.LOW)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                权限错误页面
              </button>
            </div>
          </div>

          {/* 错误边界演示 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🛡️ 错误边界演示</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 mb-4">
                ⚠️ 点击下面的按钮会故意抛出一个JavaScript错误，用于测试ErrorBoundary组件。
                这将显示一个友好的错误页面而不是白屏。
              </p>
              <button
                onClick={throwError}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                触发JavaScript错误
              </button>
            </div>
          </div>

          {/* 功能说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">✨ 错误处理系统特性</h3>
            <ul className="text-blue-700 space-y-2">
              <li>• <strong>智能错误分类：</strong>自动识别网络、服务器、认证等不同类型的错误</li>
              <li>• <strong>友好的用户提示：</strong>将技术错误转换为用户易懂的消息</li>
              <li>• <strong>交互式错误处理：</strong>提供重试、联系支持等操作选项</li>
              <li>• <strong>实时表单验证：</strong>即时反馈，提升用户体验</li>
              <li>• <strong>全局错误捕获：</strong>ErrorBoundary确保应用不会因错误而崩溃</li>
              <li>• <strong>错误追踪：</strong>为每个错误生成唯一ID，便于问题定位</li>
              <li>• <strong>视觉反馈：</strong>使用动画和颜色编码增强用户体验</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDemo;