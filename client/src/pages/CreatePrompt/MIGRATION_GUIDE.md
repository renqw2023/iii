# CreatePrompt 组件拆分实施指南

## 概述

本指南详细说明了如何从原始的 `CreatePrompt.js` 组件迁移到拆分后的模块化结构。拆分后的组件提供了更好的可维护性、可测试性和代码复用性。

## 文件结构

```
CreatePrompt/
├── components/           # 子组件
│   ├── BasicInfoForm.js     # 基本信息表单
│   ├── StyleParamsForm.js   # 风格参数表单
│   ├── AdvancedForm.js      # 高级信息表单
│   ├── FileUpload.js        # 文件上传组件
│   ├── TagManager.js        # 标签管理组件
│   └── PromptPreview.js     # 提示词预览组件
├── hooks/                # 自定义 Hooks
│   ├── useFormData.js       # 表单数据管理
│   ├── useFileUpload.js     # 文件上传管理
│   ├── useTagManager.js     # 标签管理
│   └── usePromptPreview.js  # 提示词预览生成
├── utils/                # 工具函数
│   ├── errorHandling.js     # 错误处理
│   ├── formValidation.js    # 表单验证
│   └── promptGenerator.js   # 提示词生成
├── CreatePromptRefactored.js # 重构后的主组件
├── index.js              # 导出文件
└── MIGRATION_GUIDE.md    # 本文档
```

## 迁移步骤

### 第一阶段：准备工作

1. **备份原始文件**
   ```bash
   cp CreatePrompt.js CreatePrompt.backup.js
   ```

2. **确保所有依赖已安装**
   - react-hook-form
   - react-dropzone
   - react-i18next
   - react-hot-toast
   - lucide-react

### 第二阶段：逐步替换

#### 方案A：直接替换（推荐用于测试环境）

1. **重命名原始文件**
   ```bash
   mv CreatePrompt.js CreatePrompt.legacy.js
   ```

2. **重命名新文件**
   ```bash
   mv CreatePromptRefactored.js CreatePrompt.js
   ```

3. **更新导入路径**
   如果有其他文件导入 CreatePrompt 组件，确保路径正确。

#### 方案B：渐进式迁移（推荐用于生产环境）

1. **创建新的路由**
   在路由配置中添加新的路径：
   ```javascript
   // 在 App.js 或路由配置文件中
   import CreatePromptRefactored from './pages/CreatePrompt/CreatePromptRefactored';
   
   // 添加新路由
   <Route path="/prompts/create-new" element={<CreatePromptRefactored />} />
   ```

2. **并行测试**
   - 保持原有路由 `/prompts/create` 使用旧组件
   - 新路由 `/prompts/create-new` 使用新组件
   - 进行充分测试

3. **逐步切换**
   测试完成后，将新组件替换旧组件。

### 第三阶段：验证和测试

#### 功能验证清单

- [ ] 表单字段正常显示和输入
- [ ] 表单验证规则正确执行
- [ ] 文件上传功能正常
- [ ] 标签添加和删除功能正常
- [ ] 提示词预览实时更新
- [ ] 复制功能正常工作
- [ ] 表单提交成功
- [ ] 错误处理正确显示
- [ ] 国际化文本正确显示
- [ ] 响应式布局正常

#### 性能验证

- [ ] 组件渲染性能
- [ ] 内存使用情况
- [ ] 文件上传性能
- [ ] 表单响应速度

## 主要改进点

### 1. 模块化结构
- **原始**: 单一大文件（782行）
- **拆分后**: 多个小文件，每个文件职责单一

### 2. 状态管理
- **原始**: 所有状态混合在一个组件中
- **拆分后**: 使用自定义 Hooks 分离状态逻辑

### 3. 代码复用
- **原始**: 逻辑耦合，难以复用
- **拆分后**: 组件和 Hooks 可独立复用

### 4. 测试友好
- **原始**: 难以进行单元测试
- **拆分后**: 每个模块可独立测试

## 潜在问题和解决方案

### 1. 导入路径问题

**问题**: 相对路径可能导致导入错误

**解决方案**:
```javascript
// 使用绝对路径或配置路径别名
import { useFormData } from '@/pages/CreatePrompt/hooks/useFormData';
```

### 2. Props 传递复杂

**问题**: 多层组件间 props 传递可能复杂

**解决方案**:
- 使用 Context API 共享状态
- 合理设计 props 接口
- 考虑使用状态管理库（如 Zustand）

### 3. 性能问题

**问题**: 组件拆分可能导致不必要的重渲染

**解决方案**:
```javascript
// 使用 React.memo 优化组件
export default React.memo(BasicInfoForm);

// 使用 useMemo 和 useCallback 优化
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

## 回滚计划

如果迁移过程中遇到问题，可以快速回滚：

1. **恢复原始文件**
   ```bash
   mv CreatePrompt.legacy.js CreatePrompt.js
   ```

2. **更新路由配置**
   移除新组件的路由配置

3. **清理新文件**
   可选择保留新文件用于后续改进

## 后续优化建议

### 1. 添加 TypeScript 支持
```typescript
// 为组件添加类型定义
interface BasicInfoFormProps {
  formData: UseFormReturn<FormData>;
  tagManager: TagManagerReturn;
}
```

### 2. 添加单元测试
```javascript
// 为每个组件和 Hook 添加测试
import { render, screen } from '@testing-library/react';
import BasicInfoForm from '../BasicInfoForm';

test('renders basic info form', () => {
  // 测试代码
});
```

### 3. 性能监控
```javascript
// 添加性能监控
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log('Component render time:', actualDuration);
}

<Profiler id="CreatePrompt" onRender={onRenderCallback}>
  <CreatePrompt />
</Profiler>
```

### 4. 错误边界
```javascript
// 添加错误边界组件
class CreatePromptErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## 总结

通过这次拆分，CreatePrompt 组件从一个782行的大文件变成了多个职责单一的小模块。这种结构提供了：

- **更好的可维护性**: 每个文件职责明确，易于理解和修改
- **更高的可复用性**: 组件和 Hooks 可以在其他地方复用
- **更强的可测试性**: 每个模块可以独立测试
- **更好的开发体验**: 代码组织清晰，开发效率提高

建议按照本指南逐步实施迁移，确保每个步骤都经过充分测试。