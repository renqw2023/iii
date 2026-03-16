# Stage 44 开发日志 — i18n 多语言修复 + Docs 内容更新 + 侧边栏子菜单截断修复

**日期**: 2026-03-16
**Commit**: (见 git log)
**分支**: main

---

## 一、背景与目标

本阶段解决了三类遗留问题：

1. **侧边栏头像弹窗的二级子菜单被截断** — Dashboard / Contact Us / Language 子菜单在主内容区域之后被覆盖/裁切
2. **/docs 页面内容严重过时** — 大量内容仍在描述"发布内容"的旧模式，缺少积分系统、AI 图像生成等核心功能说明
3. **前端中英文混合界面** — 多处用户可见的 UI 文字、Toast 通知、错误信息硬编码为中文，与英文主界面混排

---

## 二、修复一：侧边栏子菜单截断

### 根本原因

`Layout.js` 中的侧边栏 wrapper 使用 `position: sticky`，但没有设置 `z-index`。由于 DOM 中主内容区（`<div className="flex-1 flex flex-col">`）位于侧边栏之后，默认 stacking order 下主内容区在 sticky 侧边栏上方渲染，导致溢出侧边栏范围的子菜单（如 Dashboard 二级菜单）被主内容遮挡或裁切。

### 修复方案

在 `client/src/components/Layout/Layout.js` 的侧边栏 wrapper 上添加 `zIndex: 40`：

```jsx
// 修复前
<div
  className="hidden md:block sticky top-0 h-screen flex-shrink-0 overflow-visible"
  style={{ width: collapsed ? 64 : 264, transition: 'width 0.25s ease' }}
>

// 修复后
<div
  className="hidden md:block sticky top-0 h-screen flex-shrink-0 overflow-visible"
  style={{ width: collapsed ? 64 : 264, transition: 'width 0.25s ease', zIndex: 40 }}
>
```

侧边栏自身 stacking context (z-index 40) 高于主内容区 (z-index: auto)，子菜单（z-index 200/210）在侧边栏 stacking context 内部相对排列，正常可见。

**修改文件**: `client/src/components/Layout/Layout.js`

---

## 三、修复二：/docs 页面内容更新

### 背景

`/docs` 页面内容（`client/src/content/docsContent.js`）仍在描述项目早期的 UGC 发布模式（Create 上传 9 个文件发帖），与当前实际功能严重不符。

### 更新内容

重写了 en / zh / ja 三语言全部文档内容，**新增了两个核心 section**：

| Section | 说明 |
|---------|------|
| **Credits（新增）** | 双积分体系（40/天免费 + 永久积分）、各模型消耗积分、获取方式（每日刷新/签到/邀请）、购买套餐 |
| **Generate（新增）** | 5 个可用模型及消耗积分、参考图最多 4 张、2K/4K 放大（需购买一次解锁）、生成历史 |

**更新的 sections**：

- `Quick Start` — 重写为"登录→积分→打开生成面板→选模型→写提示词→生成"的实际工作流
- `About` — 更新为当前实际功能清单（多模型生成 + Gallery 9000+ + 参考图 + 2K/4K 等）
- `Help` — 将"Create 上传帖子"替换为真实使用场景（积分不足、生成失败、收藏/历史区别）
- `Privacy` — 补充 Google OAuth、生成图像、提示词发送给模型提供商等现行数据处理说明
- `Terms` — 新增积分与支付条款（消耗不退款、免费积分无现金价值、解锁条件）

**修改文件**: `client/src/content/docsContent.js`（完全重写，三语言 ~1200 行）

---

## 四、修复三：i18n 多语言覆盖补全

### 问题范围

通过代码扫描，发现以下文件存在用户可见的中文硬编码字符串：

| 文件 | 问题 | 严重度 |
|------|------|--------|
| `contexts/AuthContext.js` | 登录/注册/登出/Google OAuth 全部 toast 为中文 | 高 |
| `pages/Img2Prompt.js` | 整页 UI（标题、说明、按钮、结果框、错误提示）均为中文 | 高 |
| `pages/Health.js` | 状态标签、按钮、更新时间均为中文 | 中 |
| `CreatePrompt/utils/errorHandling.js` | 400/500/网络错误 toast 为中文 | 高 |
| `CreatePrompt/utils/formValidation.js` | 文件数量/类型/大小校验错误为中文 | 中 |
| `contexts/NotificationContext.js` | console.error 日志为中文（非 UI 可见，但不规范）| 低 |

