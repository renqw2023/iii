# 阶段 34 - Dynamic Background 开发日志

**日期**: 2026-03-11
**关联分析文件**: `E:/pm01/meigen_dynamic_background_analysis.md.resolved`
**目标**: 参考 MeiGen.ai 的动态 mesh gradient 背景方案，在 III.PICS 中接入可复用的纯 CSS 动态背景，并补齐公共页面布局接入。

---

## 一、背景与起点

用户要求阅读 `meigen_dynamic_background_analysis.md.resolved`，并完成实际的背景开发。

分析文件中的关键结论：

- 目标方案不是 Canvas / WebGL / JS 粒子，而是纯 CSS 的 mesh gradient。
- 核心组成是多层 `radial-gradient`、大面积 `blur()`、以及多组 keyframe 动画。
- 建议接入顶层布局，使页面内容漂浮在背景之上，并用 `pointer-events: none` 防止背景拦截点击。

---

## 二、开始时的项目现状

在读取 `tasks` 目录和项目源码后，确认到以下进度与状态：

### 1. 最近开发进度

`tasks` 中最近阶段主要集中在：

- 2026-03-09: 图片生成、双积分体系
- 2026-03-10: 桌面 Dock、积分系统、Reverse Prompt 参考图

说明项目整体 UI 架构已经相对稳定，适合将背景能力作为布局层增强，而不是每个页面单独实现。

### 2. 动态背景并非完全从零开始

开始排查后发现项目里已经存在：

- `client/src/components/UI/MeshBackground.js`
- `client/src/components/UI/MeshBackground.css`

并且：

- `client/src/components/Layout/Layout.js` 已经接入了 `MeshBackground`
- `client/src/components/Layout/HomeLayout.js` 尚未接入

这意味着之前其实已经有一版“半落地”的背景实现，但只覆盖了内容页布局，没有覆盖首页/登录/注册等公共页面。

---

## 三、第一轮改动：补齐布局接入

### 改动目的

让动态背景不仅出现在内容页，也出现在首页与公共认证页，使背景方案真正成为全站布局能力。

### 修改文件

#### 1. `client/src/components/Layout/HomeLayout.js`

改动内容：

- 引入 `MeshBackground`
- 在布局根层增加 `relative isolate`
- 使用 `relative z-10` 包裹原有内容层

这样做的原因：

- 背景层固定在底部
- 内容层明确在背景之上
- 避免背景对 Header、Footer、MobileDock 的交互产生干扰

### 同步记录

在 `tasks/todo.md` 中追加了本次动态背景落地结果，说明：

- 已阅读分析文件
- 已核对最近开发进度
- 已将 `HomeLayout` 接入背景
- 已补齐层级关系

---

## 四、第一次用户反馈：页面仍像淡紫色静态背景

用户反馈：

> 现在依然是淡紫色背景，一点动效也无

### 复查结果

排查后确认，问题不在于“背景组件未挂载”，而在于：

1. 页面本身的 `--page-bg` 和 `--stage-bg` 在视觉上较强
2. 尤其 dark 主题中，`--page-bg` 基本是整块深色底
3. 背景层即使在运动，也被上层页面背景大面积覆盖
4. 初版 mesh 的移动振幅较小、颜色差异较弱，肉眼不易感知

### 关键判断

这是一个“技术上有动画，视觉上像没动画”的问题，不是简单的挂载失败。

---

## 五、第二轮改动：让背景真正透出来

### 修改文件

#### 1. `client/src/styles/theme-variables.css`

改动内容：

- 将 light 主题的 `--page-bg` 从实色渐变改为半透明渐变
- 将 dark 主题的 `--page-bg` 从实心深色改为半透明深色渐变
- 同步调低 `--stage-bg` 的不透明度

目的：

- 让底层 mesh 背景透出
- 保留页面整体视觉结构
- 避免内容面板完全压死背景

#### 2. `client/src/components/UI/MeshBackground.js`

改动内容：

- 从原本的双层 orb，扩展为：
  - `mesh-bg-veil`
  - `mesh-bg-orb--primary`
  - `mesh-bg-orb--secondary`
  - `mesh-bg-orb--tertiary`

#### 3. `client/src/components/UI/MeshBackground.css`

改动内容：

- 重写 keyframes，扩大位移幅度与缩放变化
- 引入 veil 层做整体色雾漂移
- 增加第三层 orb 强化层次
- 提升 dark / light 下的可见度参数

### 效果目标

- 从“几乎察觉不到”提升到“明显能看到色团漂移”
- 仍保持纯 CSS 方案，不引入 JS 动画依赖

---

