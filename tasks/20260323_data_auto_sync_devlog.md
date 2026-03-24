# 数据自动采集系统 开发日志

**日期**: 2026-03-23
**阶段**: Stage 57 — 数据自动采集系统（Data Auto-Collection System）
**Commit**: 待填写
**耗时**: 约 2h（规划 + 实现 + 验证）

---

## 一、背景与目标

三个核心内容页（`/explore`、`/gallery`、`/seedance`）此前完全依赖手动运行脚本导入数据：

| 页面 | 数据来源 | 原方式 |
|------|---------|--------|
| `/explore` | promptsref.com 爬取 | Python `scraper.py`（手动运行） |
| `/gallery` | GitHub awesome-nano-banana-pro-prompts | `importNanoBanana.js`（手动） |
| `/seedance` | GitHub awesome-seedance-2-prompts + YouMind CSV | `importSeedance.js` + `syncSeedanceFromYouMind.js`（手动） |

**本次目标**：
1. 将 Python 爬虫移植为 Node.js 服务（消除 Python 依赖）
2. 为 GitHub 同步和 YouMind 同步建立统一调度框架
3. 通过 Admin Panel 提供可视化控制界面
4. 建立持久化同步日志（DataSyncLog）

---

## 二、新增依赖

```bash
cd server
npm install cheerio csv-parse
```

- `cheerio`：HTML 解析，替代 Python 的 BeautifulSoup
- `csv-parse`：CSV 解析，用于 YouMind 导出文件（注：最终实现改为内联 CSV 解析，无需此依赖）

---

## 三、新建文件总览

### Server 端（7 个新文件）

| 文件 | 说明 |
|------|------|
| `server/models/DataSyncLog.js` | 同步日志模型 |
| `server/services/srefScraper.js` | Python scraper.py 的 Node.js 完整移植 |
| `server/services/githubSync.js` | NanoBanana + Seedance GitHub 同步 |
| `server/services/youmindSync.js` | YouMind CSV 下载 + Seedance 同步 |
| `server/services/dataSyncService.js` | 统一调度门面层 |
| `server/cron/index.js` | node-cron 定时任务调度 |
| `server/routes/sync.js` | Admin 同步管理 API（5 个端点） |

### Client 端（1 个新文件）

| 文件 | 说明 |
|------|------|
| `client/src/components/Admin/tabs/DataSyncTab.js` | Admin 同步监控面板 UI |

### 修改文件（4 个）

| 文件 | 改动 |
|------|------|
| `server/index.js` | 引入 cron 调度 + sync 路由 |
| `client/src/pages/AdminPanel.js` | 添加 "Data Sync" tab |
| `client/src/services/api.js` | 添加 5 个 sync API 方法 |
| `server/package.json` | 新增 cheerio、csv-parse 依赖 |

---

## 四、各模块设计详解

### 4.1 DataSyncLog 模型（`server/models/DataSyncLog.js`）

```js
{
  source:        String,  // 'sref'|'nanobanana'|'seedance-github'|'seedance-youmind'
  status:        String,  // 'running'|'success'|'error'|'partial'|'stopped'
  startedAt:     Date,
  completedAt:   Date,
  newCount:      Number,
  updatedCount:  Number,
  skippedCount:  Number,
  errorCount:    Number,
  totalAfter:    Number,  // 同步后集合总数
  errorMessages: [String],
  meta:          Mixed,   // sref: {currentPage, totalPages, processedUrls...}
}
```

**设计注意**：Mongoose 中 `errors` 是保留字段名，因此使用 `errorMessages` 避免警告。

---

### 4.2 srefScraper.js（Python → Node.js 移植）

**对照表**：

| Python (scraper.py) | Node.js |
|---------------------|---------|
| `RateLimitedClient` | `fetchWithRetry()` + `sleep(jitter(21000, 3000))` |
| `BeautifulSoup` | `cheerio.load(html)` |
| `parse_discover_detail_urls` | `$('a[href^="/srefcodedetail/"]')` |
| `extract_ldjson_media` | `$('script[type="application/ld+json"]')` → JSON.parse |
| `extract_main_media_from_page` | `$('img,source,video')` + src 前缀/phrase 匹配 |
| `extract_tags` | `$('a[href^="/style/"]')` |
| `threading.Event` stopFlag | 模块级 `_stopFlag` boolean |
| `crawl_state.json` 断点续传 | DataSyncLog.meta.processedUrls（最近 500 条） |
| `save_entry` → metadata.json | 直接 upsert SrefStyle |

