# Stage 35 — GenerateHistory 背景修复 + 构建警告全清 Dev Log

**日期**: 2026-03-13
**分支**: main
**耗时**: ~30 min
**状态**: ✅ 完成，`Compiled successfully.`（零警告）

---

## 背景

用户反馈两个问题：
1. `/generate-history` 页面视觉上是「孤立的」，没有沿用 `/gallery`、`/explore` 等页面的紫色渐变背景
2. 前端构建存在多处 ESLint 警告，影响构建输出干净度

---

## 问题一：GenerateHistory 背景缺失

### 根因

`GenerateHistory.js` 的外层容器 `div` 没有设置背景色，直接继承了 `body` 的 `--bg-primary: #ffffff`（纯白色）。

而 Gallery / Explore 页面使用了 `.gallery-page` CSS 类，该类应用：
```css
background: var(--page-bg);
/* light: linear-gradient(135deg, #e8edff 0%, #f3eeff 60%, #fdf0ff 100%) */
/* dark: #0b0f1a */
```

`MeshBackground` 组件虽挂载在 `Layout.js` 中，但 `enabled` 参数默认为 `false`（`opacity: 0`），并非页面背景的来源。

### 修复

在 `GenerateHistory.js` 外层 `div` 加入 `background: 'var(--page-bg)'`：

```jsx
// Before
<div style={{ minHeight: '100vh', padding: 0 }}>

// After
<div style={{ minHeight: '100vh', padding: 0, background: 'var(--page-bg)' }}>
```

**效果**：浮动卡片后面现在显示与 Gallery 一致的紫色渐变底色，深色模式同步生效（`#0b0f1a`）。

---

## 问题二：ESLint 构建警告（6 文件）

### 修复清单

| 文件 | 问题 | 修复方式 |
|------|------|---------|
| `GalleryCard.js` | `MODEL_COLORS` 定义未使用；`onFavorite` 参数未使用 | 删除 `MODEL_COLORS` 常量；将参数重命名为 `_onFavorite` |
| `Sidebar.js` | `credits`（计算值）和 `isFilterPage`（布尔值）定义但从未引用 | 删除两行赋值语句（计算 `creditsData` 已直接作为 prop 传入） |
| `Img2PromptPanel.js` | 多个未使用 import + 大量死代码 | 见下方详细说明 |
| `SeedanceList.js` | `useLocation` import 未使用 | 从 react-router-dom import 中移除 |
| `App.js` | `GenerateHistory` 被 ESLint 错误标记为未使用 | 添加 `// eslint-disable-line no-unused-vars` 注释（假阳性：组件在 JSX line 130 中实际被使用，系 CRA 自定义 `no-unused-vars` 规则覆盖导致 JSX 变量追踪失效） |

### Img2PromptPanel.js 专项清理（最大变更）

#### 删除的死代码：`GenerationStatusCard` + `STATUS_MESSAGES`

`GenerationStatusCard` 是**阶段29早期版本**遗留的生成状态展示组件（232 行），已被 `GenerationCard`（独立组件）替代，但从未被清理。

```
删除行数：lines 38–269（232 行）
删除内容：
  - STATUS_MESSAGES 常量（6行）
  - GenerationStatusCard 组件（226行，含 loading/error/success 三态 JSX）
```

#### 删除的无用 import

```js
// 删除前
import {
  X, Copy, Check, Loader2, Image as ImageIcon, Plus,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Zap, ExternalLink, Wand2, Download, Link, AlertCircle, RefreshCw, CheckCircle2,
} from 'lucide-react';
const FAQ_LINKS = [...];

// 删除后
import {
  X, Copy, Check, Loader2, Image as ImageIcon, Plus,
  ChevronLeft, ChevronRight, ChevronDown,
  Zap, Wand2,
} from 'lucide-react';
```

移除：`ChevronUp`, `ExternalLink`, `FAQ_LINKS`, `Download`, `Link`, `AlertCircle`, `RefreshCw`, `CheckCircle2`（共 8 个）

#### `ReverseTab` 参数修复

`onClose` 从父组件传入 `ReverseTab` 但 Tab 内部不调用它，改为 `_onClose` 以满足 `argsIgnorePattern: '^_'` 规则。

---

## 构建前后对比

```
修复前:
Compiled with warnings.
[eslint] 7 warnings across 5 files

修复后:
Compiled successfully.
```

### Bundle 体积变化

| | JS (gzip) | CSS |
|--|-----------|-----|
| 修复前 | 578.77 kB | 20.87 kB |
| 修复后 | 略减（232行死代码删除） | 无变化 |

---

## 文件修改清单

```
client/src/pages/GenerateHistory.js          ← 加 background: var(--page-bg)
client/src/components/Gallery/GalleryCard.js  ← 删 MODEL_COLORS，_onFavorite
client/src/components/Layout/Sidebar.js       ← 删 credits, isFilterPage
client/src/components/UI/Img2PromptPanel.js   ← 删 232行死代码 + 8个unused import
client/src/pages/Seedance/SeedanceList.js     ← 删 useLocation import
client/src/App.js                             ← eslint-disable GenerateHistory假阳性
```

---

## 技术笔记

### CRA `no-unused-vars` 假阳性根因

`.eslintrc.js` 中对 `no-unused-vars` 的自定义配置会**完整覆盖** `react-app` preset 的同名规则，包括 `plugin:react/jsx-uses-vars` 标记 JSX 中变量为"已使用"的机制。导致 App.js 中 `<GenerateHistory />` JSX 用法无法被 ESLint 识别，触发误报。

**永久解法**：可在 `.eslintrc.js` 中添加 `'react/jsx-uses-vars': 'error'` 强制启用该规则，优先级高于自定义 `no-unused-vars`。

---

## 后续

- 考虑是否启用 `'react/jsx-uses-vars': 'error'` 彻底修复假阳性
- 阶段36 计划：`/register` 页烟花扩散式视觉重设计（见方案分析文档）
