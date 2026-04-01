# Seedance 视频本地存储 开发日志

**日期**: 2026-04-01
**阶段**: 视频本地存储 + GSC VideoObject 修复
**Commits**: 待 push

---

## 一、背景与目标

### 问题根因

Google Search Console 对 `https://iii.pics/seedance/` 页面反馈"视频无法播放"。

调查后确认：
- 95%+ 的 Seedance 视频 URL 格式为 `https://video.twimg.com/...`（Twitter/X 平台）
- Twitter 视频需要 Cookie 认证才能访问，Google 爬虫无 Cookie → 无法播放
- 因此 VideoObject JSON-LD 中的 `contentUrl` 指向 Twitter URL 时，GSC 视频索引无法建立

### 解决方案

将 1224 条 Twitter 视频下载到服务器本地，通过 `/v/seedance/{id}.mp4` 公开访问，contentUrl 改用本地 URL，Google 爬虫可正常抓取。

**数据规模**: ~1224 条 × ~4MB ≈ 4.8GB（服务器剩余 200GB，完全可承载）

---

## 二、架构设计

### 存储路径

```
server/uploads/videos/seedance/{mongodb_id}.mp4
```

- 用 MongoDB `_id` 作文件名（唯一、无冲突）
- 与现有 `/uploads/` 结构保持一致

### 访问 URL

```
https://iii.pics/v/seedance/{_id}.mp4
```

- `/v/` 前缀区分视频资源路由（避免与 `/uploads/` 混淆）
- 7天 Cache-Control，CDN 友好

### DB Schema 扩展

`server/models/SeedancePrompt.js` 新增：

```js
localVideoPath: { type: String, default: '' }
// 本地相对路径，如 'seedance/{id}.mp4'

storageType: { type: String, enum: ['twitter', 'local', 'r2'], default: 'twitter', index: true }
// 'twitter'  → 视频仍在 Twitter（需代理）
// 'local'    → 已下载到服务器
// 'r2'       → 已迁移到 Cloudflare R2（未来）
```

### R2 迁移预留

未来只需：
1. 将 `uploads/videos/seedance/` 上传到 R2 bucket
2. 批量更新 DB：`storageType='r2'`，`videoUrl` 改为 R2 URL
3. `getVideoSrc()` 已支持直接返回外部 URL（无需改前端逻辑）

---

## 三、实施步骤

### Step 1 — DB 模型扩展

**文件**: `server/models/SeedancePrompt.js`

在 `videoUrl` / `thumbnailUrl` 之后新增：

```js
localVideoPath: { type: String, default: '' },
storageType: {
    type: String,
    enum: ['twitter', 'local', 'r2'],
    default: 'twitter',
    index: true
},
```

### Step 2 — `/v/` 静态路由

**文件**: `server/index.js`

```js
app.use('/v', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=604800'); // 7天缓存
  next();
});
app.use('/v', express.static(path.join(__dirname, 'uploads/videos'), { maxAge: '7d' }));
```

同时创建目录：`server/uploads/videos/seedance/`

### Step 3 — 批量下载脚本

**文件**: `server/scripts/downloadSeedanceVideos.js`（新建）

关键特性：
- **查询**: `videoUrl` 包含 `twimg.com`（兼容旧数据：既有记录的 storageType 字段值为 undefined）
- **并发**: 同时 2 个下载任务
- **限速**: 每个任务完成后等待 300ms
- **断点续传**: 文件已存在且大于 10KB 则跳过下载（仍补齐 DB 更新）
- **下载成功后更新 DB**:
  - `localVideoPath = 'seedance/{id}.mp4'`
  - `storageType = 'local'`
  - `videoUrl = '/v/seedance/{id}.mp4'`（原 Twitter URL 替换为本地路径）
- **失败处理**: 记录错误继续，最终统计 done/skipped/failed

> **Bug 修复记录**: 初版查询条件为 `{ storageType: 'twitter' }`，命中 0 条。根因：既有 1224 条记录在 `storageType` 字段加入模型之前创建，字段值为 `undefined` 而非 `'twitter'`。修复方案：改用 `{ videoUrl: { $regex: 'twimg\\.com' } }` 直接匹配 URL 特征，与 storageType 无关。

### Step 4 — youmindSync 自动下载

**文件**: `server/services/youmindSync.js`

新增 `downloadVideoToLocal(videoUrl, docId)` 辅助函数（单文件下载，30s timeout）。

在 `syncSeedanceYouMind()` 的新记录创建逻辑后，立即调用下载：

```js
const doc = await SeedancePrompt.create(record);
if (record.videoUrl && record.videoUrl.includes('twimg.com')) {
  const localPath = await downloadVideoToLocal(record.videoUrl, doc._id.toString());
  if (localPath) {
    await SeedancePrompt.updateOne({ _id: doc._id }, {
      $set: { localVideoPath: localPath, storageType: 'local', videoUrl: `/v/${localPath}` }
    });
  }
}
```

