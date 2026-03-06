# 首页 Latest Content 改造：三板块预览区 开发日志

**日期**: 2026-03-06
**目标**: 将首页 Latest Content 区域从「全功能搜索/无限滚动 Sref 列表」改造为「三个紧凑预览面板」，分别展示 Sref / Gallery / Video 最新内容，并附导流链接。

---

## 一、改造背景与动机

### 问题诊断
首页原本的 Latest Content 区域存在以下问题：

1. **功能重叠**：搜索栏 + 标签筛选 + 排序 + 无限滚动，与 `/explore` 独立页面完全重复
2. **单一内容**：只展示 Sref（`/explore`），Gallery 和 Video 无法在首页被发现
3. **设计定位错误**：首页应承担「发现/导流」职责，而非「完整功能」——完整功能属于各子页
4. **加载成本高**：无限滚动默认加载 24 条，且监听滚动位置触发更多请求

### 改造目标
- 三个预览面板：Sref (8条) / Gallery (8条) / Video (4条)
- 每个面板独立标题 + 「查看全部 →」导流链接
- 三语言标题支持（ZH/EN/JA）
- 保留滚动位置恢复逻辑（从详情页返回首页时）

---

## 二、涉及文件

| 文件 | 操作类型 | 说明 |
|------|----------|------|
| `client/src/pages/Home.js` | 重构 | 移除无限滚动，添加三个预览 section |
| `client/src/i18n/modules/home.js` | 新增 key | 三组翻译 key（ZH/EN/JA） |

---

## 三、移除的内容（Home.js）

### 依赖/import 移除
| 移除项 | 原因 |
|--------|------|
| `useInfiniteQuery` | 改用简单 `useQuery` |
| `useInView` + `react-intersection-observer` | 无限滚动已移除 |
| `useState`, `useMemo`, `useCallback` | 无状态逻辑后不再需要 |
| `Search`, `SlidersHorizontal`, `Loader2`, `Sparkles` (lucide-react) | 对应 UI 已移除 |
| `APP_CONFIG` | 不再用 staleTime 常量 |

### 逻辑移除
- `searchTerm` / `debouncedSearch` 状态 + debounce effect
- `selectedTag` / `sortBy` 状态
- `useInfiniteQuery` (homeSrefs) 查询
- `useQuery` (homeSrefTags) 热门标签查询
- `allPosts` / `popularTags` useMemo 推导
- `useInView` 无限滚动触发 effect
- `handleTagSelect` callback
- Ctrl+K 快捷键 effect
- 顶层 `if (error)` 错误状态渲染

### UI 移除
- 搜索输入框（`#home-search`）
- 标签筛选栏（`tag-filter`）
- 排序下拉（`gallery-sort-select`）
- 无限滚动哨兵（`home-load-more`）
- 空状态提示（`gallery-empty`）

---

## 四、新增的内容（Home.js）

### 新增 import
```js
import { galleryAPI } from '../services/galleryApi';
import { seedanceAPI } from '../services/seedanceApi';
import GalleryCard from '../components/Gallery/GalleryCard';
import VideoCard from '../components/Seedance/VideoCard';
```

### 三个 useQuery
```js
// Sref：limit 8，按创建时间排序
const { data: srefData, status: srefStatus } = useQuery(
  ['home-sref-preview'],
  () => srefAPI.getPosts({ page: 1, limit: 8, sort: 'createdAt' }),
  { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
);

// Gallery：limit 8，按最新排序
const { data: galleryData, status: galleryStatus } = useQuery(
  ['home-gallery-preview'],
  () => galleryAPI.getPrompts({ page: 1, limit: 8, sort: 'newest' }),
  { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
);

// Video：limit 4，按最新排序（视频横幅，1行足够）
const { data: videoData, status: videoStatus } = useQuery(
  ['home-video-preview'],
  () => seedanceAPI.getPrompts({ page: 1, limit: 4, sort: 'newest' }),
  { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
);
```

### 数据解构
```js
const srefPosts      = srefData?.data?.posts || [];
const galleryPrompts = galleryData?.data?.prompts || [];
const videoPosts     = videoData?.data?.prompts || [];
const isLoading      = srefStatus === 'loading' || galleryStatus === 'loading' || videoStatus === 'loading';
```

`isLoading` 仍被 POP 导航滚动恢复 effect 依赖，确保三个数据源全部就绪后才恢复滚动位置。

