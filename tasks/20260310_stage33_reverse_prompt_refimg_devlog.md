# 阶段33 — Reverse Prompt 修复计划

**日期**: 2026-03-10
**前置 commit**: 5d06b82（Reverse Prompt 接入 Nanobanana 生图模型）

---

## 当前状态（待修复）

### 问题 1：Nanobanana 模型名称与接口不对

上一版（38d8f00 / 5d06b82）改动：
- `gemini-3-pro-image-preview` → 显示名 "Gemini 3 Pro"
- `gemini-3.1-flash-image-preview` → 显示名 "Gemini 3.1 Flash"

用户期望：保持 **Nanobanana** 品牌命名，并使用官方正确的模型 ID。
需要查询 `https://ai.google.dev/gemini-api/docs/image-generation` 确认当前有效 ID。

### 问题 2：生图模型选择器位置错误

原来的模型选择器位置：靠近 "Generate Prompt" / "Analyze" 按钮附近（面板底部）。
现在被移到了中间区域（prompt 框下方），用户认为不合理。

### 问题 3：Drag or upload reference image 与其他两个功能冲突

**冲突现象**：
- 将图片拖入 reference image 区域 → prompt 文本框中的文字消失
- 或无法拖入图片

**根本原因分析**：
ReverseTab 目前有三个"拖拽区域"：
1. Card 1（Reverse Prompt）：拖入图片 → 触发 `runGenerate()` 反推 prompt
2. Card 2（Upload reference）：拖入图片 → 应存为 `refImage` 参考图
3. Card 3（Prompt textarea）：拖入 Gallery JSON → 填入 prompt 文字

问题在于：
- Card 2 和 Card 1 的 `onDrop` 都调用了 `handleDrop(e, setDragging)` 这个同一个函数
- `handleDrop` 内判断：有 JSON → 解析 prompt；无 JSON → 取 `files[0]` 调 `handleFile()`
- `handleFile()` 设置的是 `file` 状态（用于反推 prompt），不是 `refImage`
- 所以拖到 Card 2 的图片也会被当作"反推用图片"处理，而非"参考图"
- 当 Card 3 的 prompt textarea 已有文字时，某些拖拽事件的冒泡导致文字被清空

### 问题 4：参考图未传给生图模型

Card 2 的图片目前根本没有接入生图 API。
正确行为：生图时若有 refImage，应将其作为 `inlineData` 放在 `contents.parts` 中（Gemini img2img）。

---

## 修复方案

### 4.1 查询正确模型 ID
访问 https://ai.google.dev/gemini-api/docs/image-generation 确认：
- Nanobanana Pro 的正确 model ID
- Nanobanana 2 / Flash 的正确 model ID
- 是否支持参考图（inlineData + text prompt）

### 4.2 状态拆分

```js
// 旧：一个 file 状态兼用两种功能
const [file, setFile] = useState(null);  // 反推用图片

// 新：明确拆分
const [reverseFile,   setReverseFile]   = useState(null);  // 反推分析用
const [refImageFile,  setRefImageFile]  = useState(null);  // 生图参考图
const [refImageB64,   setRefImageB64]   = useState(null);  // base64
const [refMimeType,   setRefMimeType]   = useState(null);
```

### 4.3 拖拽逻辑拆分

```
Card 1 onDrop：
  JSON 有 image → runGenerate(null, image)
  File → setReverseFile(f), preview reverse

Card 2 onDrop：
  File → setRefImageFile(f), readAsDataURL → refPreview
  不处理 JSON

Card 3 onDrop：
  JSON 有 prompt → setPrompt(prompt) 仅填文字，不清空已有
  不处理 File
```

### 4.4 生图 API 传参

当 `refImageB64` 存在时，`generate/image` 接口需要支持 `referenceImage`：

```js
generateAPI.generateImage({
  prompt,
  modelId,
  aspectRatio,
  referenceImage: refImageB64 ? { data: refImageB64, mimeType: refMimeType } : undefined,
})
```

后端 `generate.js` Gemini 3 分支中：
```js
const parts = [{ text: prompt }];
if (referenceImage) {
  parts.unshift({ inlineData: { mimeType: referenceImage.mimeType, data: referenceImage.data } });
}
```

### 4.5 模型选择器位置

回归到靠近 Analyze 按钮的区域，且保持 **Nanobanana** 命名风格。

---

## 文件改动清单

| 文件 | 操作 |
|------|------|
| `server/routes/generate.js` | 修改：Gemini 3 分支支持 referenceImage inlineData；更新模型 ID |
| `client/src/components/UI/Img2PromptPanel.js` | 修改：状态拆分，拖拽逻辑隔离，参考图传参，模型位置调整 |
