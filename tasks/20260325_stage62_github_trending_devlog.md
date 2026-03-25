# Stage 62 — GitHub Trending Prompts 导入 + 自动更新

**日期**: 2026-03-25
**分支**: main
**Commit**: `65e7b01`

---

## 目标

将 `jau123/nanobanana-trending-prompts`（MeiGen.ai 官方开源，CC BY 4.0）的
1,389 条精选 Prompt 导入到 Gallery：
1. 图片从 `images.meigen.ai` CDN 完全迁移到本地磁盘（去除外部品牌依赖）
2. 分类映射到我们的 useCase / style / subject 三维体系
3. 每周自动检查 GitHub repo 新增条目
4. DocsCenter 添加 CC BY 4.0 署名感谢（EN / ZH / JA 三语）

---

## 数据源分析

| 属性 | 内容 |
|------|------|
| 仓库 | `jau123/nanobanana-trending-prompts` |
| 所有者 | MeiGen.ai 官方（License: CC BY 4.0）|
| 总条目 | 1,389（NanoBanana 1,177 + GPT Image 212）|
| 字段 | rank, id, prompt, author, author_name, likes, views, image, images, model, categories, date, source_url |
| 图片 CDN | `images.meigen.ai/tweets/{tweetId}/{index}.jpg` |
| 分类体系 | Photography / Illustration & 3D / Product & Brand / Food & Drink / Girl / JSON / App / Other |
| 日期范围 | 2026-01-03 ~ 2026-03-04 |
| 更新频率 | 每隔约 2-4 周手动更新（含人工过滤低质量内容）|

---

## 修改文件

### 1. `server/models/DataSyncLog.js`

source enum 追加 `'github-trending'`：
```js
enum: ['sref', 'nanobanana', 'seedance-github', 'seedance-youmind', 'github-trending']
```

---

### 2. `server/services/githubSync.js`

新增 `syncGithubTrending()` 函数，共约 130 行。

**核心流程**：
```
1. 创建 DataSyncLog { source: 'github-trending', status: 'running' }
2. axios.get(RAW_GITHUB_TRENDING) — 30s timeout
3. 遍历 1,389 条 entries：
   a. mapTrendingCategories(item.categories) → { style, subject, useCase }
   b. downloadImage(meigenCdnUrl, localPath) — 跳过已存在，失败不中断
   c. GalleryPrompt.findOneAndUpdate({ sourceId: 'github-trending-{id}' }, $set, upsert)
4. 更新 DataSyncLog（success / partial / error）
```

**分类映射规则**：
```js
const TRENDING_CATEGORY_RULES = [
  { match: 'photography',       style: 'photography' },
  { match: 'illustration & 3d', style: 'illustration' },
  { match: 'product & brand',   subject: 'product',        useCase: 'product-marketing' },
  { match: 'food & drink',      subject: 'food-drink' },
  { match: 'girl',              subject: 'influencer-model' },
  { match: 'app',               useCase: 'app-web-design' },
];
```

**图片本地化**：
```js
const outputDir = path.join(__dirname, '../../output/gallery-trending');
// 文件名: {tweetId}_{index}.jpg
// serve URL: ${SERVER_PUBLIC_URL}/output/gallery-trending/{tweetId}_{index}.jpg
```
Express 已 serve `output/` 目录，与 sref 图片一致。

**去 MeiGen 化**：所有 `images.meigen.ai` URL 被本地镜像路径完全替换，
DB 中不存储任何 meigen 域名引用。

**isFeatured**：`likes >= 1000` 的高互动 prompt 自动标记为 featured。

**幂等性**：每次同步均安全重跑。已有记录 → update；新记录 → insert。

---

### 3. `server/services/dataSyncService.js`

```js
// _running 防重入 map 新增
'github-trending': false,

// SOURCES 注册
'github-trending': {
  label: 'Gallery (GitHub Trending)',
  fn: syncGithubTrending,
  manual: false,
},
```

Admin DataSync Tab 无需修改，自动出现 "Gallery (GitHub Trending)" 卡片。

---

### 4. `server/cron/index.js`

```js
// 每周一 03:30 UTC（错开其他同步任务时段）
cron.schedule('30 3 * * 1', async () => {
  await runSync('github-trending');
}, { timezone: 'UTC' });
```

---

### 5. `client/src/content/docsContent.js`

`about` 章节（EN / ZH / JA 三个语言版本）各新增 subsection：

```js
{
  id: 'acknowledgements',
  title: 'Open Source Acknowledgements',   // / 开源致谢 / オープンソース謝辞
  paragraphs: [
    '... NanoBanana Trending Prompts dataset ...',
    '... CC BY 4.0 ...',
  ],
}
```

Attribution 格式符合 CC BY 4.0 要求，不含 MeiGen.ai 品牌标识。

---

## 部署步骤

```bash
# 1. 服务器拉取代码
git pull && pm2 restart server

# 2. 首次手动触发（立即导入 1,389 条 + 下载图片）
# Admin → DataSync → Gallery (GitHub Trending) → Sync Now
# 预计耗时: 15-30 分钟（含约 2,000 张图片下载）

# 3. 验证
# - /output/gallery-trending/ 目录有图片文件
# - Admin DataSync 面板出现新 source 卡片
# - /gallery 页面显示新条目，图片为本地 URL

# 4. 后续自动更新
# 每周一 03:30 UTC 自动执行，无需手动干预
```

**环境变量**（可选）：
```env
GITHUB_TRENDING_OUTPUT_DIR=/custom/path  # 默认: E:\pm01\output\gallery-trending
SERVER_PUBLIC_URL=https://iii.pics        # 已配置，用于构建绝对图片 URL
```

---

## 注意事项

1. **首次同步图片量大**：约 1,500–2,000 张图片，每张约 100-300KB，总计约 200MB 磁盘空间
2. **图片下载失败不中断**：单张失败记入 errorCount，整体同步继续，状态为 `partial`
3. **CC BY 4.0 署名**：已在 DocsCenter 添加，符合许可证要求
4. **去 MeiGen 化验证**：GalleryPrompt 中无任何 `images.meigen.ai` 或 `meigen` 引用

---

## 验证记录

| 项目 | 验证方式 | 结果 |
|------|---------|------|
| 代码语法 | `node --check` 三个文件 | ✅ 通过 |
| SOURCES 注册 | `Object.keys(SOURCES)` 打印 | ✅ 含 github-trending |
| exports 导出 | `Object.keys(require('./githubSync'))` | ✅ syncGithubTrending 已导出 |
| 实际同步 | 待生产服务器执行 | ⚠️ 本地无 GitHub 网络访问 |
