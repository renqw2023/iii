# Stage 70 + 71 移动端重构开发日志

**日期**: 2026-03-26
**Commits**: `afc12c0` → `0089e39` → `898af69`
**分支**: main

---

## 一、背景与目标

用户反馈移动端体验与 MeiGen.ai 差距较大，提出以下需求：

1. 移动端只展示 Gallery / Explore / Me 三个核心页面，不显示桌面首页
2. 底部导航做成半透明毛玻璃 Pill 样式（参考 MeiGen）
3. Me 标签做成独立页面（而非 Drawer），展示用户信息和快捷入口
4. Gallery / Sref 详情页未适配移动端：全屏竖向布局、返回/分享按钮悬浮在图片上
5. 底部操作栏内容被截断

---

## 二、Stage 70 — 移动端基础重构

**Commit**: `afc12c0`

### 2.1 MobileDock 重设计

**文件**: `client/src/components/UI/MobileDock.js`

从 4 标签（Gallery / Explore + Me 底部 sheet）重设计为 3 标签 Pill 导航：

```
Gallery  |  Explore  |  Me
```

**关键设计参数**（对标 MeiGen）：
- 背景：`rgba(10,10,18,0.65)` + `backdropFilter: blur(28px)` — 65% 不透明毛玻璃
- 边框：`1px solid rgba(255,255,255,0.1)` — 微发光感
- 阴影：`0 8px 32px rgba(0,0,0,0.45)` + 内侧 `inset` 高光
- Active 状态：`rgba(124,58,237,0.2)` 背景 + `#c4b5fd` 文字
- `md:hidden` — 桌面端不渲染

Me tab 的 active 检测包含多个关联路径：
```js
const ME_ACTIVE_PATHS = ['/me', '/dashboard', '/favorites', '/credits',
  '/settings', '/browse-history', '/generate-history'];
```

### 2.2 Layout 简化

**文件**: `client/src/components/Layout/Layout.js`

- 移除 mobile Header（`Header` 组件不再在移动端渲染）
- 移除 `MobileProfileSheet` 相关 state 和渲染
- `MobileDock` 不再需要 `onMeClick` prop
- `pb-24` on mobile 为底部 Dock 留出间距

### 2.3 移动端首页重定向

**文件**: `client/src/App.js`

```jsx
const MobileHomeRedirect = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) return <Navigate to="/gallery" replace />;
  return <Home />;
};
```

手机端访问 `/` 直接跳转 `/gallery`，桌面端正常渲染首页。

### 2.4 Gallery / Sref 详情页移动端适配

**文件**: `client/src/styles/gallery.css`（新增 `@media (max-width: 767px)` 块）

核心布局变化：
```css
.dmodal-panel { flex-direction: column; height: 100svh; border-radius: 0; }
.dmodal-left  { flex: 0 0 44svh; /* 后升级为 50svh */ }
.dmodal-right { flex: 1; overflow-y: auto; }
.dmodal-right-header { display: none; } /* 桌面关闭按钮隐藏 */
.dmodal-right-footer { position: sticky; bottom: 0; overflow-x: auto; }
```

**文件**: `GalleryModal.js` / `SrefModal.js`
新增 `.dmodal-mobile-topbar`（返回 + 分享按钮行）— 后在 Stage 71 替换为悬浮方案。

### 2.5 MobileProfileSheet（后被废弃）

**文件**: `client/src/components/UI/MobileProfileSheet.js`（新建，Stage 71 弃用）

用 framer-motion + createPortal 实现底部上滑 Sheet，展示用户头像、积分、菜单列表、退出登录。设计完成后，用户要求改为独立页面，该组件保留但不再使用。

---

## 三、Stage 71 — Me 独立页面 + 悬浮导航按钮

**Commit**: `0089e39`

### 3.1 MePage — 独立 Profile 页面

**文件**: `client/src/pages/MePage.js`（新建）

对标 MeiGen 的 Me 页面设计：

```
┌─────────────────────────┐
│  [渐变背景 160deg]       │
│       [头像 80px]        │
│       username           │
│       email              │
│    [14,652 credits 胶囊] │
├─────────────────────────┤
│  💰 Credits          >  │
│  ❤️  Favorites       >  │
│  🕐 Browse History   >  │
│  ↩️  Generate History >  │
│  ⚙️  Settings        >  │
├─────────────────────────┤
│  [→ Sign Out]            │
└─────────────────────────┘
```

- 渐变 Header：`linear-gradient(160deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1), transparent)`
- 积分胶囊：`rgba(124,58,237,0.12)` 背景 + 紫色边框
- 未登录态：居中显示头像占位符 + Sign In 按钮
- `paddingBottom: calc(80px + env(safe-area-inset-bottom))` — 避免被底部 Dock 遮挡

路由注册（公开路由，未登录也能访问）：
```jsx
// App.js — 在 Layout 路由下
<Route path="me" element={<MePage />} />
```

### 3.2 MobileDock 改为全 Link 导航

**文件**: `client/src/components/UI/MobileDock.js`

Me tab 从 `<button onClick={onMeClick}>` 改为 `<Link to="/me">`，统一为声明式路由跳转。

### 3.3 详情页悬浮导航按钮

**文件**: `GalleryModal.js` / `SrefModal.js`
**文件**: `gallery.css`

