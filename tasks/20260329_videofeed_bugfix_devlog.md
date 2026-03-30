# VideoFeed Bug Fix 开发日志

**日期**: 2026-03-29
**阶段**: Video Feed 三项 Bug 修复
**Commits**: d478a00 → 51922e5

---

## 背景

上一版（702f952）完成了 TikTok 风格视频流的 4 个功能：作者主页、声音、Prompt Sheet、旋转唱片跳转生成页。用户测试后发现 3 个尚未解决的 Bug：

| # | 问题描述 |
|---|----------|
| 1 | 点击 "Tap for sound" 后依然静音；有时需要点击声音图标两次才能出声 |
| 2 | 点击作者头像只改变顶部标题，视频列表不变（不跳转） |
| 3 | 点击右下角旋转唱片能跳转到 Generate Video，但 prompt 为空 |

---

## Bug 1 — 声音无法立即生效

### 根本原因

`VideoFeedItem.js` 中声音同步写在 `useEffect` 里：

```js
useEffect(() => {
  const video = videoRef.current;
  if (video) video.muted = globalMuted;
}, [globalMuted]);
```

**问题 1：useEffect 是异步的**
iOS Safari 的 Autoplay Policy 规定：`video.muted = false` 必须在用户手势的**同步调用栈**内执行，才能被浏览器接受。`useEffect` 在 React 渲染完成后异步触发，已不在用户手势上下文内，因此 iOS 静默拒绝，视频仍保持静音。

**问题 2：IntersectionObserver 闭包陈旧**
IntersectionObserver 在 `useEffect([], [])` 中创建（空依赖），闭包捕获的 `globalMuted` 永远是初始值 `true`。用户点击解除静音后，当新视频滑入视口时，Observer 仍用 `globalMuted=true` 设置视频为静音，useEffect 虽然会纠正，但两者之间存在竞争，导致需要点两次才能出声。

### 修复方案

**VideoFeed.js** — 在点击处理器内同步操作 DOM：

```js
const handleUnmute = useCallback(() => {
  // 同步在用户手势上下文内执行，iOS Safari 接受
  document.querySelectorAll('video').forEach(v => { v.muted = false; });
  setGlobalMuted(false);
  setSoundHintDismissed(true);
}, []);

const handleToggleGlobalMute = useCallback(() => {
  setGlobalMuted(m => {
    const next = !m;
    document.querySelectorAll('video').forEach(v => { v.muted = next; });
    return next;
  });
  setSoundHintDismissed(true);
}, []);
```

**VideoFeedItem.js** — 新增 `globalMutedRef`，供 IntersectionObserver 读取最新值：

```js
const globalMutedRef = useRef(globalMuted);

useEffect(() => {
  globalMutedRef.current = globalMuted;   // 同步更新 ref
  if (videoRef.current) videoRef.current.muted = globalMuted;
}, [globalMuted]);

// IntersectionObserver 内：
video.muted = globalMutedRef.current;  // 不再是陈旧的闭包值
```

### 为什么这样有效

`document.querySelectorAll('video')` 在 click handler 内同步执行，属于用户手势的直接结果，浏览器允许静音切换。`globalMutedRef` 是一个普通对象引用，IntersectionObserver 闭包读取 `.current` 时永远拿到最新值。

---

## Bug 2 — 点击作者头像视频列表不切换

### 根本原因

`VideoFeedItem` 点击头像执行：

```js
navigate(`/video?author=${encodeURIComponent(item.authorName)}`);
```

`VideoFeed` 通过 `useSearchParams` 读取 `authorFilter`，`useInfiniteQuery` key 变化后重新请求 API，新数据是正确的（只含该作者的视频）。

**问题在于滚动位置**：滚动容器是 `position: fixed; overflow-y: scroll`。`authorFilter` 变化时数据重置，但容器的 `scrollTop` 停留在原来位置（比如第 5 个视频处）。新数据的第 0～4 个视频已渲染，但用户看不到，他们还在位置 5 看到的是新数据的第 6 个视频，视觉上感知"没有变化"。

### 修复方案

**VideoFeed.js** — 绑定 ref 并在 filter 变化时重置滚动：

```js
const feedRef = useRef(null);

// 作者筛选变化 → 滚动回顶部
useEffect(() => {
  if (feedRef.current) feedRef.current.scrollTop = 0;
}, [authorFilter]);

// 容器绑定 ref：
<div ref={feedRef} style={{ ... }}>
```

