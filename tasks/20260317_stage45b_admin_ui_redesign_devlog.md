# Stage 45b 开发日志 — Admin Panel UI 重设计

**日期**: 2026-03-17
**基于**: Stage 45（Admin Panel 初版）
**分支**: main

---

## 背景

Stage 45 完成了 Admin Panel 的功能重构（4 个 tab + KPI + 流水记录），但 UI 样式偏平，与商业级后台管理系统（Vercel、Linear、Stripe Dashboard）有明显差距。本次对全部界面进行视觉重设计。

---

## 问题清单（重设计前）

| 问题 | 影响 |
|------|------|
| 顶部 tab bar，无侧边导航 | 不像商业后台 |
| `var(--border-primary)` 不存在 | 所有 border 无效，表格无分隔线 |
| 无 loading skeleton，"Loading…" 纯文字 | 体验差 |
| 无 Header bar / 面包屑 | 缺少上下文感知 |
| KPI 卡片无视觉层次 | 数据平铺，缺乏重点 |
| 折线图无面积填充、无网格 | 视觉单薄 |
| App 原有侧边栏与 Admin 侧边栏同时显示 | 双侧边栏冲突，布局错乱 |

---

## 架构改动

### 1. `/admin` 路由脱离 `Layout`

**文件**: `client/src/App.js`

**之前**:
```jsx
<Route path="/admin" element={<AdminRoute><Layout /></AdminRoute>}>
  <Route index element={<AdminPanel />} />
</Route>
```

**之后**:
```jsx
<Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
```

**原因**: `Layout` 组件包含 app 的 `Sidebar`（MeiGen 风格侧边栏），与 Admin 自有侧边栏并排导致双侧边栏冲突。Admin Panel 作为独立布局，不需要 app 的 Header / Sidebar / MobileDock / DesktopDock 等组件。

---

## UI 重设计详情

### AdminPanel.js — 整体布局重构

**新布局结构**:
```
┌─────────────────────────────────────────────────────┐
│  Sidebar (220px fixed)    │  Main Content            │
│  ┌───────────────────┐    │  ┌───────────────────┐   │
│  │  🛡 Admin │ III.PICS│   │  │ Breadcrumb / Title│   │
│  │───────────────────│    │  │ Live · Refresh    │   │
│  │  Dashboard        │    │  │───────────────────│   │
│  │  > Overview       │    │  │                   │   │
│  │    Users          │    │  │   Tab Content     │   │
│  │    Transactions   │    │  │                   │   │
│  │    Payments       │    │  └───────────────────┘   │
│  │───────────────────│    │                          │
│  │  ← Back to App    │    │                          │
│  └───────────────────┘    │                          │
└─────────────────────────────────────────────────────┘
```

**Sidebar 细节**:
- 品牌区：渐变紫色盾牌图标 + "Admin / III.PICS" 文字
- 导航项：active 状态为 `rgba(99,102,241,0.12)` 底色 + accent 文字色
- Footer：← Back to App 链接（navigate('/')）
- 宽度固定 220px，`border-right: 1px solid var(--border-color)`

**TopBar 细节**:
- 左侧：面包屑（`Admin / 当前Tab名`）+ 大标题
- 右侧：绿色 Live 指示器 + Refresh 按钮（带旋转动画）
- Refresh 会重新加载 Overview stats，并通过 `key` prop 强制重渲染各 Tab

---

### OverviewTab.js — KPI + 图表重设计

#### KPI 卡片
- **彩色左 accent 边框** (`border-left: 3px solid ${accent}`)
- **角落光晕**: 绝对定位圆形，对应 accent 色 `0a` 透明度
- **图标背景**: `accent + '18'` 半透明色块
- **"today" 标签**: 出现在 Issued/Consumed 卡片右上角
- **Skeleton 加载态**: 3 个灰色占位块，`animate-pulse`
- **hover 微缩放**: `hover:scale-[1.01]`

