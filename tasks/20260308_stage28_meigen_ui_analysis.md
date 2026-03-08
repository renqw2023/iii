# 阶段28 — MeiGen UI 深度分析 & 100% 复刻开发计划

**日期**: 2026-03-08
**分析对象**: https://www.meigen.ai/
**分析方法**: Chrome DevTools 实时抓取 DOM / CSS / 截图

---

## 一、分析结论：4个核心 UI 差距

| 差距项 | MeiGen | III.PICS 现状 | 优先级 |
|--------|--------|--------------|--------|
| 头像点击 Dropdown | 完整用户菜单弹窗 | 仅跳转 /dashboard | 🔴 高 |
| 积分按钮弹窗 | 定价 Modal（4套餐） | 跳转 /credits 页 | 🔴 高 |
| DesktopDock 样式 | rounded-2xl + shadow-2xl + border | rounded-18px（已接近） | 🟡 中 |
| 导航链接 hover 样式 | hover:bg-muted-active transition | 缺少 transition | 🟢 低 |

---

## 二、头像 Dropdown 详细规格

### 截图位置
侧边栏底部左侧，点击头像字母按钮触发

### DOM 结构（完整复刻）

```
Trigger: button.h-10.w-10.rounded-lg
  data-[state=open]:bg-muted-active
  hover:bg-muted-active
  transition-transform duration-300
  Avatar: h-7 w-7 rounded-full
    bg-foreground text-background text-xs font-medium (fallback)
    group-hover:scale-105 transform duration-200

Menu Content: w-[245px] rounded-xl bg-background p-1.5 shadow-lg border border-border
  Placement: data-side="top" data-align="start" (向上弹出，左对齐)

─── 菜单结构 ───────────────────────────────────────────────

[用户头像区] h-auto px-3 py-2
  Avatar h-9 w-9 rounded-full bg-foreground text-background
  Column:
    username  text-sm font-medium truncate
    email     text-xs text-muted-foreground truncate

[分隔线] -mx-1 h-px bg-border my-1

[菜单项] flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm
  hover:bg-muted-active transition-colors cursor-default
  Icon: lucide icon size-4 text-muted-foreground
  Label: text-sm

菜单项列表（MeiGen）:
  - Headset icon     "联系我们"     (submenu →)
  - Book icon        "文档"         (submenu →)
  - Globe icon       "语言设置"     (submenu →)
  - Key icon         "API 密钥"     (button)
  - GitHub icon      "GitHub"       (link → external)
  - Scale icon       "法律条款"     (submenu →)
  [分隔线]
  - LogOut icon      "退出登录"     (button, text-destructive)

菜单项列表（III.PICS 对应）:
  - LayoutDashboard  "Dashboard"    → /dashboard
  - Settings         "设置"         → /settings
  - Clock            "浏览历史"     → /history
  - Heart            "收藏"         → /favorites
  - HelpCircle       "帮助"         → /help
  [分隔线]
  - LogOut           "退出登录"     红色 text-red-500
```

### 实现要点

```jsx
// 使用 Headless UI / 自研 Dropdown（无 Radix）
// 用 useRef + useState + useEffect(outside click) 实现
// 向上弹出：bottom: 100% + margin-bottom: 8px
// 动画：opacity 0→1 + translateY(8px)→translateY(0)，150ms ease-out

const avatarMenu = (
  <div className="absolute bottom-full mb-2 left-0 w-[245px]
       rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]
       shadow-lg p-1.5 z-[200]
       animate-in fade-in slide-in-from-bottom-2 duration-150">
    {/* User header */}
    <div className="flex items-center gap-3 px-3 py-2">
      <Avatar size={36} />
      <div className="flex flex-col overflow-hidden">
        <span className="text-sm font-medium truncate">{user.name}</span>
        <span className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</span>
      </div>
    </div>
    <Divider />
    {/* Menu items */}
    <MenuItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
    <MenuItem icon={Settings} label="设置" to="/settings" />
    <MenuItem icon={Clock} label="浏览历史" to="/history" />
    <MenuItem icon={Heart} label="收藏" to="/favorites" />
    <MenuItem icon={HelpCircle} label="帮助" to="/help" />
    <Divider />
    <MenuItem icon={LogOut} label="退出登录" onClick={logout} danger />
  </div>
);
```

