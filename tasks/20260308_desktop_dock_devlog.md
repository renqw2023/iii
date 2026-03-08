# 阶段27（续）— 桌面底部浮动导航 DesktopDock 开发日志

**日期**: 2026-03-08
**关联日志**: `20260308_sidebar_stage27_devlog.md`（侧边栏完整文档）

---

## 一、问题背景

阶段27 引入全局侧边栏后，Layout 路由在桌面端会隐藏顶部 Header（`md:hidden`）。
这导致 `/explore`、`/gallery`、`/seedance` 三个内容页在桌面端**没有页面间导航入口**：

- 用户在 /explore，想去 /gallery → 无法通过任何可见 UI 跳转
- 侧边栏 Nav 仅提供：Home / Search / History / Favorites
- 缺少内容页横向跳转 + Img2Prompt 工具入口

**参考**：MeiGen.ai 在这三个页面桌面端底部中央放置一个浮动胶囊导航（5个图标）。

---

## 二、解决方案

新建 `DesktopDock` 组件，固定在桌面端所有 Layout 路由页面底部中央。

---

## 三、组件设计

### 文件路径
`client/src/components/UI/DesktopDock.js`

### 导航项（5个）

| 图标 | 路由 | 说明 |
|------|------|------|
| `Home` | `/` | 首页 |
| `Layers` | `/explore` | Sref 样式库（对标 MeiGen 的 stack 图标） |
| `Image` | `/gallery` | AI Prompt 画廊 |
| `Clapperboard` | `/seedance` | Seedance 视频提示词 |
| `Sparkles` | `/img2prompt` | 图生提示词（AI工具） |

### 样式规格

```
位置：fixed, bottom: 20px, left: 50%, translateX(-50%), z-index: 50
显示：hidden md:flex（仅桌面端）
尺寸：自适应内容宽度，每个图标按钮 44×44px
圆角：borderRadius: 18px（胶囊感）
背景：var(--bg-secondary) + backdrop-blur(20px)
边框：1px solid var(--border-color)
阴影：0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)
```

### 图标按钮规格

```
尺寸：44×44px
圆角：12px
激活态背景：var(--gallery-filter-active-bg) ≈ rgba(99,102,241,0.10)
激活态颜色：var(--accent-primary) = #6366f1
静止态颜色：var(--text-tertiary)
悬停背景：var(--gallery-filter-hover-bg) ≈ rgba(0,0,0,0.05)
激活 strokeWidth：2.2（加粗显示）
静止 strokeWidth：1.8
```

### Active 状态逻辑

```js
const active = exact
  ? location.pathname === to        // 首页精确匹配
  : location.pathname.startsWith(to) // 其他页前缀匹配
```

---

## 四、Layout.js 改动

```jsx
// 新增 import
import DesktopDock from '../UI/DesktopDock';

// main 加底部 padding 避免被 Dock 遮挡
<main className="flex-1 pb-safe-bottom md:pb-20">

// 在 MobileDock 之后添加
<DesktopDock />
```

---

## 五、响应式行为

| 断点 | DesktopDock | MobileDock |
|------|-------------|------------|
| `< md`（手机/平板）| `display: none` | `display: flex` |
| `≥ md`（桌面）| `display: flex` | `display: none` |

两者互斥，不会同时显示。

---

## 六、验证结果

| 测试项 | 结果 |
|--------|------|
| /explore：Layers 图标高亮 | ✅ |
| /gallery：Image 图标高亮 | ✅ |
| /seedance：Clapperboard 图标高亮 | ✅ |
| /history：无图标高亮（history 不在dock） | ✅ |
| 胶囊居中定位 | ✅ |
| 内容底部 padding 避免遮挡 | ✅ |
| 移动端 MobileDock 不受影响 | ✅ |
| console 零错误 | ✅ |

---

## 七、后续优化（待开发）

见下一阶段计划文档（MeiGen UI 深度复刻分析）。
