# SEO 全面审计 + 首页性能优化 开发日志

**日期**: 2026-04-07  
**Commits**: `d95da74` (性能 Round 1) · `4324889` (robots.txt) · `9480cca` (性能 Round 2 LCP) · `eb73f94` (SEO schema) · `(pending)` (OG图 + 补漏)

---

## 一、背景

首页 PageSpeed 移动端评分 32 分，同时网站缺乏 AI 搜索引擎可见性。本次分两条主线并行推进：

1. **性能优化**：PageSpeed mobile 32 → 57，desktop 32 → 72
2. **SEO 全面审计**：使用 `/seo` skill 启动 7 个并行子 agent，生成 SEO Health Score 并修复所有可代码解决的问题

---

## 二、性能优化（PageSpeed）

### 2.1 根因分析

| 指标 | 根因 |
|------|------|
| LCP | `<video preload="auto">` 触发 1MB MP4 完整下载 |
| FCP | ScrollingGallery 同步发 API + 加载 40 张图片 |
| LCP (mobile) | framer-motion `initial={{ opacity:0, y:20 }}` 导致首屏卡片不被计入已渲染 |

**关键发现**：移动端 `/` 通过 `MobileHomeRedirect` 重定向到 `/gallery`，PageSpeed 移动端测的实际上是 Gallery 页，而非 Hero 页。因此 Hero 视频优化主要影响桌面端。

### 2.2 变更明细

#### Hero.js — video preload
```jsx
// 修改前
<video preload="auto" />  // 两个 video 各触发 1MB 下载

// 修改后
<video ref={videoARef} preload="metadata" />  // 仅下载文件头元数据
<video ref={videoBRef} preload="none" />      // crossfade 触发时才开始加载
```

#### Hero.js — 移动端 media query（追加到 HERO_STYLES）
```css
@media (max-width: 768px) {
  .split-hero { flex-direction: column; }
  .split-hero-left { width: 100%; height: 100vh; border-right: none; }
  .split-hero-right { display: none; }        /* 隐藏 ScrollingGallery 所在列 */
  .hero-video-bg { display: none; }           /* 视频布局彻底不参与 */
  .hero-orb-sun, .hero-orb-moon { animation: none; }  /* 禁用 paint 密集动画 */
}
```

#### ScrollingGallery.js — 移动端禁用 + limit 40→20
```jsx
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const { data } = useQuery(
  ['hero-sref-scroll'],
  () => srefAPI.getPosts({ page: 1, limit: 20, sort: 'newest' }),
  { enabled: !isMobile }  // 移动端完全跳过 API 请求
);
if (isMobile) return null;
```

#### GalleryCard.js — 移除 framer-motion 入场动画（最大 LCP 改善）
```jsx
// 修改前
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>

// 修改后（移除 initial/animate，Lighthouse 才能计入已渲染的卡片）
<motion.div whileHover={{ y: -2 }}>
```

#### index.html — 字体加载策略优化
```html
<!-- 修改前：CSS @import（串行发现）-->
<!-- index.css 中: @import url(https://fonts.googleapis.com/...) -->

<!-- 修改后：<link> 并行加载 + 减少字重 -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
<!-- 字重从 300;400;500;600;700;800 精简为 400;500;600;700 -->
```

#### i18n/index.js — 移除死代码
```js
// 移除 i18next-http-backend（翻译文件已直接 import JSON，Backend 是死代码）
```

#### server/index.js — gzip 压缩
```js
const compression = require('compression');
app.use(compression());  // API 响应体积减少 70-90%
```

### 2.3 结果

| 端 | 优化前 | 优化后 |
|----|--------|--------|
| Desktop | 32 | 72 |
| Mobile | 32 | 57 |

---

## 三、SEO 全面审计

### 3.1 审计方法

