# 阶段72：前端性能优化 — 开发日志

**日期**：2026-03-30  
**目标**：降低用户 CPU / 内存 / GPU 占用，优化首屏资源加载速度，不改变任何视觉或交互。

---

## 背景与问题分析

通过代码审查 + 浏览器审计，发现以下性能瓶颈：

| 优先级 | 问题描述 | 影响 |
|--------|----------|------|
| P0 | App.js 中 30+ 页面全部同步 import | 首屏需解析/编译全站 JS，白屏时间长 |
| P0 | MeshBackground `will-change: filter` 声明错误 | 浏览器每帧重计算 blur，持续 GPU 消耗 |
| P1 | html2canvas 打入主 bundle | ~60KB 无用代码首屏加载 |
| P2 | index.html 缺少 Google Fonts preconnect | 字体加载推迟 200-400ms |
| P2 | 生产构建生成 source map | 部署体积冗余 |
| P2 | VideoCard `<img>` 缺少 `decoding="async"` | 图片解码阻塞主线程 |

---

## 实施细节

### 1. Route-level Code Splitting（`client/src/App.js`）

**改动前**：所有页面静态 `import`，打入同一个 JS chunk。

**改动后**：
```js
import React, { Suspense, lazy } from 'react';

// 30+ 页面全部改为按需加载
const Home       = lazy(() => import('./pages/Home'));
const GalleryList = lazy(() => import('./pages/Gallery/GalleryList'));
// ... 所有页面

// Routes 外层包 Suspense
<Suspense fallback={<div className="min-h-screen" />}>
  <Routes>...</Routes>
</Suspense>
```

**效果**：首屏只下载当前路由 chunk，其余页面代码在用户导航时按需下载。  
**保留同步加载**：Layout、ErrorBoundary、LoginModal、SearchModal（首屏必需）。

**注意**：`import './i18n'` 必须保留在所有 static import 之后、lazy 声明之前，否则触发 ESLint `import/first` 规则导致编译失败（已修复）。

---

### 2. MeshBackground GPU 合成修复（`client/src/components/UI/MeshBackground.css`）

**问题根因**：`.mesh-bg-orb` 的 CSS `@keyframes` 动画实际动画的是 `transform`（translate/rotate/scale），但 `will-change: filter` 告诉浏览器 filter 属性会变化。这导致浏览器不能缓存模糊纹理，每帧都需要重新对大尺寸元素（inset -60%，覆盖整个屏幕）应用 `blur(60px)` / `blur(80px)`，持续消耗 GPU。

```css
/* 修改前 */
.mesh-bg-orb { will-change: filter; }

/* 修改后 */
.mesh-bg-orb { will-change: transform; }
```

**效果**：浏览器将带 blur 的 orb 光栅化为 GPU 纹理一次，之后每帧仅做 GPU transform 合成（极廉价），视觉完全不变。

---

### 3. html2canvas 动态导入（`client/src/components/ShareCard/ShareCardModal.js`）

```js
// 删除顶层 import
// import html2canvas from 'html2canvas';

// useEffect 内改为动态导入
const { default: html2canvas } = await import('html2canvas');
const canvas = await html2canvas(cardRef.current, { ... });
```

html2canvas 仅在用户打开 ShareCard Modal 时加载（约 60KB gz），不影响首屏。

---

### 4. Google Fonts Preconnect（`client/public/index.html`）

`index.css` 通过 `@import url('https://fonts.googleapis.com/...')` 加载 Inter 字体，但浏览器需先下载并解析 CSS 才能发现该 URL，延迟建立连接。

在 `<head>` 最顶部加入：
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

效果：DNS 查询 + TCP 握手提前并行进行，字体加载时连接已就绪。

---

### 5. 关闭生产 Source Map（`client/.env.production`）

```
GENERATE_SOURCEMAP=false
```

CRA 默认生产构建生成 `.map` 文件，Vercel 部署会上传这些文件增加体积，且用户浏览器可能下载它们。关闭后仅影响调试，不影响运行时性能。

---

### 6. VideoCard img `decoding="async"`（`client/src/components/Seedance/VideoCard.js`）

```jsx
<img
  src={thumbnailSrc}
  loading="lazy"
  decoding="async"   // ← 新增
/>
```

GalleryCard / SrefCard 已有此属性，VideoCard 补上。`decoding="async"` 让浏览器在非阻塞线程解码图片，避免滚动卡顿。

---

## 验证结果

| 验证项 | 结果 |
|--------|------|
| 首页视觉 | ✅ 完全一致 |
| Gallery 页 | ✅ 正常加载，masonry 布局完整 |
| Explore 页 | ✅ 正常加载 |
| 路由懒加载切换 | ✅ 无白屏，Suspense fallback 无 flash |
| 控制台错误 | ✅ 零错误 / 零警告 |
| Lighthouse SEO | ✅ 100 |
| Lighthouse Accessibility | ✅ 84 (desktop) / 89 (mobile) |

