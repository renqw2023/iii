# Stage 39 完整开发记录 — Generate Video 全流程

**日期**: 2026-03-14
**涉及 commit**: `aa87620` → `4ad698f`
**开发者**: Claude Sonnet 4.6 + 用户协作

---

## 一、背景与目标

本次开发分三个阶段（39 / 39b / 39c），逐步将"Generate Video"功能从概念规划落地为完整可用的产品体验。

### 三阶段目标

| 阶段 | 目标 |
|------|------|
| 39   | Use Idea Bug 修复 + VideoTab 初版 + Reverse Prompt 改名为 Generate Image |
| 39b  | 对接真实 Volcano Ark API + 分辨率分级计费模型 |
| 39c  | 流程改造：Generate Video 跳转历史页 + 历史页加 Video 筛选 |

---

## 二、阶段 39 — Use Idea Bug + VideoTab 初版

### 2.1 Use Idea Bug 分析

**症状**：用户在 Gallery/Sref 卡片上点击「Use Idea」按钮后，面板打开，但 Generate Image 的 Prompt Description 输入框为空。

**根本原因追踪**：

原始代码（Stage 28 遗留）中有一个 `useEffect`：
```js
useEffect(() => {
  if (open && prefillJob) setTab('generate');
}, [open, prefillJob]);
```

当用户点击「Use Idea」时，事件顺序如下：
1. `setPrefill(job)` → `prefillJob` 更新（Context 层面立即发生）
2. `setOpen(true)` → 面板开始动画展开
3. `useEffect` 检查 `open && prefillJob`：此时 `open` 是新值 `true`，但 React 批量更新机制下 `open` 在这一帧**还未渲染为 true**，条件不满足
4. 结果：tab 切换失败，`prefillJob` 也没有被传给 `ReverseTab`

**修复方案**：

1. 删除强制切换 tab 的 `useEffect`
2. 将 `prefillJob` + `onPrefillConsumed` 路由给 `ReverseTab`（现 Generate Image Tab）
3. 在 `ReverseTab` 内新增 `useEffect([prefillJob])`，检测到 prompt 即写入 state：

```js
useEffect(() => {
  if (prefillJob?.prompt) {
    setPrompt(prefillJob.prompt);
    onPrefillConsumed?.();
  }
}, [prefillJob]);
```

**产品逻辑澄清**（来自用户纠正）：
- 错误理解：Use Idea → 跳到 Generate Video Tab 并填入 prompt
- 正确逻辑：Use Idea → 停留在 Generate Image Tab → 填入 Prompt Description 供用户二次编辑

### 2.2 标签重命名

| 位置 | 旧文字 | 新文字 |
|------|--------|--------|
| 面板 header | Image Generation | AI Generation |
| Tab 1 按钮 | Reverse Prompt | Generate Image |
| Tab 2 按钮 | Generate Image | Generate Video |

> **原因**：原 Tab 1 名称"Reverse Prompt"对用户不直观，改为"Generate Image"后产品意图更清晰，不会在后续开发中造成误导。

### 2.3 VideoTab 初版（Panel 内嵌模式）

初版 VideoTab 设计为**Panel 内嵌完整流程**：
- 用户填写 Prompt → 点击 Generate → Panel 内显示 loading spinner → 完成后渲染 `<video>` 播放器

