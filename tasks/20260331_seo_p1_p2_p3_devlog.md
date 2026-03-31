# SEO 分阶段优化开发日志 (P1→P3)

**日期**: 2026-03-31  
**阶段**: SEO Phase 1 + Phase 2 + Phase 3  
**Commit**: (见下方)

---

## 背景与目标

参考 Google SEO Starter Guide，为 III.PICS 实施系统性 SEO 优化。

**核心问题**: React SPA 架构 — Googlebot 看到的是空 HTML shell，react-helmet 注入的 meta 标签需要 JS 执行后才可见。

**设计原则**:
- 分 3 层防线，逐步推进
- 每项改动不影响现有用户体验
- 所有 SEO 数据从 DB 动态读取，代码更新后自动跟随

---

## Phase 1 — 快速修复（零风险）

### P1-A: 修复 Alt 文本回退
**文件**: `client/src/components/Gallery/GalleryCard.js`, `VideoCard.js`

`alt={prompt.title}` → `alt={prompt.title || prompt.prompt?.substring(0, 80) || 'AI generated image'}`

Gallery 数据显示 100% 的记录有 title，但这是防御性编程，保证空 title 时不产生空 alt。

### P1-B: 补全 SeedanceModal Helmet
**文件**: `client/src/pages/Seedance/SeedanceModal.js`

补充完整 SEO 标签（从只有 title+description 扩展为）:
- `og:title/description/url/type/image`
- `twitter:card/title/description/image`
- `<link rel="canonical">`
- JSON-LD `VideoObject` (name/description/thumbnailUrl/uploadDate/contentUrl/url)

### P1-C: 三个列表页 Helmet
**结论**: 已有实现。

GalleryList / Explore / SeedanceList 都已调用 `useGallerySEO()` / `useExploreSEO()` / `useSeedanceSEO()` hooks，这些 hooks 通过 `configurePageSEO()` 完整注入 title/description/OG/Twitter/canonical/JSON-LD。无需修改。

### P1-D: 修复 sitemap-images.xml / sitemap-videos.xml
**文件**: `server/utils/sitemapGenerator.js`

**根因**: `generateImageSitemap()` 和 `generateVideoSitemap()` 查询 `Post` 模型（业务上已废弃，数据为空），导致两个 sitemap 文件为空（171B）。

**修复**: 
- `generateImageSitemap()` → 查询 `GalleryPrompt`（13,507 条有图片记录）
- `generateVideoSitemap()` → 查询 `SeedancePrompt`（1,172 条有视频记录）

生成后文件大小从 171B → 正常大小，包含完整的 `<image:image>` / `<video:video>` 条目。

### P1-E: Admin SEOTab 健康指标 KPI
**文件**: `server/routes/seo.js`, `client/src/components/Admin/tabs/SEOTab.js`

新增 `GET /api/seo/health` 端点（1h 缓存）返回:
```json
{
  "gallery": { "total": 13932, "altCoverage": 100, "imageCoverage": 97, "withTitle": 13932, "withImage": 13507 },
  "sref": { "total": 1346 },
  "seedance": { "total": 1223, "videoCoverage": 96, "withVideo": 1172 }
}
```

Admin SEOTab 新增第二排 3 个 KPI 卡显示 altCoverage / imageCoverage / videoCoverage，绿/橙颜色根据阈值切换。

---

## Phase 2 — 结构化数据完善

### P2-A: BreadcrumbList JSON-LD
**文件**: `GalleryModal.js`, `SrefModal.js`, `SeedanceModal.js`

在现有 `ImageObject`/`VideoObject` JSON-LD 旁追加 `BreadcrumbList`:
```json
{ "@type": "BreadcrumbList", "itemListElement": [
  { "position": 1, "name": "Home", "item": "https://iii.pics" },
  { "position": 2, "name": "Gallery", "item": "https://iii.pics/gallery" },
  { "position": 3, "name": "{title}", "item": "https://iii.pics/gallery/{id}" }
]}
```

### P2-B: Admin SEO 覆盖率表格
**文件**: `server/routes/seo.js`, `SEOTab.js`

新增 `GET /api/seo/coverage` 端点，通过计算 sitemap XML 文件中 `<loc>` 标签数量对比 DB 记录数：

```
Gallery:  13507/13932 sitemap entries (97%)  — 进度条紫色
Sref:     1346/1346  (100%) — 进度条紫色
Seedance: 1223/1223  (100%) — 进度条橙色
```

### P2-C: 修复 robots.txt 过度限制
**文件**: `server/utils/sitemapGenerator.js`

删除 `Disallow: /*?*` — 该规则过于宽泛，会阻止所有带查询参数的 URL（如 `/gallery?tag=anime`）。

