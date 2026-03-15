# Stage 42 — 图片详情"用作参考图"功能开发日志

**日期**: 2026-03-15
**状态**: ✅ 完成
**commits**: 60f56b2 → f9171d7 → aed49f1

---

## 需求描述

用户在 `/gallery`（Gallery 图片详情）或 `/explore`（Sref 风格库详情）浏览图片时，
希望能一键将该图片填充到 AI Generation 面板的"参考图"输入框，直接用于图生图。

**目标行为**：
1. 详情页底部新增 **"Use as Reference"** 按钮（与 Copy 按钮并排等宽）
2. 点击后：详情 modal **自动关闭** → Generation 面板**自动弹出** → Card2 参考图区域显示预览图
3. 用户填写 Prompt 后即可生成以该图为参考的新图

---

## 技术难点分析

### 难点 1：跨组件通信

详情 Modal 和 Generation 面板是完全独立的组件树，不共享父子关系。
解决方案：复用已有的 `GenerationContext.setPrefill()` 机制。

```
GalleryModal/SrefModal
  → setPrefill({ referenceImageUrl })
  → GenerationContext (全局状态)
  → Layout.js useEffect 监听 prefillJob → setImg2promptOpen(true)
  → Img2PromptPanel 消费 prefillJob.referenceImageUrl
```

### 难点 2：浏览器 CORS 限制

Gallery/Sref 的图片 URL 可能来自外部域名（如 midjourney CDN），
浏览器无法直接 `fetch()` 跨域图片并转 base64。

解决方案：**服务端代理转换**
- 前端只传 URL 字符串给 API
- 服务端 `fetch(referenceImageUrl)` → 转 base64 → 送给 Gemini API
- 图片预览仍用 `<img src={url}>` 直接展示（img 标签不受 CORS 限制）

---

## 修改文件清单

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `server/routes/generate.js` | 功能扩展 | 新增 `referenceImageUrl` 参数支持 |
| `client/src/components/UI/Img2PromptPanel.js` | 功能扩展 | 新增 URL 参考图状态 + prefill 消费 |
| `client/src/pages/Gallery/GalleryModal.js` | UI + 交互 | 新增按钮 + 自动关闭 modal |
| `client/src/pages/SrefModal.js` | UI + 交互 | 新增按钮 + 自动关闭 modal |
| `client/src/i18n/locales/en-US.json` | 翻译 | 添加 `useAsReference` 键 |
| `client/src/i18n/locales/zh-CN.json` | 翻译 | 添加 `useAsReference` 键 |
| `client/src/i18n/locales/ja-JP.json` | 翻译 | 添加 `useAsReference` 键 |
| `client/src/i18n/modules/gallery.js` | 翻译（主要） | 添加 `useAsReference` 键（覆盖 JSON 的模块） |

---

## 详细改动说明

### 1. `server/routes/generate.js`

**新增 `referenceImageUrl` 服务端代理转换**

```js
// 从 req.body 提取新参数
const { prompt, modelId, aspectRatio, referenceImageData, referenceImageMime, referenceImageUrl } = req.body;

// 在模型调用前，若有 URL 则服务端 fetch 转 base64
let finalRefData = referenceImageData || null;
let finalRefMime = referenceImageMime || 'image/jpeg';
if (!finalRefData && referenceImageUrl) {
  try {
    const imgRes = await fetch(referenceImageUrl, { signal: AbortSignal.timeout(10000) });
    if (imgRes.ok) {
      const buf = await imgRes.arrayBuffer();
      finalRefData = Buffer.from(buf).toString('base64');
      finalRefMime = imgRes.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    }
  } catch (_) { /* 无法获取参考图，继续生成不带参考图 */ }
}

// 下游 Gemini 调用改用 finalRefData / finalRefMime
...(finalRefData ? [{ inlineData: { mimeType: finalRefMime, data: finalRefData } }] : [])
```

**设计决策**：fetch 失败时静默降级（不带参考图继续生成），不中断用户流程。

---

### 2. `client/src/components/UI/Img2PromptPanel.js`

**新增 URL 模式参考图状态**

```js
const [refImageUrl, setRefImageUrl] = useState(null); // URL 直传模式
```

**扩展 prefill useEffect**

```js
useEffect(() => {
  if (!prefillJob) return;
  if (prefillJob.prompt) {
    setPrompt(prefillJob.prompt);
  }
  if (prefillJob.referenceImageUrl) {
    setRefImageUrl(prefillJob.referenceImageUrl);
    setRefPreview(prefillJob.referenceImageUrl);  // img src 直接展示，无 CORS 问题
    setRefImageFile(null);
    setRefImageB64(null);
    setRefMimeType(null);
  }
  onPrefillConsumed?.();
}, [prefillJob]);
```

**生成调用扩展**（原来只有 base64，现在也支持 URL）

