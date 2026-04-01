# SEO 关键词落地页 + 详情页丰富 开发日志

**日期**: 2026-04-01
**阶段**: SEO Priority 2 + Priority 3
**Commits**: `b35cb1c` (P2)、`841ae94` (P3)

---

## 一、背景与目标

基于 `tasks/optimized-yawning-turtle.md` 规划，实施 SEO 关键词战略的第二、三优先级：

- **P2**: 为站内 4 大热门 AI 工具建立独立长尾词落地页，抢占 "nanobanana pro prompts"、"gpt image 1.5 prompts"、"midjourney sref codes"、"seedance 2.0 ai video" 等关键词
- **P3**: 在 SrefModal / GalleryModal 详情页新增"相关内容"推荐模块，提升页面停留时长与内链密度

> P1（Google Search Console 接入 + SEOTab 提交按钮）在 2026-03-31 commit `a4b271d` 已完成，GSC 验证码由用户在 GSC 控制台操作后已生效，无需额外开发。

---

## 二、P2 — 长尾关键词落地页

### 2.1 新增文件

| 文件 | 路由 | 主题色 | 数据源 |
|------|------|--------|--------|
| `client/src/components/Landing/LandingGalleryGrid.js` | (公共组件) | — | — |
| `client/src/pages/Landing/MidjourneySrefGuide.js` | `/midjourney-sref` | 靛蓝紫 #4f46e5 | `srefAPI.getPosts({ limit:12, sort:'newest' })` |
| `client/src/pages/Landing/NanobananaGallery.js` | `/nanobanana` | 琥珀黄 #ca8a04 | `galleryAPI.getPrompts({ model:'nanobanana', limit:12 })` |
| `client/src/pages/Landing/GptImageGallery.js` | `/gpt-image` | 翠绿 #16a34a | `galleryAPI.getPrompts({ model:'gptimage', limit:12 })` |
| `client/src/pages/Landing/SeedanceGuide.js` | `/seedance-guide` | 紫罗兰 #7c3aed | `seedanceAPI.getPrompts({ limit:8, sort:'newest' })` |

### 2.2 LandingGalleryGrid 公共组件

`client/src/components/Landing/LandingGalleryGrid.js`

- 4 列响应式网格（1024px → 3列，640px → 2列）
- Skeleton shimmer 加载态（12个占位块）
- 支持 `type` prop：`'sref'` | `'gallery'` | `'seedance'`
- `getHref()` 按类型映射路由：sref → `/explore/:id`，gallery → `/gallery/:id`，seedance → `/seedance/:id`
- hover 放大 + overlay 显示 prompt 文字

### 2.3 各落地页结构（统一模版）

```
[Hero Section]
  badge（工具名 + 图标）
  H1（主关键词 + 副标题）
  描述段（150-200 词，含长尾关键词）
  CTA 按钮组

[What is xxx] 工具介绍 box

[Gallery/Video Grid]
  12图 / 8视频，LandingGalleryGrid 渲染
  "View all" 链接 → 主列表页

[How To Section]
  4-step 使用步骤（触发 HowTo rich result）

[CTA Banner]
  引导 → 主列表页
```

### 2.4 SEO Hooks（新增 4 个）

`client/src/hooks/useSEO.js` 末尾追加：

```js
export const useMidjourneySrefSEO   // HowTo structuredData
export const useNanobananaSEO       // CollectionPage structuredData
export const useGptImageSEO         // CollectionPage structuredData
export const useSeedanceGuideSEO    // HowTo + VideoGallery structuredData
```

每个 hook 设置完整 title / description / keywords，并注入对应 JSON-LD。

### 2.5 App.js 路由注册

`client/src/App.js` — 在 `HomeLayout` 下新增 4 个 lazy 路由：

```jsx
const MidjourneySrefGuide = lazy(() => import('./pages/Landing/MidjourneySrefGuide'));
const NanobananaGallery   = lazy(() => import('./pages/Landing/NanobananaGallery'));
const GptImageGallery     = lazy(() => import('./pages/Landing/GptImageGallery'));
const SeedanceGuide       = lazy(() => import('./pages/Landing/SeedanceGuide'));

// 在 HomeLayout Route 下：
<Route path="midjourney-sref" element={<MidjourneySrefGuide />} />
<Route path="nanobanana"      element={<NanobananaGallery />} />
<Route path="gpt-image"       element={<GptImageGallery />} />
<Route path="seedance-guide"  element={<SeedanceGuide />} />
```

### 2.6 Sitemap 新增 4 个 URL

`server/utils/sitemapGenerator.js` — `staticPages` 数组追加：

```js
{ path: '/midjourney-sref', priority: 0.85, changefreq: 'weekly' },
{ path: '/nanobanana',      priority: 0.85, changefreq: 'daily'  },
{ path: '/gpt-image',       priority: 0.85, changefreq: 'daily'  },
{ path: '/seedance-guide',  priority: 0.85, changefreq: 'weekly' },
```

