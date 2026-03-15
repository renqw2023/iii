# Stage 40 开发记录 — Seedance 详情页「Generate Video」填充 + 历史页视频卡片优化

**日期**: 2026-03-15
**涉及 commit**: 本次提交
**前置 commit**: `7541745`（Stage 39d devlog）

---

## 一、需求背景

用户在 `/seedance` 浏览 Seedance 视频示例时，想直接把当前视频的 prompt 填入右侧生成面板的 **Generate Video** 输入框，无需手动复制粘贴。类似 `/gallery` 中「Use Idea」按钮的体验，但目标是 VideoTab 而非 ImageTab。

---

## 二、方案分析

提出两个方案：

| 方案 | 描述 | 难度 |
|------|------|------|
| **A — Text to Video** | 一键填充 prompt 到 VideoTab | ★☆☆ 低，基础设施几乎就绪 |
| **B — 1st + Last 帧** | 自动从视频截取首尾帧填入图生视频模式 | ★★★ 高，火山 CDN 有 CORS 限制，无法客户端截帧 |

**最终选择方案 A**，方案 B 留作后续（需服务端 FFmpeg 代理）。

---

## 三、根因分析（改动前现状）

### 3.1 `prefillJob` 管道现状

```
GenerationContext.setPrefill(payload)
  → Layout.js useEffect 检测 prefillJob → setImg2promptOpen(true)
  → Img2PromptPanel 接收 prefillJob prop
  → ReverseTab 消费 prefillJob.prompt（填入文本框）
  → VideoTab 有 prefillJob useEffect（line 660）但从未收到 prop ← BUG
```

**问题 1**：`Img2PromptPanel` 的 `<VideoTab>` 渲染时漏传 `prefillJob` / `onPrefillConsumed`（line 983），导致 VideoTab 的填充逻辑永远无法触发。

**问题 2**：`Img2PromptPanel` 没有逻辑根据 `prefillJob.tab` 字段切换 tab，所有 prefill 都停留在 Reverse（Image）tab。

**问题 3**：`SeedanceModal` 没有「Generate Video」入口，无法触发 prefill 流程。

### 3.2 `GenerationCard` ASPECT_RATIO_MAP 缺失

视频支持 `9:16`、`21:9` 宽高比（Stage 39d 新增），但 `GenerationCard` 的 `ASPECT_RATIO_MAP` 只有 4 种，导致这两种视频的卡片高度计算 fallback 到 `16:9`，展示比例不正确。

### 3.3 历史页视频卡片偏小

`CardGrid` 固定使用 `minmax(220px, 1fr)`，对 16:9 视频卡片显示效果不佳（宽度不足，高度更矮）。

---

## 四、改动详情

### 4.1 `client/src/pages/Seedance/SeedanceModal.js`

**新增「Generate Video」按钮**

在 footer 区域，Copy Prompt 主按钮**左侧**新增紫色渐变按钮：

```jsx
<button
    className="dmodal-btn-primary"
    onClick={() => {
        setPrefill({ prompt: prompt.prompt, tab: 'video' });
        handleClose();
        toast.success('Prompt filled — check Generate Video');
    }}
    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
>
    <Wand2 size={16} />
    Generate Video
</button>
```

**payload 说明**：
- `prompt`：当前视频的 prompt 文本
- `tab: 'video'`：新增字段，告知 Img2PromptPanel 应切换到 VideoTab

**依赖新增**：`useGeneration`（import GenerationContext），`Wand2`（lucide-react）

---

### 4.2 `client/src/components/UI/Img2PromptPanel.js`

**改动 1 — 根据 `prefillJob.tab` 自动切 tab**

```js
// 旧：// prefillJob → stay on reverse tab, let ReverseTab consume it

// 新：
useEffect(() => {
  if (prefillJob?.tab === 'video') setTab('generate');
}, [prefillJob]);
```

当 prefillJob 携带 `tab: 'video'` 时，面板自动切到 Generate Video tab（内部名 `'generate'`）。

**改动 2 — VideoTab 补传 prefillJob prop**