改为精确路径:
```
Disallow: /api/
Disallow: /admin/
Disallow: /uploads/temp/
Disallow: /dashboard/
Disallow: /settings/
```

---

## Phase 3 — 动态渲染（Bot-only meta SSR）

### 架构

不做 Next.js 迁移，不引入 Rendertron/puppeteer。

**方案**: Express 检测到搜索引擎爬虫 UA 时，直接查 MongoDB 并返回含完整 meta 的轻量 HTML。普通用户请求直接 `next()` → Vercel React SPA 正常提供。

### P3-A: botDetect.js
**新文件**: `server/utils/botDetect.js`

检测 Googlebot / Bingbot / Baiduspider / FacebookExternalHit / Twitterbot 等主流爬虫。

### P3-B: render.js 动态渲染路由
**新文件**: `server/routes/render.js`

处理 `GET /gallery/:id`, `/explore/:id`, `/seedance/:id`：
1. 检查进程内 TTL 缓存（1h）
2. 查 MongoDB 获取 title/description/image/tags
3. 返回完整 HTML 含:
   - `<title>`, `<meta description>`, `<link rel="canonical">`
   - `<meta property="og:*">` 和 `<meta name="twitter:*">`
   - JSON-LD `ImageObject` 或 `VideoObject`
   - JSON-LD `BreadcrumbList`
   - 可见文本内容（h1/p/img/a for crawlers）
4. 未找到记录 → `next()` fallback

**自动跟随**: 渲染器每次从 DB 实时查询，内容与数据库永远同步。

### P3-C: 注册中间件
**文件**: `server/index.js`

在路由注册之前插入 bot 检测中间件：
```js
app.use((req, res, next) => {
  if (isBot(req)) return renderRoutes(req, res, next);
  next();
});
```

### P3-D: Bot Crawl Simulator
**文件**: `server/routes/seo.js`, `SEOTab.js`

新增 `POST /api/seo/simulate-crawl` 端点 + Admin SEOTab "Bot Crawl Simulator" 面板。

管理员输入任意路径（如 `/gallery/69cb2aabcdf7554e1635409f`）即可预览 Googlebot 会看到的完整 HTML。

---

## 验证结果

| 测试 | 结果 |
|------|------|
| `GET /api/seo/health` | ✅ 返回 gallery 100% alt / 97% image / seedance 96% video |
| `curl -A "Googlebot/2.1" http://localhost:5500/gallery/{id}` | ✅ 返回完整 HTML with title/og:title/canonical/JSON-LD |
| Admin SEOTab — 健康 KPI 卡 | ✅ 三张卡显示覆盖率数据 |
| Admin SEOTab — 覆盖率进度条 | ✅ Gallery 97% / Sref 100% / Seedance 100% |
| Admin SEOTab — Bot Simulator | ✅ 显示 "Bot renderer responded with full HTML" + HTML 预览 |
| 普通浏览器访问 /gallery/:id | ✅ 不受影响（仍返回 React SPA） |

---

## 修改文件清单

| 文件 | 改动 |
|------|------|
| `client/src/components/Gallery/GalleryCard.js` | alt 文本回退 |
| `client/src/components/Seedance/VideoCard.js` | alt 文本回退 |
| `client/src/pages/Seedance/SeedanceModal.js` | 完整 Helmet + VideoObject + BreadcrumbList JSON-LD |
| `client/src/pages/Gallery/GalleryModal.js` | 追加 BreadcrumbList JSON-LD |
| `client/src/pages/SrefModal.js` | 追加 BreadcrumbList JSON-LD |
| `server/utils/sitemapGenerator.js` | image/video sitemap 改查 Gallery/Seedance; robots.txt 修复 |
| `server/routes/seo.js` | 新增 /health, /coverage, /simulate-crawl 端点 |
| `client/src/components/Admin/tabs/SEOTab.js` | 健康 KPI 行 + 覆盖率表格 + Bot Simulator 面板 |
| `server/utils/botDetect.js` | 新建 — 爬虫 UA 检测 |
| `server/routes/render.js` | 新建 — 动态渲染路由（Bot-only meta SSR） |
| `server/index.js` | 注册动态渲染中间件 |

---

## 生产部署注意

P3 动态渲染当前在 Express 服务器（port 5500）生效。若 Vercel 为 CDN 前端、Express 仅服务 API，则需在 `vercel.json` 中添加 bot UA 重写规则将爬虫请求路由至 Express 服务器。示例：

```json
{
  "rewrites": [
    {
      "source": "/(gallery|explore|seedance)/:id",
      "destination": "https://api.iii.pics/(gallery|explore|seedance)/:id",
      "has": [{ "type": "header", "key": "user-agent", "value": "(?i).*(googlebot|bingbot).*" }]
    }
  ]
}
```
