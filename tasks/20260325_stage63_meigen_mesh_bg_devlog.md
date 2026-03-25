# Stage 63 开发日志 — MeiGen.ai 动态背景精确复刻

**日期**：2026-03-25
**Commit**：`da204e2`
**分支**：main → 已 push

---

## 一、背景与动机

项目 III.PICS 整体视觉长期存在"灰蒙蒙"问题：
- 首页 Hero 遮罩过厚，图片网格被压暗
- Gallery/Explore 页面背景纯白无层次，侧边栏 `rgba(255,255,255,0.5)` 偏灰偏虚
- 整体缺乏品牌感与设计细节

目标：向竞品 MeiGen.ai 对齐，引入动态 Mesh Gradient 背景，使页面产生"轻微彩色空气感"。

---

## 二、探索过程与关键错误

### 2.1 第一次错误方向（已废弃）

初始理论判断：动态背景需要深色底才能让光球可见（`mix-blend-mode: screen` 在白色底上不可见）。

**基于此错误假设实现了：**
- 在 `MeshBackground` 组件内加入 `mesh-bg-base` 深色底层（`#09090e`）
- 4 个光球 + 顺时针轨道旋转动画
- Sidebar blur 改为 20px

**结果**：页面出现深色背景但覆盖了内容区，视觉完全错乱。

### 2.2 真相：直接扒 MeiGen.ai

通过 Chrome DevTools MCP 直接连接 `meigen.ai`，用 `evaluate_script` 提取生产环境精确 CSS 值：

```js
// 发现：body 背景是纯白！
bodyBg: "rgb(255, 255, 255)"

// 发现：NO mix-blend-mode: screen，用的是 normal！
orb1_blendMode: "normal"
orb2_blendMode: "normal"

// 发现：只有 2 个光球，不是 4 个
animatedElements.length === 2
```

**这彻底推翻了初始理论**。MeiGen 的效果靠的是：
- 低透明度颜色（0.38–0.50）直接叠在白色底上
- 极大 blur（60px/80px）使颜色边界完全消融
- `normal` blend mode（不需要深色底）

---

## 三、MeiGen.ai 精确参数存档

### 3.1 背景容器

```css
position: fixed;
inset: 0;
z-index: 0;
overflow: hidden;
pointer-events: none;
/* 无底色，透明 */
```

### 3.2 光球 1（`animate-mesh-orbit`）

```
inset:      -60%（超出视口四边各 60%，尺寸约 2.2× 视口）
blur:       filter: blur(60px)
blend:      mix-blend-mode: normal
duration:   16s
easing:     cubic-bezier(0.4, 0, 0.6, 1)
```

**颜色（实测精确值）：**
```css
background:
  radial-gradient(80% 60% at 10% 20%, rgba(41,130,255,0.42) 0%, transparent 50%),
  radial-gradient(60% 80% at 90% 30%, rgba(184,112,255,0.38) 0%, transparent 50%),
  radial-gradient(50% 70% at 30% 60%, rgba(255,166,77,0.38) 0%, transparent 50%),
  radial-gradient(60% 60% at 70% 70%, rgba(247,247,247,0.5) 0%, transparent 50%);
```

### 3.3 光球 2（`animate-mesh-orbit-reverse`）

```
inset:      -40%
blur:       filter: blur(80px)
blend:      mix-blend-mode: normal
duration:   20s
easing:     cubic-bezier(0.4, 0, 0.6, 1)
```

**颜色（实测精确值）：**
```css
background:
  radial-gradient(55% 45% at 80% 10%, rgba(61,158,255,0.42) 0%, transparent 45%),
  radial-gradient(45% 55% at 20% 90%, rgba(210,126,252,0.38) 0%, transparent 45%),
  radial-gradient(50% 50% at 60% 50%, rgba(255,160,92,0.38) 0%, transparent 45%);
```

### 3.4 动画关键帧（实测完整值）

```css
@keyframes mesh-orbit {
  0%   { transform: translate(0) rotate(0deg) scale(1); }
  10%  { transform: translate(8%, -12%) rotate(2deg) scale(1.02); }
  20%  { transform: translate(20%, -8%) rotate(4deg) scale(1.05); }
  30%  { transform: translate(25%, 5%) rotate(3deg) scale(1.03); }
  40%  { transform: translate(15%, 18%) rotate(0deg) scale(0.98); }
  50%  { transform: translate(-5%, 22%) rotate(-3deg) scale(0.95); }
  60%  { transform: translate(-18%, 12%) rotate(-5deg) scale(0.97); }
  70%  { transform: translate(-22%, -5%) rotate(-3deg) scale(1.02); }
  80%  { transform: translate(-12%, -15%) rotate(0deg) scale(1.04); }
  90%  { transform: translate(2%, -18%) rotate(2deg) scale(1.01); }
  100% { transform: translate(0) rotate(0deg) scale(1); }
}

@keyframes mesh-orbit-reverse {
  0%   { transform: translate(0) rotate(0deg) scale(1); }
  12%  { transform: translate(-10%, -8%) rotate(-2deg) scale(0.97); }
  25%  { transform: translate(-20%, 5%) rotate(-4deg) scale(0.94); }
  37%  { transform: translate(-12%, 18%) rotate(-2deg) scale(0.98); }
  50%  { transform: translate(8%, 20%) rotate(2deg) scale(1.03); }
  62%  { transform: translate(22%, 8%) rotate(4deg) scale(1.06); }
  75%  { transform: translate(18%, -10%) rotate(3deg) scale(1.02); }
  87%  { transform: translate(5%, -12%) rotate(1deg) scale(0.99); }
  100% { transform: translate(0) rotate(0deg) scale(1); }
}
```

