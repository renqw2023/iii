# MeiGen.ai 生成记录页深度分析报告

**日期**: 2026-03-13
**分析工具**: Chrome DevTools MCP（DOM 测量 + JS 注入）
**分析页面**: https://www.meigen.ai/ → 生成记录

---

## 一、整体布局结构

### 视口与侧边栏

| 项目 | 数值 |
|------|------|
| 浏览器视口 | 1579 × 1021px |
| 侧边栏宽度 | 273px（`w-(--sidebar-width)`，CSS 变量） |
| 侧边栏定位 | `position: fixed, inset-y-0, left-0, z-10, hidden md:block` |

### 主内容容器（白色圆角卡）

这是最关键的"独立容器"——**不是全屏白背景，而是一个有圆角+毛玻璃的悬浮白卡**：

| 属性 | 值 |
|------|-----|
| 定位 | `x: 289, y: 16, width: 1274, height: 989` |
| 四边 inset | top: 16px / right: 16px / bottom: 16px / left: 289px (sidebar+16px) |
| border-radius | **22px**（`rounded-2xl`，桌面端 `md:rounded-3xl`） |
| background | `rgba(255,255,255,0.8)` + `backdrop-blur(48px)` |
| overflow | `hidden` |
| Tailwind class | `h-full flex-1 overflow-hidden rounded-2xl md:rounded-3xl bg-card/80 backdrop-blur-[48px]` |

> **核心结论**：MeiGen 的"容器"是 `position: relative`（跟随父 flex 布局），外边距 16px，圆角 22px，带毛玻璃模糊背景，**不是全屏白色**。

---

## 二、页面头部（Header Bar）

```
┌─────────────────────────────────────────────────────────┐
│  ← 返回    生成记录                     [列表] [⊞网格]    │
│  height: 56px  padding: 16px 16px 8px                   │
└─────────────────────────────────────────────────────────┘
```

| 元素 | 详情 |
|------|------|
| 返回按钮 | `← ArrowLeft` icon + "返回" 文字，`rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted` |
| 标题 | "生成记录"，`text-sm font-bold` |
| 视图切换 | 列表/网格 两个按钮，`rounded-lg bg-muted/50 p-0.5`，当前激活态加 `bg-background shadow-sm` |
| 右侧额外图标 | 三点菜单（≡）+ 网格图标（⊞） |
| 无分割线 | `border-bottom: 0px`，靠间距自然区分 |
| 总高度 | **56px** |

---

## 三、卡片区域（Scroll Container + Grid）

### 滚动容器

```
x: 289, y: 72, width: 1274, height: 933
padding: 0px 16px 80px（底部 80px 避免 dock 遮挡）
```

### 日期分组

- 文字如 "Yesterday"、"Today" 等，`text-sm`（推测），位于卡片 grid 上方

### Card Grid

```css
display: grid;
grid-template-columns: repeat(auto-fill, ~301px);  /* 实测 4列 × 301.6px */
gap: 12px;
padding: 0;
```

可用宽度计算：
```
scroll container width (1274) - padding-left (16) - padding-right (16) = 1242px
4 × 301.6 + 3 × 12 = 1206.4 + 36 = 1242.4px ✓（精确匹配4列）
```

---

## 四、卡片（Generation Card）精确规格

### 基础尺寸

| 属性 | 值 |
|------|-----|
| 宽度 | **301.6px**（随 grid auto-fill 变化） |
| 高度 | **402.2px**（aspect-ratio: 3/4，即 301.6 × 4/3） |
| border-radius | **14px**（`rounded-xl`） |
| overflow | `hidden` |
| cursor | `pointer` |
| draggable | `true`（支持拖拽！） |
| data 属性 | `data-generation-card="true"` |

### 图片原始尺寸

实测样本：`naturalWidth: 1792px, naturalHeight: 2400px`（等比 3:4 ✓）

### 卡片内部结构（4层）

```
[card] group relative rounded-xl overflow-hidden cursor-pointer
  ├── [radial-gradient overlay] absolute inset-0  ← 鼠标光源跟随效果
  ├── [bg-card fill] absolute inset-px rounded-xl ← 1px 白边衬底
  ├── [radial-gradient border] absolute inset-px  ← hover 时边框光效
  └── [content wrapper] relative overflow-hidden rounded-xl
        └── [image wrapper] relative w-full  aspect-ratio: 0.75
              ├── <img> absolute inset-0 h-full w-full object-cover
              ├── [gradient overlay] bg-gradient-to-t from-black/80 via-black/20 to-transparent
              ├── [top-left buttons] absolute left-2 top-2
              ├── [top-right button] absolute right-2 top-2
              └── [bottom overlay] absolute bottom-3 left-3 right-3
```

---

## 五、Hover 交互（完整解析）

hover 触发条件：`.group:hover` → 子元素 `opacity-0 → opacity-100`，`transition-opacity duration-300`

同时触发的背景效果：
- 黑色渐变遮罩：`bg-gradient-to-t from-black/80 via-black/20 to-transparent`
- 卡片边框光晕：`radial-gradient(200px circle at cursor, hsl(foreground/0.1), transparent)`

### 按钮区域分布