---

## 三、积分弹窗（Credits Modal）详细规格

### 触发方式
点击底部 "增加点数 ⚡80" 按钮 → 全屏 Modal

### DOM 结构（完整复刻）

```
Overlay: fixed inset-0 bg-black/50 z-50 (点击关闭)

Dialog: fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
  max-w-[1300px] max-h-[90vh] w-[95vw]
  rounded-3xl bg-white dark:bg-neutral-950
  border-none shadow-lg p-0 overflow-visible

Close Button: absolute -right-14 top-0
  h-10 w-10 rounded-xl bg-neutral-500/50 backdrop-blur-md text-white
  hover:bg-neutral-500/70
  Icon: X size-5

─── Dialog 内容区 ──────────────────────────────────────────

Header: relative rounded-xl p-6 bg-muted/30 overflow-hidden
  Background: radial-gradient mesh（紫/橙/蓝渐变）
  Title: "一次付款，永久有效" text-[32px] font-semibold text-center
  Subtitle: text-base text-muted-foreground text-center

Plan Grid: mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4

─── Plan Card 规格 ──────────────────────────────────────────

Card: rounded-[24px] border overflow-hidden
  transition-transform hover:-translate-y-1 duration-200
  bg-[#F9F9F9] dark:bg-neutral-900
  border-[#E3E3E3] dark:border-neutral-700
  (Pro card: 特殊 gradient border)

Card 内部: p-6

  Plan Name: font-bold text-[24px] text-[#252525]
  Subtitle:  text-sm text-[#6b7280]
  Price:     text-[40px] font-semibold (¥ 符号 text-[28px])
  Price sub: text-[11px] text-[#6b7280]

  积分说明: text-base font-semibold text-[#1f2937]

  CTA Button:
    Free:    h-11 border rounded-xl text-[#919191] "当前套餐"（不可点）
    Starter: h-11 rounded-xl bg-foreground text-background "选 Starter"
    Pro:     h-11 rounded-xl bg-gradient (特殊) "选 Pro"
    Ultimate:h-11 rounded-xl bg-foreground text-background "选 Ultimate"

  Features: gap-2.5, flex items-start
    ✓ Icon: lucide Check size-4 text-green-500
    Text: text-sm text-[#525252]
```

### III.PICS 对应套餐设计

```
Free    → ¥0    / 每日 40 积分 / 基础功能
Starter → ¥79   / 1000 积分   / 解锁历史记录
Pro     → ¥159  / 2200 积分   / 优先队列 + 批量
Ultimate→ ¥399  / 5000 积分   / 全功能 + 4K
```

---

## 四、DesktopDock 样式升级规格

### MeiGen 实测值（与 III.PICS 对比）

| 属性 | MeiGen | III.PICS 现状 | 需改 |
|------|--------|--------------|------|
| 容器高度 | h-16 (64px) | py-2 (auto) | ✅ 改 |
| 圆角 | rounded-2xl (16px) | borderRadius:18 | 接近 |
| 边框 | border-foreground/10 | border-color var | ✅ 改 |
| 阴影 | shadow-2xl | 自定义 shadow | ✅ 改 |
| 图标尺寸 | 40×40px | 44×44px | 微调 |
| 图标圆角 | rounded-lg (8px) | borderRadius:12 | 接近 |
| 图标背景 | bg-muted/30 | transparent(非激活) | ✅ 改 |
| 图标悬停 | hover:bg-muted/50 | var(--gallery-filter-hover-bg) | 统一 |
| 激活态 | bg-muted/30 (轻微) | var(--gallery-filter-active-bg) | 保留 |
| 间距 | gap-4 px-4 | gap-1 px-2 | ✅ 改 |

