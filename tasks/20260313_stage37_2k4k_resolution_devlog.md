# Stage 37 开发日志 — 2K/4K 分辨率分级功能

**日期**: 2026-03-13
**分支**: main
**开发者**: reki / Claude
**状态**: ✅ 完成并验证通过

---

## 背景

基于对 MeiGen.ai 的逆向分析（`tasks/20260313_meigen_2k4k_analysis.md`），III.PICS 的 2K/4K 按钮此前是纯装饰性 UI：

- `resolution` 状态在前端存在，但 `generateAPI.generateImage()` 调用时被丢弃
- 后端 `generate.js` 完全不接收 resolution 参数
- `Generation` 模型无 resolution 字段
- `User` 模型无付费状态字段

本次将其打通为真实功能：
- **2K** = 模型原生输出（现有行为，所有用户可用）
- **4K** = Replicate Real-ESRGAN 2x AI 超分辨率（付费用户专属，+5 积分）

---

## 技术方案

```
用户选择 [4K]
  → frontend 发送 { resolution: "4K" }
  → 后端鉴权（user.hasPurchasedBefore）
  → 生成基础图（原有模型，~1024px）
  → 读取本地文件 → Blob → Replicate Real-ESRGAN 2x
  → 返回 Replicate CDN URL
  → 存储 imageUrl（CDN）+ originalImageUrl（本地）+ resolution 到 DB
  → 返回 { imageUrl, resolution } 给前端
```

**关键设计决策**：Replicate 无法访问 `localhost`，因此不传 URL 而是直接读取磁盘文件转为 `Blob` 上传。

---

## 修改文件（共 9 个）

### 1. `server/models/Generation.js`
新增字段：
- `resolution: { type: String, enum: ['2K', '4K'], default: '2K' }`
- `originalImageUrl: { type: String }` — 4K 时保存未 upscale 的原图路径

### 2. `server/models/User.js`
新增字段：
- `hasPurchasedBefore: { type: Boolean, default: false }` — 是否曾经付费购买积分

### 3. `server/routes/payments.js`
Stripe webhook `checkout.session.completed` 处理中，grant credits 时同步追加：
```js
{ $inc: { credits: creditsNum }, $set: { hasPurchasedBefore: true } }
```

### 4. `server/config/index.js`
在 `services` getter 中新增：
```js
replicate: {
  apiKey: process.env.REPLICATE_API_KEY || '',
},
```

### 5. `server/services/upscaleService.js`（新建）
封装 Replicate Real-ESRGAN 调用：
- 接受**本地文件路径**（非 URL），读取为 `Blob` 上传
- 支持多种 SDK 输出类型解析：`string` → `URL 对象` → `Array` → `ReadableStream`
- 无法解析时抛出错误（由 generate.js catch 回退到 2K）

```js
const Replicate = require('replicate');
// model: nightmareai/real-esrgan:42fed1c4...
// input: { image: Blob, scale: 2, face_enhance: false }
```

**模型**: `nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b`
**成本**: ~$0.002/次（Replicate 按量计费）

### 6. `server/routes/generate.js`（核心改动）

**a. 解构 resolution：**
```js
const { prompt, modelId, aspectRatio = '1:1', referenceImageData, referenceImageMime } = req.body;
let resolution = req.body.resolution === '4K' ? '4K' : '2K';
// 用 let 而非 const，因为 upscale 失败时需要回退为 '2K'
```

**b. 4K 鉴权（403）：**
```js
if (resolution === '4K' && !user.hasPurchasedBefore) {
  return res.status(403).json({ message: '4K 画质需要付费套餐，请先购买积分' });
}
```

**c. 积分计算：**
```js
const totalCreditCost = model.creditCost + (resolution === '4K' ? 5 : 0);
```

**d. Upscaling（生成图片写盘后、扣费前）：**
```js
if (resolution === '4K') {
  try {
    originalImageUrl = imageUrl;
    finalImageUrl = await upscaleImage(filePath, 2); // 传本地路径
  } catch (err) {
    console.error('Upscale failed, falling back:', err.message);
    resolution = '2K'; // 失败不阻断，回退到原图
  }
}
```

**e. Generation.create 新增字段：**
```js
imageUrl: finalImageUrl,   // 4K 时为 Replicate CDN URL
originalImageUrl,          // 4K 时为本地路径，2K 时 undefined
creditCost: totalCreditCost,
resolution,
```

**f. 响应新增 resolution 字段。**

### 7. `client/src/components/UI/Img2PromptPanel.js`

