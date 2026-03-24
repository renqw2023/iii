# Gallery NanaBanana 同步修复 开发日志

**日期**: 2026-03-24
**阶段**: Stage 59 — Gallery NanaBanana 同步从 129 → 11,795 条
**耗时**: 约 4h（排查 + 重构 + 迁移）

---

## 一、背景

Admin Panel → Data Sync → Gallery (NanaBanana) 同步后只显示 **129 条**，而 YouMind 网站实际展示了 11,000+ 条作品。本次目标：找到根因并修复，确保全量同步。

---

## 二、问题链

### 2.1 问题一：GitHub repo 只有 129 条

**根因分析**：
- GitHub 仓库 `awesome-nano-banana-pro-prompts` 的 README 是 YouMind 团队**精选的 129 个特色作品**，相当于编辑推荐合集。
- YouMind 网站 `/nano-banana-pro-prompts` 页面是**所有用户上传的 11,795 条社区内容**。
- 原 `syncNanoBanana()` 只从 GitHub RAW URL 拉取 README，天花板就是 129。

**结论**：数据源选错了。需改为调用 YouMind 内部分页 API。

---

### 2.2 问题二：YouMind 内部 API 第 2 页起返回 500

**发现过程**：

在 `githubSync.js` 中添加调用 `https://youmind.com/youhome-api/prompts` 后，page=1 成功返回 18 条，page=2 起报错：

```json
{"error":"Failed to fetch prompts"}
```

**排查方法 — Chrome DevTools 网络抓包**：

1. 浏览器打开 `https://youmind.com/zh-CN/nano-banana-pro-prompts`
2. F12 → Network → Fetch/XHR 过滤
3. 点击页面"加载更多"按钮
4. 抓到真实浏览器请求体：

```json
{
  "model": "nano-banana-pro",
  "page": 2,
  "limit": 18,
  "locale": "zh-CN",
  "campaign": "nano-banana-pro-prompts",
  "filterMode": "imageCategories"
}
```

**对比原代码缺失的字段**：
- `limit: 18` — 未传（服务端不使用默认值）
- `locale: 'zh-CN'` — 未传（服务端根据 locale 路由查询）
- `campaign: 'nano-banana-pro-prompts'` — 未传（关键过滤条件）
- `filterMode: 'imageCategories'` — 未传

**修复**：将以上 4 个参数加入 axios POST body，page 2 起立即通过。

---

### 2.3 问题三：同步挂起无进展（Node.js 22 + native fetch 问题）

**现象**：日志停留在 "Fetching NanaBanana..." 无任何后续输出，约 10 分钟无响应。

**根因**：Node.js 22 的 native `fetch()` 配合 `AbortController` 在某些网络环境下不可靠，`AbortSignal.timeout()` 超时后请求不中止，导致 Promise 永久挂起。

**修复**：将 `fetch()` 全面替换为 `axios`，使用 `{ timeout: 60000 }` 选项，行为可靠。

---

### 2.4 问题四：同步在第 512 页前后超时失败，所有数据丢失

**现象**：同步进行约 130+ 分钟后（已抓取 ~9,000 条），在 page 512-516 区间因 YouMind 服务器响应慢，3 次重试均耗尽，抛出异常。**MongoDB 记录：0 条新增。**

**根因（架构缺陷）**：

原代码结构：
```
所有页面 → 累积到内存数组 → 全部完成后批量保存
```

第 516 页失败 → catch 分支 → `records[]` 丢弃 → 0 条写入。

**修复（增量保存架构）**：

```
每页 → 立即 upsert 到 MongoDB → 继续下一页
```

如果 page 516 失败，page 1-515 的 9,000 条已写入 DB。日志记录 `status: 'partial'`，重试时这些记录走 `updatedCount`，不重复计费。

---

### 2.5 问题五：同步超时参数不足

- 超时时间 30s → 改为 60s（YouMind 服务器偶尔慢）
- 重试次数 3 → 改为 5
- 重试等待 `2000*attempt` → `3000*attempt`（更长退避，共计最长 45s）

---

### 2.6 问题六：Admin UI 永远显示 "Running"

**根因**：服务器进程在调试阶段被多次 kill，MongoDB `DataSyncLog` 中留有多条 `status: 'running'` 的孤立记录。UI 查最新记录，发现是 running，误判为正在运行。

**修复**（临时手动命令）：
```js
DataSyncLog.updateMany(
  { source: 'nanobanana', status: 'running' },
  { $set: { status: 'stopped' } }
)
```

