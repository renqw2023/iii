# 阶段 67 开发日志 — Seedance 视频播放优化（A+B+D 三方案）

**日期**: 2026-03-26
**Commits**: `4ad87cd` (A+B 前端) + Nginx 服务器直接配置 (D)
**分支**: main
**生产地址**: https://iii.pics/seedance

---

## 一、背景与问题来源

用户反映 `/seedance` 页面点击卡片后视频播放不够流畅，主要表现：

1. 点击卡片后出现黑屏等待，没有任何加载反馈
2. 每次观看视频都需要重新从 Twitter CDN 拉取（经服务器代理），速度慢
3. hover 到点击之间的等待时间（100-500ms）完全浪费，未做任何预取

---

## 二、技术架构分析

### 播放链路（优化前）

```
用户点击卡片
  → SeedanceModal 打开
  → useQuery 获取 prompt 数据
  → getVideoSrc() 判断 URL 类型
      ├─ Twitter 视频 (twimg.com) → /api/seedance/proxy-video?url=<encoded>
      └─ 其他 CDN              → 直接加载原始 URL
  → <video autoPlay controls loop playsInline>
      ↑ 无加载态、无预取、无服务端缓存
```

### 服务器环境

| 项 | 值 |
|----|----|
| 系统 | Debian 13, AMD EPYC × 4, 7.8GB RAM |
| Web 服务 | Nginx 1.26.3（含 slice 模块） |
| 应用服务 | Node.js v22 + PM2 |
| 磁盘可用 | 213GB |
| 视频数据 | 1,047 条 Seedance 视频，全部为 Twitter twimg.com URL |

**关键发现**：Nginx 已作为反向代理运行（443 → Node:5500），且内置 `ngx_http_slice_module`，具备实施磁盘缓存的全部条件，无需安装额外软件。

---

## 三、方案 A — Modal 视频加载态 Spinner

### 问题

`SeedanceModal.js` 中的 `<video autoPlay>` 在缓冲期间无任何视觉反馈：

```jsx
// 修复前：视频加载中用户看到黑屏
<video src={getVideoSrc(prompt.videoUrl)} controls autoPlay loop playsInline
    style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
```

### 实现

**`client/src/pages/Seedance/SeedanceModal.js`**

```jsx
const [videoLoading, setVideoLoading] = useState(true);

<>
    <video
        src={getVideoSrc(prompt.videoUrl)}
        controls autoPlay loop playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onLoadStart={() => setVideoLoading(true)}   // 开始加载/切换视频
        onCanPlay={() => setVideoLoading(false)}     // 可以开始播放
        onWaiting={() => setVideoLoading(true)}      // 播放中缓冲卡顿
        onPlaying={() => setVideoLoading(false)}     // 恢复播放
    />
    {videoLoading && (
        <div className="dmodal-video-loading">
            <div className="dmodal-video-spinner" />
        </div>
    )}
</>
```

**`client/src/styles/gallery.css`** — 新增 CSS

```css
.dmodal-video-loading {
  position: absolute;       /* 叠在 video 之上 */
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 10;
  pointer-events: none;     /* 不阻挡原生 video controls */
}

.dmodal-video-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #f97316;   /* orange 主题色 */
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
```

**设计决策**：
- `.dmodal-left` 已有 `position: relative`，overlay 可直接叠加，无需修改布局
- `pointer-events: none` 确保 spinner 显示期间用户仍可操作视频进度条（如果已加载部分）
- 覆盖 `onWaiting/onPlaying` 处理播放中途网络抖动导致的二次缓冲

---

## 四、方案 B — Hover 时预加载 Modal 视频

### 原理

用户 hover 卡片到决定点击之间有 100-500ms 的决策窗口。利用这段时间向浏览器注入 `<link rel="preload" as="video">`，让浏览器提前请求视频资源的首个分片（通常 256KB-1MB），点击后播放器几乎无需等待。

### 实现

**`client/src/components/Seedance/VideoCard.js`**

```jsx
const preloadedRef = useRef(false);  // 每张卡片只注入一次

const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoSrc && !preloadedRef.current) {
        preloadedRef.current = true;
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = videoSrc;  // 已经过 getVideoSrc() 处理的代理 URL
        document.head.appendChild(link);
        // 5 分钟后清理，防止 <head> 无限积累
        setTimeout(() => link.parentNode?.removeChild(link), 5 * 60 * 1000);
    }
};

// 替换原有 onMouseEnter={() => setIsHovering(true)}
<motion.div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} ...>
```