#### 注册折线图（重设计）
- **面积渐变填充**: `linearGradient` 从 `#6366f1 25%` 到 `transparent`
- **网格虚线**: 3 条横向虚线，`stroke-dasharray="4,4"`
- **数据点**: 圆心 `fill=#6366f1` + 白色描边（`stroke="var(--bg-secondary)"`）
- **每日计数**: 图表下方展示每天的注册数，0 值用 tertiary 色弱化
- **右上角汇总**: 7 天总注册数 + 说明文字

#### Content Stats 侧栏
- 4 项内容指标（Posts / Prompts / Views / Likes）竖向排列
- 每项左侧彩色圆点，右侧 mono 字体数值
- 分隔线使用 `var(--border-color)`

---

### UsersTab.js — 表格 + 交互重设计

#### Filters Bar
- 整体放入带 border 的圆角卡片中
- 总用户数显示在右侧 pill 中（实时反映过滤结果）

#### 表格改进
- **表头**: `uppercase tracking-wider text-xs font-semibold`
- **行 hover**: `onMouseEnter/Leave` 直接操作 style（兼容 CSS 变量，Tailwind hover 对 CSS 变量支持有限）
- **Plan 列**: 新增 👑 **Paid**（金色，带 border）/ **Free**（灰色）badge
- **Badge 设计**: 所有 badge 加半透明 border（`#xxxx30`），提升层次感
- **Skeleton**: 8 行占位行，每格宽度各异，更真实

#### Pagination 重设计
- 数字页码按钮（最多显示 7 个，超出 `…`）
- Prev / Next 带文字标签
- active 页码用 `var(--accent-primary)` 背景

#### CreditsModal 改进
- 顶部图标 + 用户名标题区
- Grant 用蓝色，Deduct 用红色
- `backdrop-blur-sm` 遮罩

#### ActionsMenu 改进
- Delete 行 hover 用 `hover:bg-red-500/10` 红色提示
- 分隔线改用 `div` + `var(--border-color)`

---

### TransactionsTab.js — Reason 着色系统

每种 reason 独立配色：

| reason | 颜色 |
|--------|------|
| daily_checkin | #22c55e（绿） |
| register_bonus / invite_* | #8b5cf6（紫） |
| admin_grant | #3b82f6（蓝） |
| admin_deduct | #ef4444（红） |
| generate_image | #f59e0b（琥珀） |
| generate_video | #ec4899（粉） |
| img2prompt | #06b6d4（青） |
| purchase | #22c55e（绿） |

Amount 列带 `+/-` 前缀，earn 绿色，spend 红色。

---

### PaymentsTab.js — Summary Banner

顶部渐变 Banner（紫色调）显示：
- 当前页 Credits Sold 合计
- 总交易数
- "Stripe USD amount pending" 待完成提示

---

## Bug 修复

### `var(--border-primary)` → `var(--border-color)`

**影响范围**: 原版 4 个 tab 组件、AdminPanel 均使用了不存在的 CSS 变量 `--border-primary`，导致所有 border 显示为浏览器默认黑色（或直接无效）。

**修复**: 全部替换为 `var(--border-color)`（在 `theme-variables.css` 中定义）。

---

## 文件变更清单

```
client/src/App.js                                  修改（admin路由脱离Layout）
client/src/pages/AdminPanel.js                     完全重写（侧边栏布局版）
client/src/components/Admin/tabs/OverviewTab.js    完全重写（KPI+图表+侧栏）
client/src/components/Admin/tabs/UsersTab.js       完全重写（新分页+badge+skeleton）
client/src/components/Admin/tabs/TransactionsTab.js完全重写（reason着色+skeleton）
client/src/components/Admin/tabs/PaymentsTab.js    完全重写（summary banner）
```

---

## 构建结果

```
Compiled successfully.
474.19 kB  build/static/js/main.js（gzip）
Zero errors, zero warnings
```

---

## 后续优化建议

| 优先级 | 内容 |
|--------|------|
| 中 | Overview 折线图改为可切换时间范围（7d / 30d）|
| 中 | Users tab 支持列排序 |
| 低 | Transactions tab 支持 CSV 导出 |
| 低 | 添加管理员操作日志（audit log）|
