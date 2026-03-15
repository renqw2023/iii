# Stage 43 — Generation 面板参考图优化：多图支持 + 拖拽修复

**日期**: 2026-03-15
**状态**: ✅ 完成
**commit**: 待提交
**修改文件**: `client/src/components/UI/Img2PromptPanel.js`

---

## 需求描述

对标 meigen.ai 的 Generate 面板，优化 III.PICS Generation 面板中的两个区域：

1. **Reverse Prompt（Card 1）**：右侧空白占位图 → 改为带插图的视觉占位符
2. **Drop or upload reference（Card 2）**：
   - 单图 → 多图支持（最多 4 张，同 meigen.ai 的 `1/4` 计数器）
   - 拖拽图片添加成功率极低 → 修复根因

---

## meigen.ai 竞品分析

### 分析方法

打开 meigen.ai，通过 Chrome DevTools 提取 Generate 面板 DOM，分析其 HTML 结构与实现方式。

### 关键发现

**Card 1 "Describe Image"**：
- 右侧使用真实 jpg 图片作为叠放缩略图（`/images/gallery-card-back.jpg` + `gallery-card-front.jpg`）
- 后卡片 `-rotate-12deg`，前卡片直立，营造立体叠放感

**Card 2 "Drop or upload reference"**：
```html
<input accept="image/jpeg,image/png,image/webp" multiple="" class="hidden" type="file">
```
- `multiple` 属性 → 支持多图上传
- 空态：dashed 边框 + icon + "optional" 标签 + `+` 按钮
- 有图态：缩略图横排，每图独立 `×` 删除按钮，末尾保留 `+` 添加按钮
- 底部计数：`1/4`（最多 4 张）

---

## 技术问题分析

### 问题 1：Card 1 右侧空白占位图

**症状**：Reverse Prompt 卡片右侧两个灰色方块，完全空白，无视觉信息
**根因**：原实现仅用 `<div style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}>`，无任何内容
**解决方案**：替换为带 SVG 插图的占位符：
- 后卡片：蓝紫色背景，SVG 风景画（天空、山脉、太阳）
- 前卡片：浅紫色背景，SVG 人物头像（圆形头+身体轮廓）

---

### 问题 2：拖拽参考图 90% 失败

**症状**：用户将 Gallery/Sref 页面的图片卡拖入 Card 2，约 90% 情况不生效
**根因分析**：

站内图片卡拖拽使用 `dataTransfer.setData('application/json', JSON.stringify({ image, prompt }))` 携带数据，**不产生 FileList**。

原 `handleCard2Drop` 只处理 `e.dataTransfer.files`：

```js
// 原代码 —— 只处理 OS 文件拖入，忽略站内卡片拖拽
const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
files.forEach(f => addRefFile(f));
```

| 拖拽来源 | `files` | `application/json` | 原代码结果 |
|---------|--------|-------------------|-----------|
| OS 本地文件 | ✅ 有内容 | ❌ | ✅ 成功 |
| Gallery/Sref 卡片 | ❌ 空 | ✅ 有内容 | ❌ **静默失败** |

站内拖拽占绝大多数使用场景，导致体感失败率达到 90%。

---

## 修改说明

### 1. Card 1 — 视觉占位符

替换原有两个空白灰色 `<div>` 为带 SVG 内容的彩色占位符：

```jsx
{/* 后卡片 — 风景画 */}
<div style={{ ..., backgroundColor: '#e8eaf6', transform: 'rotate(-12deg)' }}>
  <svg viewBox="0 0 32 32">
    <rect fill="#c5cae9" />          {/* 天空 */}
    <circle cx="22" cy="10" r="4" fill="#9fa8da" />  {/* 太阳 */}
    <polygon ... fill="#7986cb" />   {/* 山脉 */}
  </svg>
</div>

{/* 前卡片 — 人物头像 */}
<div style={{ ..., backgroundColor: '#ede7f6' }}>
  <svg viewBox="0 0 32 32">
    <rect fill="#e8eaf6" />
    <circle cx="16" cy="12" r="5" fill="#b39ddb" />   {/* 头部 */}
    <path d="M6 28 Q6 20 16 20 Q26 20 26 28" fill="#9575cd" />  {/* 身体 */}
  </svg>
</div>
```

### 2. Card 2 — 多图状态管理

**状态重构**（5个独立 state → 1个数组）：

```js
// 移除：
// const [refImageFile, setRefImageFile] = useState(null);
// const [refImageB64, setRefImageB64] = useState(null);
// const [refMimeType, setRefMimeType] = useState(null);
// const [refPreview, setRefPreview] = useState(null);
// const [refImageUrl, setRefImageUrl] = useState(null);

// 新增：
const [refImages, setRefImages] = useState([]); // 每项: { preview, b64, mime, url }
const MAX_REF = 4;
```

**文件处理函数**：由覆盖式 → 追加式