UI 布局：
```
┌──────────────────────────────┐
│ Model Selector               │
├──────────────────────────────┤
│ Prompt (textarea + 拖拽支持)  │
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

积分消耗初版硬编码为 30 credits（待 39b 修正为分级定价）。

---

## 三、阶段 39b — Volcano Ark 正式对接 + 分级计费

### 3.1 API 格式考证

初版 `videoService.js` 基于文档推测实现，存在以下错误：

| 字段 | 初版（错误） | 正确格式 |
|------|------------|---------|
| 分辨率/时长/比例 | 嵌套在 `parameters: {}` | 顶层字段 `resolution`, `duration`, `ratio` |
| 视频 URL 解析 | `data.content?.find(c => c.url)?.url` | `data.content?.video_url`（字符串） |
| 模型 ID | `seedance-1-0-t2v-250125`（占位符） | `doubao-seedance-1-5-pro-251215` |

**正确请求体**：
```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "content": [{ "type": "text", "text": "prompt..." }],
  "ratio": "16:9",
  "resolution": "720p",
  "duration": 5,
  "generate_audio": false,
  "watermark": false
}
```

**正确响应解析**：
```js
const { id: taskId } = await createRes.json();          // 创建任务
const videoUrl = data.content?.video_url;              // 轮询完成后
```

### 3.2 分级计费模型设计

**定价原则**：
- 基础汇率：1 积分 ≈ ¥0.0674 CNY（反推自官方定价）
- 基准单价：1 秒 1080p = 15 积分
- 加成比例：API 成本 ×1.30（30% 利润空间）

**官方 API 定价（来自火山引擎文档）**：

| 分辨率 | 5秒 API 成本 | 10秒 API 成本 |
|--------|------------|-------------|
| 480p   | ¥0.80      | ¥1.60       |
| 720p   | ¥1.73      | ¥3.46       |
| 1080p  | ¥3.89      | ¥7.78       |

**计费公式验证**（以 1080p 5s 为例）：
```
API 成本 ¥3.89 × 1.30 = ¥5.06
¥5.06 / ¥0.0674 = 75.07 ≈ 75 积分 ✓
```

**最终积分定价表**：

```js
const CREDIT_COST_MAP = {
  '480p-5':   16,   // ¥0.80 × 1.30 / 0.0674 ≈ 15.4
  '480p-10':  31,   // ¥1.60 × 1.30 / 0.0674 ≈ 30.9
  '720p-5':   34,   // ¥1.73 × 1.30 / 0.0674 ≈ 33.4
  '720p-10':  67,   // ¥3.46 × 1.30 / 0.0674 ≈ 66.7
  '1080p-5':  75,   // ¥3.89 × 1.30 / 0.0674 ≈ 75.1
  '1080p-10': 150,  // ¥7.78 × 1.30 / 0.0674 ≈ 150.1
};
```

### 3.3 模型管理结构

引入 `MODELS` dict 支持多模型扩展：

```js
const MODELS = {
  'seedance-1-5-pro': {
    apiModelId: 'doubao-seedance-1-5-pro-251215',
    name:       'Seedance 1.5 Pro',
    comingSoon: false,
  },
  'seedance-2-0-pro': {
    apiModelId: 'doubao-seedance-2-0-pro',  // 占位符
    name:       'Seedance 2.0 Pro',
    comingSoon: true,  // 触发 503，不调用 API
  },
};
```

**前端对应 UI**：
- Seedance 1.5 Pro：可点击，正常生成
- Seedance 2.0 Pro：带 `Soon` 徽章，禁用状态，点击无响应

### 3.4 Resolution 按钮内联积分展示

每个分辨率按钮右侧显示当前 duration 下的积分数（动态联动）：

```jsx
{VIDEO_RESOLUTIONS.map(r => (
  <button key={r} onClick={() => setResolution(r)} style={SEL_BTN(resolution === r)}>
    {r}
    <span style={{ fontSize: 10, color: resolution === r ? '#8b92d9' : '#d1d5db', marginLeft: 2 }}>
      {getVideoCost(r, duration)}
    </span>
  </button>
))}
```

### 3.5 配置项变更

`server/config/index.js` 的 `services.seedance` 修改：

```js
// 旧
seedance: {
  apiKey:   process.env.SEEDANCE_API_KEY  || '',
  baseUrl:  process.env.SEEDANCE_API_BASE || '...',
  modelId:  process.env.SEEDANCE_MODEL_ID || 'seedance-1-0-t2v-250125',
}

// 新
seedance: {
  apiKey:   process.env.SEEDANCE_API_KEY  || '',
  baseUrl:  process.env.SEEDANCE_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3',
  modelKey: process.env.SEEDANCE_MODEL_KEY || 'seedance-1-5-pro',  // 改为 key，非直接 modelId
}
```

---

## 四、Timeout 排查与修复

### 4.1 故障现象

```
DOMException [TimeoutError]: The operation was aborted due to timeout
    at videoService.js:124:21   ← poll fetch 行
```

### 4.2 根本原因

`AbortSignal.timeout(15000)` 对单次 HTTP 轮询设置了 15 秒超时。
火山引擎 API 服务器位于北京（`ark.cn-beijing.volces.com`），跨境或网络抖动时单次响应超过 15 秒是常见情况。

**更严重的问题**：原始设计中，poll 超时会直接 `throw`，终止整个生成流程——但此时 Seedance 任务在服务端**仍在运行**，只是客户端放弃了轮询，导致积分已扣但视频没有返回。

### 4.3 修复方案

```js
// 旧：超时直接抛错
const pollRes = await fetch(url, { signal: AbortSignal.timeout(15000) });

