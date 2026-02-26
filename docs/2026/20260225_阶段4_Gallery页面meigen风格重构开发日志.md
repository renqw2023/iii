# 阶段4 — Gallery/Explore/首页 meigen.ai 风格重构开发日志

**日期**：2026-02-25
**分支**：main
**涉及页面**：`/gallery`、`/explore`、`/seedance`、`/`（首页）

---

## 一、目标

将 Gallery、Explore、Seedance 页面的内容展示区域精确复刻 [meigen.ai](https://www.meigen.ai/) 的前端视觉风格，核心三点：

1. **左 Sidebar + 右内容区**布局（取代原来的顶部水平 filter 行）
2. **CSS Columns 瀑布流**（取代原来的固定比例 CSS Grid）
3. **图片占满卡片，元数据仅 Hover 时显示**（取代原来图片下方常驻文字区）

---

## 二、核心差距分析（实施前）

| 维度 | 改前 | 目标（meigen.ai） |
|------|------|-----------------|
| 页面布局 | 垂直堆叠（header → filters → grid） | 左 sidebar + 右 content area |
| 网格类型 | CSS Grid `repeat(4, 1fr)` 等高 | CSS Columns 瀑布流，图片自然比例 |
| 卡片设计 | 图片(4:3固定) + 底部常驻文字 | 图片自然比例占满，元数据仅 hover |
| 过滤器位置 | 水平 tab 行（页面顶部） | 左侧 sidebar（Search + ModelFilter + TagFilter） |
| 宽度限制 | `max-width: 1400px; margin: 0 auto` | 无 max-width，全屏展示 |

---

## 三、实施步骤与变更记录

### Task 1 — GalleryCard.js 视觉重构

**文件**：`client/src/components/Gallery/GalleryCard.js`

**变更**：
- 删除 `<div className="gallery-card-info">` 整个区块（title、prompt、meta 文字）
- 图片改为 `width: 100%; height: auto; display: block`（移除 `aspect-ratio: 4/3`）
- 移除 Framer Motion `layout` prop（避免与 CSS columns 布局冲突）
- 新增底部渐变 hover overlay，包含：作者名、Heart/Eye 数据、Copy/Like/Favorite 操作按钮
- 保留 `useInView` 懒加载逻辑（`triggerOnce: true, rootMargin: '200px'`）
- 模型标签（`gallery-model-badge`）保持左上角常驻显示

---

### Task 2 — gallery.css 核心样式重写

**文件**：`client/src/styles/gallery.css`

**主要变更**：

```css
/* 页面容器 — 去掉 max-width，全屏 */
.gallery-page, .seedance-page {
  width: 100%;
  padding: 0.75rem 0.75rem 4rem;
}

/* 布局：sidebar + main 并排 */
.gallery-layout {
  display: flex;
  gap: 0.5rem;
}

/* 左侧 sidebar */
.gallery-sidebar {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 1rem;
}

/* 瀑布流网格 */
.gallery-grid {
  columns: 4;
  column-gap: 8px;
}

/* 卡片：break-inside 防止被列截断 */
.gallery-card {
  break-inside: avoid;
  margin-bottom: 8px;
}
```

**响应式断点**：
| 视口宽度 | 列数 | sidebar 状态 |
|---------|------|------------|
| ≥ 1920px | 6列 | 展开 |
| ≥ 1600px | 5列 | 展开 |
| 默认 | 4列 | 展开 |
| ≤ 1200px | 3列 | 展开 |
| ≤ 900px | 2列 | 折叠为顶部横条 |
| ≤ 600px | 2列 | 折叠 |
| ≤ 400px | 1列 | 折叠 |

**Context-aware CSS（sidebar 内过滤器覆盖）**：
```css
/* 默认水平，sidebar 内垂直 */
.gallery-sidebar .model-filter { flex-direction: column; }
.gallery-sidebar .tag-filter-scroll { flex-direction: column; max-height: 220px; overflow-y: auto; }
.gallery-sidebar .gallery-search-container { max-width: none; width: 100%; }
```

**首页专用网格**（解决 motion.div wrapper 与 CSS columns 冲突）：
```css
.home-featured-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
```

---

### Task 3 — GalleryList.js 布局重构

**文件**：`client/src/pages/Gallery/GalleryList.js`

**变更**：
- 添加 `sidebarOpen` state（默认 `true`）
- JSX 结构改为 `gallery-page > gallery-layout > [aside.gallery-sidebar + main.gallery-main]`
- Sidebar 内：Search、ModelFilter、TagFilter、Sort select
- Main 内：toolbar（toggle 按钮 + 结果统计）、gallery-grid、分页
- 所有状态管理（model、activeTag、sort、search、page）和 URL 同步逻辑完整保留
- 移除未使用的 `motion` import，保留 `AnimatePresence`

---

### Task 4 — SeedanceList.js 布局同步

**文件**：`client/src/pages/Seedance/SeedanceList.js`

**变更**：与 Task 3 相同的 sidebar + main 布局结构，category filter 移入 sidebar。
VideoCard 的 `aspect-ratio: 16/9` 保持不变。

---

### Task 5 — Explore.js 完整重设计

**文件**：`client/src/pages/Explore.js`

**变更**：原为 light Tailwind 主题，完全重写为暗色 sidebar + masonry 布局。

```jsx
// 新结构
<div className="gallery-page">
  <div className="gallery-layout">
    <aside className={`gallery-sidebar ${sidebarOpen ? '' : 'closed'}`}>
      {/* Search, Category tags, Sort */}
    </aside>
    <main className="gallery-main">
      <div className="gallery-grid">
        {posts.map(post => <LiblibStyleCard key={post._id} post={post} />)}
      </div>
    </main>
  </div>
</div>
```

---

### Task 6 — LiblibStyleCard 完整重写

**文件**：`client/src/components/Post/LiblibStyleCard.js` + `LiblibStyleCard.css`

**根本原因**：旧 CSS 文件中 `.liblib-card { height: 450px; background: #ffffff }` 和 `.liblib-card-image { height: 380px }` 硬编码覆盖所有 JS 修改，必须彻底重写 CSS。

**新设计**：
- 无固定高度，图片自然撑开
- 暗色主题（CSS 变量）
- hover overlay：作者、Heart+Eye 数据、Like+Share 按钮
- 风格标签（version/style/aspect）左上角常驻
- `break-inside: avoid; margin-bottom: 8px` 适配瀑布流

---

### Task 7 — LiblibPromptCard 完整重写

**文件**：`client/src/components/Prompt/LiblibPromptCard.js` + `LiblibPromptCard.css`

**根本原因**：旧 CSS `aspect-ratio: 3/4; min-height: 380px` 强制固定高度。

**新设计**：
- 无固定高度
- PROMPT badge + difficulty badge 左上角
- hover overlay：作者、Heart+Eye+Copy 数据、Like+Copy 操作
- 移除不存在的 `promptAPI.likePrompt` 调用，改为纯本地 state

---

## 四、Bug 修复记录

| Bug | 根本原因 | 修复方式 |
|-----|---------|---------|
| GalleryList 编译警告 | `motion` import 未使用 | 移除 `motion`，保留 `AnimatePresence` |
| LiblibPromptCard 点赞报错 | `promptAPI.likePrompt` 不存在 | 移除 API 调用，保留本地 state |
| 卡片白色固定高度 | CSS 文件硬编码 `height: 450px; background: #fff` | 完整重写 CSS 文件 |
| 首页 motion.div 破坏瀑布流 | CSS columns 要求直接子元素是卡片，motion.div 作为中间层导致列布局失效 | 首页专用 `.home-featured-grid` 改用 `display: grid` |
| 侧边栏 Style 标签折叠压缩 | `flex-shrink: unset`（= 初始值 1）在 `flex-direction: column` + `max-height` 容器中，flex 算法优先压缩子元素而非触发滚动 | 改为 `flex-shrink: 0`，强制保持自然高度，触发 `overflow-y: auto` 滚动 |
| 图片/内容区宽度受限 | `.gallery-page` 有 `max-width: 1400px; margin: 0 auto` | 移除 `max-width`，改为 `width: 100%` |

---

## 五、首页布局调整历程

本次开发过程中对首页布局进行了多轮讨论与调整：

### 方案讨论

**方案 A（最终采用）**：首页居中（`max-width: 1400px`），Gallery/Explore 满屏
- 首页是品牌展示页，文字+入口卡片+CTA，居中更有设计感
- Gallery/Explore 是图片浏览页，满屏提升视觉冲击力

**方案 B（探索后放弃）**：标题居中 + 图片网格满屏
- 技术实现：`.home-section-header` 加 `max-width`，`.home-section` 去 `max-width`
- 用户反馈：标题未居中（视觉上不符合预期）

**方案 C（探索后放弃）**：CSS 负边距突破（`width: 100vw; margin-left: calc(-50vw + 50%)`）
- 技术上可行，但用户选择回归简单方案

### 最终决定

首页保持 `max-width: 1400px` 居中，图片大小略小于子页面是可接受的设计差异。

---

## 六、不变的部分（零修改）

- GalleryCard.js 的懒加载逻辑（useInView）
- GalleryCard.js 的 Copy/Like/Favorite 操作逻辑
- ModelFilter.js 和 TagFilter.js 组件本身（只移动了位置）
- GalleryList.js 的所有状态管理、API 调用、URL 同步逻辑
- 所有 API services（galleryApi.js / seedanceApi.js / enhancedApi.js）
- 路由配置（App.js）
- Header 导航

---

## 七、关键经验与教训

1. **CSS 文件必须与 JS 同步检查**：JS 层的 className 修改如果 CSS 文件有硬编码覆盖（如 `height: 450px`），JS 改动完全无效。遇到样式不生效，首先检查对应 CSS 文件是否有冲突规则。

2. **CSS columns 与 React motion.div 不兼容**：CSS 瀑布流（`columns`）要求直接子元素是卡片。如果用 `motion.div` 包裹，motion.div 成为列的直接子元素，卡片变成 motion.div 的子元素，break-inside 失效。解决方案：首页用 `display: grid`，或将 motion 属性直接加到卡片组件本身。

3. **flex-shrink unset 的陷阱**：`flex-shrink: unset` 不是"不设置"，而是"重置为继承或初始值"。`flex-shrink` 的初始值是 `1`，在有 `max-height` 的 flex 列容器中，`flex-shrink: 1` 会导致子元素被压缩而非容器滚动。应显式设置 `flex-shrink: 0`。

4. **Context-aware CSS 比组件 props 更轻量**：通过 `.gallery-sidebar .tag-filter-scroll { flex-direction: column }` 这类父级选择器覆盖，可以让同一个组件在不同位置呈现不同布局，无需修改组件本身或传递 props。

5. **全屏布局的层级**：`max-width` 必须在正确的层级去掉。如果只去掉子容器的 max-width，但父容器仍有 max-width，子容器依然受限。本次 `.gallery-page` 层级是关键，移除后 `.gallery-layout`、`.gallery-sidebar`、`.gallery-main`、`.gallery-grid` 全部自动获得全宽。