### img2prompt 自定义 SVG（MeiGen 原版）

```jsx
// MeiGen 的 Sparkles 是自定义双星图标，不是 lucide Sparkles
<svg viewBox="0 0 20 20" fill="none">
  {/* 大星 */}
  <path d="M11.8525 4.21651L11.7221 3.2387C11.6906 3.00226 11.4889 2.82568
   11.2504 2.82568C11.0118 2.82568 10.8102 3.00226 10.7786 3.23869L10.6483
   4.21651C10.2658 7.0847 8.00939 9.34115 5.14119 9.72358L4.16338 9.85396
   C3.92694 9.88549 3.75037 10.0872 3.75037 10.3257C3.75037 10.5642 3.92694
   10.7659 4.16338 10.7974L5.14119 10.9278C8.00938 11.3102 10.2658 13.5667
   10.6483 16.4349L10.7786 17.4127C10.8102 17.6491 11.0118 17.8257 11.2504
   17.8257C11.4889 17.8257 11.6906 17.6491 11.7221 17.4127L11.8525 16.4349
   C12.2349 13.5667 14.4913 11.3102 17.3595 10.9278L18.3374 10.7974
   C18.5738 10.7659 18.7504 10.5642 18.7504 10.3257C18.7504 10.0872 18.5738
   9.88549 18.3374 9.85396L17.3595 9.72358C14.4913 9.34115 12.2349 7.0847
   11.8525 4.21651Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  {/* 小星 */}
  <path d="M4.6519 14.7568L4.82063 14.2084..." stroke="currentColor" strokeWidth="1.5"/>
</svg>
```

---

## 五、导航链接 Hover 样式规格

### MeiGen 实测

```css
/* 所有交互元素统一 */
.nav-item {
  transition: colors 150ms;
}
.nav-item:hover { background: var(--muted-active); }  /* rgba(0,0,0,0.06) */
.nav-item:focus { background: var(--accent); color: var(--accent-foreground); }
.nav-item[data-active="true"] { background: var(--muted-active); }
```

### 菜单项样式（Dropdown menu items）

```
hover:bg-muted-active
focus:bg-accent focus:text-accent-foreground
transition-colors duration-150
rounded-lg px-3 py-1.5 gap-3
Icon: text-muted-foreground size-4
```

---

## 六、Img2Prompt 右侧面板（最大亮点）

### MeiGen 设计解析

```
Right Sidebar: fixed top-4 bottom-4 right-4 z-40
  width: var(--right-sidebar-width)  ≈ 400px
  transition-transform duration-200 ease-out
  slide-in: translate-x-[calc(100%+1rem)] → translate-x-0

Container: rounded-3xl bg-card/95 p-4 backdrop-blur-sm flex flex-col h-full

Header: mb-4 flex items-center justify-between px-2
  "生成" h2 text-base font-semibold
  Close: rounded-lg p-1.5 hover:bg-muted PanelRight icon

Section 1 — 反推提示词 入口卡:
  h-16 rounded-xl bg-muted/50 hover:bg-muted/70 cursor-pointer px-3
  Left: image icon (size-3.5) + "反推提示词" text-sm font-medium
                              + "拖拽图片反推画面描述" text-xs text-muted-foreground
  Right: 两张叠加图片预览
    背图: h-8 w-8 rounded-md -rotate-12 absolute right:4px bottom:-2px z-0
    前图: h-8 w-8 rounded-md absolute right:-2px bottom:-4px z-1

Section 2 — 上传参考图:
  h-16 rounded-xl border border-dashed border-muted-foreground/20 px-3
  hover:border-muted-foreground/30
  Left: image-plus icon + "拖拽或上传参考图" + "可选"
  Right: + button h-9 w-9 rounded-md bg-foreground/5 hover:bg-foreground/10

Section 3 — 生成参数（bg-muted/50 rounded-xl p-4）
```

### III.PICS 实现方案

由于 `/img2prompt` 已存在为独立页面，阶段28 的策略：

