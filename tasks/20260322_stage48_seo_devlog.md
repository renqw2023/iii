# Stage 48 开发日志 — SEO 整体框架实施

**日期**: 2026-03-22
**Commit**: `933c849` (Stage 48) → `<Stage 48b>`
**Author**: Claude Sonnet 4.6 + 人工审核

---

## 背景与目标

III.PICS 已有相当完善的 SEO 基础设施（`react-helmet-async`、`SEOHead` 组件、`useSEO` hook、`sitemapGenerator`），但大量代码停留在"写好但未接入"的状态，且关键配置全部指向旧域名 `mjgallery.com`、内容以中文为主。本次改造目标：

1. **让 SEO 框架从"有代码"变成"真正运作"** — 生成 robots.txt / sitemap.xml，修复写入路径
2. **英文优先** — 网站服务器在欧美，用户群体以欧美创作者为主，所有页面 meta 改为英文
3. **Google 关键词优化** — 针对 AI 艺术、Midjourney、AI 图像生成等热门搜索词布局关键词权重

---

## 问题诊断（改造前）

| 问题 | 严重度 | 说明 |
|------|--------|------|
| `robots.txt` 不存在 | 🔴 Critical | 爬虫无规则可循，sitemap 地址无从获取 |
| `sitemap.xml` 不存在 | 🔴 Critical | Google / Bing 不知道索引哪些页面 |
| `SEOHead.js` 硬编码 `mjgallery.com` | 🔴 Critical | canonical / og:url 全部指向错误域名 |
| `sitemapGenerator.js` 写入 `client/build/` | 🔴 Critical | 生成文件不进部署包（Vercel 部署用 `client/public/`）|
| sitemapGenerator 静态页路径错误 | 🟠 High | `/prompts` 不存在；缺少 `/gallery`、`/seedance`、`/img2prompt` |
| 所有 useSEO hooks 内容为中文 | 🟠 High | 欧美用户 Google 搜索无法匹配中文 meta |
| 大多数页面未接入任何 SEO hook | 🟠 High | Gallery / Seedance / Img2Prompt / 各保护页无 meta |
| `seo.js` noIndex 未透传 | 🟡 Medium | 保护页（Dashboard / Credits 等）被 Google 索引 |
| `seo.js` title 追加导致重复 "III.PICS" | 🟡 Medium | title 显示为 "A - III.PICS \| B - III.PICS - AI艺术..." |
| `twitter:site` 写死 `@mjgallery` | 🟡 Medium | Twitter Card 社交分享信息错误 |
| `index.html` og:image 用 logo.svg | 🟡 Medium | 社交分享卡片显示不佳（需 1200×630 JPG）|

---

## 改造内容详解

### 1. 新建 `client/public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://iii.pics/sitemap.xml

# 受保护路径（noindex）
Disallow: /api/
Disallow: /admin
Disallow: /dashboard
Disallow: /settings
Disallow: /credits
Disallow: /notifications
Disallow: /browse-history
Disallow: /generate-history
Disallow: /favorites
Disallow: /login
Disallow: /register
Disallow: /verify-email
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /magic-link/

# 爬取延迟配置
User-agent: Googlebot
Crawl-delay: 0          ← Google 优先，无延迟

User-agent: Bingbot
Crawl-delay: 1

User-agent: Baiduspider
Crawl-delay: 2
```

**策略说明**：登录/注册页虽然在 robots.txt 中 Disallow，并同时在 React 层加了 `noindex, nofollow`，实现双重保护防止爬取私密页面。

---

### 2. 新建 `client/public/sitemap.xml` + `sitemap-main.xml`

**结构**：
```
sitemap.xml          ← sitemapindex（主索引，指向各子 sitemap）
  ├─ sitemap-main.xml    ← 9条静态路由
  └─ sitemap-images.xml  ← 图片（由 sitemapGenerator 动态生成）
