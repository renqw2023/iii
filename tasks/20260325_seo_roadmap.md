# SEO 强化路线图 — III.PICS
**日期**: 2026-03-25
**项目**: III.PICS (pm01)

---

## 一、现状盘点

### 已有基础

| 类型 | 文件 / 组件 | 状态 |
|------|------------|------|
| Sitemap 索引 | `client/public/sitemap.xml` | ✅ 含 sitemap-main + sitemap-images |
| 主要页面 Sitemap | `client/public/sitemap-main.xml` | ✅ 6 个静态 URL |
| 图片 Sitemap | `client/public/sitemap-images.xml` | ✅ 基于 Post 模型 |
| robots.txt | `client/public/robots.txt` | ✅ 多 bot 差异化爬取延迟 |
| 全局 meta | `client/public/index.html` | ✅ OG / Twitter 静态 meta |
| 动态 SEO 组件 | `client/src/components/SEO/SEOHead.js` | ✅ Helmet + hreflang + schema |
| SEO 工具函数 | `client/src/utils/seo.js` | ✅ WebSite/Article/ImageObject schema |
| SEO 管理页 | `client/src/pages/SEOManagement.js` | ✅ Admin 可手动触发生成 |
| SitemapGenerator | `server/utils/sitemapGenerator.js` | ✅ 但 sref 缺失、gallery URL 格式错误 |

### 核心缺口

1. **1300+ sref codes 完全没进 sitemap** — `SrefStyle` 无任何 sitemap 方法
2. **11795 gallery items URL 格式错误** — `generateGalleryURLs()` 生成的是 `/gallery?id=` 查询参数 URL，搜索引擎视为非规范
3. **SrefModal Helmet 不完整** — 缺 `og:title`、Twitter card、canonical、ld+json
4. **GalleryModal 从未注入 meta** — `Helmet` 只 import 未使用
5. **SPA 渲染盲区** — Googlebot 抓取到的是空 `<div id="root">`，动态 meta 对 SEO 贡献有限（需预渲染解决）

---

## 二、9 项 SEO 措施详细说明

### P0 — 最高收益（本次实施）

#### 措施 1：动态 Sitemap（sref + gallery）
**问题**：数据库有 13,095 条内容未被搜索引擎发现。
**方案**：
- 修复 `SitemapGenerator.generateGalleryURLs()` URL 格式（`/gallery?id=` → `/gallery/:id`）
- 新增 `generateSrefURLs()` — 生成 `/explore/:id` URL for all active SrefStyle
- 新增独立的 `generateSrefSitemap()` 和 `generateGallerySitemap()`（含 `image:image` 条目）
- 更新 `generateSitemapIndex()` 和 `generateAllSitemaps()`
- 更新 `client/public/sitemap.xml` 追加两个新子 sitemap

**文件**：`server/utils/sitemapGenerator.js`, `client/public/sitemap.xml`
**预期效果**：13,000+ URL 进入 Google 索引池

#### 措施 2：Sref/Gallery 详情页独立 SEO Meta
**问题**：`/explore/:id` 和 `/gallery/:id` 已是真实 URL（nested route），但 meta 不完整，社交分享和搜索结果展示差。
**方案**：
- SrefModal：扩充 Helmet（og:title, og:type, twitter:card, canonical, ImageObject ld+json）
- GalleryModal：实装完整 Helmet 块（目前只 import 未使用）

**文件**：`client/src/pages/SrefModal.js`, `client/src/pages/Gallery/GalleryModal.js`
**预期效果**：每条详情页有独立的搜索结果摘要和社交分享卡片

---

### P1 — 中高收益

#### 措施 3：各页面实装 SEOHead（传 structuredData）
**问题**：`SEOHead` 组件功能完整，但 Gallery/Explore/Seedance 列表页没有传入 `structuredData`，错过了 ImageGallery schema。
**方案**：在 `GalleryList.js`、`Explore.js`、`SeedanceList.js` 的 SEO hook 中添加 ImageGallery/CollectionPage 结构化数据。
**文件**：`client/src/pages/Gallery/GalleryList.js`, `client/src/pages/Explore.js`, `client/src/pages/Seedance/SeedanceList.js`

#### 措施 4：预渲染（react-snap）
**问题**：React SPA，Googlebot 拿到的是空 `<div id="root">`。虽然 Googlebot 支持 JavaScript rendering，但存在延迟（通常 2-4 周）且 JS 执行限制多。
**方案**：引入 `react-snap`（零依赖，构建时 headless Chrome 快照），对关键路由（/、/explore、/gallery、/seedance）生成静态 HTML。
**文件**：`client/package.json`（postbuild script）, `client/src/index.js`（hydrate 适配）
**注意**：`/explore/:id` 和 `/gallery/:id` 动态路由暂不预渲染（URLs 过多），但列表页可以

#### 措施 5：og-default.jpg 路径统一
**问题**：`index.html` 引用 `/og-default.jpg`，而 `seo.js` 引用 `/images/og-default.jpg`，路径不一致，社交分享可能显示 404 图片。
**方案**：统一为 `/og-default.jpg`（或确认文件存在位置后统一路径）
**文件**：`client/public/index.html`, `client/src/utils/seo.js`

---

### P2 — 标准优化

