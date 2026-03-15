# Stage 39d 开发记录 — Generate Video 全能力升级

**日期**: 2026-03-14
**前置 commit**: `a2124fb` (Stage 39b)
**本次 commit**: `a4a5ec5`
**涉及中间修复 commit**: `5ff3572`, `09af839`, `228ff81`, `ecc1d42`

---

## 一、背景与目标

Stage 39b 完成了 Generate Video 的基础功能（文生视频，5s/10s，480p/720p/1080p，3个比例）。本次升级基于官方文档全面对齐 Seedance 1.5 Pro 的完整能力集，目标是让产品的视频生成能力与火山方舟控制台保持一致。

**参考资源：**
- API 文档：https://www.volcengine.com/docs/82379/1366799?lang=zh
- 火山方舟控制台：https://console.volcengine.com/ark/...?modelId=doubao-seedance-1-5-pro-251215&tab=GenVideo

---

## 二、Bug 修复记录（升级前置）

在正式开发新功能前，陆续修复了以下遗留 bug：

### 2.1 CreditTransaction enum 缺失 `generate_video`

**错误日志：**
```
CreditTransaction validation failed: reason: `generate_video` is not a valid enum value for path `reason`.
```

**根因：** `server/models/CreditTransaction.js` 的 `reason` 枚举数组中只有 `generate_image`，路由写入 `generate_video` 时 Mongoose 校验失败。视频实际生成成功（API 已返回 URL），但积分流水记录写入失败。

**修复：**
```js
// server/models/CreditTransaction.js
enum: [
  ...
  'generate_image',
  'generate_video',  // ← 新增
  ...
]
```

### 2.2 Generation model resolution enum 缺失视频分辨率

**错误日志：**
```
Generation validation failed: resolution: `1080p` is not a valid enum value for path `resolution`.
```

**根因：** `server/models/Generation.js` 的 `resolution` 枚举只有图像分辨率 `['2K', '4K']`，视频的 `480p/720p/1080p` 未列入。

**修复：**
```js
resolution: { type: String, enum: ['2K', '4K', '480p', '720p', '1080p'], default: '2K' },
```

**注意：** 两次报错均发生在服务器**未重启**的情况下，说明代码改动后需要重启服务端进程才能加载新的 Mongoose Schema。

### 2.3 视频卡片 3 项交互问题

| 问题 | 根因 | 修复 |
|------|------|------|
| 无播放按钮 | video 仅 `autoPlay muted`，无控件 | 加「▶ VIDEO」角标 + hover 时显示 🔇/🔊 静音切换按钮 |
| Download 无效 | `handleDownload` 只取 `imageUrl` | 视频走 `window.open()` 在新标签打开（CDN 跨域无法直接 blob 下载） |
| Share/Copy 无效 | `handleCopyUrl` 只取 `imageUrl`，且对外部 CDN URL 错误拼接了 `window.location.origin` | 视频取 `videoUrl`，判断 `url.startsWith('http')` 决定是否加 origin 前缀 |

---

## 三、Stage 39d — 新功能实现

### 3.1 功能概览

| 功能 | 旧版 | 新版 |
|------|------|------|
| 输入模式 | 仅文生视频 | 文生视频 / 首帧图生视频 / 首尾帧图生视频 |
| 首帧上传 | 不支持 | 上传图片 → 服务端存储 → 构造公开 URL → 传入 API |
| 尾帧上传 | 不支持 | 同首帧，需先选首帧 |
| 有声视频 | 固定 `generate_audio: false` | Toggle 开关，开启 +30% 积分 |
| 时长选项 | [5s, 10s] 固定按钮 | Range Slider，4–12s 任意整数 |
| 宽高比 | 16:9 / 9:16 / 1:1（3种） | 文生视频 6 种 + 图生视频新增 `adaptive`（7 种） |
| 积分计算 | 固定查表 `CREDIT_COST_MAP` | 公式动态计算，支持任意时长和音频加成 |

### 3.2 图生视频（首帧 / 首尾帧）

#### API 格式

官方 API 通过 `content` 数组区分文生视频和图生视频：

```js
// 文生视频
content: [{ type: 'text', text: prompt }]

// 首帧图生视频（先文后图）
content: [
  { type: 'text',      text: prompt },
  { type: 'image_url', image_url: { url: firstFrameUrl } }
]

// 首尾帧图生视频
content: [
  { type: 'text',      text: prompt },
  { type: 'image_url', image_url: { url: firstFrameUrl } },
  { type: 'image_url', image_url: { url: lastFrameUrl  } }
]
```

