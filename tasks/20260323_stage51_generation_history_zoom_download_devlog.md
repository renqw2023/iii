# Stage 51 开发日志 — Generation History 图片放大 & 下载修复

**日期**: 2026-03-23
**分支**: main
**涉及文件**:
- `client/src/components/UI/GenerationCard.js`
- `client/src/pages/GenerateHistory.js`

---

## 一、背景

### 1.1 图片无法放大

Generation History 页面的图片卡片没有放大预览功能。视频卡片已有全屏按钮（`Maximize2`），但图片侧完全缺失，用户只能看到缩略图尺寸，无法查看生成细节。

### 1.2 下载功能受限

原有下载使用 `a.href + a.click()` 直链方式，在部分浏览器/系统下会触发页面导航而非文件下载，导致用户无法正常保存图片。

---

## 二、实现方案

### 2.1 图片放大 Lightbox（GenerationCard.js）

#### 功能设计

- hover 图片卡片时，右上角显示 `Maximize2` 放大按钮（与视频的全屏按钮位置一致）
- 点击后弹出全屏 Lightbox：
  - 深色遮罩（`rgba(0,0,0,0.88)`）
  - 图片居中，`max 90vw / 90vh`，保持原始比例
  - 右上角 X 关闭按钮
  - 右下角 Download 下载按钮（直接调用 `onDownload`）
  - 底部居中显示 prompt（最多 2 行，截断）
  - 点击遮罩背景关闭
  - ESC 键关闭

#### 关键技术决策：ReactDOM.createPortal

**问题**：最初使用 `position: fixed; inset: 0; z-index: 9999` 实现 Lightbox，实测发现遮罩范围不是全视口，而是被白色卡片容器限制。

**根因排查**：

```js
// 实测数据
overlay:   { w: 1496, left: 281, top: 17 }  // 限制在容器内
viewport:  { w: 2134, h: 1021 }

// GenerateHistory.js 容器样式
{
  backdropFilter: 'blur(48px)',   // ← 元凶
  overflow: 'hidden',
}
```

Chrome（Blink 引擎）将 `backdrop-filter` 非 none 的元素视为 `position: fixed` 子元素的新 containing block，与 `filter`/`transform` 行为一致（CSS 规范 §9.3）。这导致 `position: fixed` 相对该容器定位，而非视口。

**修复**：使用 `ReactDOM.createPortal` 将 Lightbox 渲染为 `document.body` 的直接子节点：

```jsx
import { createPortal } from 'react-dom';

// 挂载到 body，彻底脱离任何祖先的 containing block
{lightboxOpen && !isVideo && createPortal(
  <div style={{ position: 'fixed', inset: 0, zIndex: 9999, ... }}>
    ...
  </div>,
  document.body
)}
```

**修复后实测**：

```js
// portal 渲染到 body
bodyLastChildTag: "DIV"
bodyLastChildStyle: "position: fixed; inset: 0px; z-index: 9999; ..."
htmlTransform: "none"
bodyTransform: "none"

// 覆盖全视口 ✓
```

#### ESC 键处理

```js
useEffect(() => {
  if (!lightboxOpen) return;
  const onKey = (e) => { if (e.key === 'Escape') setLightboxOpen(false); };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, [lightboxOpen]);
```

cleanup 函数确保组件卸载时移除监听器，防止内存泄漏。

---

### 2.2 下载修复（GenerateHistory.js）

#### 原有方式的问题

```js
// 原代码 — 部分浏览器会触发导航而非下载
const a = document.createElement('a');
a.href = url;
a.download = `generated_${Date.now()}.png`;
a.click();
```

浏览器对 `<a download>` 的处理取决于：
- 资源是否跨域（跨域无效，`download` 属性被忽略）
- `Content-Disposition` response header 是否存在
- 浏览器安全策略

#### 修复方案：fetch → blob → ObjectURL

```js
const handleDownload = async (job) => {
  // ...
  try {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);   // 本地 blob:// URL，download 属性100%生效
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `iii_generated_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);                // 及时释放内存
  } catch {
    // Fallback: 降级直链下载
    const a = document.createElement('a');
    a.href = url;
    a.download = `iii_generated_${Date.now()}.png`;
    a.click();
  }
};
```

`blob://` URL 是同源本地资源，`<a download>` 对其100%生效，不受跨域或 Content-Disposition 限制。`URL.revokeObjectURL` 在点击后立即释放，防止内存泄漏。

---

## 三、改动清单

### `client/src/components/UI/GenerationCard.js`

| 改动 | 内容 |
|------|------|
| import 新增 | `createPortal` from `react-dom`，`useEffect` from `react` |
| state 新增 | `lightboxOpen` boolean |
| useEffect 新增 | ESC 键监听（lightboxOpen 为 true 时挂载）|
| 按钮新增 | 图片卡片右上角 `Maximize2` 按钮（hover 时显示）|
| Lightbox 新增 | 通过 `createPortal` 渲染到 `document.body` 的全屏遮罩 |

### `client/src/pages/GenerateHistory.js`

| 改动 | 内容 |
|------|------|
| `handleDownload` 重写 | fetch → blob → ObjectURL，含 fallback |
| 文件名前缀 | `generated_` → `iii_generated_`（品牌标识）|

---

## 四、验证结果

| 测试项 | 结果 |
|--------|------|
| 图片 hover 显示 Maximize2 按钮 | ✓ |
| 点击按钮弹出 Lightbox | ✓ |
| Lightbox 覆盖全视口（含侧边栏）| ✓（portal 修复后）|
| ESC 键关闭 | ✓ |
| 点击遮罩背景关闭 | ✓ |
| 点击图片本身不关闭 | ✓（stopPropagation）|
| Lightbox 内 Download 按钮 | ✓ |
| Chrome Console 无报错 | ✓ |

---

## 五、已知限制 / 后续优化方向

- Lightbox 无左右切换（多图浏览）—— 若历史记录图片较多，可考虑添加键盘左右箭头导航
- 移动端手势缩放（pinch-to-zoom）—— 目前仅桌面端优化
- Lightbox 打开时未禁用 body scroll —— 可添加 `document.body.style.overflow = 'hidden'`

