# VideoFeed Bug Fix 开发日志

**日期**: 2026-03-29
**阶段**: Video Feed 全面 Bug 修复（声音 / 作者页 / Prompt / 视频背景 / 双滑 / Modal 覆盖）
**Commits**: d478a00 → 本次

---

## 背景

上一版（702f952）完成了 TikTok 风格视频流的 4 个核心功能：作者主页、声音、Prompt Sheet、旋转唱片跳转生成页。用户测试后发现多个 Bug，分两轮修复。

---

## 第一轮修复（三个核心 Bug）

| # | 问题描述 |
|---|----------|
| 1 | 点击 "Tap for sound" 后依然静音；有时需要点击声音图标两次才能出声 |
| 2 | 点击作者头像只改变顶部标题，视频列表不变（不跳转到真正的作者页） |
| 3 | 点击右下角旋转唱片能跳转到 Generate Video，但 prompt 为空 |

---

### Bug 1 — 声音无法立即生效

#### 根本原因

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

**问题 3：声音偏好不持久**
每次进入 `/video` 页面，`globalMuted` 都重新初始化为 `true`，用户必须每次重新点击解除静音。

#### 修复方案

**VideoFeed.js** — 在点击处理器内同步操作 DOM + localStorage 持久化：

```js
// 声音偏好持久化（lazy initializer）
const [globalMuted, setGlobalMuted] = useState(
  () => localStorage.getItem('vf_muted') !== 'false'
);
const [soundHintDismissed, setSoundHintDismissed] = useState(
  () => localStorage.getItem('vf_sound_hint') === 'true'
);

const handleUnmute = useCallback(() => {
  // 同步在用户手势上下文内执行，iOS Safari 接受
  document.querySelectorAll('video').forEach(v => { v.muted = false; });
  setGlobalMuted(false);
  setSoundHintDismissed(true);
  localStorage.setItem('vf_muted', 'false');
  localStorage.setItem('vf_sound_hint', 'true');
}, []);

const handleToggleGlobalMute = useCallback(() => {
  setGlobalMuted(m => {
    const next = !m;
    document.querySelectorAll('video').forEach(v => { v.muted = next; });
    localStorage.setItem('vf_muted', String(next));
    return next;
  });
  setSoundHintDismissed(true);
  localStorage.setItem('vf_sound_hint', 'true');
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

---

### Bug 2 — 点击作者头像视频列表不切换（后改为独立作者页）

#### 需求澄清

最初方案是：头部标题变为 `@authorName`，右侧出现返回按钮，底层视频列表通过 `?author=` 参数过滤。用户纠正：

> "点击头像应该跳转到当前作者的主页，展示他在我们数据库中的其他视频作品，而不是顶部标题变来变去。"

参考 TikTok 作者页设计：sticky 顶栏（返回 + 用户名）、大头像 + 昵称、粉丝/获赞统计、Watch All 按钮、3 列视频网格（9:16 缩略图）。

#### 实现方案

1. **新建 `client/src/pages/VideoFeed/AuthorPage.js`**
   - 路由：`/video/author/:name`（App.js 中位于 `/video` 路由前，确保路径匹配优先级正确）
   - 88px 靛蓝渐变头像（首字母占位）
   - 统计：Videos = `pagination.total`，Likes = 客户端 `videos.reduce` 求和
   - "Watch All" 按钮 → `navigate('/video?author=${encodeURIComponent(name)}')`
   - 3 列网格：`gridTemplateColumns: 'repeat(3, 1fr)'`，cell 用 `paddingBottom: (16/9)*100+'%'` 保持 9:16 比例
   - 缩略图 img + 获赞叠加；无缩略图时靛蓝渐变占位
   - 骨架屏（加载）、空状态、错误状态

2. **App.js** — 注册新路由（独立于 Layout，与 `/video` 同级）：
   ```jsx
   <Route path="/video/author/:name" element={<AuthorPage />} />
   <Route path="/video" element={<VideoFeed />} />
   ```

3. **VideoFeedItem.js** — 头像点击改为跳转新页：
   ```js
   navigate(`/video/author/${encodeURIComponent(item.authorName)}`);
   ```

4. **后端修复** — `server/routes/seedance.js` 新增 `authorName` regex 过滤（原 `$text` 索引不包含该字段）：
   ```js
   if (authorName) filter.authorName = { $regex: authorName.trim(), $options: 'i' };
   ```

5. **VideoFeed.js** — 作者筛选时重置滚动位置：
   ```js
   const feedRef = useRef(null);
   useEffect(() => {
     if (feedRef.current) feedRef.current.scrollTop = 0;
   }, [authorFilter]);
   ```

---

### Bug 3 — 旋转唱片跳转后 Prompt 为空（最隐蔽）

#### 根本原因

`Img2PromptPanel` 有两个子 Tab 组件：`ReverseTab`（默认）和 `VideoTab`（`tab='generate'` 时渲染）。

**`ReverseTab` 的 `[prefillJob]` effect**：

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
2. 导航到 `/generate-history` → `Img2PromptPanel` 初始 `tab='reverse'`，`ReverseTab` 渲染
3. Effects 运行（子先父后）：
   - `ReverseTab [prefillJob]` 先触发 → 调用 `onPrefillConsumed()` → `clearPrefill()` → **`prefillJob = null`**
   - `Img2PromptPanel [prefillJob]` 后触发 → `prefillJob?.tab === 'video'` → `setTab('generate')`（正确）
4. React 批量处理两次 state 更新：`prefillJob=null` + `tab='generate'`
5. 重新渲染：`VideoTab` 挂载，`prefillJob` 已经是 `null`
6. `VideoTab [prefillJob]` effect → `if (!prefillJob) return` → **prompt 永远不会被填入**

#### 修复方案

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

---

## 第二轮修复（视觉 + UX 优化）

### 16:9 视频显示优化（移动端专项）

#### 问题

`object-fit: cover` 对 16:9 横屏视频在竖向容器（9:16）里只能显示中间约 44% 宽度，主体内容严重裁切。

#### 修复方案（Instagram Reels 同款方案）

`object-fit: contain` + 模糊背景填充：

```jsx
{/* 模糊背景层：用缩略图放大模糊，填充 letterbox 留白区域 */}
{thumbSrc && (
  <div style={{
    position: 'absolute',
    inset: '-8%',          // 超出边框，避免 blur 软边露出
    backgroundImage: `url(${thumbSrc})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(22px)',
    transform: 'translateZ(0)', // GPU 图层
    opacity: 0.55,
  }} />
)}

{/* 视频本身：contain 保留完整帧 */}
<video ... style={{ objectFit: 'contain' }} />
```

**为什么用缩略图而不是第二个 video 元素**：移动端内存敏感，多余 video 元素极大增加 GPU 内存压力，缩略图是单张图片，成本几乎为零。

---

### Bug A — /video 下滑时跳过 1 个视频（双滑）

#### 根本原因

VideoFeedItem 容器有 `scroll-snap-align: start` 但缺少 `scroll-snap-stop: always`。在滑动速度较快时，浏览器的 scroll-snap 算法允许跳过中间吸附点，导致一次滑动跳 2 个视频。

#### 修复方案

在 VideoFeedItem 容器 div 的 style 中增加一行：

```js
scrollSnapStop: 'always',
```

`scroll-snap-stop: always` 强制浏览器在每个吸附点停顿，无论滑动速度多快，最多滑一格。

---

### Bug B — /gallery 和 /explore 移动端 Modal 不锁定背景滚动

#### 问题

`GalleryModal` 和 `SrefModal` 使用 `createPortal` 挂到 `document.body`，有 `.dmodal-backdrop` 全屏背景层。原注释认为 backdrop 能阻止背景交互，但在移动端 touch 事件会穿透 backdrop 传到下层 GalleryList/ExploreList，导致用户下滑 Modal 时实际滚动了背景页。

原注释：`// overflow:hidden 会导致 Chrome 在移除时重置 scrollY 到 0`

这个担忧是真实存在的，但可以用 `position: fixed` 方案绕过：

#### 修复方案（GalleryModal.js 和 SrefModal.js 相同）

```js
useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;   // 桌面端不锁（原 overflow 行为正常）
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);   // 精确还原滚动位置
    };
}, []);
```

**为什么有效**：`position: fixed` 将 body 固定，`top: -scrollY` 在视觉上维持当前位置。关闭时恢复样式并手动 `window.scrollTo` 还原位置，避免 Chrome 的 scrollY 重置 bug。

---

## 文件变更清单

| 文件 | 改动 |
|------|------|
| `client/src/pages/VideoFeed/VideoFeed.js` | `feedRef` 绑定；`handleUnmute`/`handleToggleGlobalMute` 同步 DOM + localStorage；`useEffect([authorFilter])` 重置 scrollTop；去除 isAuthorMode/headerTitle |
| `client/src/pages/VideoFeed/VideoFeedItem.js` | `globalMutedRef` + IntersectionObserver stale 修复；作者头像跳转改为 `/video/author/:name`；blurred bg + `objectFit: contain`；`scrollSnapStop: 'always'` |
| `client/src/pages/VideoFeed/AuthorPage.js` | **新建**：TikTok 风格作者主页（头像/统计/网格/骨架屏） |
| `client/src/App.js` | 注册 `/video/author/:name` 路由 |
| `client/src/components/UI/Img2PromptPanel.js` | ReverseTab `[prefillJob]` effect 增加 `tab==='video'` 早返回保护 |
| `client/src/pages/Gallery/GalleryModal.js` | 移动端 body scroll lock（position:fixed 方案） |
| `client/src/pages/SrefModal.js` | 移动端 body scroll lock（position:fixed 方案） |
| `server/routes/seedance.js` | 新增 `authorName` regex 过滤；sort=likes/random 聚合管道 |

---

## 技术要点总结

| 问题模式 | 教训 |
|----------|------|
| iOS Safari 音频控制 | `video.muted = false` 必须在用户手势同步上下文内，`useEffect` 不够 |
| useEffect 空依赖 + 闭包 | Observer/Timer 中用到的外部状态必须用 `useRef` 保持同步，不能依赖闭包 |
| React effects 执行顺序 | 兄弟组件 effects 按 DOM 顺序（子→父），共享 context 的消费要注意谁先谁后 |
| 条件渲染 + prefill 消费 | 如果 prefill 是"定向"的（只给某个子组件），其他组件不应无条件消费 |
| scroll-snap 跳格 | 缺少 `scroll-snap-stop: always` 时高速滑动可跳过吸附点 |
| 移动端 Modal 背景穿透 | backdrop div 无法阻止 touch scroll；需 `position:fixed` 锁定 body，关闭时手动还原 scrollY |
| 16:9 视频在竖屏容器 | `object-fit: cover` 严重裁切；改 contain + 模糊背景是业界标准方案（Instagram Reels 同款） |
