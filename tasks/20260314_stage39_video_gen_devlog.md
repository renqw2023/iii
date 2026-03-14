# Stage 39 开发记录 — Generate Video (Seedance 2.0) + Use Idea Bug Fix

**日期**: 2026-03-14
**前置 commit**: `aa87620` Stage 38: Gallery/Sref card hover polish
**本次 commit**: Stage 39

---

## 一、背景与目标

### 问题1：Use Idea Tab 跳转错误（Bug）
用户在 Gallery/Sref 卡片上点击「Use Idea」按钮后，面板应打开并停留在 **Generate Image**（原 Reverse Prompt）标签页，将卡片 prompt 填入「Prompt Description」输入框供用户二次使用。

**实际表现**：面板打开后停在 Reverse 标签，但 Prompt Description 为空——prompt 没有被填入。

**根本原因**：`prefillJob` 没有被传递给 `ReverseTab`，只传给了 `GenerateTab`（阶段29原始设计是把 prompt 送去文生图，但那是错误的产品逻辑）。

### 问题2：Generate Video 功能缺失
面板 Tab 2 原为「Generate Image」（文生图，7种模型），计划替换为「Generate Video」，对接 ByteDance Volcano Ark 平台的 Seedance 2.0 文生视频模型。

---

## 二、文件改动清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `client/src/components/UI/Img2PromptPanel.js` | 修改 | Tab bug 修复 + VideoTab 替换 + 标签改名 |
| `client/src/services/generateApi.js` | 修改 | 新增 `generateVideo()` 方法（180s timeout）|
| `server/config/index.js` | 修改 | `services.seedance` 配置块 |
| `server/services/videoService.js` | **新增** | Seedance API create-then-poll 封装 |
| `server/routes/generate.js` | 修改 | 新增 `POST /api/generate/video` 路由 |
| `server/models/Generation.js` | 修改 | 新增 `videoUrl`、`mediaType` 字段 |
| `tasks/20260314_stage39_video_gen_devlog.md` | **新增** | 本开发记录 |

---

## 三、详细实现

### 3.1 Use Idea Bug 修复

**修复前行为**：
- `prefillJob` 只传给 `GenerateTab`（现 VideoTab），不传给 `ReverseTab`
- 面板主组件有一个 `useEffect([open, prefillJob])` 试图切换到 generate tab
  - 但 `open` 为 false 时（面板还没动画展开）条件不满足，切换失效
  - 即使切换成功，也是错误的产品逻辑——prompt 应填入 Generate Image tab

**修复后行为**：
1. 删除强制切换到 generate tab 的 `useEffect`
2. `prefillJob` + `onPrefillConsumed` 改为传给 `ReverseTab`（现 `GenerateImageTab`）
3. `ReverseTab` 内新增 `useEffect([prefillJob])`，检测到 `prefillJob.prompt` 即写入 `prompt` state（Prompt Description 字段），并调用 `onPrefillConsumed()`
4. 面板保持在 Generate Image（Reverse Prompt）标签，无 tab 切换

```js
// ReverseTab 新增
useEffect(() => {
  if (prefillJob?.prompt) {
    setPrompt(prefillJob.prompt);
    onPrefillConsumed?.();
  }
}, [prefillJob]);
```

### 3.2 标签重命名

| 位置 | 旧文字 | 新文字 |
|------|--------|--------|
| 面板 header | Image Generation | AI Generation |
| Tab 1 按钮 | Reverse Prompt | Generate Image |
| Tab 2 按钮 | Generate Image | Generate Video |

### 3.3 server/services/videoService.js（新文件）

ByteDance Volcano Ark API 采用异步任务模式：

```
POST /api/v3/contents/generations/tasks
  Body: { model, content: [{type:'text', text: prompt}], parameters: {duration, resolution, aspect_ratio} }
  → { id: "task_xxx" }

GET /api/v3/contents/generations/tasks/{id}
  → { status: 'queued'|'running'|'succeeded'|'failed', content: [{type:'video', url:'...'}] }
```

