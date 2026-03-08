# 阶段27 — 全局侧边栏完整开发日志

**日期**: 2026-03-08
**目标**: 对标 MeiGen.ai，在桌面端引入左侧固定侧边栏导航，替代顶部 Header

---

## 一、需求背景

III.PICS 此前桌面端只有顶部 Header 导航，移动端有底部 MobileDock。
对标 MeiGen.ai 截图后，计划在桌面端引入：

- Logo + 折叠/展开按钮
- 主导航（Home / Search / History / Favorites）
- 页面专属过滤面板（Explore / Gallery / Seedance）
- 底部用户头像 + Credits 胶囊

---

## 二、最终架构（第3次迭代后定稿）

```
SidebarContext.js          → collapsed 状态 + SidebarPanel 注入接口
Sidebar.js                 → 纯壳（Header / Nav / {Panel} / Bottom）
components/Sidebar/
  DefaultPanel.js          → 普通页：Tags 手风琴 + Recent Updates
  ExplorePanel.js          → Search + Style Tags (动态) + Sort
  GalleryPanel.js          → Search + Model + Style + Sort
  SeedancePanel.js         → Search + Category (动态) + Sort
components/Layout/
  Layout.js                → 桌面端 flex-row，左侧 Sidebar + 右侧内容
  HomeLayout.js            → 首页专用，无侧边栏，保留顶部 Header
App.js                     → 路由分组：HomeLayout / Layout
```

**Panel 注入机制（核心设计）：**
```js
// 页面只需一行注册自己的 Panel
useSidebarPanel(ExplorePanel);  // mount 注册，unmount 自动清除
```

```js
// SidebarContext 内部实现
export const useSidebarPanel = (Panel) => {
  const { setSidebarPanel } = useSidebar();
  useEffect(() => {
    setSidebarPanel(() => Panel);  // 函数形式，避免被当作 setState updater
    return () => setSidebarPanel(null);
  }, []);
};
```

---

## 三、迭代过程（3次）

### 迭代 1：初始实现

**实现内容：**
- `SidebarContext.js`：collapsed + localStorage 持久化
- `Sidebar.js`：单一组件，路由感知条件渲染
- `Layout.js`：flex-row，桌面侧边栏 + 内容区
- `App.js`：SidebarProvider wrap

**问题：**
首页也出现全局侧边栏，用户反馈不希望首页有侧边栏。

---

### 迭代 2：HomeLayout + 两侧边栏问题

**修复：**
- 新建 `HomeLayout.js`（无侧边栏，保留 Header），首页路由切换到 HomeLayout
- `/explore`、`/gallery`、`/seedance` 原本有自己的 `.gallery-sidebar` filter 面板

**新问题：**
用户指出"两个侧边栏很奇怪" — 全局 Sidebar（240px）+ 页面 filter Sidebar（240px）= 480px 空间浪费严重，UI 混乱。

**错误方向尝试：**
- 尝试在全局侧边栏上用路由检测隐藏 Tags 块（`isFilterPage` 条件）→ 治标不治本
- 尝试把三个页面移回 HomeLayout，让页面自己的 filter sidebar 单独工作 → 用户否定

**用户明确需求：**
> "将 explore/gallery/seedance 原有的侧边栏替换成 MeiGen 的侧边栏，并将每个页面的功能整合进去，不要之前存在的侧边栏。"

---

### 迭代 3：Sidebar 壳 + 页面专属 Panel（定稿）

**用户确认方向：**
> "按照：Sidebar 壳 + 页面专属 Panel 这个思路来。"

**实现：**

1. **SidebarContext.js 升级**：新增 `SidebarPanel` state + `setSidebarPanel` + `useSidebarPanel` hook

2. **Sidebar.js 精简为纯壳**：
   - 只保留 Header（Logo + 折叠按钮）、Nav（4个导航项）、`{Panel && <Panel />}`、Bottom（邀请卡 + 用户行）
   - Panel 由各页面动态注入，默认为 DefaultPanel

3. **4个独立 Panel 组件**（各自完全独立设计）：
   - `DefaultPanel`：Tags 手风琴导航，链接到 `/explore?tag=X`
   - `ExplorePanel`：Search 输入框（防抖300ms）+ 所有 Sref Tags（动态 API + 滚动）+ Sort 下拉
   - `GalleryPanel`：Search + 3种 Model 单选 + 10种 Style 单选 + Sort 下拉
   - `SeedancePanel`：Search + Category 列表（动态 API + 计数）+ Sort 下拉

4. **Filter 状态统一走 URL searchParams**：
   - Panel 写入 searchParams → 页面读取 searchParams → API 查询
   - 无需额外 Context 传递过滤状态，URL 本身就是 single source of truth

5. **三个内容页简化**：
   - 删除页面内部的 `<aside class="gallery-sidebar">` 完整代码块
   - 删除 `sidebarOpen` state、filter 同步 useEffect、本地 filter state
   - 只保留数据获取（从 searchParams 读）+ 内容渲染

---

## 四、路由分组最终结构