#### 图片上传流程

图生视频要求传入**公开可访问的 HTTPS URL**（Volcano Ark 服务端会主动拉取该图片）。本地 `blob:` URL 和 `localhost` 无效，必须先将图片上传到公开服务器。

**上传端点：** `POST /api/generate/video/upload-frame`

```
Request:  multipart/form-data  field="frame"  (单张图片，最大 20MB)
Response: { url: "https://iii.pics/uploads/video-frames/{uuid}.ext" }
```

服务端使用 `multer` 将文件存到 `uploads/video-frames/`，然后用 `config.app.baseUrl` 拼接成公开 URL。该目录已包含在 `/uploads` 静态服务路径下，无需额外配置。

**前端流程：**
1. 用户选择图片文件 → 即时生成本地 `blob:` URL 用于预览
2. 点击「Generate Video」时先调用 `generateAPI.uploadVideoFrame(file)` 上传
3. 获得服务端返回的公开 URL 后再调用视频生成接口

```js
// 上传优先，失败则中断生成
let firstFrameUrl = null;
if (firstFile) {
  const res = await generateAPI.uploadVideoFrame(firstFile);
  firstFrameUrl = res.url;
}
// 再调用生成
generateAPI.generateVideo({ ..., firstFrameUrl, lastFrameUrl });
```

#### `adaptive` 宽高比

图生视频专属选项，让 API 根据输入图片的原始宽高比自动匹配最接近的输出比例（无需裁剪，保留最多图片内容）。文生视频不支持此选项，会自动 fallback 到 `16:9`。

```js
// videoService.js 中的 fallback 逻辑
const effectiveRatio = (ratio === 'adaptive' && !firstFrameUrl) ? '16:9' : ratio;
```

### 3.3 有声视频（Generate Audio）

官方参数：`generate_audio: true/false`

开启后 AI 会根据视频内容自动生成背景音效/音乐。成本高于无声版本。

**计费策略：** 音频 +30% 积分加成（服务端和前端保持一致）

```js
const getVideoCost = (res, dur, audio = false) => {
  const base = Math.round((PER_SEC_RATES[res] ?? 15) * Number(dur));
  return audio ? Math.round(base * 1.3) : base;
};
```

**UI 实现：** 自定义 Toggle 开关，右侧副文字提示「+30% credits」。Toggle 状态变化时生成按钮的积分数字即时更新（分辨率按钮内的积分也同步更新）。

### 3.4 时长扩展（4–12s）

Seedance 1.5 Pro 支持 4–12 秒任意时长（原文档 `4 ~ 12 秒`）。旧版只提供 5s/10s 两个按钮，新版改为 `<input type="range" min=4 max=12 step=1>`，实时显示当前值。

服务端验证：
```js
const dur = Number(duration);
const validDuration = (dur >= 4 && dur <= 12) ? dur : 5;
```

### 3.5 宽高比扩展

| 模式 | 可选宽高比 |
|------|-----------|
| 文生视频 | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` |
| 图生视频 | 以上 6 种 + `adaptive`（自适应） |

服务端白名单：
```js
const validRatios = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'];
```

### 3.6 积分公式重构

旧版使用固定查表（只支持 5s/10s）：
```js
const CREDIT_COST_MAP = { '480p-5': 16, '480p-10': 31, ... };
```

新版改为公式计算（支持 4–12s 任意时长）：
```js
// 每秒积分费率（含 30% 利润加成）
const PER_SEC_RATES = { '480p': 3.15, '720p': 6.75, '1080p': 15 };