使用 `/seo audit` skill 启动 7 个并行子 agent：
- `seo-technical`：可爬性、安全性、URL 结构
- `seo-content`：E-E-A-T、内容质量
- `seo-schema`：结构化数据检测和验证
- `seo-sitemap`：Sitemap 覆盖率
- `seo-performance`：Core Web Vitals
- `seo-visual`：截图、移动端渲染
- `seo-geo`：AI 搜索可见性（GEO）

**SEO Health Score: 41/100**（审计前）

### 3.2 Critical 问题（已修复或需用户操作）

#### ⚠️ Cloudflare Bot Fight Mode（需用户操作）
- **问题**：Cloudflare "阻止 AI 识别自动程序" 功能覆盖了本地 robots.txt，在 CDN 边缘拦截 Google-Extended、GPTBot、ClaudeBot、CCBot
- **影响**：所有 AI 搜索引擎（ChatGPT、Perplexity、Claude、Google AI Overviews）无法抓取内容
- **解决**：Cloudflare Dashboard → Security → Bots → 将"阻止 AI 识别自动程序"设为"不阻止（允许爬网程序）"
- **状态**：✅ 用户已操作完成

#### HowTo Schema 废弃（2023年9月）
- **问题**：`/midjourney-sref` 和 `/seedance-guide` 使用 HowTo + HowToStep schema，Google 已于 2023-09 停止支持 HowTo rich results
- **修复**：`client/src/hooks/useSEO.js` — 两处 `HowTo` → `Article` schema
- **状态**：✅ 已修复

#### VideoObject 缺少必填字段
- **问题**：`SeedanceModal.js` 的 VideoObject schema 缺少 `duration`（ISO 8601）和 `publisher`（含 logo 的 Organization），Google 要求这两个字段才能获得视频 Rich Results
- **修复**：添加 `duration: "PT10S"` + `publisher: { Organization + logo }`
- **状态**：✅ 已修复

#### OG 图片损坏
- **问题**：`/og-default.jpg` 文件大小仅 284 字节，为纯黑色损坏图片
- **修复**：使用用户提供的 `III.PICS — AI Art Gallery.png`（947KB），PowerShell 转换为 JPEG（179KB），覆盖 `client/public/og-default.jpg`
- **状态**：✅ 已修复

### 3.3 High 问题（已修复）

#### lang 属性错误
- **问题**：`<html lang="zh-CN">` 但网站主要内容为英文，导致 Google 判断语言错误
- **修复**：`client/public/index.html` → `lang="en"`
- **状态**：✅ 已修复

#### robots.txt 过度限制
- **问题**：旧 robots.txt 有复杂的 Crawl-delay 规则，部分爬虫被差异化限速
- **修复**：简化为标准格式，仅 Disallow 后台路径
- **状态**：✅ 已修复（commit `4324889`）

#### AI 爬虫 UA 未识别
- **问题**：`server/utils/botDetect.js` 不识别 AI 爬虫 UA，导致这些爬虫访问时不触发 SSR bot-rendering 逻辑
- **修复**：添加 `gptbot|oai-searchbot|chatgpt-user|claudebot|anthropic-ai|perplexitybot|google-extended|ccbot|bytespider`
- **状态**：✅ 已修复

#### GalleryModal contentUrl 相对路径
- **问题**：ImageObject schema 的 `contentUrl` 字段直接使用 `prompt.previewImage`，可能是相对路径，Google 无法解析
- **修复**：`client/src/pages/Gallery/GalleryModal.js` — 判断是否以 `http` 开头，否则加 `https://iii.pics` 前缀
- **状态**：✅ 已修复

### 3.4 Medium 问题（已修复）

#### 缺少 Organization schema
- **修复**：`client/public/index.html` 添加静态 JSON-LD（Organization + WebSite + SearchAction）
- **状态**：✅ 已修复

#### 缺少 llms.txt
- **问题**：AI 爬虫通过 `llms.txt` 了解网站结构和内容概要（类似 robots.txt for LLMs）
- **修复**：创建 `client/public/llms.txt`，列出所有关键页面、数据覆盖范围、内容政策
- **状态**：✅ 已修复

