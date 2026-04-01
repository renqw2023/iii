# 首页 SplitHero 分屏布局开发日志

**日期**: 2026-04-01
**阶段**: Homepage Redesign (Demo 1 Split-Screen)

---

## 目标

将首页 Hero 改造为「左静右动」分屏布局：
- 左侧固定品牌区（暗红背景 + 品牌文字 + CTAs + 统计数字）
- 右侧垂直自动滚动图片墙（接入 srefAPI 真实数据）

SEO 无影响（title/description/og/ld+json 完整保留，仅视觉结构升级）。

---

## 涉及文件

| 文件 | 改动类型 |
|------|----------|
| `client/src/components/Home/Hero.js` | 完全重写为 SplitHero |
| `client/src/components/Home/ScrollingGallery.js` | 新建：垂直滚动图片墙 |
| `client/src/pages/Home.js` | 简化：删除下方三板块，仅保留 `<Hero />` |
| `client/src/components/Layout/HomeLayout.js` | `pathname === '/'` 时不渲染 Header / MobileDock |

---

## 实现细节

### ScrollingGallery 组件

- 数据源：`srefAPI.getPosts({ page: 1, limit: 40, sort: 'newest' })`，staleTime 10 分钟
- 布局：偶数索引 → 列 A，奇数索引 → 列 B；各列数据复制一次实现无缝循环
- 动画：列 A 70s / 列 B 90s，列 B `animation-delay: -27s`（相位偏移，避免两列同步起点）
- hover：`animation-play-state: paused` + sref code overlay 显示
- 点击：`navigate('/explore/' + post._id)`
- 顶底渐变遮罩：`linear-gradient(to bottom/top, #08000f, transparent)`
- Loading 态：6 个 Skeleton 卡片
- 性能：`will-change: transform`，`aria-hidden="true"`

### Hero.js SplitHero

**左面板（38%）**：
- 背景：`radial-gradient(ellipse at 25% 30%, rgba(160,0,70,0.55), rgba(18,0,20,0.98), #08000f)`
- III.PICS：白色渐变文字（`linear-gradient(135deg, #ffffff, #e2e8f0)`）
- 按钮一：Explore Gallery（黑底 `#0f172a` 白字）
- 按钮二：Sign In（始终显示，点击触发 `openLoginModal()`）
- Surprise Me：ghost 按钮
- 统计：2×2 网格，`useCountUp` count-up 动效，数据来自 `/api/seo/stats`

**右面板（62%）**：
- 直接渲染 `<ScrollingGallery />`，`overflow: hidden`

### HomeLayout 修改

```js
const isHome = pathname === '/';
if (isHome) return <Outlet />;
```

首页直接渲染内容，无 Header / MobileDock。登录/注册等子路由仍走原有带 Header 布局。

---

## 性能调研（Chrome DevTools Performance Trace）

| 指标 | 数值 | 评级 |
|------|------|------|
| LCP | 1077 ms | ✅ Good (< 2500ms) |
| CLS | 0.10 | ⚠️ Needs Improvement (阈值 0.1) |
| TTFB | 4 ms | ✅ 极佳 (localhost) |

### LCP 拆解

| 阶段 | 时长 |
|------|------|
| TTFB | 4 ms |
| Load delay | 806 ms ← 主要瓶颈（React bundle 解析） |
| Load duration | 49 ms |
| Render delay | 218 ms |

**LCP element**：Hero 区域内第一张可见元素（nodeId: 125）

### CLS 分析

- CLS = 0.10，恰好在「需改进」阈值边界
- 发生时间：约 806ms（页面加载中 ScrollingGallery skeleton → 真实图片切换时）
- 根因：ScrollingGallery 图片卡片 `aspectRatio: '1/1'` 在图片实际加载后可能有轻微尺寸抖动

### 改进建议（不在本次 commit 范围内）

1. **CLS 修复**：ScrollingGallery 图片加上 `width`/`height` 属性或明确 `aspectRatio`，避免图片加载后布局偏移
2. **LCP Load Delay**：806ms 是 React SPA 的 bundle 解析耗时，已通过阶段72 Code Splitting 优化；可考虑对首屏 sref 图片加 `<link rel="preload">`
3. **ThirdParties**：本地无第三方影响，生产环境需关注 Google Fonts / analytics 脚本

---

## 验证结果

| 检查项 | 结果 |
|--------|------|
| 分屏布局（左38%/右62%） | ✅ |
| 导航栏已去除 | ✅ |
| 下方三板块已去除 | ✅ |
| 右侧图片双列自动滚动 | ✅ |
| hover 暂停 + overlay | ✅ |
| 点击跳转 /explore/:id | ✅ |
| Sign In 按钮弹出 LoginModal | ✅ |
| III.PICS 白色渐变文字 | ✅ |
| Explore Gallery 黑底白字 | ✅ |
| SEO meta 不变（title/desc/og） | ✅ |
| JS console 无报错 | ✅ |

---

## Result

✅ 首页 SplitHero 改造完成，commit 已 push。
