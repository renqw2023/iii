# 阶段33 开发日志 — MeiGen 风格生图历史页

**日期**: 2026-03-13
**作者**: Claude Code
**分支**: main
**状态**: ✅ 完成（含 post-deploy 修复）

---

## 背景与目标

### 问题来源

阶段29～32 完成了多模型文生图功能，但生图体验存在明显缺陷：

- 生图结果塞在右侧 `Img2PromptPanel` 底部的 `GenerationStatusCard`，用户视野狭小
- 已写的 `GenerationProgressModal.js`（Portal 浮层方案）经 MCP 浏览器实测后确认与 MeiGen 实际做法不符
- 无持久化生图历史（DB 记录），刷新即丢失
- `/history`（浏览历史）与"生图历史"概念混淆，急需拆分

### MeiGen 实测结论（Chrome DevTools 深度分析）

经 MCP Chrome DevTools 实测，MeiGen.ai 的实际做法是：

- 点击"生成图片" → **自动跳转**到「生成记录」页
- 在主内容区 Grid **顶部插入内联卡片**
- 三态：loading（SVG 圆环 + 百分比）/ error（图标 + Retry）/ success（图片内联）
- **不是 Modal 浮层**，而是持久化页面

### 用户确认的5个目标

1. 新建 `/generate-history` 页（MeiGen 风格内联 Grid）
2. 旧 `/history` 迁移为 `/browse-history`，原路径重定向
3. SVG `stroke-dasharray` 圆环替代旧 conic-gradient
4. 侧边栏新增"Generation History"入口
5. 生图时自动跳转 + 内联卡片 + DB 持久化

---

## 架构决策

### 不做异步 Job 队列

服务端 `POST /api/generate/image` 保持同步（等待 AI 返回后响应）。

采用**乐观 UI + React Context** 模拟 MeiGen 体验：
- 点击生成 → navigate `/generate-history` → 前端插入 loading 卡片（内存 state）
- 同步 API 在后台继续执行
- 返回后 Context 更新卡片为 success/error

优势：无需改造 API、无 WebSocket/SSE 复杂度、与现有积分流程完全兼容。

### GenerationContext 伪进度机制

使用 `useReducer` + TICK action：
- 每 700ms dispatch TICK
- TICK 在 reducer 内对所有 `status === 'loading'` 的 job 推进进度
- `< 60%: +7` | `< 85%: +3` | `< 95%: +1` | `>= 95%: 停止`
- interval 在 `useEffect` 中管理，有 loading job 时启动，全部完成时停止

之所以用 reducer 内 TICK（而不是 dispatch 多个 UPDATE）：避免读取 stale closure 中的 state。

### DB 持久化

新建 `Generation` Model，在 `POST /api/generate/image` 成功 + 积分扣除后 try-catch 写入。
写入失败只 `console.error`，不影响生图响应。

---

## 文件变更清单

### 新建（5个）

| 文件 | 说明 |
|------|------|
| `server/models/Generation.js` | Generation MongoDB 模型（user/prompt/modelId/imageUrl/aspectRatio/creditCost/status） |
| `client/src/contexts/GenerationContext.js` | 全局 activeGenerations 状态 + TICK reducer + interval 管理 |
| `client/src/components/UI/GenerationCard.js` | 内联三态卡片（SVG ring / AlertCircle+Retry / img+hover overlay） |
| `client/src/pages/GenerateHistory.js` | 生成记录页，日期分组，active + DB history 双来源 |
| `client/src/services/generationHistoryApi.js` | `GET /api/generate/history` 封装 |

### 修改（6个）

| 文件 | 改动摘要 |
|------|---------|
| `server/routes/generate.js` | POST /image 成功后写 Generation；新增 GET /history 路由 |
| `client/src/App.js` | 加 GenerationProvider；/generate-history 路由；/history → /browse-history 重定向 |
| `client/src/components/Layout/Sidebar.js` | 新增 Wand2 "Generation History"；Clock 改为 /browse-history |
| `client/src/components/UI/Img2PromptPanel.js` | GenerateTab 改用 navigate + Context；移除 GenerationProgressModal；onClose 透传 |
| `client/src/pages/History.js` | SectionCard 标题改为 "Browse History" |
| `client/src/index.css` | 新增 `@keyframes shimmer` |

### 废弃（保留文件，不再引用）

- `client/src/components/UI/GenerationProgressModal.js`

---

## 实现细节

### SVG stroke-dasharray 圆环

```jsx
const circumference = 2 * Math.PI * 45; // = 282.74
const dashArray = `${Math.max(progress, 2) * (circumference / 100)} ${circumference}`;

<circle cx="50" cy="50" r="45"
  stroke="#111827" strokeWidth="3"
  strokeLinecap="round"
  strokeDasharray={dashArray}
  transform="rotate(-90 50 50)"
  style={{ transition: 'stroke-dasharray 0.7s ease' }}
/>
```

相比旧的 `conic-gradient` 方案，SVG 圆环：
- 支持 `strokeLinecap="round"` 端点圆角
- 过渡动画（`transition`）更流畅
- 完全跨浏览器

### GenerateTab → onClose 透传