## 六、第二次用户反馈：已有色差，但仍然感觉静态

用户反馈：

> 现在有明确的色差差异了。以及可见渐变色，但是依然是静态

### 复查结论

这说明第二轮改动已经解决了“背景完全被盖住”的问题，但新的问题是：

- 色块虽然存在
- 颜色变化虽然可见
- 但整体 blur 太大、色块太慢、颜色边界太柔
- 肉眼仍然难以追踪到位移轨迹

换句话说：

不是没有动画，而是运动特征不够“可识别”。

---

## 七、第三轮改动：增强“肉眼可见的动感”

### 修改文件

#### 1. `client/src/components/UI/MeshBackground.js`

新增：

- `mesh-bg-wave`

#### 2. `client/src/components/UI/MeshBackground.css`

新增 / 调整：

- 新增 `mesh-wave-drift` 动画
- 新增 `mesh-shimmer` 动画
- `mesh-bg-wave` 使用更小范围、更高对比的 radial gradient
- `mesh-bg-wave::after` 增加更亮的 shimmer 细节
- 缩小 primary / secondary / tertiary orb 的尺寸
- 降低 blur 半径
- 提高颜色饱和度与透明度
- 缩短动画时长

### 同时处理了 reduced-motion 策略

原本 reduced motion 下是直接：

- `animation: none`

这会导致某些系统环境下背景完全静止。

后续改成：

- 仍然保留动画
- 但降低速度、改为更平缓的节奏

这样即使系统偏好减少动态，也不会变成彻底静止。

---

## 八、当前代码状态总结

截至本日志落地时，动态背景相关文件状态如下：

### 已接入的文件

- `client/src/components/UI/MeshBackground.js`
- `client/src/components/UI/MeshBackground.css`
- `client/src/components/Layout/Layout.js`
- `client/src/components/Layout/HomeLayout.js`
- `client/src/styles/theme-variables.css`

### 当前背景结构

- 顶层固定背景容器
- veil 大色雾层
- wave 位移动感层
- 3 个大 orb 层
- 页面本身使用半透明 page/stage 叠加

### 技术特点

- 纯 CSS
- 无 Canvas / WebGL
- 无运行时 JS 动画调度
- 主要依赖 `radial-gradient + blur + keyframes`

---

## 九、验证情况

已多次执行：

- `npm run build`（工作目录：`E:/pm01/client`）

结果：

- 构建通过
- 存在若干历史 ESLint warning，但不是本次改动引入

本轮限制：

- 当前会话没有可用的 Chrome DevTools MCP
- 因此未能完成仓库规范中的浏览器截图/控制台自动验收

---

## 十、用户新需求：保留方案，但默认恢复白色背景

用户后续要求：

> 想保留这个背景方案，但是默认恢复成之前的白色背景

这意味着后续方向不应是删除动态背景能力，而是：

- 保留 `MeshBackground` 组件与样式体系
- 保留未来按页面/主题/开关恢复该背景的能力
- 但将默认视觉返回到“白底优先”

因此下一步更适合做“背景能力降级为可控特性”，而不是彻底移除背景实现。

---

## 十一、建议的后续方案方向

可以考虑以下三种策略：

### 方案 A：保留代码，默认不挂载

- 从 `Layout` / `HomeLayout` 中移除默认渲染
- 仅在特定页面或未来开关开启时显示

优点：

- 白底恢复最彻底
- 风险最低

缺点：

- 背景能力默认不可见

### 方案 B：保留挂载，但默认透明化

- 保留 `MeshBackground`
- 将默认 opacity 降到接近 0
- 未来通过 body class / page class / setting 打开

优点：

- 组件链路不变
- 未来恢复简单

缺点：

- 从用户角度接近“背景不存在”

### 方案 C：保留动态能力，但默认切回白色主题变量

- 保留背景层
- 但把 page/stage/theme 调回之前更白的静态变量
- 将 mesh 自身透明度降到非常弱，作为环境光而不是主视觉

优点：

- 不完全消失
- 仍保留细微动态质感

缺点：

- 需要精细调参，否则容易再次回到“看不出动”或“干扰白底”的中间态

---

## 十二、结论

本轮动态背景开发已经完成了：

- 分析文件落地
- 全站布局接入
- 页面背景透出问题修复
- 背景动感可见性多轮增强
- 开发日志与任务记录补齐

但根据用户新方向，下一步目标已从“增强动态背景”转为：

**保留动态背景体系，但将默认视觉恢复为此前的白色背景风格。**

这属于产品取向调整，而不是技术回退，适合在现有代码基础上做开关化或默认样式回退。