**关键设计决策**：
- **爬取速度**：21s 基础延迟 + 0~3s jitter，全量 33 页约需 8 小时
- **不设 cron**：仅 Admin 手动触发，避免 Cloudflare cf_clearance cookie 失效时自动爬取失败
- **断点续传**：记录已处理 URL 集合到 DataSyncLog.meta，重新触发时跳过已完成项
- **停止信号**：`_stopFlag = true` 后在每次循环迭代前检测，最长等待一次 HTTP 请求时间

**暴露的接口**：
```js
startCrawl(opts)   // 启动，异步返回 logId
stopCrawl()        // 发送停止信号
getCrawlStatus()   // 实时进度对象
```

---

### 4.3 githubSync.js

直接复用 `importNanoBanana.js` / `importSeedance.js` 的解析逻辑（内联，无文件依赖），区别是用 `axios.get(rawUrl)` 替代 `fs.readFileSync(localPath)`。

**GitHub Raw URL**：
```
NanoBanana README: https://raw.githubusercontent.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts/main/README.md
Seedance README:   https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedance-2-prompts/main/README.md
Seedance Videos:   https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedance-2-prompts/main/video-urls.json
```

Seedance GitHub 同步同时合并 promptMap + videoUrls，处理 `allIds = union(promptMapKeys, videoUrlsKeys)` 确保不遗漏仅有视频或仅有提示词的条目。

---

### 4.4 youmindSync.js

从 `syncSeedanceFromYouMind.js` 提取核心逻辑为服务函数（去除 CLI 参数解析、process.exit）。

**关键改动**：
- 不再依赖 `csv-parse` 包，改为内联实现简单 CSV 解析器（支持带引号字段、转义双引号）
- 保留 CSV 备份到 `_data_sources/seedance/csv_backups/`
- 保留选择性更新逻辑（只更新有实质变化的字段，保留用户交互数据）

---

### 4.5 dataSyncService.js（统一门面）

```js
const SOURCES = {
  'nanobanana':       { fn: syncNanoBanana,      label: 'Gallery (NanoBanana)' },
  'seedance-github':  { fn: syncSeedanceGithub,  label: 'Seedance (GitHub)' },
  'seedance-youmind': { fn: syncSeedanceYouMind, label: 'Seedance (YouMind CSV)' },
  'sref':             { fn: srefCrawler,          label: 'Explore (Sref)', manual: true },
};
```

- `runSync(source, opts)` — 触发同步，fire-and-forget，防双触发（`_running[source]` 状态锁）
- `getStatus()` — 并行查询各数据源最新日志
- `getLogs(page, limit)` — 分页历史
- `stopSync('sref')` — 只有 sref 支持停止

---

### 4.6 cron/index.js 定时计划

```
每天 02:00 UTC  — Gallery NanoBanana      （轻量，GitHub raw 拉取）
每天 02:30 UTC  — Seedance GitHub         （轻量，GitHub raw 拉取）
每天 03:00 UTC  — Seedance YouMind        （中量，CSV 下载 + upsert）
每周日 05:00 UTC — 链接健康检查            （复用 checkLinkHealth.js）
Sref 爬取       — 仅 Admin 手动触发        （重量，~8h）
```

---

### 4.7 routes/sync.js（API 端点）

全部使用 `adminAuth` 中间件保护（JWT + role=admin）。

```
GET  /api/admin/sync/status           — 所有数据源最新状态（并行查询）
POST /api/admin/sync/trigger/:source  — 触发同步（异步，立即返回 logId）
GET  /api/admin/sync/logs             — 历史分页（?page=&limit=）
POST /api/admin/sync/sref/stop        — 停止 sref 爬取
GET  /api/admin/sync/sref/progress    — sref 实时进度
```

**路由注册顺序**：必须在 `app.use('*', 404handler)` 之前注册，且 `syncRoutes` 挂载于 `/api/admin/sync`，与 `/api/admin` 的 `adminRoutes` 分离，不产生冲突。

---

### 4.8 DataSyncTab.js（Admin UI）

**布局**：
```
[Header: "Data Sync" 标题 + Refresh 按钮]
[2列网格: 4个数据源卡片]
  - 状态徽章 (Never/Running/Success/Partial/Error/Stopped)
  - 统计数字 (+New / ~Updated / Total)
  - 最后同步时间 + 耗时
  - Sref专属: 进度条（Discover阶段 + Detail阶段）
  - Sref专属: 黄色 Cookie 警告提示
  - [Sync Now] 按钮 + Sref [Stop] 按钮
[Sync History 表格: 时间/数据源/状态/New/Updated/Errors/Duration]
[分页控件]
```