`Img2PromptPanel` 在 `onClose` 存在时通过 prop 传给 `GenerateTab`，生图触发后 navigate + onClose，使面板收起、主内容区完整显示 loading 卡片。

```jsx
// Img2PromptPanel 内：
{tab === 'reverse' ? <ReverseTab onClose={onClose} /> : <GenerateTab onClose={onClose} />}

// GenerateTab 内 handleGenerate：
addGeneration(job);
navigate('/generate-history');
onClose?.();  // 收起面板
```

### DB record → job shape 转换

```js
function recordToJob(rec) {
  return {
    id: rec._id,
    status: rec.status === 'error' ? 'error' : 'success',
    progress: 100,
    prompt: rec.prompt,
    modelId: rec.modelId,
    modelName: rec.modelName,
    aspectRatio: rec.aspectRatio || '1:1',
    result: { imageUrl: rec.imageUrl },
    imageUrl: rec.imageUrl,
    errorMessage: rec.errorMsg || '',
    startedAt: new Date(rec.createdAt),
  };
}
```

### 日期分组

```js
function groupByDate(records) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  // ...
  label = d >= today ? 'Today' : d >= yesterday ? 'Yesterday' : d.toLocaleDateString(...)
}
```

---

## 路由架构变更

```
旧:
  /history       → History.js（浏览历史）

新:
  /browse-history → History.js（浏览历史，原内容）
  /history        → <Navigate to="/browse-history" replace />（重定向，保持旧书签有效）
  /generate-history → GenerateHistory.js（生图历史，新增）
```

`/generate-history` 放在非保护 Layout 块内（与 `/explore`、`/gallery` 同级），但页面内部自己处理未登录状态（显示登录提示）。

---

## 已知问题与 Post-Deploy 修复

### 问题1：面板不收起导致主内容区被遮挡

**症状**: 点击 Generate Image 后导航到 `/generate-history`，但 `Img2PromptPanel`（`position: fixed, right: 16, zIndex: 100`）仍然覆盖主内容区，loading 卡片被遮挡不可见。

**根因**: `GenerateTab` 未接收 `onClose` prop，无法在 navigate 后关闭面板。

**第一次修复（不完整）**: `Img2PromptPanel` 将 `onClose` 透传给 `<GenerateTab onClose={onClose} />`，加了 `onClose?.()` — 但 navigate 仍在 `GenerateTab` 内调用，深嵌于 `position:fixed` 面板中，HMR 热重载后 Router context 不稳定导致 navigate 偶发无效。

**最终修复（导航提升至 Layout）**:
- `Layout.js` 新增 `handleStartGeneration` callback：先 `setImg2promptOpen(false)` 再 `navigate('/generate-history')`
- 通过 `onStartGeneration` prop 传给 `Img2PromptPanel` → `GenerateTab`
- `GenerateTab` 完全移除本地 `useNavigate`，改为调用 `onStartGeneration?.()`
- 同时移除 `GenerateTab` 中所有本地 status/progress/result/errorMessage state 和 `GenerationStatusCard`，所有反馈均通过 `GenerationContext` 在 `GenerateHistory` 页渲染

### 问题2：侧边栏出现中文标签

**症状**: 侧边栏导航、头像下拉菜单出现 "浏览历史"、"生成记录" 中文。
**根因**: 开发时未严格遵循全英文 UI 规范。
**修复**: 改为 "Browse History" 和 "Generation History"。

### 问题3：生成历史页全背景，非独立容器

**症状**: `/generate-history` 页面整个视口都是内容，缺乏 MeiGen 风格的独立白色容器感。
**用户反馈**: "生成历史也不是我们这种全背景，而是一个独立的大容器"
**修复**: 重构 `GenerateHistory.js` return：
- 外层 `div` 加 `minHeight: '100vh', backgroundColor: '#fff'`
- 内层容器 `maxWidth: 900, margin: '0 auto', padding: '0 20px 80px'`
- 页头改为 `← Back | Generation History` 风格（`ChevronLeft` + `navigate(-1)`）

### 注意：Google Gemini API 高峰限流

**报错**: `Gemini 服务错误: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.`

此错误来自 Google 服务端，属于临时性流量高峰限流，非代码缺陷。无需修改代码。建议在前端展示更友好的提示（如"服务繁忙，请稍后重试"），或在用户界面增加"重试"按钮。

---

## 验证截图描述

1. `/generate-history` 页面加载正常：Wand2 图标 + "Generation History" 页头，空状态"No generations yet"
2. 侧边栏正确显示 "Browse History"（Clock）和 "Generation History"（Wand2）链接
3. `/history` → 自动重定向到 `/browse-history` ✓
4. `/browse-history` 显示完整浏览历史内容，标题 "Browse History" ✓
5. 无 JS 控制台错误

---

## 后续优先项

- 为 Gemini 限流错误增加更友好的前端提示
- 生成图片数量超过 50 条后，分页加载（当前 limit: 50）
- 生成记录页增加"再次生成"按钮（用历史 prompt 填充 panel 并重新生成）
- 可考虑在 GenerationCard success 状态增加"收藏"按钮