```
┌─────────────────────────────────────┐
│ [✎] [⟳] [🎬]              [🗑️]     │  ← top overlay (opacity-0 → 1)
│                                     │
│      (图片内容区域)                  │
│                                     │
│ □3:4  ⊙2K  [↺ 使用创意]  [⊞][↓][↗] │  ← bottom overlay (translateY(8px)→0)
└─────────────────────────────────────┘
```

### 完整按钮列表（8个 + 1个主CTA）

#### 左上角 3 个按钮（`absolute left-2 top-2, gap: 6px`）

| # | 图标 | 功能推断 |
|---|------|---------|
| 1 | `lucide-pencil` ✎ | **编辑/修改 Prompt** — 用当前图片 prompt 打开编辑 |
| 2 | 自定义圆形箭头 SVG ⟳ | **重新生成** — 用相同参数重新生成一张图 |
| 3 | `lucide-clapperboard` 🎬 | **生成视频** — 将该图转为 Seedance 视频任务 |

#### 右上角 1 个按钮（`absolute right-2 top-2`）

| # | 图标 | 功能 |
|---|------|------|
| 4 | `lucide-trash2` 🗑️ | **删除记录** — 删除该生成记录 |

#### 底部信息栏（`absolute bottom-3 left-3 right-3`，从 translateY(8px) 升起）

**左侧信息**（白色小字，`text-xs text-white/80`）：
- `□ 3:4`（RectangleHorizontal icon + 比例）
- `⊙ 2K`（分辨率标识）

**主 CTA 按钮**（白底黑字，prominent）：
```
[↺ 使用创意]
```
- `lucide-repeat2` icon + "使用创意"
- 样式：`bg-white text-black rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-white/90`
- 功能：将该图的 prompt 填入右侧生成面板并聚焦，**一键复用历史创意**

**右侧 3 个图标按钮**（`rounded-lg bg-foreground/10 p-2 backdrop-blur-md`）：

| # | 图标 | 功能 |
|---|------|------|
| 5 | `lucide-layers` ⊞ | **添加到收藏/图层** — 收藏到个人 Gallery |
| 6 | `lucide-arrow-down-to-line` ↓ | **下载图片** |
| 7 | `lucide-share2` ↗ | **分享** — 复制链接或分享到社交媒体 |

### Hover 动画时序

```
0ms    → mouseenter 触发
0-300ms → opacity: 0 → 1（所有按钮区域）
           transform: translateY(8px) → translateY(0)（底部栏）
           radial-gradient 跟随鼠标位置（JS mousemove）
```

---

## 六、与我们的实现对比

### 已实现

| 功能 | 状态 |
|------|------|
| 导航到 /generate-history | ✅ |
| 面板保持打开（左内容+右面板） | ✅ |
| SVG 圆环进度 | ✅ |
| 日期分组 | ✅ |
| DB 持久化 | ✅ |
| 下载图片 | ✅ |
| 复制 URL | ✅ |

### 与 MeiGen 的差距（待实现）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 容器改为 `inset-4 rounded-3xl bg-white/80 backdrop-blur` | 🔴 高 | 目前是全屏白色，应改为悬浮白卡 |
| hover → 黑色渐变遮罩 | 🔴 高 | `bg-gradient-to-t from-black/80` |
| **使用创意**按钮 | 🔴 高 | 将 prompt 填回右侧面板并切换到 Generate 标签 |
| 左上角编辑/重生成/视频按钮 | 🟡 中 | 编辑 prompt、重新生成、转视频 |
| 右上角删除按钮 | 🟡 中 | 删除单条生成记录 |
| 底部 aspect ratio + 分辨率信息 | 🟡 中 | 小字信息展示 |
| 收藏（Layers）按钮 | 🟡 中 | 添加到收藏夹 |
| 分享按钮 | 🟢 低 | 复制/分享链接 |
| 拖拽支持 | 🟢 低 | `draggable="true"` |
| 列表/网格切换 | 🟢 低 | 头部视图切换按钮 |
| Header 视图切换图标（≡ ⊞） | 🟢 低 | 右上角 |
| 容器 border-radius 22px | 🔴 高 | 整体改为 inset 16px 悬浮卡 |

---

## 七、关键像素值总结（供开发直接使用）

```
主容器:
  inset: 16px（四边）
  border-radius: 22px (md: rounded-3xl → 24px)
  background: rgba(255,255,255,0.8) backdrop-blur-[48px]

Header:
  height: 56px
  padding: 16px 16px 8px

Scroll area padding: 0px 16px 80px

Card grid:
  gap: 12px
  columns: repeat(auto-fill, minmax(~300px, 1fr))

Card:
  border-radius: 14px
  aspect-ratio: 按生成比例（3:4 默认）
  hover transition: 300ms opacity + translateY(8px)

Bottom overlay buttons:
  bg: foreground/10 (rgba(0,0,0,0.1)) backdrop-blur-md
  padding: 8px (p-2)
  border-radius: 8px (rounded-lg)

"使用创意" CTA:
  bg: white, color: black
  padding: 6px 12px (px-3 py-1.5)
  border-radius: 8px
  font: text-xs font-medium
```