**方案A（推荐）**：在 DesktopDock 点击 Sparkles 时，不跳转路由，而是滑出右侧面板
**方案B（保守）**：保持路由跳转，仅优化页面内 UI 布局

推荐方案A：
```jsx
// Layout.js 新增：
const [img2promptOpen, setImg2promptOpen] = useState(false);

// DesktopDock props:
<DesktopDock onImg2PromptClick={() => setImg2promptOpen(true)} />

// 右侧面板：
<Img2PromptPanel open={img2promptOpen} onClose={() => setImg2promptOpen(false)} />
```

---

## 七、阶段28 开发计划

### 实施顺序

```
Step 1 — 头像 Dropdown 菜单          （2h）
Step 2 — DesktopDock 样式升级         （30min）
Step 3 — Sidebar Nav hover 样式统一   （30min）
Step 4 — 积分 Modal 弹窗             （3h）
Step 5 — Img2Prompt 右侧面板         （4h）
```

---

### Step 1 — 头像 Dropdown

**文件**: `client/src/components/Layout/Sidebar.js`

改动点：
- 将底部 avatar button 从 `<Link to="/dashboard">` 改为 dropdown trigger
- 新建 dropdown state + outside-click handler
- 渲染 w-[245px] 菜单（bottom-full + mb-2 弹出方向向上）
- 菜单项：Dashboard / Settings / History / Favorites / Help / 退出登录
- 登出调用 `useAuth().logout()`

```jsx
// 新增 state
const [avatarOpen, setAvatarOpen] = useState(false);
const dropdownRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setAvatarOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

---

### Step 2 — DesktopDock 样式升级

**文件**: `client/src/components/UI/DesktopDock.js`

```jsx
// 容器 className 改为：
"fixed bottom-6 left-1/2 z-50 -translate-x-1/2 hidden md:flex"

// 内部容器样式：
{
  height: 64,
  gap: 16,        // gap-4
  borderRadius: 16,  // rounded-2xl
  padding: '12px 16px',  // px-4 py-3
  border: '1px solid rgba(var(--foreground-rgb), 0.10)',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',  // shadow-2xl
  backgroundColor: 'var(--bg-primary)',  // bg-background/80
  backdropFilter: 'blur(12px)',
}

// 图标按钮：40×40px, rounded-lg(8px),
// 非激活默认: rgba(0,0,0,0.04) bg
// 悬停: rgba(0,0,0,0.08) bg
// 激活: var(--accent-primary) color + rgba(99,102,241,0.12) bg
```

---

### Step 3 — Nav hover 样式

**文件**: `client/src/components/Layout/Sidebar.js`

```jsx
// 所有 nav link/button 统一添加：
style={{ transition: 'background-color 150ms, color 150ms' }}
onMouseEnter/Leave 统一用 CSS class 替代 inline handler
```

或直接在 `Sidebar.css` 中定义：
```css
.sidebar-nav-item:hover {
  background-color: var(--gallery-filter-hover-bg, rgba(0,0,0,0.06));
}
.sidebar-nav-item[data-active="true"] {
  background-color: var(--gallery-filter-active-bg, rgba(99,102,241,0.10));
  color: var(--accent-primary);
}
```

---

### Step 4 — 积分 Modal

**新文件**: `client/src/components/UI/CreditsModal.js`

**集成**:
- `Layout.js` / `Sidebar.js` 底部 credits button 触发 `setCreditsModalOpen(true)`
- Context 或 prop 传递 open state

**Modal 结构**:
```jsx
<Modal open={open} onClose={onClose} className="max-w-[1300px] rounded-3xl p-0">
  <CloseButton />  {/* absolute -right-14 top-0 */}
  <Header gradient />  {/* "解锁更多积分" + 副标题 */}
  <PlanGrid>
    <PlanCard tier="free" />
    <PlanCard tier="starter" price="¥79" credits={1000} />
    <PlanCard tier="pro" price="¥159" credits={2200} featured />
    <PlanCard tier="ultimate" price="¥399" credits={5000} />
  </PlanGrid>