```jsx
// 旧：
{tab === 'reverse' ? <ReverseTab ... /> : <VideoTab onStartGeneration={onStartGeneration} />}

// 新：
{tab === 'reverse'
  ? <ReverseTab onClose={onClose} onStartGeneration={onStartGeneration} prefillJob={prefillJob} onPrefillConsumed={onPrefillConsumed} />
  : <VideoTab onStartGeneration={onStartGeneration} prefillJob={prefillJob} onPrefillConsumed={onPrefillConsumed} />
}
```

`VideoTab` 内部（line 660）已有消费逻辑：
```js
useEffect(() => {
  if (prefillJob?.prompt) { setPrompt(prefillJob.prompt); onPrefillConsumed?.(); }
}, [prefillJob]);
```
补传 prop 后该逻辑立即生效，无需其他修改。

---

### 4.3 `client/src/pages/GenerateHistory.js`

**`CardGrid` 支持动态 minCardWidth**

```jsx
// 旧：固定 220px
const CardGrid = ({ children }) => (
  <div style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>

// 新：接受 prop
const CardGrid = ({ children, minCardWidth = 220 }) => (
  <div style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}>
```

**视频分组自动使用大卡片（340px）**：

```jsx
// 活跃生成区
<CardGrid minCardWidth={filteredActive.every(j => j.mediaType === 'video') ? 340 : 220}>

// 历史记录区（按日期分组）
<CardGrid minCardWidth={items.every(r => r.mediaType === 'video') ? 340 : 220}>
```

逻辑：当一组内**全部是视频**时使用 340px，否则保持 220px（混合/图片）。

---

### 4.4 `client/src/components/UI/GenerationCard.js`

**补充缺失的视频宽高比**

```js
// 旧：
const ASPECT_RATIO_MAP = {
  '1:1': [1, 1], '4:3': [4, 3], '3:4': [3, 4], '16:9': [16, 9],
};

// 新：
const ASPECT_RATIO_MAP = {
  '1:1': [1, 1], '4:3': [4, 3], '3:4': [3, 4], '16:9': [16, 9],
  '9:16': [9, 16],   // ← 新增：竖屏视频
  '21:9': [21, 9],   // ← 新增：超宽屏视频
};
```

Stage 39d 新增了 9:16 / 21:9 视频生成选项，但卡片渲染的高度计算 fallback 了，本次修复。

---

## 五、用户操作流程（改动后）

```
① 用户在 /seedance 列表点击任意视频卡片
② 详情 Modal 打开 → 查看视频 + prompt
③ 点击底部紫色「✦ Generate Video」按钮
④ Modal 关闭 + toast 提示「Prompt filled — check Generate Video」
⑤ 右侧 AI Generation 面板自动弹出
⑥ 面板自动切到「Generate Video」tab
⑦ Prompt 输入框已预填当前视频的 prompt 文本
⑧ 用户调整时长/分辨率/比例后直接点击生成
```

---

## 六、验证截图说明

Browser 验证（localhost:3100）：

1. **SeedanceModal 详情页** — 底部新增紫色 Generate Video 按钮 + 橙色 Copy Prompt 按钮并排 ✅
2. **点击后** — Modal 关闭，面板弹出，tab 自动切到「Generate Video」，Prompt 文本框预填「The main subject enters the frame, first sprinkles salt lightly into the flour...」✅
3. **积分显示正常**（⚡ 34）✅
4. **无 JS 错误** ✅

---

## 七、文件改动汇总

| 文件 | 改动类型 | 关键内容 |
|------|---------|---------|
| `client/src/pages/Seedance/SeedanceModal.js` | 功能新增 | Generate Video 按钮 + setPrefill 调用 |
| `client/src/components/UI/Img2PromptPanel.js` | Bug 修复 + 功能新增 | prefillJob.tab 切 tab + VideoTab 补传 prop |
| `client/src/pages/GenerateHistory.js` | 优化 | CardGrid 动态 minCardWidth，视频卡片 340px |
| `client/src/components/UI/GenerationCard.js` | Bug 修复 | ASPECT_RATIO_MAP 补充 9:16 / 21:9 |

---

## 八、已知限制

| 项目 | 说明 |
|------|------|
| 图生视频（方案 B）| 火山 CDN 有 CORS 限制，客户端无法截帧；需服务端 FFmpeg 支持，留作后续 |
| Seedance 视频 prompt 语言 | 部分 prompt 为英文，填入 VideoTab 直接使用；中文用户可点 Translate 先翻译再复制 |