**长期改进**：可在服务器启动时自动清理残留 running 日志（未实现，暂不影响正式使用）。

---

## 三、最终同步结果

| 指标 | 值 |
|------|---|
| 新增记录 | +11,795 |
| 总计记录 | 11,924（含 129 条原 GitHub 条目） |
| 状态 | Success |
| 耗时 | 134 分 54 秒 |
| Commit | `072b3b7` |

---

## 四、图片质量修复（同日追加）

### 4.1 问题：所有图片模糊（300px 缩略图）

**发现**：YouMind API 返回两个图片字段：
- `media[]` — 原始全分辨率图（如 `1763886933714_5zqn1e_G6QBjQHbgAE3Yt_.jpg`）
- `mediaThumbnails[]` — 服务端生成的缩略图（如 `1763886933714_5zqn1e_G6QBjQHbgAE3Yt_-300x168.jpg`）

**bug**：代码写成了 `item.mediaThumbnails?.[0] || item.media?.[0]`，缩略图优先级高于原图。

**统计**（迁移前）：
```
thumbnails (-300x): 11,366
full-size:             137
empty:                 421
```

**代码修复**（`githubSync.js` line 388）：
```js
// Before（错误）
const previewImage = item.mediaThumbnails?.[0] || item.media?.[0] || '';

// After（正确）
const previewImage = item.media?.[0] || item.mediaThumbnails?.[0] || '';
```

### 4.2 迁移现有数据

编写 `server/scripts/fixNanaBananaImages.js`，使用正则 `-\d+x\d+(\.[a-zA-Z]+)$` 匹配缩略图 URL 后缀，替换为原始后缀：

```js
// "...G6QBjQHbgAE3Yt_-300x168.jpg" → "...G6QBjQHbgAE3Yt_.jpg"
const fullUrl = doc.previewImage.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');
```

**执行结果**：
```
previewImage fix: 11,366 updated, 0 skipped
sourceUrl fix:    11,795 updated
Done.
```

---

## 五、来源 URL 修复

**问题**：`sourceUrl` 存的是 Twitter 作者个人主页（`https://x.com/stark_nico99`），点击跳转到用户页，与图片无关。

**修复**：统一改为 YouMind NanaBanana 画廊页 `https://youmind.com/nano-banana-pro-prompts`。

- 代码修复（`githubSync.js` line 409）：
  ```js
  // Before
  sourceUrl: item.sourceLink || item.author?.link || '',

  // After
  sourceUrl: 'https://youmind.com/nano-banana-pro-prompts',
  ```
- 迁移脚本同时执行了 `updateMany`（见 4.2）

---

## 六、关于图片与提示词不对应

YouMind NanaBanana 每条记录的 `media[]` 和 `content`（提示词）来自同一个条目，理论上是对应的。如果视觉上看到不对应，可能原因：

1. YouMind 上传者本人的图片和提示词就不匹配（社区内容质量参差）
2. 之前 `mediaThumbnails` 的图是缩略图，分辨率极低看起来像"错误图片"
3. 某些条目只有图无提示词（prompt 为空），或只有提示词无图

本次修复后使用原始全分辨率图，视觉匹配度应明显改善。

---

## 七、修改文件汇总

| 文件 | 改动 |
|------|------|
| `server/services/githubSync.js` | ① 完全重写 `syncNanoBanana()`（增量upsert架构 + YouMind分页API + 正确参数）② `previewImage` 改用 `media[0]` ③ `sourceUrl` 改为 YouMind 固定 URL |
| `server/scripts/fixNanaBananaImages.js` | 新增：一次性迁移脚本（已执行，可保留） |

---

## 八、GitHub Repo vs YouMind 数据量对比

| 来源 | 条目数 | 说明 |
|------|--------|------|
| GitHub README | 129 | YouMind 团队精选特色作品（编辑推荐） |
| YouMind 社区页面 | 11,795 | 所有用户上传的完整内容 |

两者均真实，定位不同：GitHub 是展示用的精华合集，YouMind 网站是完整社区库。

---

## 九、关键经验总结

1. **优先抓包而不是猜参数**：浏览器 DevTools 直接告诉你服务端期望的请求体，比反复试错快 10 倍。
2. **增量保存优于批量保存**：长时间爬取/同步任务必须每页立即落库，防止中途失败导致全量丢失。
3. **Node.js 22 native fetch 不可靠**：长连接 + AbortController 组合有已知问题，用 axios 代替。
4. **区分 thumbnail vs original**：API 返回多个图片字段时，务必核查哪个是原图，不要假设顺序。
