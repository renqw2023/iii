# Stage: SEO 强化 — 动态 Sitemap + 详情页 Meta + 全面 SEO 优化
**日期**: 2026-03-25
**项目**: III.PICS (pm01)

---

## 背景与目标

在完成 sitemap-main.xml（6 个静态 URL）和 sitemap-images.xml 后，发现数据库中 1300+ sref codes 和 11,795 gallery items 完全未进入 sitemap，详情 Modal 的 SEO meta 也不完整。本次开发系统性补全了所有遗漏的 SEO 措施。

---

## 一、分析文档

**新建文件**: `tasks/20260325_seo_roadmap.md`

内容包括：
- 现状盘点（已有 6 个文件、1 个 SEOHead 组件、1 个 seo.js 工具库）
- 9 项措施详细说明（P0/P1/P2 分级）
- 关键技术备注（SPA 渲染问题、Sitemap 部署策略、SrefStyle previewImage virtual 路径）
- 进度追踪表

---

## 二、Task 1 — 动态 Sitemap

### 问题
- `SrefStyle` 模型完全没有 sitemap 生成逻辑
- `GalleryPrompt` 的 `generateGalleryURLs()` 使用 `/gallery?id=` 查询参数 URL（搜索引擎视为非规范）
- limit 仅 5000，但 gallery 已有 11,795 条

### 修改：`server/utils/sitemapGenerator.js`

**新增 `SrefStyle` import**
```js
const SrefStyle = require('../models/SrefStyle');
```

**新增 `generateSrefURLs()`** — 语言 sitemap 内嵌版
- 查询所有 `isActive: true` 的 sref
- URL 格式：`${baseUrl}/explore/${item._id}`
- changefreq: weekly, priority: 0.8, limit: 50000

**新增 `generateSrefSitemap()`** — 独立 sref sitemap（含 image:image）
- 包含 `xmlns:image` 扩展
- 每条 sref 附带预览图 URL：`${baseUrl}/output/sref_${item.srefCode}/images/${item.images[0]}`
- 包含 title（`--sref {code}`）和 description（如有）

**新增 `generateGallerySitemap()`** — 独立 gallery sitemap（含 image:image）
- 每条 gallery prompt 附带 previewImage
- URL 格式：`${baseUrl}/gallery/${item._id}`
- limit: 50000

**修复 `generateGalleryURLs()`**
```diff
- const items = await GalleryPrompt.find({}).limit(5000);
- xml += `    <loc>${this.baseUrl}/gallery?id=${item._id}</loc>\n`;
+ const items = await GalleryPrompt.find({ isActive: true }).limit(50000);
+ xml += `    <loc>${this.baseUrl}/gallery/${item._id}</loc>\n`;
```

**更新 `generateLanguageSitemap()`** — 新增 sref URLs 调用
```diff
+ xml += await this.generateSrefURLs();
  xml += await this.generateGalleryURLs();
```

**更新 `generateSitemapIndex()`** — 追加两个子 sitemap 条目
```xml
<sitemap><loc>https://iii.pics/sitemap-sref.xml</loc></sitemap>
<sitemap><loc>https://iii.pics/sitemap-gallery.xml</loc></sitemap>
```

**更新 `generateAllSitemaps()`** — 调用并保存新 sitemap
```js
const srefSitemap = await this.generateSrefSitemap();
await this.saveSitemap('sitemap-sref.xml', srefSitemap);

const gallerySitemap = await this.generateGallerySitemap();
await this.saveSitemap('sitemap-gallery.xml', gallerySitemap);
```

### 修改：`client/public/sitemap.xml`

静态 sitemap 索引追加两个新子 sitemap（服务器生成后会覆盖此文件）：
```xml
<sitemap><loc>https://iii.pics/sitemap-sref.xml</loc><lastmod>2026-03-25</lastmod></sitemap>
<sitemap><loc>https://iii.pics/sitemap-gallery.xml</loc><lastmod>2026-03-25</lastmod></sitemap>
```

### ⚠️ 已知问题：Admin SEO 面板未挂载

**发现**：`client/src/pages/SEOManagement.js` 存在，但：
1. **未在 `App.js` 中注册路由**
2. **未集成到 `AdminPanel.js`**