#### /img2prompt 缺少 SoftwareApplication schema
- **修复**：`client/src/hooks/useSEO.js` → `useImg2PromptSEO` 添加 `SoftwareApplication` schema（含 free offer）
- **状态**：✅ 已修复

### 3.5 需持续跟进（非代码问题）

| 问题 | 说明 | 行动 |
|------|------|------|
| GSC 验证码 | `index.html` 中 `PENDING_GSC_VERIFICATION_CODE` 占位符 | 在 GSC 控制台获取真实验证码后替换 |
| OG 图片尺寸 | 当前图片需确认是否为标准 1200×630 | 已转换，可通过 Twitter Card Validator 验证 |
| sameAs 社交链接 | `twitter.com/mjgallery` 等链接指向不存在的账号 | 创建对应社交账号或删除 sameAs 字段 |
| SPA CSR 限制 | 首页仅有 45 词可被爬虫直接读取 | 长期方案：迁移 Next.js SSG，或扩充 `<noscript>` 内容 |

---

## 四、变更文件汇总

| 文件 | 变更 | Commit |
|------|------|--------|
| `client/src/components/Home/Hero.js` | video preload + 移动端 media query | d95da74 |
| `client/src/components/Home/ScrollingGallery.js` | 移动端 early return + limit 40→20 | d95da74 |
| `client/src/components/Gallery/GalleryCard.js` | 移除 framer-motion 入场动画 | 9480cca |
| `client/public/index.html` | 字体 link 方式 + lang=en + Organization/WebSite JSON-LD | d95da74, eb73f94 |
| `client/src/index.css` | 移除 Google Fonts @import | d95da74 |
| `client/src/i18n/index.js` | 移除 i18next-http-backend 死代码 | 9480cca |
| `server/index.js` | gzip compression 中间件 | d95da74 |
| `client/public/robots.txt` | 简化，移除过度 Crawl-delay | 4324889 |
| `client/public/llms.txt` | 新建，AI 爬虫内容索引 | eb73f94 |
| `client/public/og-default.jpg` | 替换损坏黑图为真实 OG 图 | pending |
| `client/src/hooks/useSEO.js` | HowTo→Article × 2 + SoftwareApplication schema | eb73f94, pending |
| `client/src/pages/Seedance/SeedanceModal.js` | VideoObject + duration + publisher | eb73f94 |
| `client/src/pages/Gallery/GalleryModal.js` | contentUrl 绝对 URL 修复 | pending |
| `server/utils/botDetect.js` | 添加 AI 爬虫 UA 识别 | eb73f94 |

---

## 五、技术备注

### Cloudflare Bot Fight Mode 与 robots.txt 的关系
Cloudflare 的 Bot Fight Mode 在 CDN 边缘拦截 AI 爬虫，**优先级高于** origin 服务器返回的 robots.txt。即使 robots.txt 明确 `Allow: /`，AI 爬虫也会在到达 origin 之前被 Cloudflare 返回 403 拒绝。这是影响 AI 搜索可见性最关键的单点问题。

### 移动端 PageSpeed 测试的实际页面
III.PICS 移动端 `/` 通过 `MobileHomeRedirect` 组件重定向到 `/gallery`。PageSpeed 移动端测试跟随重定向，实际测量的是 Gallery 列表页，而非 Hero 首页。因此 Hero 视频优化（移除 preload=auto）主要改善桌面端 LCP。

### framer-motion opacity:0 与 LCP 的关系
Lighthouse 使用 LCP 算法时，opacity=0 的元素不计入"已渲染的最大内容"。GalleryCard 使用 `initial={{ opacity: 0 }}` 导致所有卡片在动画完成前均被 Lighthouse 忽略，人为推高了 LCP 时间。移除 initial 属性后卡片立即可见，LCP 大幅下降。
