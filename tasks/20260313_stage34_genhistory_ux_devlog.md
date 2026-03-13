# 阶段34 开发日志 — 生成记录 UX 完整重构

**日期**: 2026-03-13
**阶段**: Stage 34
**关联分析**: `tasks/20260313_stage33_meigen_genhistory_analysis.md`

---

## 一、背景与问题诊断

本次改造基于对 MeiGen.ai 生成记录页的深度 DOM 分析（阶段33），发现我们的实现存在三个核心问题：

### 问题 1 — 生成流程错误（最高优先级）

**症状**：用户在 Image Generation 面板中点击"Generate Image"后，生成过程在面板内部进行，按钮变为"Generating…"转圈状态，结果图也在面板内显示。与设计目标不符——应该立即跳转到 `/generate-history` 页面，在那里看到加载卡片，面板保持打开等待下一次生成。

**根因分析（双重问题）**：

1. `ReverseTab` 的 `handleGenerateImage` 有完整的独立生成流程：
   - 本地 `genStatus / genProgress / genResult / genError / isGenerating` 状态树
   - 独立的进度计时器 (`setInterval` @ 700ms)
   - 在面板底部渲染 `<GenerationStatusCard>` 显示结果
   - 从不调用 `onStartGeneration` → 不跳转

2. `GenerateTab` 的 `handleGenerate` 虽然调用了 `onStartGeneration`，但：
   - 使用 `async/await` 阻塞模式
   - `setIsGenerating(true)` 使按钮显示"Generating…"
   - 面板不关闭，用户看到的是面板在转圈而不是历史页的卡片

### 问题 2 — 容器不可见

**症状**：`/generate-history` 的白色浮动卡片与白色页面背景完全融合，圆角和阴影均不可见。

**根因**：`MeshBackground` 组件默认 `enabled=false`，页面背景是纯白色，卡片的 `rgba(255,255,255,0.92)` 在白色上不可见。无 `boxShadow` 和 `border`。

### 问题 3 — GenerationCard hover 交互缺失

`success` 状态的卡片 hover 只有简单的半透明遮罩 + 两个白色按钮，缺少 MeiGen 精确复刻的完整交互层。

---

## 二、实现方案

### 2.1 文件变更清单（共9个文件）

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `server/routes/generate.js` | 新增路由 | `DELETE /history/:id` — 单条记录删除 |
| `client/src/services/generationHistoryApi.js` | 新增方法 | `deleteRecord(id)` |
| `client/src/contexts/GenerationContext.js` | 重构 | 新增 `prefillJob` 状态 + `SET_PREFILL/CLEAR_PREFILL` action |
| `client/src/components/UI/GenerationCard.js` | 完整重写 | success 态 hover 完整复刻 MeiGen |
| `client/src/pages/GenerateHistory.js` | 重写 | 浮动白卡容器 + handleUseIdea + handleDelete |
| `client/src/components/Layout/Layout.js` | 新增监听 | 监听 `prefillJob` → 自动打开面板 |
| `client/src/components/UI/Img2PromptPanel.js` | 核心重构 | ReverseTab + GenerateTab 生成流程重构 |
| `server/models/Generation.js` | 新增模型 | (阶段33已创建) |
| `tasks/` | 文档 | 分析报告 + 本开发日志 |

---

## 三、关键改动详解

### 3.1 GenerationContext — prefillJob 状态

```js
// 新增 state
{ generations: [], prefillJob: null }

// 新增 reducer cases
case 'SET_PREFILL': return { ...state, prefillJob: action.payload };
case 'CLEAR_PREFILL': return { ...state, prefillJob: null };

// 新增 context 导出
setPrefill, clearPrefill, prefillJob
```

**用途**：`GenerateHistory` 中点击"Use Idea" → `setPrefill({prompt, modelId, aspectRatio})` → `Layout` 监听到 → 自动打开面板 → 面板切换到 Generate 标签 → `GenerateTab` 消费并填入字段 → `clearPrefill()`。

---

### 3.2 Img2PromptPanel — 生成流程彻底重构