#### 措施 6：Core Web Vitals（LCP/CLS）
**问题**：Gallery 瀑布流图片没有 `width`/`height` 属性导致 CLS；首屏图片没有 `fetchpriority="high"` 影响 LCP。
**方案**：
- GalleryCard/SrefCard 图片加 `loading="lazy"`（非首屏）
- 首屏卡片 `fetchpriority="high"`
- 图片容器设定 aspect-ratio 防止 CLS
**文件**：`client/src/components/Gallery/GalleryCard.js`, `client/src/components/Sref/SrefCard.js`

#### 措施 7：`<noscript>` 内容增强
**问题**：现有 `<noscript>` 仅一行，无 JS 爬虫什么都抓不到。
**方案**：在 `<noscript>` 内放核心导航链接 + 页面简介文本，给不执行 JS 的爬虫提供内容锚点。
**文件**：`client/public/index.html`

#### 措施 8：首页结构化数据（WebSite + SearchAction）
**问题**：`seo.js` 里有 `WebSite` + `SearchAction` schema 但首页没有注入。
**方案**：在 `Home.js` 的 SEO hook 中传入 WebSite schema，Google 搜索结果可能出现站内搜索框。
**文件**：`client/src/pages/Home.js`

#### 措施 9：hreflang 清理
**问题**：`SEOHead.js` 自动生成 `/zh-CN/`, `/en-US/`, `/ja-JP/` 前缀的 hreflang，但实际 React 路由没有语言前缀（`/explore`，不是 `/zh-CN/explore`）。这会导致 hreflang 指向不存在的 URL，可能被 Google 忽略或误判。
**方案**：移除自动 hreflang 生成逻辑，或将其设为可选（仅当真正实现多语言路由时使用）。
**文件**：`client/src/components/SEO/SEOHead.js`

---

## 三、优先级执行表

| 优先级 | # | 任务 | 预估工作量 | 收益 |
|--------|---|------|-----------|------|
| P0 | 1 | 动态 Sitemap（sref+gallery） | M | 13,000 URL 进索引 |
| P0 | 2 | 详情页 SEO Meta（Modal Helmet） | S | 搜索摘要+社交卡片 |
| P1 | 3 | 各页面 structuredData | S | Rich Results |
| P1 | 4 | react-snap 预渲染 | M | 爬取速度↑ |
| P2 | 5 | og-default 路径统一 | XS | 社交分享图片修复 |
| P2 | 6 | Core Web Vitals 图片优化 | S | 排名信号 |
| P2 | 7 | noscript 增强 | XS | 无 JS 爬虫 |
| P2 | 8 | 首页 WebSite schema | XS | 站内搜索框 |
| P2 | 9 | hreflang 清理 | XS | 避免误导 Google |

---

## 四、技术备注

### 关于 SPA 与爬虫
III.PICS 使用 React SPA（CRA），Google Search Console 建议的最佳实践是：
1. 短期：完善 meta（已有 react-helmet-async）+ 动态 sitemap
2. 中期：react-snap 预渲染关键页面
3. 长期：如有必要迁移 Next.js（SSR/SSG）

### 关于 Sitemap 部署
- **本地 / 同服务器**：`SitemapGenerator.saveSitemap()` 直接写 `client/public/`，admin 触发生成即可
- **Vercel 部署**：静态文件由 Vercel 提供，服务端无法写入。解决方案：
  1. CI/CD 中加入生成步骤（`npm run generate-sitemaps` 在 `npm run build` 之前）
  2. 或将动态 sitemap 改为 Express 路由直接返回 XML（需 nginx rewrite）

### SrefStyle previewImage Virtual
```js
// server/models/SrefStyle.js
SrefStyleSchema.virtual('previewImage').get(function() {
  if (this.images && this.images.length > 0) {
    return `/output/sref_${this.srefCode}/images/${this.images[0]}`;
  }
  return null;
});
```
Sitemap 中使用时需拼接 baseUrl：`${baseUrl}/output/sref_${item.srefCode}/images/${item.images[0]}`

---

## 五、进度追踪

| 日期 | 措施 | 状态 |
|------|------|------|
| 2026-03-25 | 1. 动态 Sitemap (sref+gallery) | ✅ 完成 |
| 2026-03-25 | 2. 详情页 SEO Meta (SrefModal + GalleryModal) | ✅ 完成 |
| 2026-03-25 | 3. 各页面 structuredData (useExploreSEO + useGallerySEO) | ✅ 完成 |
| 2026-03-25 | 4. react-snap 预渲染 | ⏭️ 跳过：react-snap 不支持 React 18 createRoot，待迁移 Next.js 时处理 |
| 2026-03-25 | 5. og-default.jpg 路径统一 | ✅ 完成：seo.js + SEOHead.js 统一为 /og-default.jpg |
| 2026-03-25 | 6. Core Web Vitals (decoding=async) | ✅ 完成：GalleryCard + SrefCard 已有 loading=lazy，补充 decoding=async |
| 2026-03-25 | 7. noscript 内容增强 | ✅ 完成：index.html 添加导航链接和页面描述 |
| 2026-03-25 | 8. 首页 WebSite+SearchAction schema | ✅ 已有：useHomeSEO 已包含 WebSite schema |
| 2026-03-25 | 9. hreflang 清理 | ✅ 完成：seo.js + SEOHead.js 移除不存在的语言前缀 URL，只保留 x-default |