// 新：超时记录警告，continue 跳过本次轮询
let pollRes;
try {
  pollRes = await fetch(url, { signal: AbortSignal.timeout(POLL_FETCH_TIMEOUT) });
} catch (fetchErr) {
  console.warn(`[videoService] poll fetch error (will retry): ${fetchErr.message}`);
  continue;  // 不 throw，继续等下一次 poll
}
```

**超时值调整**：

| 参数 | 旧值 | 新值 | 说明 |
|------|------|------|------|
| `POLL_FETCH_TIMEOUT` | 15s | 30s | 单次 poll 请求超时 |
| `CREATE_FETCH_TIMEOUT` | 30s | 60s | 创建任务请求超时 |
| `TIMEOUT_MS`（总超时） | 120s | 180s | 整体任务超时上限 |
| 前端 axios timeout | 180s | 240s | 留出足够余量 |

---

## 五、阶段 39c — 流程改造为 fire-and-forget

### 5.1 问题诊断

阶段 39/39b 的 VideoTab 使用 `async/await` 在 Panel 内等待结果，存在两个用户体验问题：

1. **用户被锁在 Panel 内**：等待 60-90 秒期间无法浏览其他内容
2. **与 Generate Image 流程不一致**：图像生成点击后立即跳转历史页，视频生成却卡在 Panel

### 5.2 流程改造

**旧流程（Panel 内阻塞）**：
```
点击 Generate Video
  → setLoading(true)
  → await generateAPI.generateVideo(...)  ← 阻塞 60-90s
  → setVideoUrl(data.videoUrl)
  → 在 Panel 内显示 <video>
```

**新流程（fire-and-forget，对标 Generate Image）**：
```
点击 Generate Video
  → addGeneration({ id, status:'loading', mediaType:'video', ... })
  → onStartGeneration?.()  ← 立即跳转到 /generate-history
  → generateAPI.generateVideo(...).then(data => {
      updateGeneration(id, { status:'success', result:{ videoUrl } })
    }).catch(err => {
      updateGeneration(id, { status:'error', errorMessage: msg })
    })
```

**核心改动**：
- 删除 `loading` / `videoUrl` 本地 state
- 删除 Panel 底部的 loading spinner 和内联 video 播放区
- VideoTab 新增 `useGeneration()` hook（`addGeneration` / `updateGeneration`）
- 接收 `onStartGeneration` prop，父组件传入
- `handleGenerate` 由 `async` 改为普通函数（同步触发，异步处理）

### 5.3 GenerationCard 视频支持

```jsx
const isVideo  = job.mediaType === 'video';
const videoUrl = job.result?.videoUrl || job.videoUrl;

{isVideo ? (
  <video src={videoUrl} autoPlay loop muted playsInline
    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
  />
) : (
  <img src={imageUrl} ... />
)}
```

- loading 状态复用现有进度环动画（对视频同样适用）
- 视频 aspect ratio 未知时默认 `16:9`（原为 `1:1`，对视频不合适）

### 5.4 GenerateHistory 筛选 Tab

在 Header 右侧新增 All / Images / Videos 筛选控件：

```jsx
{['all', 'image', 'video'].map(key => (
  <button
    key={key}
    onClick={() => setMediaFilter(key)}
    style={{ ... active styles ... }}
  >
    {label}
  </button>
))}
```

过滤逻辑：
```js
const filteredRecords = mediaFilter === 'all' ? records
  : records.filter(r => (r.mediaType || 'image') === mediaFilter);
const filteredActive = mediaFilter === 'all' ? activeGenerations
  : activeGenerations.filter(g => (g.mediaType || 'image') === mediaFilter);
```

> 注意：存量图像记录无 `mediaType` 字段，用 `|| 'image'` 兜底，不影响历史数据显示。

### 5.5 recordToJob 字段映射扩展

```js
function recordToJob(rec) {
  const isVideo = rec.mediaType === 'video';
  return {
    ...
    aspectRatio: rec.aspectRatio || (isVideo ? '16:9' : '1:1'),
    mediaType:   rec.mediaType || 'image',
    result:      isVideo ? { videoUrl: rec.videoUrl } : { imageUrl: rec.imageUrl },
    videoUrl:    rec.videoUrl,
    ...
  };
}
```

### 5.6 Server 端 history 接口扩展

`GET /api/generate/history` 新增 `?mediaType=` 查询参数：

```js
const query = { user: req.userId };
if (req.query.mediaType === 'video')
  query.mediaType = 'video';
