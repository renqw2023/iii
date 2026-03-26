# Seedance 视频播放优化分析与实施记录

**日期**: 2026-03-26
**状态**: 方案 A + B 已实施
**分支**: main

---

## 一、当前技术架构（实施前）

### 播放链路

```
用户点击卡片
  → SeedanceModal 打开 (React Router nested route /seedance/:id)
  → useQuery 获取 prompt 数据
  → getVideoSrc(prompt.videoUrl) 判断 URL 类型
      ├─ Twitter 视频 (twimg.com) → /api/seedance/proxy-video?url=<encoded>
      └─ 其他 CDN              → 直接加载原始 URL
  → <video autoPlay controls loop playsInline>
```

### 核心技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 播放器 | 原生 HTML5 `<video>` | 无第三方库，支持原生 controls |
| CORS 代理 | Node.js `Readable.fromWeb()` 流式代理 | 绕过 Twitter CORS，转发 Range 请求 |
| 卡片预览 | Intersection Observer + hover → `video.play()` | 进入视口 500px 才加载，hover 触发播放 |
| 缩略图 | `preload="metadata"` 隐藏 video 提取首帧 | 无 thumbnailUrl 时的降级方案 |
| 浏览器缓存 | `Cache-Control: max-age=3600`（视频）/ `86400`（缩略图）| 仅浏览器级 |

### 关键文件索引

```
client/src/pages/Seedance/SeedanceModal.js      — 详情 Modal（视频播放器）
client/src/components/Seedance/VideoCard.js     — 卡片组件（hover-to-play）
client/src/pages/Seedance/SeedanceList.js       — 列表页（infinite scroll）
client/src/services/seedanceApi.js              — getVideoSrc() / getThumbnailSrc()
server/routes/seedance.js                       — /proxy-video + /proxy-thumbnail
server/models/SeedancePrompt.js                 — videoUrl / thumbnailUrl 字段
client/src/styles/gallery.css                   — .video-card* / .dmodal-* 样式
```

---

## 二、瓶颈分析

### 1. 最大问题：所有 Twitter 视频走 Node.js 代理（带宽 & 延迟双重损耗）

```
现在：用户 → 你的服务器(Node代理) → Twitter CDN
```

所有 twimg.com 视频必须经服务器中转，1047 条数据如果多人并发访问，服务器带宽会成为瓶颈。

**根本解决方案（方案 C，待实施）**：将视频转存到 OSS/CDN，彻底消除代理层：

```
未来：用户 → 阿里云OSS/Cloudflare R2（边缘节点，低延迟）
```

### 2. Modal 打开时视频黑屏等待（无加载态 UI）

`<video>` 无 `preload` 属性，点击后才开始加载，首帧出现前用户看到黑屏（已由方案 A 修复）。

### 3. 无预缓冲——点击即加载（已由方案 B 修复）

从 hover 到点击通常有 100-500ms，这段时间原本完全浪费。

### 4. 视频格式未优化（待评估）

所有视频为 `.mp4`，无 WebM/AV1 等更高压缩格式，也无多分辨率自适应。

### 5. 无 HLS 流（长期优化）

不支持自适应码率，移动端弱网体验差。需要 ffmpeg 转码流水线，成本较高。

---

## 三、已实施方案

### 方案 A — Modal 视频加载态 Spinner

**文件**: `client/src/pages/Seedance/SeedanceModal.js`

**问题**：`<video autoPlay>` 在视频开始缓冲期间不提供任何视觉反馈，用户看到黑屏。

**实现**：

```jsx
const [videoLoading, setVideoLoading] = useState(true);

<video
    src={getVideoSrc(prompt.videoUrl)}
    controls autoPlay loop playsInline
    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    onLoadStart={() => setVideoLoading(true)}   // 开始加载
    onCanPlay={() => setVideoLoading(false)}     // 可以播放了
    onWaiting={() => setVideoLoading(true)}      // 播放中途缓冲
    onPlaying={() => setVideoLoading(false)}     // 继续播放
/>
{videoLoading && (
    <div className="dmodal-video-loading">
        <div className="dmodal-video-spinner" />
    </div>
)}
```

**CSS** (`gallery.css`)：

```css
.dmodal-video-loading {
  position: absolute;  /* 叠在 video 之上，.dmodal-left 已有 position:relative */
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 10;
  pointer-events: none;  /* 不阻挡 video controls */
}

.dmodal-video-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #f97316;  /* orange 主色 */
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
```

**效果**：视频加载中显示半透明黑底 + orange 转圈，`onCanPlay` 触发后消失，播放中途网络卡顿时再次出现。

---

### 方案 B — Hover 预加载 Modal 视频

**文件**: `client/src/components/Seedance/VideoCard.js`

**原理**：用户 hover 卡片到点击打开 Modal 之间有 100-500ms 的决策时间，利用这段时间预取视频资源。

**实现**：

```jsx
const preloadedRef = useRef(false);

const handleMouseEnter = () => {
    setIsHovering(true);
    // 首次 hover 时注入 <link rel="preload" as="video">
    if (videoSrc && !preloadedRef.current) {
        preloadedRef.current = true;
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = videoSrc;  // 已经过 getVideoSrc() 处理的代理 URL
        document.head.appendChild(link);
        // 5 分钟后清理，防止 <head> 无限增长
        setTimeout(() => link.parentNode?.removeChild(link), 5 * 60 * 1000);
    }
};
```

**为什么用 `<link rel="preload">` 而非隐藏 `<video preload="auto">`**：
- `<video preload="auto">` 会下载整个视频文件，消耗大量带宽
- `<link rel="preload" as="video">` 浏览器只请求视频的首个分片（通常 256KB-1MB），足够让播放器快速启动
- 代理的 Range 请求支持确保分片请求正常工作

**为什么用 `preloadedRef` 而非 state**：
- 防止用户反复 hover 时重复注入（每张卡片只注入一次）
- ref 不触发重渲染，性能更好

**验证**：通过 Chrome DevTools hover 模拟确认，hover 后 `document.head` 中出现：
```html
<link rel="preload" as="video" href="http://localhost:5500/api/seedance/proxy-video?url=https%3A%2F%2Fvideo.twimg.com%2F...">
```

---

## 四、待实施方案（优先级排序）

| 优先级 | 方案 | 预计工期 | 核心效果 |
|--------|------|----------|----------|
| 高 | **C — 视频转存 OSS/CDN** | 1-2 天 | 消除代理层，速度从 2-5s → <1s，带宽零消耗 |
| 中 | **D — Nginx proxy_cache** | 半天 | 减轻服务器重复请求压力，热门视频秒开 |
| 低 | **E — HLS 自适应流** | 3-5 天 | 弱网体验，移动端自适应码率 |

### 方案 C 实施思路（供参考）

采集阶段（`syncGptImage.js`）同步下载视频并上传 OSS：

```js
// 同步时上传到 OSS
const ossUrl = await uploadToOSS(videoBuffer, `seedance/${item.id}.mp4`);
record.videoUrl = ossUrl;  // 存 OSS URL 而非 Twitter URL
```

`getVideoSrc()` 中 OSS URL 直接返回，不经代理：
```js
export const getVideoSrc = (url) => {
    if (!url) return '';
    if (url.includes('oss.aliyuncs.com') || url.includes('r2.dev')) return url; // CDN 直连
    if (url.includes('twimg.com')) return `${baseURL}/seedance/proxy-video?url=${encodeURIComponent(url)}`;
    return url;
};
```
