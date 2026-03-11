# Dynamic Background 开发文档

## 1. 背景

本次开发基于 `E:/pm01/meigen_dynamic_background_analysis.md.resolved` 的分析结果，将 MeiGen.ai 风格的纯 CSS 动态背景方案引入 III.PICS，并最终调整为：

- 保留完整动态背景能力
- 默认关闭显示
- 不影响当前默认白色背景
- 不影响既有暗色模式视觉

这意味着当前代码库里已经具备动态背景的完整实现，但它被设计为一个“可启用能力”，而不是默认的全站视觉。

---

## 2. 目标

本次改动的最终目标分为两个阶段：

### 阶段 A：完成动态背景方案落地

- 引入纯 CSS mesh gradient 背景
- 挂载到全站布局层
- 支持首页/公共页与内容页共用
- 不阻塞交互

### 阶段 B：保留方案，但默认恢复原视觉

- 保留背景组件和样式
- 默认恢复此前白底与原有暗色模式
- 后续可按页面、按设置或按主题显式开启

---

## 3. 方案概览

动态背景方案采用纯 CSS 实现，不使用 Canvas、WebGL 或运行时 JS 动画调度。

### 3.1 核心技术

- `radial-gradient`
- `filter: blur()`
- CSS keyframes
- 固定定位背景容器
- 内容层与背景层的显式 z-index 分层

### 3.2 组件结构

文件：

- `client/src/components/UI/MeshBackground.js`
- `client/src/components/UI/MeshBackground.css`

组件内部结构：

- `mesh-bg-container`
- `mesh-bg-veil`
- `mesh-bg-wave`
- `mesh-bg-orb--primary`
- `mesh-bg-orb--secondary`
- `mesh-bg-orb--tertiary`

其中：

- `veil` 负责大面积色雾漂移
- `wave` 负责更容易被肉眼识别的位移层
- 3 个 `orb` 负责主要颜色团和 mesh 层次

---

## 4. 布局接入

背景已接入以下布局：

- `client/src/components/Layout/Layout.js`
- `client/src/components/Layout/HomeLayout.js`

布局处理方式：

- 布局根节点使用相对定位
- 背景固定在底层
- 内容层通过 `z-10` 覆盖在背景之上
- 背景使用 `pointer-events: none`

这样可以保证：

- 背景不会拦截点击
- Header / Footer / Sidebar / Dock 不受影响
- 页面可以共享同一套背景能力

---

## 5. 视觉演进记录

### 5.1 第一版

第一版已经存在于项目中，但只覆盖部分布局，且视觉上存在两个问题：

- 公共页面未接入
- 背景虽然有动画，但不明显

### 5.2 第二版

为让背景透出来，曾对以下变量做过透明化处理：

- `--page-bg`
- `--stage-bg`

这提升了背景可见性，但同时改变了默认页面视觉。

### 5.3 第三版

继续增强动态感时，做了如下方向的优化：

- 增加 `wave` 层
- 缩小颜色团范围
- 降低 blur
- 提高色差和位移识别度
- 处理 reduced motion 下完全静止的问题

### 5.4 最终决定

最终根据产品方向，动态背景不再作为默认背景，而是保留为可开关能力。

---

## 6. 默认关闭的实现方式

当前采用的是“保留挂载，默认透明化”的方案。

### 6.1 组件接口

`MeshBackground` 当前支持：

```jsx
<MeshBackground enabled />
<MeshBackground />
```

行为：

- `enabled={true}` 时显示动态背景
- 未传或 `false` 时背景保持隐藏

### 6.2 当前默认行为

虽然 `Layout` 与 `HomeLayout` 中仍然挂载了 `MeshBackground`，但由于没有显式传入 `enabled`，所以默认不会显示背景。

### 6.3 好处

- 背景能力链路仍然完整
- 后续开启只需要一处显式参数或开关
- 不需要再次重建组件与样式体系

---

## 7. 主题恢复策略

为了不影响之前的视觉，本次最终又将主题变量恢复为原来的状态。

恢复内容位于：

- `client/src/styles/theme-variables.css`

已恢复的关键变量：

- light: `--page-bg`
- light: `--stage-bg`
- dark: `--page-bg`
- dark: `--stage-bg`

结果：

- 默认白色背景恢复
- 原有暗色模式外观恢复
- 动态背景不再依赖页面底色透明化才能存在

---

## 8. 如何再次启用动态背景

如果未来需要在某个页面、某类页面或某个实验模式中启用动态背景，有三种推荐方式。

### 方式 A：在布局层显式开启

例如：

```jsx
<MeshBackground enabled />
```

适合：

- 整站临时启用
- 某个布局整体启用

### 方式 B：按页面条件开启

例如在布局中根据路由判断：

```jsx
<MeshBackground enabled={location.pathname === '/explore'} />
```

适合：

- 只在特定页面启用
- 做视觉实验页

### 方式 C：接入用户设置

例如增加用户偏好：

- 设置项：`dynamicBackground`
- 默认为 `false`
- 开启后传入 `enabled`

适合：

- 给用户提供个性化视觉开关
- 避免默认打扰所有用户

---

## 9. 文件清单

本次动态背景相关的核心文件如下。

### 代码文件

- `client/src/components/UI/MeshBackground.js`
- `client/src/components/UI/MeshBackground.css`
- `client/src/components/Layout/Layout.js`
- `client/src/components/Layout/HomeLayout.js`
- `client/src/styles/theme-variables.css`

### 记录文件

- `tasks/20260311_dynamic_background_devlog.md`
- `tasks/todo.md`
- `tasks/lessons.md`

### 参考分析文件

- `meigen_dynamic_background_analysis.md.resolved`

---

## 10. 验证

本次代码变更后已执行：

```bash
npm run build
```

执行目录：

```bash
E:/pm01/client
```

结果：

- 构建通过
- 仍有项目中既有的 ESLint warning
- 未发现由本次动态背景改动引入的新构建错误

---

## 11. 已知限制

### 11.1 当前默认关闭

这是一项有意设计，不是背景失效。

### 11.2 浏览器自动验收未完成

由于当前会话没有可用的 Chrome DevTools MCP，未执行自动截图和 console 检查。

### 11.3 `tasks` 中部分旧文档存在编码历史问题

个别旧记录文件显示为乱码，不影响当前代码逻辑，但会影响日志阅读体验。

---

## 12. 后续建议

如果未来重新启用动态背景，建议按以下顺序推进：

1. 先决定启用范围：整站、部分页面还是用户可选
2. 再决定强度：弱环境光、明显动态背景、或营销页强化版
3. 最后做浏览器实机验收，重点确认：
   - 动效是否足够可见
   - 是否影响文本可读性
   - 是否干扰暗色模式
   - 是否影响低性能设备

---

## 13. 结论

当前仓库已经具备可用的动态背景系统，但它被安全地降级为默认关闭的可控能力：

- 代码保留
- 默认白底保留
- 暗色模式保留
- 后续可随时按需开启

这使得项目既保留了视觉扩展能力，也维持了当前产品界面的稳定性。