### 修复策略

1. **React 组件** (`Img2Prompt.js`, `Health.js`)：添加 `useTranslation` hook，所有字符串换为 `t('key')`
2. **Context / 工具函数** (`AuthContext.js`, `errorHandling.js`)：直接 `import i18n from '../i18n'`，使用 `i18n.t('key')`（React hook 不可在非组件函数中使用）
3. **纯工具函数** (`formValidation.js`)：将中文错误字符串直接替换为英文（不依赖 i18n，确保 fallback 可用）

### 新增翻译键（三语言同步）

在 `i18n/locales/{en-US,zh-CN,ja-JP}.json` 末尾新增以下 4 个顶层 section：

```
auth.toast.*          (14 个键) — 登录/注册/登出/Google/邮箱验证的 toast 消息
img2prompt.*          (10 个键) — 图生文页面所有 UI 文字
health.*              (13 个键) — 系统健康页面所有 UI 文字
createPrompt.errors.* (11 个键) — 表单提交/文件校验错误
```

### 主要变更详情

**AuthContext.js**
```js
// 修复前
toast.success('登录成功！欢迎回来！', { icon: '🎉' });

// 修复后
import i18n from '../i18n';
toast.success(i18n.t('auth.toast.loginSuccess'), { icon: '🎉' });
```

**Img2Prompt.js**（示例）
```jsx
// 修复前
<h1>图生文</h1>
toast.error('请选择图片文件');

// 修复后
const { t } = useTranslation();
<h1>{t('img2prompt.title')}</h1>
toast.error(t('img2prompt.toast.imageOnly'));
```

**Health.js**
- `useCallback` 包裹 `checkHealth`（同时修复 ESLint `react-hooks/exhaustive-deps` 警告）
- 全部中文 label 替换为 `t('health.*')` 调用

**修改文件**:
- `client/src/contexts/AuthContext.js`
- `client/src/pages/Img2Prompt.js`（完全重写）
- `client/src/pages/Health.js`
- `client/src/pages/CreatePrompt/utils/errorHandling.js`
- `client/src/pages/CreatePrompt/utils/formValidation.js`
- `client/src/contexts/NotificationContext.js`
- `client/src/i18n/locales/en-US.json`
- `client/src/i18n/locales/zh-CN.json`
- `client/src/i18n/locales/ja-JP.json`

---

## 五、修复四：ESLint 构建警告

两处 webpack 编译警告一并修复：

### 警告 1 — `GalleryCard.js` 未使用变量

```
'Bookmark' is defined but never used.
```

**修复**：从 lucide-react import 中移除 `Bookmark`。

```js
// 修复前
import { Wand2, Share2, Heart, Eye, Bookmark } from 'lucide-react';
// 修复后
import { Wand2, Share2, Heart, Eye } from 'lucide-react';
```

### 警告 2 — `Health.js` Hook 依赖缺失

```
React Hook useEffect has a missing dependency: 'checkHealth'.
```

**修复**：将 `checkHealth` 改为 `useCallback` 包裹，移至 `useEffect` 之前，并加入依赖数组。

```js
// 修复前
useEffect(() => { checkHealth(); ... }, []);
const checkHealth = async () => { ... };

// 修复后
const checkHealth = useCallback(async () => { ... }, [t]);
useEffect(() => { checkHealth(); ... }, [checkHealth]);
```

**修改文件**:
- `client/src/components/Gallery/GalleryCard.js`
- `client/src/pages/Health.js`

---

## 六、i18n 覆盖现状（修复后）

| 类型 | 修复前 | 修复后 |
|------|--------|--------|
| 用户可见中文硬编码字符串 | ~40 处 | 0 处 |
| 仅注释/console 中的中文 | — | 保留（不影响 UI）|
| 新增翻译键数量 | — | +48 键（三语言） |
| 受影响页面 / 组件 | 6 个 | 全部修复 |

---

## 七、已知限制与后续

1. **`formValidation.js` 错误字符串** — 目前直接用英文硬编码（不走 i18n），因为该工具函数不在 React 组件上下文中。如需国际化，可改为接收 `t` 参数传入。
2. **`errorHandling.js` 服务端响应匹配** — `includes('文件')` / `includes('创建')` 依然匹配中文服务端报错，长期应改为错误码匹配（而非字符串匹配）。
3. **无 i18n 的英文页面**（Dashboard, Explore, GenerateHistory 等）— 目前已是英文，无中英混合问题，i18n 接入留作后续可选优化。