**替代方案**：移除白色 topbar，改为在图片内悬浮玻璃圆形按钮：

```jsx
{/* 放置在 dmodal-left 内，position:absolute */}
<div className="dmodal-mobile-float">
  <button className="dmodal-float-btn" onClick={handleClose}>
    <ArrowLeft size={20} />
  </button>
  <button className="dmodal-float-btn" onClick={handleShare}>
    <Share2 size={18} />
  </button>
</div>
```

**CSS 设计**：
```css
/* 桌面端全局隐藏 */
.dmodal-mobile-float { display: none; }

@media (max-width: 767px) {
  .dmodal-mobile-float {
    position: absolute; top: 14px; left: 14px; right: 14px;
    z-index: 10; pointer-events: none; /* 不阻挡图片点击放大 */
  }
  .dmodal-float-btn {
    pointer-events: all;
    width: 38px; height: 38px; border-radius: 50%;
    background: rgba(0,0,0,0.48);
    backdrop-filter: blur(10px);
    color: #fff;
  }
}
```

**优势**：
- 无白色遮罩，视觉干净
- 图片面积从 44svh 扩大到 50svh（释放原 topbar ~58px 高度）
- 按钮玻璃质感，悬浮于内容之上

### 3.4 详情页底部栏重设计

**问题根因**：`dmodal-right-footer` 包含两个 `flex:1` 的 primary 按钮（Copy + Use as Reference），加上 3 个 icon 按钮，在移动端 390px 宽度下内容溢出。

**解决方案**：`Use as Reference` 按钮在移动端降级为 icon-only：

```jsx
<button className="dmodal-btn-primary dmodal-btn-ref" title="Use as Reference">
  <ImagePlus size={16} />
  <span className="dmodal-btn-ref-label">Use as Reference</span>
</button>
```

```css
@media (max-width: 767px) {
  .dmodal-btn-primary   { flex: 1; }          /* 主按钮填满剩余宽度 */
  .dmodal-btn-ref       { flex: 0 0 auto !important; width: 40px; font-size: 0 !important; }
  .dmodal-btn-ref-label { display: none; }    /* 移动端隐藏文字 */
}
```

桌面端 `.dmodal-btn-ref` 无特殊样式，继承 `dmodal-btn-primary`，文字正常显示。

---

## 四、Bug Fix — 桌面端布局被破坏

**Commit**: `898af69`

### 根因分析

Stage 70 在 `GalleryModal.js` 的 `motion.div.dmodal-panel` 上加了内联样式：

```jsx
// ❌ 错误写法 — 内联样式优先级高于 CSS，始终生效
<motion.div className="dmodal-panel" style={{ flexDirection: 'column' }}>
```

`inline style` 的优先级高于所有 CSS 规则（包括 `@media` 内的规则），导致桌面端原本应为 `row`（左图右文）的布局被强制变为 `column`（上图下文）。

**正确方案**：直接删除内联样式，由 CSS 媒体查询控制：

```css
/* gallery.css — 已存在的规则，无需修改 */
@media (max-width: 768px) {
  .dmodal-panel { flex-direction: column; }  /* 移动端竖排 */
}
/* 桌面端: flex 默认值 row — 左图右文 */
```

**影响范围检查**：
- `SrefModal.js` — 从未有过该内联样式 ✅
- `SeedanceModal.js` — 未触碰 ✅
- `gallery.css` 所有新增规则均在正确的 `@media` 范围内 ✅

### 经验教训

> **原则**：响应式布局的方向（`flex-direction`、`display`）必须完全交由 CSS 媒体查询控制，**绝不能**通过内联 `style` 设置。内联样式无法被媒体查询覆盖。

---

## 五、最终验证结果

| 场景 | 验证结果 |
|------|---------|
| 桌面 /gallery 详情 | 左图（58%）右文，与改造前一致 ✅ |
| 桌面 /explore 详情 | 同上 ✅ |
| 移动端 /gallery | 3-tab Dock（Gallery 高亮）+ 全宽卡片流 ✅ |
| 移动端 /explore | 3-tab Dock（Explore 高亮）✅ |
| 移动端 /me | 独立 Profile 页：头像/积分/菜单列表/退出 ✅ |
| 移动端 /gallery/:id | 图片 50svh + 悬浮返回/分享按钮 + 底栏完整显示 ✅ |
| 移动端 /explore/:id | 同上 ✅ |

---

## 六、涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `client/src/pages/MePage.js` | 新建 | Mobile Me 独立页面 |
| `client/src/App.js` | 修改 | 新增 `/me` 路由 + MobileHomeRedirect |
| `client/src/components/UI/MobileDock.js` | 重写 | 3-tab Pill 导航，Me→Link |
| `client/src/components/UI/MobileProfileSheet.js` | 新建（已弃用） | 底部 Sheet 方案（被 MePage 取代） |
| `client/src/components/Layout/Layout.js` | 修改 | 移除 mobile Header + MobileProfileSheet |
| `client/src/pages/Gallery/GalleryModal.js` | 修改 | 悬浮按钮 + btn-ref + 删除内联 flexDirection |
| `client/src/pages/SrefModal.js` | 修改 | 悬浮按钮 + btn-ref |
| `client/src/styles/gallery.css` | 修改 | 新增 mobile dmodal overrides 完整块 |
