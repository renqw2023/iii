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
