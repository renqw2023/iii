# 阶段27 — MeiGen 侧边栏复刻 开发日志

**日期**: 2026-03-07
**阶段**: 27
**目标**: 对标 MeiGen.ai 左侧固定侧边栏，桌面端引入折叠/展开导航面板

---

## 背景

III.PICS 此前桌面端仅有顶部 Header 导航，移动端有底部 MobileDock。
对标 MeiGen.ai 截图，需要在桌面端实现左侧固定侧边栏，覆盖：
- Logo + 折叠/展开按钮
- 主导航（Home / Search / History / Favorites）
- Categories > Tags 手风琴（真实标签数据）
- Recent Updates 快捷入口
- 渐变边框邀请卡
- 底部用户头像 + Credits 胶囊按钮

---

## 新增 / 改动文件

### 1. `client/src/contexts/SidebarContext.js` ← 新建

提供 `collapsed` / `toggleCollapsed` 给整个应用：

```js
export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  );
  const toggleCollapsed = () => setCollapsed(v => {
    const next = !v;
    localStorage.setItem('sidebar-collapsed', String(next));
    return next;
  });
  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};
```

- 折叠状态写入 `localStorage`，刷新后恢复
- `useSidebar()` hook 供子组件消费

---

### 2. `client/src/components/Layout/Sidebar.js` ← 新建（核心）

**尺寸**: 展开 240px / 折叠 64px，`transition: width 0.25s ease`
**背景**: `var(--bg-secondary)`，右边框 `1px solid var(--border-color)`

#### 数据来源（复用已有 react-query cache）

| 数据 | API | Query Key |
|------|-----|-----------|
| 用户积分 | `creditsAPI.getBalance()` | `['credits-balance']` |
| 热门标签 | `srefAPI.getPopularTags(8)` 取前6个 | `['sref-tags']` |

#### 路由感知（避免与页面自身 filter sidebar 重复）

在 `/explore`、`/gallery`、`/seedance` 路由下，自动隐藏 **Categories/Tags 手风琴**和 **Recent Updates** 项，因为这些页面有专属的过滤器侧边栏。其他路由正常显示完整导航。

#### 结构

```
Sidebar (240px / 64px)
├── Header: Logo + ChevronLeft/Right collapse button
├── Scrollable nav area
│   ├── Home → /
│   ├── Search → openSearch()
│   ├── History → /history
│   ├── Favorites → /favorites (未登录 → openLoginModal)
│   └── [非过滤页] Categories section
│       ├── Tags accordion (默认展开，tagsOpen state)
│       │   ├── All → /explore
│       │   └── tag1..6 → /explore?tag=X (active 高亮跟随 URL)
│       └── Recent Updates → /explore?sort=createdAt
└── Bottom section
    ├── [非折叠 + 非过滤页] Gradient border invite card
    └── User row
        ├── Avatar (→ /dashboard)
        └── [非折叠] "⚡N" Credits 胶囊按钮 (→ /credits)
```

#### 渐变边框邀请卡 CSS trick

```jsx
style={{
  background: `linear-gradient(var(--bg-secondary), var(--bg-secondary)) padding-box,
               linear-gradient(135deg, #f472b6, #6366f1) border-box`,
  border: '1px solid transparent',
}}
```

#### Credits 胶囊按钮样式

```jsx
style={{
  backgroundColor: 'var(--text-primary)',
  color: 'var(--bg-primary)',
  borderRadius: 20,
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 600,
}}
```

---

### 3. `client/src/components/Layout/Layout.js` ← 重写

从单列 `flex-col` 改为双列 `flex-row` 布局：

```jsx
<div className="flex min-h-screen">
  {/* Desktop sidebar — hidden on mobile */}
  <div className="hidden md:block sticky top-0 h-screen flex-shrink-0 overflow-hidden"
       style={{ width: collapsed ? 64 : 240, transition: 'width 0.25s ease' }}>
    <Sidebar />
  </div>

  {/* Main content */}
  <div className="flex-1 flex flex-col min-w-0 min-h-screen">
    <div className="md:hidden"><Header /></div>  {/* Mobile only */}
    <main className="flex-1 pb-safe-bottom md:pb-0"><Outlet /></main>
    <Footer />
  </div>

  <MobileDock />  {/* Already has md:hidden */}
</div>
```

**关键点**：
- 桌面端 Header 隐藏（`md:hidden`），由侧边栏替代
- 移动端保持原有 Header + MobileDock

---

### 4. `client/src/components/Layout/HomeLayout.js` ← 新建

首页专用布局，无全局侧边栏（保留完整 Header）：

```jsx
const HomeLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1 pb-safe-bottom"><Outlet /></main>
    <Footer />
    <MobileDock />
  </div>
);
```

---

### 5. `client/src/App.js` ← 改

- 引入 `SidebarProvider`，包裹在 `<ThemeProvider>` 内
- 首页路由（`/` index）改用 `HomeLayout`，其余路由继续用 `Layout`

```jsx
<ThemeProvider>
  <SidebarProvider>
    <AuthProvider>
      ...
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<Home />} />
        ...
      </Route>
      <Route path="/" element={<Layout />}>
        <Route path="explore" ... />
        <Route path="gallery" ... />
        ...
      </Route>
```

---

## 路由与侧边栏对应关系

| 路由 | 布局 | 全局侧边栏 | 页面内 filter sidebar |
|------|------|------------|----------------------|
| `/` | HomeLayout | ❌ 无 | ❌ 无 |
| `/explore` | Layout | ✅ Nav only (无Tags块) | ✅ Filters (Search/Tags/Sort) |
| `/gallery` | Layout | ✅ Nav only (无Tags块) | ✅ Filters (Search/Model/Style/Sort) |
| `/seedance` | Layout | ✅ Nav only (无Tags块) | ✅ Filters (Search/Category/Sort) |
| `/dashboard` | Layout | ✅ 完整（含Tags） | ❌ 无 |
| `/history` | Layout | ✅ 完整（含Tags） | ❌ 无 |
| 其他 | Layout | ✅ 完整（含Tags） | ❌ 无 |

---

## 验证结果

| 测试项 | 结果 |
|--------|------|
| 桌面展开 240px | ✅ Logo + 完整nav + Tags手风琴 + 邀请卡 + Credits |
| 点 ❮ 折叠 64px | ✅ 流畅动画，仅图标，内容区自然扩展 |
| localStorage 持久化 | ✅ `sidebar-collapsed` 正确读写 |
| 刷新恢复折叠状态 | ✅ |
| 移动端 375px | ✅ 侧边栏隐藏，顶部Header + MobileDock正常 |
| Home 全幅无侧边栏 | ✅ |
| /explore Tags块隐藏 | ✅ |
| Tags手风琴折叠/展开 | ✅ |
| 点击tag → /explore?tag=X | ✅ URL同步，active高亮 |
| Console JS错误 | ✅ 零错误 |

---

## 已知限制 / 后续

- 折叠态（64px）的邀请卡和 Sign In 按钮隐藏（折叠时空间不足）
- Tags 仅取前6个（`getPopularTags(8).slice(0,6)`）
- 侧边栏暂不支持移动端抽屉（swipe-to-open）— 保留移动端原有 Header + Dock 方案