**为什么不用 `<video preload="auto">`**：
- `preload="auto"` 会下载整个视频（几十 MB），浪费带宽
- `<link rel="preload" as="video">` 浏览器只取首个 Range 分片（与 slice 缓存配合完美）
- 使用 `preloadedRef` 而非 state，避免重复注入且不触发组件重渲染

**为什么不担心内存泄漏**：
- 5 分钟自动从 `<head>` 移除 `<link>` 标签
- `preloadedRef.current = true` 确保每个卡片实例只注入一次
- 浏览器的资源缓存（memory cache）在页面关闭时自动释放

---

## 五、方案 D — Nginx 磁盘缓存

### 为什么 D 比 C 更优先

方案 C（视频转存 OSS）需要重写数据采集流水线并迁移现有数据，工期 1-2 天。方案 D 纯服务器配置，**零代码改动，30 分钟完成**，且效果可量化验证。

### 技术选型：Slice 模块

普通 `proxy_cache` 无法正确处理 Range 请求（视频 seek）。`ngx_http_slice_module` 将大文件切成固定大小的块（1MB/块），每块独立缓存：

```
用户请求 Range: bytes=5242880-10485759 (5-10MB)
→ Nginx 分解为 slice 5 和 slice 6 的请求
→ 各 slice 独立缓存，命中则直接返回，未命中则回源 Node.js
→ 合并两个 slice 返回给用户
```

**优点**：
- 支持任意位置 seek，每段独立缓存
- 多用户并发 `proxy_cache_lock on` 确保同一 slice 只有一个回源请求
- 24.2MB 视频只需 25 次首次请求后全部缓存，后续全为 HIT

### 配置文件

**新增 `/etc/nginx/conf.d/video_cache.conf`**（被 nginx.conf 的 `http {}` 自动 include）

```nginx
proxy_cache_path /var/cache/nginx/video_cache
    levels=1:2
    keys_zone=video_cache:50m    # 50MB 内存存索引（约 40 万个缓存条目）
    max_size=30g                 # 磁盘上限 30GB（当前可用 213GB）
    inactive=7d                  # 7 天无访问自动删除
    use_temp_path=off;           # 直接写入缓存目录，减少磁盘 IO
```

**修改 `/etc/nginx/sites-available/iii.pics`**

在 `location /api/` 之前插入（Nginx 优先匹配更具体的 location）：

```nginx
# 视频代理缓存（slice 分块）
location /api/seedance/proxy-video {
    slice 1m;

    proxy_cache          video_cache;
    proxy_cache_key      "$scheme$host$uri$is_args$args$slice_range";
    proxy_cache_valid    200 206 7d;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
    proxy_cache_lock     on;
    proxy_cache_lock_timeout 10s;

    proxy_set_header Range $slice_range;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;

    proxy_pass http://127.0.0.1:5500;

    add_header X-Cache-Status $upstream_cache_status always;  # 调试用
}

# 缩略图缓存（无需分块）
location /api/seedance/proxy-thumbnail {
    proxy_cache          video_cache;
    proxy_cache_key      "$scheme$host$uri$is_args$args";
    proxy_cache_valid    200 30d;
    proxy_cache_use_stale error timeout;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_http_version 1.1;

    proxy_pass http://127.0.0.1:5500;

    add_header X-Cache-Status $upstream_cache_status always;
}
```

### 执行过程

```bash
# 1. 创建 cache zone 配置
sudo tee /etc/nginx/conf.d/video_cache.conf << 'EOF' ... EOF

# 2. 备份站点配置
sudo cp /etc/nginx/sites-available/iii.pics /etc/nginx/sites-available/iii.pics.bak.20260326

# 3. Python 脚本在正确位置插入 location 块（避免手动编辑出错）
sudo python3 << 'PYEOF' ... PYEOF

# 4. 创建缓存目录
sudo mkdir -p /var/cache/nginx/video_cache
sudo chown -R www-data:www-data /var/cache/nginx/

# 5. 测试 + 零停机重载
sudo nginx -t && sudo nginx -s reload
```

