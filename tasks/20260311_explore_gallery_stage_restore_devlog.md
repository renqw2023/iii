# 阶段35 - Explore / Gallery 大容器视觉恢复开发日志
**日期**: 2026-03-11
**目标**: 在保留阶段27全局 Sidebar 架构的前提下，恢复 `/explore` 与 `/gallery` 页面原本的“大容器 / stage”视觉层级
**关联页面**: `/explore`, `/gallery`
**关联提交线索**: `162194a feat: 阶段27 — MeiGen侧边栏复刻 + DesktopDock浮动导航`

---

## 一、问题背景

用户反馈 `/explore` 和 `/gallery` 页面中的图片区域，之前是包在一个统一的大容器中的，现在页面上看不到这层容器了。

初步判断有两种可能：

1. 容器结构仍在，但样式被后续 CSS 覆盖
2. 容器结构在某次重构中被移除，只留下内容网格

为避免误判，先同时核对：

- `docs/2026` 中的阶段开发文档
- `tasks` 中的阶段 devlog
- 当前页面源码
- git 历史与 blame

---

## 二、排查过程

### 1. 文档侧确认旧结构曾经存在

在 `docs/2026/20260225_阶段4_Gallery页面meigen风格重构开发日志.md` 中，明确记录过 `/gallery`、`/explore` 使用如下结构：

```jsx
gallery-page
  -> gallery-layout
     -> aside.gallery-sidebar
     -> main.gallery-main
```

这说明“大容器”并不是用户错觉，而是确实存在过的页面结构。

### 2. 当前源码确认结构已不在页面组件中

当前版本中：

- `client/src/pages/Explore.js`
- `client/src/pages/Gallery/GalleryList.js`

都已经只保留：

- `gallery-page`
- `gallery-grid`
- 结果数 / loading / empty 状态

也就是说，页面本身已经不再渲染 `gallery-layout` / `gallery-main` 这一层容器。

### 3. CSS 侧确认样式仍然保留

在 `client/src/styles/gallery.css` 中，下面这些样式仍然存在：

- `.gallery-layout`
- `.gallery-main`
- 原 stage 风格的背景、边框、阴影、模糊

这说明问题不是“样式丢了”，而是“结构没人用了”。

### 4. git 历史确认是哪次改动移除了它

对以下文件做 `git log` / `git show` / `git blame`：

- `client/src/pages/Explore.js`
- `client/src/pages/Gallery/GalleryList.js`
- `client/src/styles/gallery.css`
- `client/src/components/Layout/Layout.js`
- `client/src/components/Layout/Sidebar.js`
- `client/src/contexts/SidebarContext.js`

最终定位到：

`162194a feat: 阶段27 — MeiGen侧边栏复刻 + DesktopDock浮动导航`

这次提交里，提交说明和阶段日志都明确写了：

- 删除页面内的 filter sidebar
- 改为全局 Sidebar + 页面专属 Panel
- 页面从“自己带 sidebar 的双栏结构”改为“只负责渲染内容网格”

所以这次不是 bug 性质的“误删一个 class”，而是阶段27架构迁移时，旧的页面容器和旧 sidebar 一起被拿掉了，导致大容器视觉也跟着消失了。

---

## 三、修复策略选择

### 可选方案 A：完整回滚旧页面结构

即恢复：

- `gallery-layout`
- 页面内 `aside.gallery-sidebar`
- `main.gallery-main`

问题：

- 会与阶段27之后的全局 Sidebar 架构冲突
- 会重新出现双侧边栏 / 重复筛选入口
- 会抵消后续的 Sidebar Panel 设计成果

因此不采用。

### 可选方案 B：保留全局 Sidebar，只恢复内容区的大容器视觉

做法：

- 页面继续通过全局 Sidebar / Panel 提供筛选
- 页面内容区重新包一层统一的 stage 容器
- 让网格、结果数、loading/empty 状态重新回到一个玻璃面板中

优点：

- 改动最小
- 不破坏阶段27架构
- 能恢复用户感知最明显的视觉层级

最终采用此方案。

---

## 四、实际实现

### 1. `client/src/pages/Explore.js`

调整内容：

- 在 `gallery-page` 内增加 `gallery-stage`
- 将结果数、网格、loading、empty、分页底部提示统一包进 stage
- 原本直接写在 `gallery-grid` 上的 `padding: 1rem` 改为交给 stage 结构控制
- 网格新增 `gallery-stage-grid` 类，用于控制容器内部的顶部间距

目的：

- 恢复 Explore 页面统一的内容面板
- 保持数据流和 Sidebar Panel 逻辑完全不变

### 2. `client/src/pages/Gallery/GalleryList.js`

调整内容与 Explore 相同：

- 新增 `gallery-stage`
- 新增 `gallery-stage-header`
- 为网格补上 `gallery-stage-grid`
- 保留原有无限滚动、like/favorite、URL searchParams 驱动逻辑

目的：

- 让 Gallery 页面与 Explore 页面在视觉层级上重新统一

### 3. `client/src/styles/gallery.css`

新增样式：

```css
.gallery-stage {
  width: 100%;
  background: var(--stage-bg);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid var(--stage-border);
  box-shadow: var(--stage-shadow);
  padding: 1.25rem;
}
```

同时补充：

- `.gallery-stage-header`
- `.gallery-stage-grid`
- 移动端断点下的 `.gallery-stage` padding / radius 调整

设计原则：

- 不直接复用 `.gallery-layout`，因为它绑定了双栏布局语义
- 改用语义更明确的新类名 `gallery-stage`
- 仅恢复“统一玻璃面板”的视觉，不重新耦合旧的 aside/main 结构

---

## 五、为什么这样修复更稳

这次修复刻意把“视觉容器”和“筛选架构”拆开处理：

- 筛选仍由全局 Sidebar 负责
- 页面只负责内容展示
- 内容展示重新获得统一容器层级

这样做的好处是：

1. 避免重复 sidebar
2. 避免回滚阶段27的 URL searchParams 单一数据源方案
3. 避免旧的 `gallery-layout` 语义和新布局产生混淆
4. 后续如果 `/seedance` 也需要统一回补，可以沿用同一套 `gallery-stage` 模式

---

## 六、验证结果

执行：

```bash
cd client
npm run build
```

结果：

- 构建成功
- 本次改动未引入新的编译错误

现存 warning 为项目中已有问题，和本次修复无直接关系，包括：

- `GalleryCard.js` 未使用变量
- `Sidebar.js` 未使用变量
- `VideoCard.js` 重复 props / 未使用参数
- `Img2PromptPanel.js` 未使用变量
- `SeedanceList.js` 未使用 `useLocation`

这些 warning 本次未顺手处理，以避免扩大改动范围。

---

## 七、涉及文件

本次实际修改：

- `client/src/pages/Explore.js`
- `client/src/pages/Gallery/GalleryList.js`
- `client/src/styles/gallery.css`

本次调研参考：

- `docs/2026/20260225_阶段4_Gallery页面meigen风格重构开发日志.md`
- `tasks/20260307_sidebar_stage27_devlog.md`
- `tasks/20260308_sidebar_stage27_devlog.md`

---

## 八、结论

这次问题的根因不是样式失效，而是阶段27引入全局 Sidebar 时，页面内部旧的双栏容器结构被整体移除，导致“大容器”视觉一并消失。

本次修复没有回滚那次架构演进，而是以最小代价恢复了用户真正关心的视觉效果：

- `/explore` 恢复统一内容面板
- `/gallery` 恢复统一内容面板
- 全局 Sidebar / Panel 架构保持不变

这属于一次“视觉层回补”，不是“架构回退”。