因此无法通过 UI 触发 `/api/seo/sitemap/generate`。

**临时触发方式**（直接 curl 或浏览器访问 API）：
```bash
curl http://localhost:5500/api/seo/sitemap/generate
```
或登录后在浏览器访问：
```
https://iii.pics/api/seo/sitemap/generate
```

**后续待做**：将 SEOManagement 集成进 AdminPanel（添加 "SEO" tab）。

---

## 三、Task 2 — 详情页 SEO Meta

### 问题
- **SrefModal**：有基础 Helmet（title, description, og:image, og:url），缺 og:title、twitter card、canonical、ld+json
- **GalleryModal**：`import { Helmet }` 存在但从未在 JSX 中使用

### 修改：`client/src/pages/SrefModal.js`（line 138-165）

扩充后的完整 Helmet：

| 标签 | 内容 |
|------|------|
| `<title>` | `--sref {code} · {title} — III.PICS Style Gallery` |
| `description` | sref.description 或 `Midjourney --sref {code} style reference. Tags: …` |
| `canonical` | `https://iii.pics/explore/{_id}` |
| `og:title` | `--sref {code} — III.PICS Style Gallery` |
| `og:type` | `article` |
| `og:image` | `https://iii.pics` + sref.previewImage（拼接完整绝对 URL）|
| `twitter:card` | `summary_large_image` |
| `ld+json` | `ImageObject` schema（name, description, contentUrl, url, keywords） |

### 修改：`client/src/pages/Gallery/GalleryModal.js`（line 117-145）

新增完整 Helmet 块：

| 标签 | 内容 |
|------|------|
| `<title>` | `{title \| prompt前50字} — III.PICS Gallery` |
| `description` | description 或 prompt 前 155 字 |
| `canonical` | `https://iii.pics/gallery/{_id}` |
| `og:title` / `og:type` / `og:url` | 标准 OG |
| `og:image` | prompt.previewImage（已是完整 URL，无需拼接）|
| `twitter:card` | `summary_large_image` |
| `ld+json` | `ImageObject` schema |

---

## 四、Task 3 — 各页面 structuredData

### 修改：`client/src/hooks/useSEO.js`

**`useExploreSEO`** 新增 CollectionPage schema：
```js
structuredData: {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Midjourney Sref Style Gallery — III.PICS',
  description: 'Browse 1,300+ Midjourney --sref style reference codes with visual previews.',
  url: 'https://iii.pics/explore',
  provider: { '@type': 'Organization', name: 'III.PICS', url: 'https://iii.pics' },
}
```

**`useGallerySEO`** 新增 CollectionPage schema：
```js
structuredData: {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'AI Prompt Gallery — III.PICS',
  description: 'Browse the best AI image prompts for NanoBanana Pro, GPT Image, and more.',
  url: 'https://iii.pics/gallery',
  provider: { '@type': 'Organization', name: 'III.PICS', url: 'https://iii.pics' },
}
```

**备注**：`useHomeSEO` 已有 `WebSite + potentialAction(SearchAction)` schema，Task 8 无需额外修改。

---

## 五、Task 4 — react-snap 预渲染（跳过）

**结论**：react-snap 官方不支持 React 18 的 `createRoot` API（需要 `hydrate`，而 React 18 已移除此 API 的 CRA 默认用法）。强行安装会导致 build 失败。

**替代方案（长期）**：
- 迁移到 Next.js（推荐）
- 或使用 Vercel 的 Edge SSR / prerender 中间件

---

## 六、Task 5 — og-default.jpg 路径统一

**问题**：`client/public/og-default.jpg` 存在于根目录，但 `seo.js` 引用 `/images/og-default.jpg`（不存在）。

**修复**：

`client/src/utils/seo.js`:
```diff
- const baseImage = `${config.app.baseUrl}/images/og-default.jpg`;
+ const baseImage = `${config.app.baseUrl}/og-default.jpg`;
```

`client/src/components/SEO/SEOHead.js`:
```diff
- const defaultImage = `${baseUrl}/images/og-default.jpg`;
+ const defaultImage = `${baseUrl}/og-default.jpg`;
```

---

## 七、Task 6 — Core Web Vitals