**与 /admin SEO 的集成**：Admin Panel → SEO Tab → 点击「Generate All」重新生成 sitemap-main.xml 后，这 4 个 URL 将自动包含在内。点击「Submit to All Engines」可立即提交到 Google / Bing / Baidu。无需手动操作 sitemap 文件。

---

## 三、P3 — 详情页内容丰富

### 3.1 SrefModal — Related Styles

**文件**: `client/src/pages/SrefModal.js`

`GET /api/sref/:id` 接口早已在响应中返回 `related` 字段（按 tags 相似度查 8 条），前端之前未使用。现在：

```jsx
const related = data?.data?.related || [];

// 在 tags 区域下方渲染 4 宫格：
{related.length > 0 && (
  <div>
    <p>RELATED STYLES</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
      {related.slice(0, 4).map(r => (
        <div onClick={() => navigate(`/explore/${r._id}`)}>
          <img src={r.previewImage} />
          <div>{r.srefCode}</div>
        </div>
      ))}
    </div>
  </div>
)}
```

**零额外 API 请求**：数据复用已有响应字段。

### 3.2 GalleryModal — Similar Prompts

**文件**: `client/src/pages/Gallery/GalleryModal.js`

新增 react-query 次级查询，按当前 prompt 的 model + 首个 tag 获取同类提示词：

```jsx
const { data: similarData } = useQuery(
  ['gallery-similar', prompt?.model, prompt?.tags?.[0]],
  () => galleryAPI.getPrompts({ model: prompt.model, tag: prompt.tags[0], limit: 8, sort: 'newest' }),
  { enabled: !!(prompt?.model && prompt?.tags?.length > 0), staleTime: 10 * 60 * 1000 }
);
const similarItems = (similarData?.data?.prompts || []).filter(p => p._id !== id).slice(0, 4);
```

渲染 4 宫格，点击导航至 `/gallery/:id`，hover 显示 prompt 预览。

---

## 四、/admin SEO 集成状态

| 功能 | 状态 |
|------|------|
| 4 个落地页 URL 进入 sitemap-main.xml | ✅ Admin → SEO Tab → Generate All 后自动包含 |
| Submit to Google / Bing / Baidu | ✅ 现有按钮已覆盖 |
| GSC 验证 | ✅ 用户已在 GSC 控制台完成验证（无需开发操作） |
| Bot Crawler Simulator | ✅ 可模拟爬取 `/midjourney-sref` 等页面 |
| 覆盖率进度条 | ✅ 显示 Gallery/Sref/Seedance 条目覆盖率，落地页为静态 URL 不纳入统计 |

**操作建议**：部署后在 Admin → SEO Tab 执行一次「Generate All」+ 「Submit to All Engines」，确保新 URL 进入 Google 索引队列。

---

## 五、验证截图记录

| 页面 | 验证结果 |
|------|---------|
| `/midjourney-sref` | ✅ Hero + 图片网格 + HowTo 正常渲染 |
| `/nanobanana` | ✅ Hero + 说明 box + 图片网格正常渲染 |
| `/gpt-image` | ✅ Hero + 图片网格（GPT Image 数据加载） |
| `/seedance-guide` | ✅ Hero + 视频缩略图 16:9 网格 + play 按钮 |
| SrefModal Related Styles | ✅ 4 宫格显示相关风格，srefCode 悬浮标签 |
| GalleryModal Similar Prompts | ✅ 4 宫格显示同 model+tag 提示词 |
| Console errors | ✅ 零 JS 错误 |

---

## 六、修改文件清单

| 文件 | 类型 | 改动说明 |
|------|------|---------|
| `client/src/components/Landing/LandingGalleryGrid.js` | 新建 | 落地页公共网格组件 |
| `client/src/pages/Landing/MidjourneySrefGuide.js` | 新建 | /midjourney-sref 落地页 |
| `client/src/pages/Landing/NanobananaGallery.js` | 新建 | /nanobanana 落地页 |
| `client/src/pages/Landing/GptImageGallery.js` | 新建 | /gpt-image 落地页 |
| `client/src/pages/Landing/SeedanceGuide.js` | 新建 | /seedance-guide 落地页 |
| `client/src/App.js` | 修改 | 注册 4 个 lazy 路由 |
| `client/src/hooks/useSEO.js` | 修改 | 新增 4 个 SEO hook |
| `server/utils/sitemapGenerator.js` | 修改 | staticPages 追加 4 个落地页 URL |
| `client/public/index.html` | 修改 | GSC 验证 meta 占位（用户已在控制台验证） |
| `client/src/pages/SrefModal.js` | 修改 | 新增 Related Styles 4 宫格 |
| `client/src/pages/Gallery/GalleryModal.js` | 修改 | 新增 Similar Prompts 4 宫格 |