```

**sitemap-main.xml 覆盖路由**：
| URL | Priority | Changefreq |
|-----|----------|------------|
| `https://iii.pics/` | 1.0 | daily |
| `https://iii.pics/explore` | 0.9 | daily |
| `https://iii.pics/gallery` | 0.9 | daily |
| `https://iii.pics/seedance` | 0.8 | daily |
| `https://iii.pics/img2prompt` | 0.7 | weekly |
| `https://iii.pics/docs` | 0.7 | monthly |
| `https://iii.pics/docs#about` | 0.6 | monthly |
| `https://iii.pics/docs#privacy` | 0.5 | yearly |
| `https://iii.pics/docs#terms` | 0.5 | yearly |

---

### 3. 修复 `SEOHead.js`

```js
// 修改前
const baseUrl = process.env.REACT_APP_BASE_URL || 'https://mjgallery.com';
<meta name="twitter:site" content="@mjgallery" />

// 修改后
const baseUrl = process.env.REACT_APP_BASE_URL || 'https://iii.pics';
<meta name="twitter:site" content="@iii_pics" />
```

---

### 4. 修复 `sitemapGenerator.js`

**a) 写入路径修复**：
```js
// 修改前
const publicDir = path.join(__dirname, '../../client/build');
// 修改后
const publicDir = path.join(__dirname, '../../client/public');
```

**b) 静态页路径修正**：去掉不存在的 `/prompts`、`/about`、`/help` 等；新增 `/gallery`、`/seedance`、`/img2prompt`、`/docs`

**c) 新增 Gallery + Seedance 动态内容查询**：
```js
const GalleryPrompt = require('../models/GalleryPrompt');
const SeedancePrompt = require('../models/SeedancePrompt');

async generateGalleryURLs()   // → https://iii.pics/gallery?id=xxx
async generateSeedanceURLs()  // → https://iii.pics/seedance?id=xxx
```

---

### 5. 修复 `seo.js` — 三处 Bug

**Bug 1: title 重复追加**
```js
// 修改前（所有 hook title 已含 "III.PICS"，再追加 baseTitle 导致重复）
const finalTitle = title ? `${title} | ${baseTitle}` : baseTitle;

// 修改后
const finalTitle = title
  ? (title.includes('III.PICS') ? title : `${title} | ${baseTitle}`)
  : baseTitle;
```

**Bug 2: noIndex 未透传**
```js
// configurePageSEO 未解构 noIndex，updatePageMeta 硬写 'index, follow'
// 修改后
updatePageMeta({ ...seoConfig, noIndex });
// updatePageMeta 中
updateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
```

**Bug 3: twitter:site 域名错误**
```js
updateMeta('twitter:site', '@mjgallery');  // → '@iii_pics'
```

---

### 6. 扩展 `useSEO.js` — 6 个新增 Hook

| Hook | 页面 | 关键词策略 |
|------|------|-----------|
| `useGallerySEO()` | `/gallery` | AI image prompts, GPT Image, NanoBanana |
| `useSeedanceSEO()` | `/seedance` | AI video generator, Seedance, Kling, Wan |
| `useImg2PromptSEO()` | `/img2prompt` | image to prompt, reverse prompt, AI image generator |
| `useDocsSEO()` | `/docs` | user guide, privacy policy |
| `useGalleryItemSEO(item)` | GalleryModal | AI image prompt, text to image |
| `useSrefSEO(sref)` | SrefModal | midjourney --sref [code], style reference |

---

### 7. 16 个页面批量接入 SEO