---

## 六、生产环境验证结果

### 验证地址：https://iii.pics/seedance

**方案 B — Hover 预加载**

hover 第一张卡片后，`document.head` 注入 4 个预加载链接：

```
<link rel="preload" as="video"
  href="https://iii.pics/api/seedance/proxy-video?url=https%3A%2F%2Fvideo.twimg.com%2F...">
```

**方案 A — 加载 Spinner**

Modal 打开，视频缓冲完成后 Spinner 正确消失：
- `spinnerExists: false`（已消失）
- `videoPlaying: true`（视频播放中）

**方案 D — Nginx 缓存命中**

```js
fetch(videoUrl, { headers: { Range: 'bytes=0-65535' } })
// 返回：
{
  status: 206,
  cacheStatus: 'HIT',           // ← Nginx 磁盘命中
  contentRange: 'bytes 0-65535/24321745'  // 视频总大小 23.2MB
}
```

**性能对比**（服务器本地 curl 测试同一视频片段）：

| 请求 | 耗时 | Cache 状态 |
|------|------|-----------|
| 第 1 次（MISS，回源 Twitter） | 0.339s | MISS |
| 第 2 次（HIT，Nginx 磁盘） | 0.005s | **HIT** |
| 提升 | **68x 更快** | — |

---

## 七、三方案协同效果

```
用户 hover 卡片
  → [B] <link rel="preload"> 注入，浏览器开始预取首段视频
  → [D] Nginx 检查磁盘缓存
      ├─ MISS: 回源 Node.js → Twitter，下载并缓存到磁盘
      └─ HIT:  直接从 /var/cache/nginx/video_cache/ 读取（0.005s）

用户点击卡片
  → SeedanceModal 打开
  → [A] videoLoading=true，显示 orange spinner
  → <video src> 请求视频
      → 如果 B 已预取: 首段数据已在浏览器缓存，几乎立即播放
      → 如果 D 已缓存: Nginx 极速响应（0.005s/slice）
  → onCanPlay 触发
  → [A] videoLoading=false，spinner 消失
  → 视频流畅播放 ✅
```

---

## 八、运维说明

### 缓存清理（如需强制刷新某视频）

```bash
# 清空全部视频缓存
sudo find /var/cache/nginx/video_cache -type f -delete
sudo nginx -s reload

# 查看当前缓存大小
sudo du -sh /var/cache/nginx/video_cache
```

### 回滚 Nginx 配置

```bash
sudo cp /etc/nginx/sites-available/iii.pics.bak.20260326 /etc/nginx/sites-available/iii.pics
sudo rm /etc/nginx/conf.d/video_cache.conf
sudo nginx -t && sudo nginx -s reload
```

### 监控缓存命中率（在访问日志中添加 cache_status）

可在 nginx.conf 的 `log_format` 中加入 `$upstream_cache_status` 字段，通过 `awk` 统计 HIT/MISS 比例。

---

## 九、待实施优化（参考文档 20260326_seedance_video_playback_analysis.md）

| 方案 | 内容 | 预计效果 |
|------|------|----------|
| C | 视频转存阿里云 OSS / Cloudflare R2 | 彻底消除代理层，服务器带宽零消耗 |
| E | ffmpeg 转码 → HLS 流（.m3u8 分片） | 自适应码率，移动端弱网流畅播放 |

---

## 十、文件变更索引

| 文件 | 类型 | 改动 |
|------|------|------|
| `client/src/pages/Seedance/SeedanceModal.js` | 前端 | 新增 `videoLoading` state + 4 个 video 事件处理 + Spinner overlay |
| `client/src/components/Seedance/VideoCard.js` | 前端 | 新增 `preloadedRef` + `handleMouseEnter` 注入 preload link |
| `client/src/styles/gallery.css` | 前端 | 新增 `.dmodal-video-loading` / `.dmodal-video-spinner` / `@keyframes spin` |
| `/etc/nginx/conf.d/video_cache.conf` | 服务器 | 新建：cache zone 定义（50MB 内存索引，30GB 磁盘，7d TTL） |
| `/etc/nginx/sites-available/iii.pics` | 服务器 | 新增两个 location 块（proxy-video slice 缓存 + proxy-thumbnail 缓存） |