实现细节：
- Poll 间隔：3 秒
- 超时：120 秒
- `AbortSignal.timeout()` 控制单次 fetch 超时（create=30s，poll=15s）
- 环境变量：`SEEDANCE_API_KEY`（必须）、`SEEDANCE_API_BASE`（可选覆盖）、`SEEDANCE_MODEL_ID`（可选覆盖）
- 默认 model ID：`seedance-1-0-t2v-250125`

### 3.4 POST /api/generate/video

- 路径：`POST /api/generate/video`
- 鉴权：JWT（`auth` middleware）
- 积分消耗：**30 credits**（先扣 freeCredits，再扣 credits）
- 参数：
  - `prompt` (required)
  - `duration`: 5 | 10，默认 5
  - `resolution`: "720p" | "1080p"，默认 "720p"
  - `aspectRatio`: "16:9" | "9:16" | "1:1"，默认 "16:9"
- 返回：`{ videoUrl, taskId, creditsLeft, freeCreditsLeft }`
- 无 API Key 时返回 503，带明确提示信息

### 3.5 VideoTab UI 组件

替换原 GenerateTab，布局：
```
┌──────────────────────────────┐
│ Prompt (textarea, drag支持)   │
├──────────────────────────────┤
│ Duration:   [5s] [10s]       │
│ Resolution: [720p] [1080p]   │
│ Ratio:  [16:9] [9:16] [1:1]  │
├──────────────────────────────┤
│ [Generate Video — ⚡30]      │
├──────────────────────────────┤
│ loading spinner / <video>    │
└──────────────────────────────┘
```

- 生成中显示 spinner + "Generating… this may take 30–60 seconds"
- 成功后渲染 `<video autoPlay loop controls>` 内联播放器
- 无 `onStartGeneration` 跳转（视频生成在 panel 内完成，不需要跳到历史页）
- 同步更新 `user.credits` / `user.freeCredits`

### 3.6 Generation 模型字段扩展

```js
videoUrl:  { type: String },
mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
```

已有 `imageUrl` 字段的记录不受影响（`default: 'image'` 兼容）。

---

## 四、已知限制与后续工作

| 项目 | 说明 |
|------|------|
| `SEEDANCE_API_KEY` | 需在 `server/.env` 配置才能真正生成视频，未配置返回 503 |
| 视频 URL 有效期 | Volcano Ark CDN 链接约 1 小时有效，生产环境需转存 OSS/S3 |
| Generation History | 视频记录已写入 DB，但 `/generate-history` 页面目前只渲染 imageUrl，视频卡片展示待后续阶段实现 |
| VideoTab prefill | 目前 VideoTab 不接收 prefillJob，如需支持可后续添加 |

---

## 五、验证结果

| 验证项 | 结果 |
|--------|------|
| 点击 Use Idea → 面板打开在 Generate Image tab | ✅ |
| Prompt Description 自动填入卡片 prompt | ✅ |
| 面板 header 显示 "AI Generation" | ✅ |
| Tab 1 显示 "Generate Image"，Tab 2 显示 "Generate Video" | ✅ |
| VideoTab 显示 Duration / Resolution / Ratio 控件 | ✅ |
| Generate Video 按钮显示 30 积分 | ✅ |
| Console 零报错 | ✅ |

---

## 六、Lessons Learned

1. **产品逻辑优先于技术实现**：Stage 39 原计划把 Use Idea 的 tab 切换改到 Generate Video，但用户澄清正确逻辑是填入 Generate Image 的 Prompt Description。规划阶段应先确认每个功能的产品意图，不能凭字面推断。

2. **组件 prop 传递要跟随业务流**：`prefillJob` 只传给一个子组件是最初的错误根源——当业务流改变时，应同步更新 prop 传递路径，不能留孤立的 useEffect 试图绕过去。