新的 YouMind 同步不再产生 Twitter URL 记录，直接落地为本地存储。

### Step 5 — render.js 更新

**文件**: `server/routes/render.js`

原逻辑：检测是否为 Twitter URL，若是则 `contentUrl` 为空。

新逻辑（三级优先）：

```js
let publicVideoUrl = '';
if (item.storageType === 'local' && item.localVideoPath) {
  publicVideoUrl = `https://iii.pics/v/${item.localVideoPath}`;      // 1. 本地存储 ✅
} else if (item.storageType === 'r2' && item.videoUrl?.startsWith('http')) {
  publicVideoUrl = item.videoUrl;                                     // 2. R2 ✅
} else if (item.videoUrl && !item.videoUrl.includes('twimg.com')) {
  publicVideoUrl = item.videoUrl;                                     // 3. 其他公开 URL ✅
}
// Twitter URL → publicVideoUrl = ''（不暴露给 Google）
```

`SeedancePrompt.select()` 同步增加 `localVideoPath storageType`。

### Step 6 — sitemapGenerator.js 更新

**文件**: `server/utils/sitemapGenerator.js`（两处：generateVideoSitemap + generateSeedanceSitemap）

`.select()` 新增 `localVideoPath storageType`，`contentLoc` 生成逻辑同 render.js 三级优先。

下载完成后，sitemap 中的 `<video:content_loc>` 将自动指向 `https://iii.pics/v/seedance/{id}.mp4`，Google 爬虫可直接访问。

### Step 7 — 前端 getVideoSrc 更新

**文件**: `client/src/services/seedanceApi.js`

```js
export const getVideoSrc = (url) => {
    if (!url) return '';
    // 本地存储或 R2 URL 直接使用（无需代理）
    if (url.startsWith('/v/') || url.startsWith('https://iii.pics/v/')) return url;
    // Twitter/X 视频需要代理
    if (url.includes('twimg.com') || url.includes('video.twimg.com')) {
        const baseURL = config.api.baseURL || '/api';
        return `${baseURL}/seedance/proxy-video?url=${encodeURIComponent(url)}`;
    }
    return url;
};
```

---

## 四、修改文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `server/models/SeedancePrompt.js` | 修改 | 新增 localVideoPath + storageType 字段 |
| `server/index.js` | 修改 | 新增 /v/ 静态路由 |
| `server/scripts/downloadSeedanceVideos.js` | **新建** | 批量下载脚本（并发2、限速、断点续传） |
| `server/services/youmindSync.js` | 修改 | 新增 downloadVideoToLocal + 新记录自动下载 |
| `server/routes/render.js` | 修改 | contentUrl 优先使用本地路径（Bot SSR） |
| `server/utils/sitemapGenerator.js` | 修改 | video:content_loc 优先使用本地路径（两处） |
| `client/src/services/seedanceApi.js` | 修改 | getVideoSrc 支持 /v/ 路径 |
| `server/uploads/videos/seedance/` | **新建目录** | 视频存储目录 |

---

## 五、下载脚本使用说明

### 本地测试

```bash
node server/scripts/downloadSeedanceVideos.js
```

### 服务器后台运行

```bash
nohup node server/scripts/downloadSeedanceVideos.js > /tmp/seedance-download.log 2>&1 &
tail -f /tmp/seedance-download.log
```

### 预期输出

```
[download] Connected to MongoDB
[download] Found 1224 twitter videos to download
[download] 1/1224 done:1 skip:0 fail:0
[download] 2/1224 done:2 skip:0 fail:0
...
[download] Complete — done:1220 skipped:0 failed:4
```

### 中断后恢复

直接重跑脚本即可，已下载文件自动跳过（断点续传）。

---

## 六、R2 迁移路径（备忘）

1. 将 `server/uploads/videos/seedance/` 同步到 Cloudflare R2 bucket
2. 批量更新 DB：
   ```js
   await SeedancePrompt.updateMany(
     { storageType: 'local' },
     { $set: { storageType: 'r2' } }
     // videoUrl 同步改为 R2 public URL
   );
   ```
3. `getVideoSrc()` 前端无需修改（非 /v/ 非 twimg → 直接返回 URL）
4. render.js / sitemapGenerator.js 的 storageType=r2 分支已就绪

---

## 七、GSC 预期效果

下载完成并重新生成 sitemap 后：

- `<video:content_loc>` 指向 `https://iii.pics/v/seedance/{id}.mp4`（公开可访问）
- VideoObject `contentUrl` 同样指向本地 URL
- Google 爬虫可直接访问视频文件
- GSC 视频索引"无法播放"错误预计 1-2 周内消失
- VideoObject rich result 有望在 GSC → 增强功能 → 视频中出现

**操作建议**：下载完成后，Admin → SEO Tab → Generate All → Submit to All Engines。
