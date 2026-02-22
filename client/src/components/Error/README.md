# 错误处理系统使用指南

## 概述

本错误处理系统提供了一套完整的用户友好错误交互解决方案，包括：

- 🛡️ **ErrorBoundary**: 全局错误边界，防止应用崩溃
- 🔔 **EnhancedToast**: 增强的Toast通知系统
- 📝 **FormErrorDisplay**: 表单验证和错误显示组件
- 🚨 **ErrorDisplay**: 错误页面显示组件
- ⚙️ **errorHandler**: 统一错误处理工具类

## 快速开始

### 1. 基础设置

在你的应用根组件中包装 `ErrorBoundary`：

```jsx
import ErrorBoundary from './components/Error/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* 你的应用内容 */}
    </ErrorBoundary>
  );
}
```

### 2. 使用增强Toast通知

```jsx
import { enhancedToast } from './components/Error/EnhancedToast';

// 成功提示
enhancedToast.success('操作成功！');

// 错误提示
enhancedToast.error('操作失败', {
  title: '错误',
  errorId: 'ERR_001'
});

// 网络错误（带重试功能）
enhancedToast.networkError('网络连接失败', {
  onRetry: () => {
    // 重试逻辑
  }
});

// 服务器错误
enhancedToast.serverError('服务器内部错误', {
  errorId: 'SRV_500_001'
});

// 权限错误
enhancedToast.permissionError('权限不足', {
  action: {
    label: '申请权限',
    onClick: () => {
      // 申请权限逻辑
    }
  }
});
```

### 3. 表单验证和错误显示

```jsx
import { FormFieldError, FormValidationSummary } from './components/Error/FormErrorDisplay';

function MyForm() {
  const [errors, setErrors] = useState({});

  return (
    <form>
      <FormFieldError error={errors.email} type="error">
        <label>邮箱</label>
        <input type="email" name="email" />
      </FormFieldError>

      <FormFieldError error={errors.password} type="warning">
        <label>密码</label>
        <input type="password" name="password" />
      </FormFieldError>

      <FormValidationSummary errors={errors} />
    </form>
  );
}
```

### 4. 错误页面显示

```jsx
import ErrorDisplay from './components/Error/ErrorDisplay';
import { ERROR_TYPES, ERROR_SEVERITY } from './utils/errorHandler';

function ErrorPage() {
  return (
    <ErrorDisplay
      type={ERROR_TYPES.NETWORK}
      severity={ERROR_SEVERITY.MEDIUM}
      title="网络连接失败"
      message="请检查您的网络连接后重试"
      showRetry={true}
      onRetry={() => window.location.reload()}
    />
  );
}
```

### 5. 统一错误处理

```jsx
import { ErrorHandler } from './utils/errorHandler';

// 在API调用中使用
try {
  const response = await api.login(credentials);
  // 处理成功响应
} catch (error) {
  // 使用统一错误处理
  ErrorHandler.handle(error, {
    showToast: true,
    logError: true
  });
}
```

## 组件详细说明

### ErrorBoundary

**功能**: 捕获React组件树中的JavaScript错误，显示友好的错误页面

**特性**:
- 自动错误捕获和日志记录
- 友好的错误UI界面
- 重试、回到首页、报告错误等操作
- 开发环境下显示详细错误信息

**使用场景**:
- 包装整个应用或关键组件
- 防止单个组件错误导致整个应用崩溃

### EnhancedToast

**功能**: 提供丰富的Toast通知系统

**特性**:
- 多种类型：success, error, warning, info
- 专门的错误类型：networkError, serverError, permissionError, validationError
- 支持操作按钮（重试、链接等）
- 错误ID显示和复制功能
- 动画效果和视觉反馈

**API**:
```jsx
enhancedToast.success(message, options)
enhancedToast.error(message, options)
enhancedToast.warning(message, options)
enhancedToast.info(message, options)
enhancedToast.networkError(message, options)
enhancedToast.serverError(message, options)
enhancedToast.permissionError(message, options)
enhancedToast.validationError(message, options)
```

### FormErrorDisplay

**功能**: 表单验证和错误显示组件集合

**组件**:
- `FormErrorDisplay`: 单个错误消息显示
- `FormFieldError`: 表单字段包装器，带状态指示
- `FormValidationSummary`: 表单错误汇总

**支持的消息类型**:
- `error`: 错误信息（红色）
- `warning`: 警告信息（黄色）
- `success`: 成功信息（绿色）
- `info`: 提示信息（蓝色）

### ErrorDisplay