#### ReverseTab 重构（删除 ~80 行，核心逻辑替换）

**删除的冗余代码**：
```js
// 删除：独立生图状态树（6个 useState）
const [isGenerating, setIsGenerating] = useState(false);
const [genResult,    setGenResult]    = useState(null);
const [genStatus,    setGenStatus]    = useState('idle');
const [genProgress,  setGenProgress]  = useState(0);
const [genError,     setGenError]     = useState('');

// 删除：进度计时器 useEffect（14行）
useEffect(() => {
  if (genStatus !== 'loading') return undefined;
  const timer = window.setInterval(() => { setGenProgress(...); }, 700);
  return () => window.clearInterval(timer);
}, [genStatus]);

// 删除：handleDownload + handleCopyUrl（12行）
// 删除：<GenerationStatusCard> 渲染（10行）
// 删除：resultRef + 两处 scrollIntoView 调用
```

**新的 handleGenerateImage（fire-and-forget）**：
```js
const handleGenerateImage = () => {
  const jobId = Date.now().toString();
  addGeneration({ id: jobId, status: 'loading', progress: 8, prompt: promptText, ... });
  onStartGeneration?.();   // ← 立即跳转到 /generate-history

  generateAPI.generateImage({ ... })
    .then(data => { updateGeneration(jobId, { status: 'success', result: data }); })
    .catch(err  => { updateGeneration(jobId, { status: 'error', errorMessage: msg }); });
};
```

#### GenerateTab 重构

**删除** `isGenerating` 状态 + `async/await` 模式：
```js
// 旧：阻塞式 async/await → 按钮卡在 "Generating…"
const handleGenerate = async () => {
  setIsGenerating(true);
  addGeneration({...});
  onStartGeneration?.();
  try {
    const data = await generateAPI.generateImage({...});  // ← 阻塞！
    updateGeneration(jobId, {...});
  } finally { setIsGenerating(false); }
};

// 新：fire-and-forget → 立即导航，API 在后台继续
const handleGenerate = () => {
  addGeneration({...});
  onStartGeneration?.();   // ← 立即跳转
  generateAPI.generateImage({...})
    .then(data => updateGeneration(jobId, { status: 'success', result: data }))
    .catch(err  => updateGeneration(jobId, { status: 'error', errorMessage: msg }));
};
```

**关键洞察**：`GenerationContext` 挂载在根组件，页面跳转时不会销毁。`addGeneration` / `updateGeneration` 的引用在闭包中保留，后台 API 回调仍能正确更新 context。

---

### 3.3 GenerationCard — 完整 hover 复刻

MeiGen 精确规格实现：
```
┌─────────────────────────────────────┐
│ [↺ Regenerate]              [🗑️]    │  ← top (仅历史记录)
│                                     │
│          图片内容                    │
│                                     │
│  3:4   [↺ Use Idea]    [⬇️] [↗️]    │  ← bottom (translateY 8→0)
└─────────────────────────────────────┘
```

- `background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent)`
- overlay 整体 `opacity: 0 → 1`，transition 300ms
- bottom bar `translateY: 8px → 0`，300ms ease
- 按钮毛玻璃样式：`rgba(0,0,0,0.35) + backdropFilter: blur(8px)`
- "Use Idea" CTA：`bg-white text-black`，突出显示
- `border-radius: 14px`（从 12px 升级）
- 移除底部 prompt 文字区域（MeiGen 无此设计）

**新增 props**：`onDelete`, `onUseIdea`（兼容原有 `onDownload`, `onCopyUrl`, `onRetry`, `onDismiss`, `isActive`）

---

### 3.4 GenerateHistory — 浮动白卡容器

```jsx
// 外层：透明，让 MeshBackground 渐变透出
<div style={{ minHeight: '100vh', padding: 0 }}>
  // 内层：悬浮白卡
  <div style={{
    margin: 16,
    marginRight: 'calc(320px + 32px)',   // panel 占位
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(48px)',
    border: '1px solid rgba(0,0,0,0.07)',      // ← 修复可见性
    boxShadow: '0 2px 24px rgba(0,0,0,0.07)', // ← 修复可见性
    overflow: 'hidden',
    minHeight: 'calc(100vh - 32px)',
  }}>
```