```js
const addRefFile = (f) => {
  if (!f?.type?.startsWith('image/')) { toast.error('Please select an image file'); return; }
  if (refImages.length >= MAX_REF) { toast.error(`Maximum ${MAX_REF} reference images`); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    setRefImages(prev => [...prev, { preview: dataUrl, b64: dataUrl.split(',')[1], mime: f.type, url: null }]);
  };
  reader.readAsDataURL(f);
};
```

**prefill 消费**（来自 Use as Reference 按钮）：

```js
if (prefillJob.referenceImageUrl) {
  setRefImages([{ preview: prefillJob.referenceImageUrl, b64: null, mime: null, url: prefillJob.referenceImageUrl }]);
}
```

**生成调用**：取第一张图发送（Gemini API 目前只支持单张参考图）

```js
...(refImages[0]?.b64
  ? { referenceImageData: refImages[0].b64, referenceImageMime: refImages[0].mime }
  : refImages[0]?.url ? { referenceImageUrl: refImages[0].url } : {})
```

### 3. Card 2 — 拖拽修复（核心）

```js
const handleCard2Drop = useCallback((e) => {
  e.preventDefault();
  setIsDragging2(false);

  // ① 优先处理 Gallery/Sref 卡片拖拽（JSON 含 image URL）
  const jsonData = e.dataTransfer.getData('application/json');
  if (jsonData) {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.image) {
        const url = parsed.image;
        setRefImages(prev => {
          if (prev.length >= MAX_REF) { toast.error(`Maximum ${MAX_REF} reference images`); return prev; }
          if (prev.some(r => r.url === url || r.preview === url)) return prev; // 去重
          return [...prev, { preview: url, b64: null, mime: null, url }];
        });
      }
    } catch (_) { /* ignore */ }
    return;
  }

  // ② 本地文件拖入（OS FileList）
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
  files.forEach(f => addRefFile(f));
}, [refImages.length]);
```

**关键设计**：
- JSON 拖拽优先，处理后立即 `return`（避免与文件逻辑冲突）
- URL 去重：同一张图不会被重复添加
- 服务端代理：URL 模式图片在 generate.js 服务端 fetch 转 base64，绕过浏览器 CORS 限制（Stage 42 已实现）

### 4. Card 2 — UI 双态设计

**空态**（`refImages.length === 0`）：
```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│  🖼 Drop or upload reference  [+] │
│     optional                      │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

**有图态**（`refImages.length > 0`）：
```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│ [img1×] [img2×] [img3×] [+]      │
│ 3/4 · Will be sent with prompt   │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```
- 每张缩略图：40×40px，圆角 8px，右上角红色 `×` 删除按钮（16px）
- `+` 按钮：虚线边框，hover 变紫色
- 整个区域仍可继续拖拽（有图态也接受 drop）

### 5. Input 多选支持

```jsx
<input ref={refFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
       onChange={(e) => { [...e.target.files].forEach(f => addRefFile(f)); e.target.value = ''; }} />
```

---

## 排查过程记录

### 问题：DesktopDock 不出现在 DOM

**症状**：修改代码后，Chrome DevTools 找不到 dock 的 fixed 定位元素
**排查**：检查控制台无报错；逐步确认 Layout.js 正确引用 DesktopDock；确认 CRA 仍在编译中（热更新延迟）
**结论**：非代码问题，为 CRA 热编译期间的临时状态，等待编译完成后正常恢复

### 问题：拖拽失败根因确认

**验证方式**：在 Gallery 页面检查 GalleryCard 的 `draggable` 和 `onDragStart` 实现，确认其使用 `setData('application/json', ...)` 而非原生文件拖拽。与 Card 2 原有 handler 对比，确认为类型不匹配导致的静默失败。

---

## 验证清单

| 验证项 | 结果 |
|--------|------|
| Card 1 占位图有视觉内容（非空白灰块）| ✅ |
| Card 2 空态：dashed 边框 + optional 标签 + + 按钮 | ✅ |
| Card 2 从 OS 拖入本地图片 | ✅ |
| Card 2 从 Gallery 卡片拖入图片 | ✅ 修复 |
| Card 2 点击 + 打开文件选择器（支持多选）| ✅ |
| Card 2 有图态：缩略图横排 + × 删除 + + 添加 | ✅ |
| Card 2 最多 4 张，超出有 toast 提示 | ✅ |
| Card 2 URL 去重（同一图不重复添加）| ✅ |
| Use as Reference → 参考图自动填充 | ✅ |
| Generate Image 正常携带第一张参考图 | ✅ |

---

## 拖拽数据类型对照表

| 场景 | `dataTransfer.files` | `dataTransfer.getData('application/json')` |
|------|---------------------|-------------------------------------------|
| OS 拖入本地文件 | ✅ FileList | ❌ 空 |
| Gallery 卡片拖入 | ❌ 空 | ✅ `{ image, prompt }` |
| Sref 卡片拖入 | ❌ 空 | ✅ `{ image, prompt }` |

---

*文档创建：2026-03-15*
*适用版本：Stage 43*
