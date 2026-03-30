# Stage 72 — Seedance Sitemap 修复与视频 Sitemap 新增

**日期**: 2026-03-29
**文件**: `server/utils/sitemapGenerator.js`, `client/public/sitemap.xml`, `client/public/sitemap-seedance.xml`

---

## 问题诊断

### 原始缺陷

| 问题 | 细节 |
|------|------|
| 查询参数 URL | `generateSeedanceURLs()` 生成 `/seedance?id=xxx`，Google 默认过滤查询字符串参数，**基本不收录** |
| 无专用视频 sitemap | Seedance 每条记录含 `videoUrl` + `thumbnailUrl`，但没有 `<video:video>` 标签，无法出现在 Google Video 搜索 |
| 索引缺失 | `sitemap.xml` 索引中没有 `sitemap-seedance.xml` 条目 |

### 路由实际支持

`client/src/App.js` 已有：
```jsx
<Route path="seedance" element={<SeedanceList />}>
  <Route path=":id" element={<SeedanceModal />} />
</Route>
```
即 `/seedance/:id` 路径参数形式完全可用，只是 sitemap 用错了格式。

---

## 修复内容

### 1. 修复 `generateSeedanceURLs()` — 路径参数

```diff
- xml += `    <loc>${this.baseUrl}/seedance?id=${item._id}</loc>\n`;
+ xml += `    <loc>${this.baseUrl}/seedance/${item._id}</loc>\n`;
```

这个方法内嵌在语言 sitemap（`sitemap-zh-CN.xml` 等）中，修复后语言 sitemap 里的 Seedance URL 也正确。

### 2. 新增 `generateSeedanceSitemap()` — 专用视频 sitemap

新增方法，生成带 `xmlns:video` 命名空间的专用 sitemap，每条记录包含：

```xml
<video:video>
  <video:thumbnail_loc>...</video:thumbnail_loc>
  <video:title>...</video:title>
  <video:description>...</video:description>
  <video:content_loc>...</video:content_loc>
  <video:publication_date>...</video:publication_date>
  <video:tag>...</video:tag>  <!-- 最多10个 -->
</video:video>
```

- 只收录 `isActive: true` 的条目
- `thumbnailUrl` 为空时降级用 `videoUrl`
- `description` 为空时降级用 `prompt` 前200字符
- tags 最多取10个（Google 限制）

### 3. 更新 `generateSitemapIndex()` — 加入索引

```xml
<sitemap>
  <loc>https://iii.pics/sitemap-seedance.xml</loc>
  <lastmod>...</lastmod>
</sitemap>
```

### 4. 更新 `generateAllSitemaps()` — 加入生成流程

```js
const seedanceSitemap = await this.generateSeedanceSitemap();
await this.saveSitemap('sitemap-seedance.xml', seedanceSitemap);
```

---

## 验证结果

```
sitemap-seedance.xml  1.3MB
<url> 条目数: 1223
<video:video> 标签数: 2344（开/关标签各一）
sitemap.xml 索引: 包含 sitemap-seedance.xml ✅
```

---

## 注意事项

- 运行中的 server 有 Node.js 模块缓存，API `/api/seo/sitemap/generate` 需要**重启 server** 后才能正确生成 `sitemap-seedance.xml`。本次已通过 `node` 脚本手动生成并写入。
- Seedance 视频 URL 来自 Cloudflare Stream（`customer-*.cloudflarestream.com`），属于外部 CDN，Google Video sitemap 可以抓取，但播放需要 JS，Google 能否完整索引视频内容取决于其爬虫能力。
- 建议重启 server 后通过 `/api/seo/sitemap/generate` 重新生成一次，确保所有文件一致。