**ReverseTab（Tab 1）：**
- 解析 `resolution` 状态传入 `generateImage()` API 调用
- 4K 按钮：`user?.hasPurchasedBefore` 为 false 时显示 `🔒`，点击弹 toast 提示
- catch 中区分 403（付费提示）和其他错误

**GenerateTab（Tab 2）：**
- 新增 `resolution` state（默认 '2K'）
- 新增 Resolution 选择器 UI（与 Aspect Ratio 风格一致）
- 4K 显示 `+5` 积分提示（付费用户可见）；非付费显示 `🔒`
- `generateImage()` 调用加入 `resolution` 参数
- catch 中同样处理 403

### 8. `server/package.json` + `package-lock.json`
新增依赖：`replicate@1.4.0`

---

## 排错记录

### Bug 1 — Replicate 无法访问 localhost
**错误**：`HTTPConnectionPool(host='localhost', port=5500): Max retries exceeded`
**根因**：最初传了 `http://localhost:5500/uploads/generated/...` 给 Replicate，但 Replicate 是外部云服务，无法访问本地网络
**修复**：改为读取本地文件 `fs.readFileSync(filePath)` 转 `Blob` 直接上传，彻底绕开网络访问

### Bug 2 — Replicate SDK v1.4.0 返回 ReadableStream
**错误**：DB 中 `imageUrl` 为 null，无报错
**根因**：SDK v1.4.0 对 Blob 输入返回 `ReadableStream` 对象，原代码只处理 `string` 和 `array`，`output[0]` 对 ReadableStream 为 undefined，静默返回 null
**修复**：在 `upscaleService.js` 增加完整的输出类型判断链：
```
string → URL对象(.href) → Array → URL-like(.href) → toString() fallback → 兜底抛错
```
实测 `ReadableStream.toString()` 直接返回正确的 CDN URL 字符串。

### Bug 3 — resolution const 重赋值
**错误**：`TypeError: Assignment to constant variable` （隐患，未在运行时触发）
**根因**：`const { resolution = '2K' } = req.body` 后在 catch 块中 `resolution = '2K'`
**修复**：改为 `let resolution = req.body.resolution === '4K' ? '4K' : '2K'`

---

## 验证结果

### 免费用户（未付费）
- 4K 按钮显示 `🔒`，cursor: not-allowed，opacity 0.65
- 点击触发 toast："4K requires a paid plan — purchase credits first"
- 若强行调 API 发送 `resolution: "4K"` → 返回 `403 { message: '4K 画质需要付费套餐' }`

### 付费用户（hasPurchasedBefore: true）
- 4K 按钮正常可点击，显示 `+5`
- 选择 Nanobanana Pro（10 积分）+ 4K → 扣 15 积分 ✅
- 生成成功：DB 记录 `resolution: "4K"`, `creditCost: 15`
- `imageUrl`: `https://replicate.delivery/...` Replicate CDN URL ✅
- `originalImageUrl`: `/uploads/generated/gen_xxx.png` 本地原图 ✅
- 实测输出分辨率：**1792×2400**（原图约 896×1200，2x 超分） ✅
- 前端 Generation History 正常显示 Replicate CDN 图片 ✅

### 积分对照
| 模型 | 2K 积分 | 4K 积分 |
|------|---------|---------|
| Nanobanana（Gemini 2.5 Flash） | 4 | 9 |
| Imagen 4 Fast | 4 | 9 |
| Imagen 4 Pro | 8 | 13 |
| Nanobanana 2（Gemini 3.1 Flash） | 6 | 11 |
| Nanobanana Pro（Gemini 3 Pro） | 10 | 15 |
| DALL·E 3 | 8 | 13 |
| GPT Image 1.5 | 10 | 15 |

---

## 已知限制 / 后续优化

1. **Replicate CDN URL 有效期**：`replicate.delivery` CDN URL 默认 1 小时过期，长期存储需要额外将图片转存到自己的 OSS/S3
2. **Upscale 耗时**：Real-ESRGAN 冷启动约 10-20s，热启动约 3-5s，前端无进度指示（可后续加 SSE/WebSocket 进度推送）
3. **4K 图片前端展示**：目前 Generation History 直接渲染外链，建议后续加 `<img loading="lazy">` 和 CDN 代理缓存
4. **环境变量**：需在 `server/.env` 中配置 `REPLICATE_API_KEY=r8_xxx`

---

## 相关文件
- 分析报告：`tasks/20260313_meigen_2k4k_analysis.md`
- 积分系统：`tasks/20260310_stage32_credits_system_devlog.md`
- todo.md：已更新 Stage 37 状态