两个卡片组件已有 `loading="lazy"`（GalleryCard 还有 `IntersectionObserver` 懒加载）。补充 `decoding="async"` 让浏览器在解码图片时不阻塞主线程：

`client/src/components/Gallery/GalleryCard.js`:
```diff
  loading="lazy"
+ decoding="async"
```

`client/src/components/Sref/SrefCard.js`:
```diff
  loading="lazy"
+ decoding="async"
```

---

## 八、Task 7 — noscript 增强

`client/public/index.html`：

原内容：
```html
<noscript>You need to enable JavaScript to run this app.</noscript>
```

新内容：包含站点标题、简介、主要页面导航链接（5 条），供无 JS 爬虫抓取内容锚点。

---

## 九、Task 9 — hreflang 清理

**问题**：`seo.js` 和 `SEOHead.js` 自动生成 `/zh-CN/`, `/en-US/`, `/ja-JP/` 前缀的 hreflang，但实际路由是 `/explore`（无语言前缀），导致 Google 收到指向不存在 URL 的 hreflang 声明。

**修复**：`client/src/utils/seo.js` — `generateHrefLangLinks()` 简化为只输出 `x-default`：
```js
return [
  { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl },
];
```

**修复**：`client/src/components/SEO/SEOHead.js` — hreflang 简化：
```js
const hreflangs = [
  { rel: 'alternate', hreflang: 'x-default', href: alternateUrls['x-default'] || currentUrl }
];
```

**后续**：待实现真正多语言路由（`/zh-CN/explore` 等）后再补充各语言链接。

---

## 十、完整修改文件列表

| 文件 | 类型 | 变更摘要 |
|------|------|---------|
| `server/utils/sitemapGenerator.js` | 后端 | +SrefStyle import; +generateSrefURLs; +generateSrefSitemap; +generateGallerySitemap; fix generateGalleryURLs URL; update index+all |
| `client/public/sitemap.xml` | 静态 | +sitemap-sref.xml, +sitemap-gallery.xml 条目 |
| `client/src/pages/SrefModal.js` | 前端 | 完整 Helmet 扩充（+canonical, og:title, twitter, ld+json） |
| `client/src/pages/Gallery/GalleryModal.js` | 前端 | 实装 Helmet 块（原来只 import 未使用） |
| `client/src/hooks/useSEO.js` | 前端 | useExploreSEO + useGallerySEO 新增 CollectionPage structuredData |
| `client/src/utils/seo.js` | 前端 | 修复 og-default 路径; hreflang 清理（移除错误语言前缀） |
| `client/src/components/SEO/SEOHead.js` | 前端 | 同步修复 og-default 路径; hreflang 清理 |
| `client/public/index.html` | 静态 | noscript 内容增强（导航链接 + 站点描述） |
| `client/src/components/Gallery/GalleryCard.js` | 前端 | img 新增 decoding="async" |
| `client/src/components/Sref/SrefCard.js` | 前端 | img 新增 decoding="async" |
| `tasks/20260325_seo_roadmap.md` | 文档 | 新建 SEO 路线图（9 项措施详细说明）|

---

## 十一、⚠️ 后续待做（未完成项）

### 高优先级
1. **Admin SEO 面板**：将 `SEOManagement.js` 集成进 `AdminPanel.js`，添加 "SEO" tab
   - 或在 App.js 添加独立路由 `/admin/seo`（需 AdminRoute 保护）
   - 届时可通过 UI 触发 `/api/seo/sitemap/generate` 生成 13,000+ URL 的动态 sitemap

2. **首次 sitemap 生成**：服务器部署后手动调用一次：
   ```bash
   curl https://iii.pics/api/seo/sitemap/generate
   # 或使用 Admin 面板（待集成后）
   ```

### 中优先级
3. **定时自动生成 sitemap**：在现有 cron 调度系统中添加每日 sitemap regeneration
   - 参考 `server/routes/dataSync.js` 的 cron 模式
4. **react-snap 替代方案**：评估 Next.js 迁移路径（长期）

### 低优先级
5. **多语言路由实现**：待真正实现 `/zh-CN/`, `/en-US/` 路由前缀后，恢复 hreflang 多语言声明
6. **Google Search Console 提交**：部署后在 GSC 提交 sitemap URL