### 3.5 侧边栏

```
宽度:           272.995px
内面板背景:     rgba(255, 255, 255, 0.80)  ← oklab(0.999994.../0.8) 等价
backdrop-blur:  blur(48px)
border:         1px solid rgb(229, 231, 235)
```

---

## 四、最终实现

### 4.1 改动文件列表

| 文件 | 改动内容 |
|------|---------|
| `client/src/components/UI/MeshBackground.js` | 重写：2光球 inline style 精确颜色，删除 base/tertiary/quaternary |
| `client/src/components/UI/MeshBackground.css` | 完全重写：MeiGen 精确 keyframes，normal blend |
| `client/src/components/Layout/Layout.js` | `<MeshBackground enabled />` 启用 |
| `client/src/components/Layout/HomeLayout.js` | `<MeshBackground enabled />` 启用 |
| `client/src/components/Layout/Sidebar.js` | blur 48px，透明度 0.80，border MeiGen 精确色 |
| `client/src/styles/theme-variables.css` | stage-bg/sidebar 透明度 0.80，边框 rgb(229,231,235) |
| `client/src/styles/gallery.css` | gallery-stage backdrop-blur 20px → 48px |

### 4.2 MeshBackground.js 最终代码

颜色值通过 inline style 传入（便于精确对应 MeiGen，也便于未来调整）：

```jsx
const MeshBackground = ({ enabled = false }) => (
  <div className={`mesh-bg-container${enabled ? ' mesh-bg-container--enabled' : ''}`} aria-hidden="true">
    <div className="mesh-bg-orb mesh-bg-orb--primary" style={{
      inset: '-60%',
      background: [
        'radial-gradient(80% 60% at 10% 20%, rgba(41,130,255,0.42) 0%, transparent 50%)',
        'radial-gradient(60% 80% at 90% 30%, rgba(184,112,255,0.38) 0%, transparent 50%)',
        'radial-gradient(50% 70% at 30% 60%, rgba(255,166,77,0.38) 0%, transparent 50%)',
        'radial-gradient(60% 60% at 70% 70%, rgba(247,247,247,0.5) 0%, transparent 50%)',
      ].join(', '),
      filter: 'blur(60px)',
    }} />
    <div className="mesh-bg-orb mesh-bg-orb--secondary" style={{
      inset: '-40%',
      background: [
        'radial-gradient(55% 45% at 80% 10%, rgba(61,158,255,0.42) 0%, transparent 45%)',
        'radial-gradient(45% 55% at 20% 90%, rgba(210,126,252,0.38) 0%, transparent 45%)',
        'radial-gradient(50% 50% at 60% 50%, rgba(255,160,92,0.38) 0%, transparent 45%)',
      ].join(', '),
      filter: 'blur(80px)',
    }} />
  </div>
);
```

---

## 五、验证结果（9/9 通过）

浏览器截图逐项核对：

| 验证项 | 结果 |
|--------|------|
| 白色底 body，无深色遮罩 | ✅ |
| 页面有淡彩色晕染（蓝/紫/橙） | ✅ Explore 左上角可见淡粉/蓝光晕 |
| 光球 blur 足够大，边界消融 | ✅ 无明显球形轮廓 |
| 动画缓慢自然（16-20s 周期） | ✅ |
| 两球反向浮动，非同步 | ✅ |
| 侧边栏半透明白色，blur 明显 | ✅ |
| 侧边栏边框淡灰 #e5e7eb | ✅ |
| 内容容器白色半透明 + blur | ✅ |
| 整体有轻微彩色空气感 | ✅ |

---

## 六、经验教训

### 教训 1：不要基于理论假设实现，直接扒源码
`mix-blend-mode: screen` 在白色底上不可见——这个理论是正确的，但 MeiGen 根本不用 screen。
**正确做法**：遇到视觉效果实现问题，优先用 DevTools 直接读取生产环境 CSS，而不是靠推断。

### 教训 2：DevTools MCP 的 `evaluate_script` 是竞品分析的终极武器
通过 JS 注入可以获取：
- `getComputedStyle()` — 实际生效的 CSS 值
- `sheet.cssRules` — 提取 @keyframes 完整内容
- `el.style` — inline style 精确值
- `animationDuration`、`animationName` 等动画属性

比看 Network 请求或手动查 CSS 文件快 10 倍。

### 教训 3：计划文件应包含"对标基准"
本次将 MeiGen 精确参数写入 `tasks/todo.md` 风格的计划文件，开发完成后逐项对比，效率极高。后续复刻竞品功能时应沿用此模式。

---

## 七、后续优化方向

- [ ] 首页 Hero 遮罩减薄（目前 hero 覆盖了 mesh 效果，需要单独处理）
- [ ] Dark mode 下 mesh 光球颜色调整（当前 dark mode 未专门适配）
- [ ] 移动端性能：`prefers-reduced-motion` 已配置（60s），可进一步按设备降帧