**轮询策略**：
- 初始加载时一次性拉取 status + logs
- 当任意 source `running === true` 时，开启 `setInterval` 每 8s 轮询
- 当无 source 运行时，`clearInterval` 停止轮询

---

## 五、server/index.js 修改

```js
// 新增 import（文件顶部）
const syncRoutes = require('./routes/sync');
const { startCronJobs } = require('./cron/index');

// 路由注册（在 /api/generate 后）
app.use('/api/admin/sync', syncRoutes);

// MongoDB 连接成功回调
startGptImageSync();
startCronJobs();   // ← 新增
```

---

## 六、验证结果

### 6.1 服务器模块加载测试
```
OK  ./models/DataSyncLog
OK  ./services/srefScraper
OK  ./services/githubSync
OK  ./services/youmindSync
OK  ./services/dataSyncService
OK  ./cron/index
OK  ./routes/sync
```
无报错，无未处理的警告。

### 6.2 浏览器 E2E 验证

1. **Admin → Data Sync 标签**: 4 个数据源卡片正常渲染
2. **点击 "Sync Now" (Gallery/NanoBanana)**:
   - 卡片状态立即变为 "Running"（蓝色 spinner）
   - Sync History 表格出现 "Gallery / Running" 行
   - 约 3 秒后自动刷新为 **"+129 new · ~0 updated · Total 129 · Success**
   - 历史行更新为 "Gallery / ✓ Success / +129 / 3s"
3. **Sref 卡片**: 显示 "Manual only · ~8h full crawl" + Cookie 警告

---

## 七、生产环境配置说明

### 7.1 需要在服务器 `server/.env` 新增

```env
# Sref 爬取（promptsref.com 需要登录 Cookie）
PROMPTSREF_COOKIE=cf_clearance=xxx; _session=xxx; ...

# Sref 输出目录（生产环境）
SREF_OUTPUT_DIR=/var/www/iii.pics/output
```

**获取 PROMPTSREF_COOKIE 方法**：
1. 浏览器登录 promptsref.com
2. 打开 DevTools → Network → 任意请求 → 复制 Cookie 请求头
3. 注意：cf_clearance 有效期约 24-72h，需定期更新

### 7.2 cron 日志查看

```bash
# 服务重启后确认 cron 注册
pm2 logs | grep "\[cron\]"

# 预期输出：
[cron] Scheduled jobs: NanoBanana@02:00 | Seedance-GH@02:30 | Seedance-YM@03:00 | LinkHealth@Sun05:00 (UTC)
```

### 7.3 YouMind CSV 降级策略

如果 `https://youmind.com/api/export/csv?slug=seedance-2-0-prompts` 下载失败：
1. 自动查找 `_data_sources/seedance/csv_backups/` 最新备份文件
2. 备份目录不存在时查找项目根目录 `seedance-2-0-prompts-20260302.csv`
3. 三级都不存在才报错

---

## 八、已知限制 & 后续计划

| 限制 | 说明 |
|------|------|
| Sref Cookie 失效 | cf_clearance 约 24-72h 过期，需手动更新 .env |
| Sref 断点续传精度 | processedUrls 只保留最近 500 条，超出部分重复爬取（影响极小） |
| YouMind CSV 无分页 | 若数据超过单次导出限制需联系 YouMind |
| 图片 CDN URL | NanoBanana GitHub CDN 图片直接存 URL，无本地缓存 |

**后续可选优化**：
- Sref Cookie 健康检测（定期 HEAD 请求验证有效性）
- Sref 增量爬取（只爬取新增页面，不全量重跑）
- 邮件/Slack 告警（同步失败时通知）
- 图片 CDN 转存（NanoBanana 预览图转存到 OSS 避免 GitHub CDN 依赖）

---

## 九、文件依赖关系图

```
server/index.js
├── routes/sync.js
│   └── services/dataSyncService.js
│       ├── services/srefScraper.js   (cheerio, axios)
│       ├── services/githubSync.js    (axios)
│       └── services/youmindSync.js   (fetch API)
│           └── models/DataSyncLog.js
└── cron/index.js
    └── services/dataSyncService.js

client/src/pages/AdminPanel.js
└── components/Admin/tabs/DataSyncTab.js
    └── services/api.js (getSyncStatus, triggerSync, getSyncLogs, stopSrefCrawl, getSrefProgress)
```