```js
...(refImageB64
  ? { referenceImageData: refImageB64, referenceImageMime: refMimeType }
  : refImageUrl ? { referenceImageUrl: refImageUrl } : {})
```

**Card2 显示逻辑**

```jsx
// 有文件 → 显示文件名；有 URL → 显示 "Reference image"；都没有 → 占位文字
{refImageFile
  ? refImageFile.name.slice(0, 22) + ...
  : refImageUrl ? 'Reference image' : 'Drag or upload reference image'}
```

**清除按钮**：补充重置 `refImageUrl`

```js
setRefImageFile(null); setRefImageB64(null); setRefMimeType(null); setRefPreview(null); setRefImageUrl(null);
```

**清除按钮显示条件**：`(refImageFile || refImageUrl)` 任一有值即显示 ✕

---

### 3. `client/src/pages/Gallery/GalleryModal.js`

**新增 imports**

```js
import { ImagePlus } from 'lucide-react'; // 追加到现有图标导入
import { useGeneration } from '../../contexts/GenerationContext';
```

**hook 使用**

```js
const { setPrefill } = useGeneration();
```

**footer 按钮**

```jsx
{prompt.previewImage && (
  <button
    className="dmodal-btn-primary"
    onClick={() => { setPrefill({ referenceImageUrl: prompt.previewImage }); handleClose(); }}
  >
    <ImagePlus size={16} />
    {t('gallery.detail.useAsReference')}
  </button>
)}
```

`flex:1` 来自 `.dmodal-btn-primary`，两个主按钮自动各占一半宽度。

---

### 4. `client/src/pages/SrefModal.js`

与 GalleryModal 相同结构，差异：
- 使用 `imageUrls[activeIdx]`（当前浏览的媒体 URL）
- 仅当 `active?.type === 'image'` 时渲染（视频不显示参考图按钮）
- 按钮文字直接写 `Use as Reference`（SrefModal 未接入 i18n，与现有风格一致）

```jsx
{active?.type === 'image' && (
  <button
    className="dmodal-btn-primary"
    onClick={() => { setPrefill({ referenceImageUrl: active.url }); handleClose(); }}
  >
    <ImagePlus size={16} />
    Use as Reference
  </button>
)}
```

---

### 5. i18n 翻译

**发现的坑**：项目 i18n 采用双层结构：
- `locales/en-US.json` — 基础翻译
- `i18n/modules/gallery.js` — 模块化翻译，**会覆盖** JSON 文件中的同名 key

所以必须在 `modules/gallery.js` 中添加，否则 JSON 文件的新 key 会被模块覆盖掉：

```js
// modules/gallery.js — 三语言均需添加
// en-US
copyPrompt: 'Copy Prompt',
useAsReference: 'Use as Reference',   // ← 新增

// zh-CN
copyPrompt: '复制提示词',
useAsReference: '用作参考图',          // ← 新增

// ja-JP
copyPrompt: 'プロンプトをコピー',
useAsReference: '参照画像として使用',  // ← 新增
```

---

## 排查过程记录

### 问题 1：编译错误 `referenceImageUrl is not defined`

**症状**: CRA 报错，页面显示红色编译错误
**根因**: JS 对象简写 `{ referenceImageUrl }` 找的是同名变量，但 state 变量名是 `refImageUrl`
**修复**: 改为 `{ referenceImageUrl: refImageUrl }`

### 问题 2：翻译 key 显示原始字符串

**症状**: 按钮显示 `gallery.detail.useAsReference` 而不是 "Use as Reference"
**根因**: i18n 模块化翻译（`modules/gallery.js`）会用 spread 覆盖 JSON 文件，key 仅加在 JSON 文件中无效
**修复**: 在 `modules/gallery.js` 三语言各处补充 `useAsReference`

### 问题 3：点击后 modal 不自动关闭

**症状**: 点击 Use as Reference 后面板弹出，但详情页 modal 还开着
**根因**: `onClick` 只调用了 `setPrefill()`，未调用 `handleClose()`
**修复**: `onClick={() => { setPrefill({...}); handleClose(); }}`

---

## 验证结果

| 验证项 | /gallery | /explore |
|--------|---------|---------|
| 按钮出现在 footer | ✅ | ✅ |
| 样式与 Copy 按钮一致 | ✅ | ✅ |
| 点击后 modal 关闭 | ✅ | ✅ |
| Generation 面板自动弹出 | ✅ | ✅ |
| Card2 显示参考图预览 | ✅ | ✅ |
| Card2 显示 "Will be sent with prompt" | ✅ | ✅ |
| 视频媒体不显示参考图按钮（/explore）| ✅ | — |

---

## 多语言对照

| 语言 | 按钮文字 |
|------|---------|
| 英文 (en-US) | Use as Reference |
| 中文 (zh-CN) | 用作参考图 |
| 日文 (ja-JP) | 参照画像として使用 |

---

*文档创建：2026-03-15*
*适用版本：Stage 42*