### 三个 section 结构
每个 section 统一模板：
```jsx
<section className="home-section home-content-section">
  <div className="home-section-header">
    <div>
      <h2>
        <span className="gradient-text">{t('home.latestXxx.title')}</span>
        <span className="home-section-header-text"> {t('home.latestXxx.titleSuffix')}</span>
      </h2>
    </div>
    <Link to="/xxx" className="home-section-link">
      {t('home.latestXxx.viewAll')} <ArrowRight size={14} />
    </Link>
  </div>
  {xxxStatus === 'loading' ? (
    <div className="gallery-loading"><LoadingSpinner size="md" /></div>
  ) : (
    <div className="xxx-grid">
      {xxxPosts.map(item => <XxxCard key={item._id} ... />)}
    </div>
  )}
</section>
```

- Sref / Gallery：使用 `.gallery-grid`（已有 CSS，4列 masonry）
- Video：使用 `.seedance-grid`（已有 CSS，4列固定比例 16:9）

---

## 五、i18n 新增 key

在 `client/src/i18n/modules/home.js` 的三个语言块中各新增三组 key：

### ZH (`zh-CN`)
```js
latestSref:    { title: '风格参数', titleSuffix: '最新作品', viewAll: '查看全部' }
latestGallery: { title: '提示词库', titleSuffix: '最新作品', viewAll: '查看全部' }
latestVideo:   { title: 'AI 视频',  titleSuffix: '最新作品', viewAll: '查看全部' }
```

### EN (`en-US`)
```js
latestSref:    { title: 'Sref',   titleSuffix: 'Gallery', viewAll: 'View All' }
latestGallery: { title: 'Prompt', titleSuffix: 'Gallery', viewAll: 'View All' }
latestVideo:   { title: 'Video',  titleSuffix: 'Gallery', viewAll: 'View All' }
```

### JA (`ja-JP`)
```js
latestSref:    { title: 'スタイル',   titleSuffix: '最新作品', viewAll: 'すべて見る' }
latestGallery: { title: 'プロンプト', titleSuffix: '最新作品', viewAll: 'すべて見る' }
latestVideo:   { title: 'AI動画',    titleSuffix: '最新作品', viewAll: 'すべて見る' }
```

---

## 六、保留的逻辑

以下逻辑**未作任何修改**，完整保留：

| 逻辑 | 位置 | 说明 |
|------|------|------|
| `HOME_SCROLL_KEY` 常量 | `Home.js:17` | sessionStorage key |
| 实时保存滚动位置 effect | `Home.js:26-30` | scroll 事件监听 |
| POP 导航恢复滚动 effect | `Home.js:55-64` | navigationType + isLoading 联动 |
| Hero 组件 | `Home.js:68` | 不变 |
| Explore Our Collections section | `Home.js:72-109` | 三入口卡片不变 |
| `useHomeSEO()` | `Home.js:23` | SEO hook 不变 |

---

## 七、验证结果

- 首页正常加载，显示三个玻璃面板
- Sref Gallery：8 张卡片，图片正常渲染
- Prompt Gallery：8 张卡片，占位图正常（部分数据无封面图属正常）
- Video Gallery：4 张视频卡片，横幅排列
- 每个面板右上角「查看全部 →」链接存在
- DevTools 控制台：**零报错、零警告**

---

## 八、架构说明

### 首页职责划分（改造后）
```
首页
├── Hero           → 品牌宣传
├── Explore Our Collections → 三入口卡片（导流）
├── Sref Gallery   → 预览 8 条，→ /explore
├── Prompt Gallery → 预览 8 条，→ /gallery
└── Video Gallery  → 预览 4 条，→ /seedance
```

### 数据流
```
useQuery(['home-sref-preview'])    → srefAPI.getPosts()    → srefPosts[]
useQuery(['home-gallery-preview']) → galleryAPI.getPrompts() → galleryPrompts[]
useQuery(['home-video-preview'])   → seedanceAPI.getPrompts() → videoPosts[]
```

三个查询**并行发起**（React Query 默认行为），互不阻塞。`isLoading` 是三者的 OR，确保滚动恢复在全部数据就绪后触发。

### 卡片数量选择依据
| 板块 | 数量 | 依据 |
|------|------|------|
| Sref | 8 | 4列 × 2行，信息密度适中，能看出风格多样性 |
| Gallery | 8 | 同上 |
| Video | 4 | 视频卡片宽，4列 1行刚好铺满，避免页面过长 |