function getCreditCost(resolution, duration, audio = false) {
  const rate = PER_SEC_RATES[resolution] ?? 15;
  const base = Math.round(rate * Number(duration));
  return audio ? Math.round(base * 1.3) : base;
}
```

**验证（已有数据对齐）：**

| 规格 | 公式结果 | 旧表结果 | 差异 |
|------|---------|---------|------|
| 480p 5s | `round(3.15 × 5)` = 16 | 16 | ✅ 一致 |
| 480p 10s | `round(3.15 × 10)` = 32 | 31 | ±1（四舍五入误差，可接受） |
| 720p 5s | `round(6.75 × 5)` = 34 | 34 | ✅ 一致 |
| 720p 10s | `round(6.75 × 10)` = 68 | 67 | ±1 |
| 1080p 5s | `round(15 × 5)` = 75 | 75 | ✅ 一致 |
| 1080p 10s | `round(15 × 10)` = 150 | 150 | ✅ 一致 |

CREDIT_COST_MAP 保留为向后兼容的导出，内部由公式生成（不再手动维护）。

---

## 四、文件改动汇总

### 新增文件

| 文件 | 说明 |
|------|------|
| `uploads/video-frames/` | 首帧/尾帧图片临时存储目录（运行时自动创建） |

### 修改文件

| 文件 | 关键改动 |
|------|---------|
| `server/models/CreditTransaction.js` | `reason` enum 新增 `generate_video` |
| `server/models/Generation.js` | `resolution` enum 新增 `480p`, `720p`, `1080p` |
| `server/services/videoService.js` | 新增 `firstFrameUrl`/`lastFrameUrl`/`generateAudio` 参数；content 数组动态构建；积分公式重构；`adaptive` fallback |
| `server/routes/generate.js` | 新增 `POST /video/upload-frame` 端点（multer）；更新 `POST /video` 参数接受范围（duration 4–12，7种 ratio，audio，frame URLs） |
| `client/src/services/generateApi.js` | 新增 `uploadVideoFrame(file)` 方法 |
| `client/src/components/UI/Img2PromptPanel.js` | VideoTab 完全重写：Mode 选择器、FrameZone 子组件、Audio toggle、Duration slider、Ratio 扩展、动态积分 |
| `client/src/components/UI/GenerationCard.js` | 视频卡片：VIDEO badge、静音切换按钮、video 元素渲染 |
| `client/src/pages/GenerateHistory.js` | All/Images/Videos 筛选 tab；recordToJob 支持 mediaType；download/copyUrl 支持视频 |

---

## 五、API 请求格式完整示例

### 文生视频（带音频）

```json
POST /api/v3/contents/generations/tasks
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [{ "type": "text", "text": "一只猫在草地上奔跑" }],
  "ratio": "16:9",
  "resolution": "720p",
  "duration": 8,
  "generate_audio": true,
  "watermark": false
}
```

### 首帧图生视频

```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [
    { "type": "text", "text": "女孩抬起头，温柔地看向镜头" },
    { "type": "image_url", "image_url": { "url": "https://iii.pics/uploads/video-frames/xxx.jpg" } }
  ],
  "ratio": "adaptive",
  "resolution": "1080p",
  "duration": 5,
  "generate_audio": false,
  "watermark": false
}
```

### 首尾帧图生视频

```json
{
  "content": [
    { "type": "text", "text": "图中女孩对着镜头说「茄子」，360度环绕运镜" },
    { "type": "image_url", "image_url": { "url": "https://iii.pics/uploads/video-frames/first.jpg" } },
    { "type": "image_url", "image_url": { "url": "https://iii.pics/uploads/video-frames/last.jpg" } }
  ],
  ...
}
```

---

## 六、积分计费完整表（新公式）

### 无音频

| 规格 | 4s | 5s | 6s | 7s | 8s | 9s | 10s | 11s | 12s |
|------|----|----|----|----|----|----|-----|-----|-----|
| 480p | 13 | 16 | 19 | 22 | 25 | 28 | 32 | 35 | 38 |
| 720p | 27 | 34 | 41 | 47 | 54 | 61 | 68 | 74 | 81 |
| 1080p | 60 | 75 | 90 | 105 | 120 | 135 | 150 | 165 | 180 |

### 有音频（×1.3）

| 规格 | 4s | 5s | 6s | 8s | 10s | 12s |
|------|----|----|----|----|-----|-----|
| 480p | 17 | 21 | 25 | 33 | 42 | 50 |
| 720p | 36 | 44 | 53 | 70 | 88 | 106 |
| 1080p | 78 | 98 | 117 | 156 | 195 | 234 |

---

## 七、UI 设计说明

### VideoTab 布局

```
┌──────────────────────────────┐
│ Model: [1.5 Pro] [2.0 Soon]  │
├──────────────────────────────┤
│ Mode: [Text] [1st] [1st+Last]│
├──────────────────────────────┤
│ [First Frame ▲] [Last Frame ▲]│  ← 仅图生视频模式显示
├──────────────────────────────┤
│ Prompt (textarea + 拖拽)      │
├──────────────────────────────┤
│ Duration          5s         │
│ ◀————●———————————▶           │
│ 4s                      12s  │
├──────────────────────────────┤
│ Resolution: [480p 16][720p 34][1080p 75] │
├──────────────────────────────┤
│ Ratio: [16:9][4:3][1:1][3:4][9:16][21:9]│
│   图生视频额外显示: [⟳ Auto]   │
├──────────────────────────────┤
│ Generate Audio      [○ OFF]  │
│ +30% credits                 │
├──────────────────────────────┤
│ [Generate Video  ⚡ 34]      │
├──────────────────────────────┤
│ Free: 30  ·  Credits: 47     │
└──────────────────────────────┘
```

### FrameZone 组件

- 未上传：虚线边框 + Plus 图标 + "Upload" 文字，点击触发 `<input type="file">`
- 已上传：16:9 比例缩略图预览 + 右上角 ✕ 清除按钮
- 两个 FrameZone 并排，flex 等宽

### 生成按钮状态

| 状态 | 显示 |
|------|------|
| 上传中 | `Loader2` spinner + "Uploading…" |
| 可生成 | `Wand2` + "Generate Video" + 积分徽章 |
| 不可生成（无 prompt / 缺图片）| 灰色半透明 disabled |

---

## 八、已知限制与后续工作

| 项目 | 说明 |
|------|------|
| 帧图片 URL 要求 | 必须是服务端可访问的公开 HTTPS URL，本地开发（localhost:5500）上传的图片 Volcano Ark API 无法拉取，图生视频仅在生产环境（iii.pics）可用 |
| 帧图片清理 | `uploads/video-frames/` 目前无自动清理机制，建议后续加 cron 定期删除 7 天以上的文件 |
| 视频 CDN 有效期 | Volcano Ark 返回的视频 URL 约 1 小时内有效，生产环境建议异步转存 OSS/S3 |
| 样片模式（Draft） | 官方文档支持 `draft: true`（480p 低成本预览），本版本未实现，可作为后续优化 |
| Seedance 2.0 Pro | 占位已就绪（`comingSoon: true`），API 发布后去掉该标记即可激活 |
| 音频精确定价 | 目前音频按 +30% 估算，官方有声视频精确定价尚未公开，后续可修正 |

---

## 九、Commit 记录

| Commit | 内容 |
|--------|------|
| `5ff3572` | Fix: poll timeout 增大 + retry on network hiccup |
| `228ff81` | Fix: generate_video CreditTransaction enum + 超时时长 6 分钟 |
| `09af839` | Fix: Generation.resolution enum 新增视频分辨率 |
| `ecc1d42` | Fix: 视频卡片播放按钮 + download + copy URL |
| `4ad698f` | Stage 39c: fire-and-forget 流程 + 历史页 video 支持 |
| `a4a5ec5` | Stage 39d: VideoTab 全能力升级（图生视频 / 音频 / 时长滑块 / 比例扩展） |

---

## 十、Lessons Learned

### L1：Mongoose enum 新增字段必须同步更新所有相关 Schema

本次开发因 `CreditTransaction.reason` 和 `Generation.resolution` 两个 enum 遗漏，导致视频生成成功但记录写入失败的"半成功"状态。
**规则：** 新增一种业务类型时，在开发计划阶段就列出所有涉及枚举的 Schema 字段，逐一检查是否需要更新。

### L2：Mongoose Schema 改动需要重启服务进程

Node.js 进程缓存 `require()` 的模块，Schema 改动后若不重启，运行中的进程仍使用旧的 Schema 定义。
**规则：** 修改任何 Mongoose Schema 后，必须提示用户重启服务端。

### L3：外部 API 对图片 URL 的要求比预期严格

Volcano Ark 图生视频 API 需要公开可访问的 HTTPS URL 来拉取图片，无法使用 base64、blob URL 或 localhost 地址。
**规则：** 对接需要图片输入的外部 API 前，先确认其支持的图片传递方式（URL 还是 base64），再设计前后端数据流。

### L4：积分公式比查表更健壮

旧版使用 `CREDIT_COST_MAP` 查表，支持的参数组合有限（只有 5s/10s）。当时长扩展到 4–12s 任意值时，查表需要维护 3×9=27 个条目，而公式只需 3 个费率参数。
**规则：** 对于参数维度高的计费逻辑，优先使用公式；查表适合特殊定价（如阶梯价）但不适合连续变量。