**功能**: 全屏错误页面显示组件

**特性**:
- 根据错误类型显示不同图标和颜色
- 支持多种操作按钮
- 动画效果
- 响应式设计

**Props**:
```jsx
{
  type: ERROR_TYPES,           // 错误类型
  severity: ERROR_SEVERITY,    // 错误严重程度
  title: string,               // 错误标题
  message: string,             // 错误描述
  errorId: string,             // 错误ID
  showRetry: boolean,          // 显示重试按钮
  showGoHome: boolean,         // 显示回到首页按钮
  showContactSupport: boolean, // 显示联系支持按钮
  onRetry: function,           // 重试回调
  onGoHome: function,          // 回到首页回调
  onContactSupport: function   // 联系支持回调
}
```

### ErrorHandler

**功能**: 统一错误处理工具类

**方法**:
- `handle(error, options)`: 处理错误
- `analyzeError(error)`: 分析错误类型和严重程度
- `createUserFriendlyMessage(error)`: 创建用户友好的错误消息
- `logError(error, context)`: 记录错误
- `getErrorHistory()`: 获取错误历史
- `clearErrorHistory()`: 清除错误历史

**错误类型**:
```jsx
ERROR_TYPES = {
  NETWORK: 'network',
  SERVER: 'server',
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  UNKNOWN: 'unknown'
}
```

**错误严重程度**:
```jsx
ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}
```

## 最佳实践

### 1. 错误分类

根据错误类型提供不同的处理方式：

```jsx
// 网络错误 - 提供重试选项
if (error.code === 'NETWORK_ERROR') {
  enhancedToast.networkError('网络连接失败', {
    onRetry: () => retryRequest()
  });
}

// 认证错误 - 引导用户重新登录
if (error.response?.status === 401) {
  enhancedToast.error('登录已过期，请重新登录', {
    action: {
      label: '去登录',
      onClick: () => navigate('/login')
    }
  });
}

// 权限错误 - 提供申请权限选项
if (error.response?.status === 403) {
  enhancedToast.permissionError('权限不足', {
    action: {
      label: '申请权限',
      onClick: () => requestPermission()
    }
  });
}
```

### 2. 表单验证

实现实时验证和友好的错误提示：

```jsx
const validateField = (name, value) => {
  const errors = {};
  
  switch (name) {
    case 'email':
      if (!value) {
        errors.email = '邮箱不能为空';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.email = '邮箱格式不正确';
      }
      break;
      
    case 'password':
      if (!value) {
        errors.password = '密码不能为空';
      } else if (value.length < 8) {
        errors.password = '密码长度至少8位';
      }
      break;
  }
  
  return errors;
};
```

### 3. 错误日志

在生产环境中记录错误信息：

```jsx
const logError = (error, context) => {
  if (process.env.NODE_ENV === 'production') {
    // 发送到错误监控服务（如Sentry）
    Sentry.captureException(error, {
      tags: {
        component: context.component,
        action: context.action
      }
    });
  } else {
    // 开发环境下在控制台输出
    console.error('Error:', error, 'Context:', context);
  }
};
```

### 4. 用户体验优化

- **渐进式错误处理**: 先尝试自动恢复，再显示错误信息
- **上下文相关的错误信息**: 根据用户当前操作提供相关的错误提示
- **操作指导**: 告诉用户下一步应该怎么做
- **错误预防**: 通过表单验证等方式预防错误发生

## 演示页面

访问 `/error-demo` 页面可以查看所有错误处理组件的演示效果，包括：

- Toast通知的各种类型
- 表单验证的实时反馈
- 错误页面的不同样式
- ErrorBoundary的错误捕获

## 配置选项

### Toast配置

在 `App.js` 中可以配置全局Toast样式：

```jsx
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      // 更多样式配置
    }
  }}
/>
```

### 错误消息配置

在 `config/index.js` 中定义常用的错误消息：

```jsx
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器暂时无法响应，请稍后重试',
  UNAUTHORIZED: '登录已过期，请重新登录',
  FORBIDDEN: '您没有权限执行此操作',
  // 更多错误消息
};
```

## 总结

这套错误处理系统提供了：

1. **全面的错误覆盖**: 从JavaScript错误到API错误，从表单验证到网络问题
2. **用户友好的界面**: 清晰的错误信息和操作指导
3. **开发者友好的工具**: 统一的API和丰富的配置选项
4. **生产环境就绪**: 错误日志、监控集成和性能优化

通过使用这套系统，可以显著提升用户体验，减少用户困惑，并帮助开发团队更好地定位和解决问题。