### 验证

浏览器测试：点击 `@かし子🍩` 的头像 → URL 变为 `/video?author=%E3%81%8B%E3%81%97...`，header 显示 `@かし子🍩`，`scrollTop = 0`，视频列表切换为该作者的内容。✓

---

## Bug 3 — 旋转唱片跳转后 Prompt 为空

### 根本原因（最关键，且隐蔽）

`Img2PromptPanel` 有两个子 Tab 组件：`ReverseTab`（默认）和 `VideoTab`（`tab='generate'` 时渲染）。

**`ReverseTab` 的 `[prefillJob]` effect（旧代码第 104 行）**：

```js
useEffect(() => {
  if (!prefillJob) return;
  if (prefillJob.prompt) setPrompt(prefillJob.prompt);
  if (prefillJob.referenceImageUrl) setRefImages([...]);
  onPrefillConsumed?.();   // ← 无论 tab 是什么，都调用！
}, [prefillJob]);
```

**执行顺序**（React effects 从子到父）：

1. `prefillJob = { prompt: '...', tab: 'video' }` 被 `setPrefill` 设置
2. 导航到 `/generate-history` → `Layout` 挂载，`Img2PromptPanel` 初始 `tab='reverse'`，`ReverseTab` 渲染
3. Effects 运行（子先父后）：
   - `ReverseTab [prefillJob]` 先触发 → 调用 `onPrefillConsumed()` → `clearPrefill()` → **`prefillJob = null`**
   - `Img2PromptPanel [prefillJob]` 后触发 → `prefillJob?.tab === 'video'` → `setTab('generate')`（正确）
4. React 批量处理两次 state 更新：`prefillJob=null` + `tab='generate'`
5. 重新渲染：`VideoTab` 挂载，`prefillJob` 已经是 `null`
6. `VideoTab [prefillJob]` effect → `if (!prefillJob) return` → **prompt 永远不会被填入**

这就是为什么 "Generate Video" 标签切换正常（步骤 3 中 `setTab` 成功），但 prompt 为空（步骤 6 中 `prefillJob` 已被 ReverseTab 提前清空）。

### 修复方案

**Img2PromptPanel.js** — `ReverseTab` 跳过 `tab:'video'` 类型的 prefill：

```js
useEffect(() => {
  if (!prefillJob) return;
  if (prefillJob.tab === 'video') return;  // ← 留给 VideoTab 消费
  if (prefillJob.prompt) setPrompt(prefillJob.prompt);
  if (prefillJob.referenceImageUrl) setRefImages([...]);
  onPrefillConsumed?.();
}, [prefillJob]);
```

一行防护语句，`tab:'video'` 的 prefill 不再被 ReverseTab 提前消费，VideoTab 挂载后能完整读取 prompt。

### 验证

浏览器测试：点击旋转唱片 → 导航到 `/generate-history` → "Generate Video" 标签激活 → `textarea` 填入完整 prompt（"Use the reference image only as a reference..."，共 1200+ 字符）。✓

---

## 文件变更清单

| 文件 | 改动 |
|------|------|
| `client/src/pages/VideoFeed/VideoFeed.js` | 新增 `feedRef`；`handleUnmute`/`handleToggleGlobalMute` 同步操作 DOM；`useEffect([authorFilter])` 重置 scrollTop |
| `client/src/pages/VideoFeed/VideoFeedItem.js` | 新增 `globalMutedRef`；IntersectionObserver 改用 `globalMutedRef.current` |
| `client/src/components/UI/Img2PromptPanel.js` | `ReverseTab [prefillJob]` effect 增加 `tab==='video'` 早返回保护 |

---

## 技术要点总结

| 问题模式 | 教训 |
|----------|------|
| iOS Safari 音频控制 | `video.muted = false` 必须在用户手势同步上下文内，`useEffect` 不够 |
| useEffect 空依赖 + 闭包 | Observer/Timer 中用到的外部状态必须用 `useRef` 保持同步，不能依赖闭包 |
| React effects 执行顺序 | 兄弟组件 effects 按 DOM 顺序（子→父），共享 context 的消费要注意谁先谁后 |
| 条件渲染 + prefill 消费 | 如果一个 prefill 是"定向"的（只给某个子组件），其他组件不应无条件消费 |