| 页面 | Hook | robots |
|------|------|--------|
| `GalleryList.js` | `useGallerySEO()` | index, follow |
| `SeedanceList.js` | `useSeedanceSEO()` | index, follow |
| `Explore.js` | `useExploreSEO()` | index, follow |
| `Img2Prompt.js` | `useImg2PromptSEO()` | index, follow |
| `PostDetail.js` | `usePostSEO(post)` | index, follow |
| `Profile.js` | `useUserSEO(user)` | index, follow |
| `GalleryModal.js` | Helmet（动态） | index, follow |
| `SrefModal.js` | Helmet（动态） | index, follow |
| `Login.js` | `useLoginSEO()` | **noindex, nofollow** |
| `Register.js` | `useRegisterSEO()` | **noindex, nofollow** |
| `Dashboard.js` | `useSEO({ noIndex: true })` | **noindex, nofollow** |
| `Credits.js` | `useSEO({ noIndex: true })` | **noindex, nofollow** |
| `Settings.js` | `useSettingsSEO()` | **noindex, nofollow** |
| `Favorites.js` | `useSEO({ noIndex: true })` | **noindex, nofollow** |
| `Notifications.js` | `useSEO({ noIndex: true })` | **noindex, nofollow** |
| `NotFound.js` | `useSEO({ noIndex: true })` | **noindex, nofollow** |

---

### 8. 英文优先 + Google 关键词优化（Stage 48b）

服务器在欧美，主要用户群为英语创作者，因此全站 meta 切换为英文优先，针对以下高搜索量词布局：

#### 关键词矩阵

| 类别 | 目标关键词 | 搜索量级 |
|------|-----------|---------|
| Midjourney 核心 | `midjourney sref`, `midjourney style reference`, `midjourney --sref`, `sref codes` | 高 |
| AI 图像生成 | `AI image generator`, `text to image AI`, `AI art generator free`, `AI art styles` | 极高 |
| 提示词相关 | `midjourney prompts`, `AI image prompts`, `AI art prompts` | 高 |
| 反推工具 | `image to prompt`, `reverse prompt`, `img2prompt`, `AI prompt extractor` | 中 |
| AI 视频 | `AI video generator`, `Seedance prompts`, `Kling AI video`, `text to video AI` | 中高 |
| 社区 | `AI art gallery`, `AI art inspiration`, `AI art community` | 中 |

#### 各页面最终 Title / Description

**首页**：
```
Title: III.PICS — AI Art Gallery & Midjourney Style Reference
Desc:  Discover thousands of Midjourney sref style codes, AI-generated images, and creative prompts.
       Browse the best AI art gallery online — free inspiration for every artist.
```

**Explore（Sref 画廊）**：
```
Title: Explore Midjourney Sref Styles — III.PICS Style Gallery
Desc:  Browse 1,300+ Midjourney --sref style reference codes with visual previews.
       Find the perfect AI art style for your next prompt — updated daily.
```

**Gallery（AI Prompt 画廊）**：
```
Title: AI Prompt Gallery — III.PICS | Trending AI Image Prompts
Desc:  Browse the best AI image prompts for NanoBanana Pro, GPT Image, and more.
       One-click copy — no prompt engineering needed. Updated daily with trending AI art.
```

**Seedance（AI 视频）**：
```
Title: AI Video Gallery — III.PICS | Seedance & Kling Video Prompts
Desc:  Explore AI-generated video clips made with Seedance 2.0, Kling, and Wan.
       Browse text-to-video and image-to-video prompts with playable previews.
```

**Img2Prompt（AI 生成工具）**：
```
Title: AI Image Generator & Reverse Prompt Tool — III.PICS
Desc:  Generate AI images from text prompts, or upload any image to instantly extract its prompt.
       Free AI art generator powered by Gemini, DALL·E, and more.
```

**Sref Modal（单个风格详情）**：
```
Title: Midjourney --sref {CODE} Style Reference — III.PICS
Desc:  {description/prompt snippet} — Midjourney style code --sref {CODE}.
```

---

### 9. index.html 更新

```html
<!-- 修改前 -->
<title>III.PICS - 专业AI视觉艺术平台 | 激发灵感·释放想象·推动创新</title>
<meta name="description" content="III.PICS - 专业AI视觉艺术平台..." />
<meta property="og:image" content="%PUBLIC_URL%/logo.svg" />

<!-- 修改后 -->
<title>III.PICS — AI Art Gallery & Midjourney Style Reference</title>
<meta name="description" content="Browse Midjourney sref style codes, AI-generated images, and creative prompts..." />
<meta property="og:image" content="https://iii.pics/og-default.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:site" content="@iii_pics" />
```