else if (req.query.mediaType === 'image')
  query.$or = [{ mediaType: 'image' }, { mediaType: { $exists: false } }];
// all: 不加额外条件
```

> 存量图像记录无 `mediaType` 字段，所以 `image` 过滤需要用 `$or` 匹配"值为 image"或"字段不存在"两种情况。

---

## 六、文件改动汇总

| 文件 | 改动类型 | 关键变更 |
|------|---------|---------|
| `client/src/components/UI/Img2PromptPanel.js` | 修改 | Use Idea bug 修复；VideoTab 改名/重写；fire-and-forget 流程 |
| `client/src/components/UI/GenerationCard.js` | 修改 | mediaType=video 渲染 `<video>`；默认 ratio 改 16:9 |
| `client/src/pages/GenerateHistory.js` | 修改 | 筛选 Tab；recordToJob 扩展；filteredActive/filteredRecords |
| `client/src/services/generateApi.js` | 修改 | generateVideo() axios timeout 调整 |
| `server/services/videoService.js` | 新增/重写 | 正确 API 格式；CREDIT_COST_MAP；MODELS；poll retry on timeout |
| `server/config/index.js` | 修改 | services.seedance 配置块 |
| `server/routes/generate.js` | 修改 | POST /api/generate/video；动态 creditCost；history mediaType 过滤 |
| `server/models/Generation.js` | 修改 | videoUrl / mediaType 字段 |

---

## 七、Commit 记录

| Commit | 内容 |
|--------|------|
| `a2124fb` | Stage 39: Use Idea bug fix + VideoTab 初版 + 标签重命名 |
| `61b5d6f` | Stage 39b: Volcano Ark 正式 API + 分级计费 |
| `5ff3572` | Fix: poll timeout 增大 + retry on network hiccup |
| `4ad698f` | Stage 39c: fire-and-forget 流程 + 历史页 video 支持 |

---

## 八、已知限制与后续工作

| 项目 | 说明 |
|------|------|
| 视频 URL 有效期 | Volcano Ark CDN 链接约 1 小时有效，生产环境建议异步转存 OSS/S3 |
| Seedance 2.0 Pro | 占位已就绪，API 开放后去掉 `comingSoon: true` 即可激活 |
| 历史页下载 | 视频下载按钮目前使用 `<a href>` 方式，跨域 CDN 链接可能不触发下载，需后续处理 |
| Generate Image tab prefill | 目前 VideoTab 接收 prefillJob.prompt，但 Generate Image tab（ReverseTab）的 prefill 来自 Gallery Use Idea，两个入口分离，逻辑清晰 |
| 视频历史页无 Copy URL | 视频 CDN URL 有时效性，Copy URL 对视频意义不大，暂未展示 |

---

## 九、Lessons Learned

### L1：先确认产品逻辑，再写代码

Stage 39 初期将"Use Idea 跳到 Generate Video Tab"写进了实现规划，实际上用户意图是填入 Generate Image 的 Prompt Description。
**规则**：任何涉及跨 Tab 跳转的功能，先用一句话描述完整用户路径（从哪来，到哪去，做什么），再动手。

### L2：API 格式必须查一手文档

videoService.js 初版基于"合理推测"写了嵌套 `parameters` 结构，实际 API 是顶层字段。这种错误只能通过阅读官方文档或实测发现。
**规则**：对接新的第三方 API 时，先获取并读完官方文档的 Request Body 和 Response 示例，不猜测。

### L3：网络超时不等于任务失败

Seedance 生成任务在服务端异步运行，单次 poll HTTP 请求超时只说明**这次查询网络不通**，不代表任务失败。原始设计把 poll 超时直接 throw 出去等于"因为打不通电话，就认为对方死了"。
**规则**：轮询外部异步任务时，单次 fetch 错误（包括 timeout、5xx、网络断开）应 catch 后 `continue`，只有 4xx 错误（如任务 ID 无效）才视为不可恢复的失败。

### L4：交互模式要在产品线内保持一致

Generate Image 和 Generate Video 是同一面板下的两个 Tab，用户预期它们的交互模式一致。初版 VideoTab 做成了 Panel 内阻塞模式，和 Generate Image 的跳转模式形成割裂，用户会感到困惑。
**规则**：新功能的交互模式优先对齐同一产品区域内的已有模式，除非有明确的差异化理由。