---

## 不做的优化（原因）

| 优化项 | 原因 |
|--------|------|
| 虚拟滚动 | masonry CSS grid-row-span 布局与虚拟列表不兼容，极复杂，高风险 |
| 响应式图片 srcset | 需后端 CDN 图片裁剪支持 |
| DesktopDock spring 节流 | framer-motion useSpring 已内部 RAF 批处理，改动有视觉风险 |
| 删除重复 qrcode 包 | 需逐一验证依赖，目前风险高 |

---

## 修改文件清单

```
client/public/index.html                          — 加 preconnect
client/src/App.js                                 — Route lazy + Suspense
client/src/components/Seedance/VideoCard.js       — decoding async
client/src/components/ShareCard/ShareCardModal.js — html2canvas 动态导入
client/src/components/UI/MeshBackground.css      — will-change: transform
client/.env.production                            — GENERATE_SOURCEMAP=false
tasks/20260330_frontend_perf_devlog.md            — 本文件
```

---

## 补丁修复（同日）

### Bug：移动端图片 Overlay 常驻显示

**现象**：Gallery（`/gallery`）和 Explore（`/explore`）两个图片列表页，在移动端打开时，卡片上的操作遮罩（作者名、❤️收藏、🔖书签、"Use Idea"按钮、分享按钮、`--sref code`等）始终可见，大面积遮挡图片内容，严重影响视觉体验。

**根因**：
- `gallery.css` 的 `@media (max-width: 767px)` 块中有规则 `.gallery-card-overlay { opacity: 1; pointer-events: auto; }` — 明确将 Gallery overlay 强制设为可见（触屏无 hover 状态的历史妥协）
- `LiblibStyleCard.css` 的 `@media (max-width: 767px)` 块有同类规则 `.liblib-card-overlay { opacity: 1; ... }` — 影响 Explore/SrefCard 的 overlay

**修复**：
- `gallery.css`：删除 `.gallery-card-overlay` 的移动端强制显示规则，回归 opacity:0 默认状态（overlay 仅桌面端 hover 时触发）
- `LiblibStyleCard.css`：将规则改为 `opacity: 0; pointer-events: none;`（明确覆盖，防止继承冲突）

**隔离保证**：两处修改全在 `@media (max-width: 767px)` 内，桌面端 hover 逻辑完全不受影响。

---

### Bug：移动端 Gallery/Seedance 单列布局（iPhone 14/15）

**现象**：390px 宽度（iPhone 14/15 标准宽度）的 Gallery 页面显示为单列，而预期为双列。

**根因**：`gallery.css` 有 `@media (max-width: 400px)` → `grid-template-columns: 1fr`，390px < 400px，触发了单列规则。

**修复**：将阈值从 `400px` 改为 `360px`，只有极小屏幕（如旧款 Android 小屏）才退化为单列，iPhone 14/15（390px）恢复双列。

---

### 构建警告清零（ESLint no-unused-vars）

构建输出 `Compiled with warnings`，6 处未用变量：

| 文件 | 问题 | 修复 |
|------|------|------|
| `DataSyncTab.js:369` | `source` 参数未用 | 改为 `_source` |
| `TrafficTab.js:98` | `color` 参数未用 | 改为 `_color` |
| `Credits.js:1` | `useRef` import 未用 | 移除 |
| `Subscription.js:1` | `useEffect`/`useState` 未用 | 移除；`barColor` 变量也删除 |
| `VideoFeedItem.js:38` | `onRequestUnmute` prop 未用 | 重命名为 `_onRequestUnmute` |

修复后 `npm run build` 输出 `Compiled successfully.`，零警告。

---

### 补丁验证结果

| 验证项 | 结果 |
|--------|------|
| 移动端 Gallery overlay 隐藏 | ✅ 图片干净，无遮挡 |
| 移动端 Explore overlay 隐藏 | ✅ 图片干净，无遮挡 |
| 移动端 Gallery 双列布局 (390px) | ✅ 恢复 2 列 |
| 桌面端 Gallery hover overlay | ✅ 仍正常显示（未受影响） |
| 桌面端 4 列布局 | ✅ 正常 |
| 构建警告 | ✅ 零警告（Compiled successfully） |

### 补丁修改文件清单

```
client/src/styles/gallery.css                               — 删除 overlay 强制显示；单列阈值 400→360px
client/src/components/Post/LiblibStyleCard.css              — overlay 移动端改为 opacity:0
client/src/components/Admin/tabs/DataSyncTab.js             — source → _source
client/src/components/Admin/tabs/TrafficTab.js              — color → _color
client/src/pages/Credits.js                                 — 移除未用 useRef
client/src/pages/Subscription.js                            — 移除未用 hooks + barColor
client/src/pages/VideoFeed/VideoFeedItem.js                 — onRequestUnmute → _onRequestUnmute
```