---

## 验证结果

| 验证项 | 结果 |
|--------|------|
| `GET /robots.txt` | ✅ 正确返回爬取规则 |
| `GET /sitemap.xml` | ✅ 合法 sitemapindex XML |
| `/explore` title | ✅ `Explore Midjourney Sref Styles — III.PICS Style Gallery` |
| `/explore` description | ✅ 英文，含目标关键词 |
| `/explore` canonical | ✅ `https://iii.pics/explore` |
| `/gallery` title | ✅ `AI Prompt Gallery — III.PICS | Trending AI Image Prompts` |
| `/dashboard` robots | ✅ `noindex, nofollow` |
| JS 错误 | ✅ 零错误 |

---

## 已知限制 & 后续优化

| 项目 | 说明 |
|------|------|
| `og-default.jpg` 尚未生成 | index.html 引用了 `/og-default.jpg` 但文件不存在（需要设计 1200×630 社交分享图）|
| SPA 预渲染缺失 | Google 可以执行 JS，但 Bing / 百度对 SPA 抓取效果有限；长期建议接入 SSR 或 `react-snap` 预渲染 |
| 关键词 meta 重复追加 | `seo.js` 的 `baseKeywords` 会追加到页面 keywords，造成一定冗余（Google 不使用 keywords meta，无实质影响）|
| sitemap-images.xml 为空 | 运行 `sitemapGenerator.generateAllSitemaps()` 后才会有图片内容（需部署到服务器运行）|
| Sref Modal noindex | 目前通过 `<Helmet>` 设置动态标题，但没有设 `noindex`——Sref 详情页具备索引价值，保持 indexable 是正确的 |

---

## 文件变更清单

```
新建
├── client/public/robots.txt
├── client/public/sitemap.xml
├── client/public/sitemap-main.xml
└── tasks/20260322_stage48_seo_devlog.md

修改（Stage 48）
├── client/public/index.html
├── client/src/components/SEO/SEOHead.js
├── client/src/hooks/useSEO.js
├── client/src/utils/seo.js
├── client/src/pages/Gallery/GalleryList.js
├── client/src/pages/Gallery/GalleryModal.js
├── client/src/pages/Seedance/SeedanceList.js
├── client/src/pages/Explore.js
├── client/src/pages/Img2Prompt.js
├── client/src/pages/PostDetail.js
├── client/src/pages/Profile.js
├── client/src/pages/SrefModal.js
├── client/src/pages/Login.js
├── client/src/pages/Register.js
├── client/src/pages/Dashboard.js
├── client/src/pages/Credits.js
├── client/src/pages/Settings.js
├── client/src/pages/Favorites.js
├── client/src/pages/Notifications.js
├── client/src/pages/NotFound.js
└── server/utils/sitemapGenerator.js

修改（Stage 48b — 英文化 + 关键词优化）
├── client/public/index.html
├── client/src/hooks/useSEO.js
├── client/src/utils/seo.js
├── client/src/pages/SrefModal.js
└── client/src/pages/Gallery/GalleryModal.js
```

---

## Google Search Console 后续操作

1. 登录 [Google Search Console](https://search.google.com/search-console)
2. 添加属性 `https://iii.pics`（DNS TXT 验证或 HTML 文件验证）
3. 提交 sitemap：`Sitemaps` → 输入 `https://iii.pics/sitemap.xml` → 提交
4. 使用 `URL Inspection` 工具手动请求索引 `/`、`/explore`、`/gallery`、`/seedance`
5. 监控 `Coverage` 报告，确认受保护页（/dashboard 等）出现在 `Excluded` 列表中

---

*日志由 Claude Sonnet 4.6 自动生成，人工审核通过*