</Modal>
```

**与 Stripe 集成**（已有）：
- 点击套餐 CTA → `stripeAPI.createCheckoutSession(tier)` → redirect Stripe

---

### Step 5 — Img2Prompt 右侧面板

**新文件**: `client/src/components/UI/Img2PromptPanel.js`

```jsx
// 滑入/滑出动画：
<div
  className="fixed top-4 bottom-4 right-4 z-40 w-[380px] transition-transform duration-200"
  style={{ transform: open ? 'translateX(0)' : 'translateX(calc(100% + 1rem))' }}
>
  {/* rounded-3xl bg-[var(--bg-secondary)] backdrop-blur-sm */}

  {/* Header: "图生提示词" + 关闭按钮 */}
  {/* 反推提示词入口卡（带叠层图片预览）*/}
  {/* 拖拽/上传区域（hidden input + drag events）*/}
  {/* 结果展示区（生成的 prompt 文本）*/}
  {/* Copy 按钮 */}
</div>
```

**DesktopDock 改动**：
- Sparkles 图标不跳转 /img2prompt，改为 `onClick: props.onImg2PromptClick`
- Active 态：`img2promptOpen ? true : false`

---

## 八、文件改动清单

| 文件 | 类型 | 改动 |
|------|------|------|
| `components/Layout/Sidebar.js` | 改 | 头像→Dropdown，credits button触发Modal |
| `components/UI/DesktopDock.js` | 改 | 样式升级，Sparkles点击改为面板触发 |
| `components/Layout/Layout.js` | 改 | 新增 CreditsModal + Img2PromptPanel 状态 |
| `components/UI/CreditsModal.js` | **新建** | 定价 Modal（4套餐） |
| `components/UI/Img2PromptPanel.js` | **新建** | 右侧滑出面板 |
| `pages/Img2Prompt.js` | 保留 | 独立页面保留（/img2prompt 路由） |

---

## 九、视觉细节对标表

| 元素 | MeiGen 实测值 | III.PICS 实现目标 |
|------|--------------|-----------------|
| Dropdown 宽度 | 245px | 240px |
| Dropdown 圆角 | rounded-xl (12px) | rounded-xl |
| Dropdown shadow | shadow-lg | shadow-lg |
| Dropdown 动画 | fade-in + zoom-in-95 | opacity+translateY |
| Dropdown 菜单项间距 | gap-3 px-3 py-1.5 | 相同 |
| Dropdown 悬停 | hover:bg-muted-active | rgba(0,0,0,0.06) |
| Credits Modal 圆角 | rounded-3xl (24px) | rounded-3xl |
| Credits Modal 最大宽 | 1300px | 1200px |
| Credits Modal 背景 | bg-white dark:bg-neutral-950 | var(--bg-primary) |
| Credits Close btn | -right-14 圆角毛玻璃 | 相同实现 |
| PlanCard 圆角 | rounded-[24px] | rounded-3xl |
| PlanCard 悬停 | hover:-translate-y-1 | 相同 |
| DesktopDock 高度 | 64px (h-16) | 64px |
| DesktopDock 圆角 | rounded-2xl (16px) | rounded-2xl |
| DesktopDock 阴影 | shadow-2xl | shadow-2xl |
| Dock 图标尺寸 | 40×40px | 40×40px |
| Dock 图标圆角 | rounded-lg (8px) | rounded-lg |
| Dock 图标默认bg | bg-muted/30 | rgba(0,0,0,0.04) |
| RightPanel 宽 | ~400px | 380px |
| RightPanel 圆角 | rounded-3xl | rounded-3xl |
| RightPanel 背景 | bg-card/95 backdrop-blur | var(--bg-secondary)/0.95 |
| RightPanel 动画 | translateX 200ms ease-out | 相同 |

---

*文档由 Claude Code 自动生成 — 基于 Chrome DevTools 实时 DOM 分析*