```
HomeLayout（无全局侧边栏，有顶部 Header）
  /                     首页
  /login                登录
  /register             注册
  /verify-email         邮箱验证
  /forgot-password      忘记密码
  /reset-password       重置密码
  /magic-link/verify    Magic Link 验证

Layout（全局侧边栏，桌面端隐藏顶部 Header）
  /explore              Sref 样式库（ExplorePanel）
  /gallery              AI Prompt 画廊（GalleryPanel）
  /seedance             Seedance 视频（SeedancePanel）
  /history              浏览历史（DefaultPanel）
  /post/:id             帖子详情（DefaultPanel）
  /user/:id             用户主页（DefaultPanel）
  /about /help /privacy /terms /contact /health
  /img2prompt           图生提示词（DefaultPanel）

ProtectedRoute > Layout（需登录）
  /dashboard /create /favorites /settings /notifications /credits

AdminRoute > Layout（需管理员）
  /admin
```

---

## 五、各侧边栏功能详情

### DefaultPanel（普通页）
- Categories 标题
- Tags 手风琴（展开/折叠），动态从 `srefAPI.getPopularTags(8)` 取前6个
- 点击 tag → navigate(`/explore?tag=X`)，当前 tag active 高亮
- Recent Updates → `/explore?sort=createdAt`

### ExplorePanel（/explore）
- **Search**：防抖输入框，300ms 后写 `?q=`
- **Style Tags**：`srefAPI.getPopularTags(40)` 动态列表，含数量，可滚动（max-h-64）
- **Sort**：Newest / Most viewed

### GalleryPanel（/gallery）
- **Search**：防抖输入框，写 `?q=`
- **Model**：All 🔥 / NanoBanana Pro 🍌 / GPT Image 🤖，写 `?model=`
- **Style**：10个预设标签（photography / cinematic / anime / 3d-render 等），写 `?tag=`
- **Sort**：Newest / Most liked / Trending

### SeedancePanel（/seedance）
- **Search**：防抖输入框，写 `?q=`
- **Category**：`seedanceAPI.getCategories()` 动态列表，含计数，可滚动（max-h-52），写 `?category=`
- **Sort**：Newest / Most liked / Trending

---

## 六、Sidebar 壳细节

| 区域 | 内容 | 折叠态 |
|------|------|--------|
| Header | Logo（SVG动画）+ ChevronLeft/Right 按钮 | 仅 ChevronRight |
| Nav | Home / Search / History / Favorites | 仅图标 + title tooltip |
| Panel | 页面专属组件 | 隐藏（!collapsed） |
| Invite Card | 渐变边框（padding-box trick），仅非 filter 页 | 隐藏 |
| User Row | 头像（→ /dashboard）+ Credits 胶囊（→ /credits）| 仅头像 |

**渐变边框 CSS trick：**
```css
background: linear-gradient(var(--bg-secondary), var(--bg-secondary)) padding-box,
            linear-gradient(135deg, #f472b6, #6366f1) border-box;
border: 1px solid transparent;
```

**Credits 胶囊：**
```jsx
style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)',
         borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600 }}
```

---

## 七、响应式策略

| 断点 | 布局 |
|------|------|
| `< md`（< 768px）| HomeLayout / Layout 均隐藏全局 Sidebar，显示移动端 Header + MobileDock |
| `≥ md`（≥ 768px）| 全局 Sidebar 可见，Header 隐藏（md:hidden） |

---

## 八、已知问题 & 后续

### 问题（本次发现）
**桌面端 /explore、/gallery、/seedance 无页面间导航入口**
由于这三页隐藏了顶部 Header，用户在桌面端无法通过 Header 导航栏跳转到其他内容页（如从 /explore 到 /gallery）。
侧边栏 Nav 仅提供 Home / Search / History / Favorites，缺少内容页横向跳转。

**MeiGen 的解法**：在这三个页面桌面端底部中央显示一个浮动胶囊导航条（5个图标：首页 / 历史 / Styles / Video / AI工具），让用户随时跳转。

### 后续优先级
1. **底部浮动导航（桌面端 filter 页专用）** — 待实现，见分析
2. STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET 配置并重启 server
3. 移动端侧边栏抽屉（swipe-to-open）

---

## 九、验证结果

| 测试项 | 结果 |
|--------|------|
| 首页：无全局侧边栏，顶部 Header 正常 | ✅ |
| /explore：ExplorePanel 渲染，Filter 写 URL，内容响应 | ✅ |
| /gallery：GalleryPanel 渲染，Model/Style/Sort 过滤正常 | ✅ |
| /seedance：SeedancePanel 渲染，Category 动态加载，Sort 正常 | ✅ |
| /history（DefaultPanel）：Tags 手风琴，跳转 /explore | ✅ |
| 侧边栏折叠 64px / 展开 240px，动画流畅 | ✅ |
| localStorage 持久化，刷新恢复折叠状态 | ✅ |
| 移动端（375px）：侧边栏隐藏，Header + Dock 正常 | ✅ |
| Panel 切换路由自动注销/注册，无内存泄漏 | ✅ |
| Console 错误/警告 | ✅ 零 |