**Header 重构（MeiGen 精确复刻）**：
- `← Back` (ArrowLeft icon，原为 ChevronLeft)
- `|` 分割线 → 移除，改为 `gap: 12px` flex 布局
- `Generation History` 14px 700 fontWeight

**新增处理函数**：
```js
const handleUseIdea = (rec) => setPrefill({ prompt, modelId, aspectRatio });
const handleDelete  = async (recId) => {
  await generationHistoryAPI.deleteRecord(recId);
  setRecords(prev => prev.filter(r => r._id !== recId));
  toast.success('Deleted');
};
```

---

### 3.5 Layout — prefillJob 监听

```js
const { prefillJob, clearPrefill } = useGeneration();

useEffect(() => {
  if (prefillJob) setImg2promptOpen(true);
}, [prefillJob]);

// 传给 Img2PromptPanel：
<Img2PromptPanel
  prefillJob={prefillJob}
  onPrefillConsumed={clearPrefill}
  ...
/>
```

---

### 3.6 后端 DELETE 路由

```js
// server/routes/generate.js
router.delete('/history/:id', auth, async (req, res) => {
  const doc = await Generation.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,   // ← 只能删自己的记录
  });
  if (!doc) return res.status(404).json({ message: '记录不存在' });
  res.json({ message: 'deleted' });
});
```

安全性：`user: req.userId` 确保用户只能删除自己的记录，防止越权删除。

---

## 四、验证结果

| 测试项 | 结果 |
|--------|------|
| 点击"Generate Image"立即跳转 `/generate-history` | ✅ |
| 历史页出现加载卡片（loading 状态） | ✅ |
| API 完成后卡片变为成功状态（图片显示） | ✅ |
| 面板保持打开，可继续生成 | ✅ |
| ReverseTab 的"Generate Image"也跳转 | ✅ |
| 浮动白卡容器有边框和阴影，可见 | ✅ |
| 卡片 hover：渐变遮罩 + 按钮浮现 | ✅ |
| 点击"Use Idea"：面板打开 + Generate 标签 + prompt/model/ratio 填入 | ✅ |
| 点击"Delete"：卡片消失 + toast "Deleted" | ✅ |
| 点击"Download"：图片下载 | ✅ |
| JS console 零错误 | ✅ |

---

## 五、架构洞察

### Fire-and-forget 生成模式

本次改造确立了图片生成的标准模式：

```
用户点击 Generate
    ↓
addGeneration(job) → 写入 context（立即渲染 loading 卡片）
    ↓
onStartGeneration() → navigate to /generate-history（立即导航）
    ↓
generateAPI.generateImage().then/catch → 后台运行
    ↓（context 在根组件，导航不销毁）
updateGeneration(jobId, {status: 'success'}) → 卡片更新
```

**优势**：
- 用户体验流畅：点击即跳转，无等待
- API 失败时卡片显示错误状态，用户可在历史页看到
- 面板保持可用，可立即提交下一个生成任务
- 与 MeiGen.ai 的 UX 模式完全对齐

---

## 六、遗留问题 / 后续优化

| 项目 | 优先级 | 说明 |
|------|--------|------|
| MeshBackground 按页面启用 | 中 | 在 generate-history 页面启用彩色 mesh，让白卡毛玻璃效果更明显 |
| 卡片 hover 鼠标光源跟随 | 低 | MeiGen 有 radial-gradient 随鼠标移动的边框光晕效果 |
| 收藏按钮（Layers icon） | 低 | 添加到个人收藏夹 |
| 列表/网格视图切换 | 低 | Header 右上角视图切换按钮 |
| 拖拽支持 | 低 | 卡片 `draggable="true"` |
| 面板生成后自动清空 prompt | 中 | 生成后清空 GenerateTab 的 prompt 框，准备下次输入 |
