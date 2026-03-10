# 阶段31 — DesktopDock 毛玻璃 + macOS Dock 动效 & 积分悬浮卡修复

**日期**: 2026-03-10
**分支**: main
**涉及文件**:
- `client/src/components/UI/DesktopDock.js`（完整重写）
- `client/src/components/Layout/Sidebar.js`（CreditsHoverArea 修复）
- `server/routes/generate.js`（Imagen 模型 ID 修正）

---

## 一、问题背景

### 1.1 DesktopDock 动效失效

前一版本使用 `<motion.nav>` 同时承载居中定位和动画，导致冲突：

```jsx
// ❌ 旧版：translateX 被 framer-motion 的 transform 属性覆盖
<motion.nav
  className="fixed bottom-6 left-1/2 z-50"
  style={{ translateX: '-50%' }}   // 与动画 transform 互斥
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
>
```

Tailwind 的 `left-1/2` + CSS `translateX(-50%)` 与 framer-motion 的 `transform` 矩阵合并时互相干扰，结果：居中失败或动画不生效。

### 1.2 积分悬浮卡两个 Bug

**Bug A — 卡片不可交互**：卡片设了 `pointerEvents: 'none'`，鼠标事件被屏蔽，"Upgrade" 按钮无法点击。

**Bug B — 鼠标移入卡片即消失**：卡片使用 `position: fixed` 视觉上脱离了父 `div`，浏览器认为鼠标已离开父容器，立即触发 `mouseLeave` → 卡片隐藏。

### 1.3 Imagen 404 错误

```
Imagen 服务错误: models/imagen-3.0-generate-002 is not found for API version v1beta
```

模型 ID `imagen-3.0-generate-002` 不存在，应为 `imagen-3.0-generate-001`。

---

## 二、修复方案

### 2.1 DesktopDock 架构修正

**核心原则**：将"居中定位"与"动画"分离到两个独立元素。

```jsx
// ✅ 新版：外层静态 div 负责定位，内层 motion.nav 纯负责动画
<div
  className="fixed hidden md:block"
  style={{ bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
>
  <motion.nav
    initial={{ opacity: 0, y: 32, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.08 }}
    // ...
  >
```

外层 `div` 的 `transform: translateX(-50%)` 是静态 CSS，不参与 framer-motion 矩阵运算，两者互不干扰。

### 2.2 积分悬浮卡修复

**Bug A 修复**：移除 `pointerEvents: 'none'`，同时将"Upgrade"从 `<span>` 改为真正的 `<button>`。

**Bug B 修复**：延迟关闭 + 卡片自身 keep-alive 模式：

```jsx
const hideTimer = useRef(null);

const show = () => {
  clearTimeout(hideTimer.current);        // 取消待执行的关闭
  // ... 计算坐标并显示卡片
};

const hide = () => {
  hideTimer.current = setTimeout(() => setCardPos(null), 120); // 延迟 120ms
};

// 触发按钮 + 卡片本身都监听 onMouseEnter/onMouseLeave
<div onMouseEnter={show} onMouseLeave={hide}>    {/* 触发区域 */}
  <button ref={triggerRef}>...</button>
</div>

{cardPos && (
  <div onMouseEnter={show} onMouseLeave={hide}  {/* 卡片自身续命 */}
       style={{ position: 'fixed', ... }}>
    ...
  </div>
)}
```

逻辑：当鼠标从触发按钮移向卡片时，触发区域先 `mouseLeave` 启动 120ms 定时器，而鼠标在 120ms 内进入卡片后调用 `show()` 取消定时器，卡片保持显示。

### 2.3 Imagen 模型 ID 修正

```js
// ❌ 旧版
apiModel: 'imagen-3.0-generate-002',

// ✅ 新版
apiModel: 'imagen-3.0-generate-001',
```

---

## 三、DesktopDock macOS 风格动效设计

### 3.1 设计目标

对标 macOS Dock 与 MeiGen.ai 导航栏：
- 鼠标悬停时，光标附近的图标放大，周围图标受影响程度随距离衰减
- 图标向上生长（而非等比中心缩放）
- 弹性物理感（spring，非线性缓动）

### 3.2 实现原理

使用 framer-motion 的三层 Motion Value 管道：

```
mouseX (useMotionValue)
  ↓ useTransform: 视口X → 与各图标中心的距离
distance (per-icon)
  ↓ useTransform: [-MAG_RADIUS, 0, MAG_RADIUS] → [1, SCALE_MAX, 1]
scaleRaw
  ↓ useSpring: 物理弹簧平滑
scale (最终驱动 motion.div style.scale)
```

**关键代码**：

```jsx
// Dock 容器：追踪鼠标 X 坐标
const mouseX = useMotionValue(Infinity);

<motion.nav
  onMouseMove={(e) => mouseX.set(e.clientX)}
  onMouseLeave={() => mouseX.set(Infinity)}   // 离开后所有图标归位
>

// DockItem 内部：距离 → scale
const distance = useTransform(mouseX, (val) => {
  const rect = ref.current?.getBoundingClientRect();
  return val - (rect.left + rect.width / 2);  // 视口X - 图标中心X
});

const scaleRaw = useTransform(
  distance,
  [-MAG_RADIUS, 0, MAG_RADIUS],   // 输入域：鼠标距离（px）
  [1, SCALE_MAX, 1],               // 输出域：缩放比例
  { clamp: true },                 // 超出范围不继续放大
);

const scale = useSpring(scaleRaw, {
  mass: 0.12,
  stiffness: 200,
  damping: 14,
});
```

**为什么用 `transformOrigin: 'bottom center'`**：

图标从底部向上生长，视觉上"从 Dock 栏中浮起"，而非从中心等比膨胀。这与 macOS Dock 的行为完全一致。

### 3.3 放大参数

| 参数 | 值 | 含义 |
|------|----|------|
| `MAG_RADIUS` | 120px | 鼠标影响半径，超出此距离图标不放大 |
| `SCALE_MAX` | 1.55 | 光标正下方图标的最大放大倍率 |
| `mass` | 0.12 | Spring 质量，越小响应越快 |
| `stiffness` | 200 | Spring 刚度，越大弹回越快 |
| `damping` | 14 | Spring 阻尼，越大越平稳（越小越弹跳） |

### 3.4 毛玻璃质感

```js
backgroundColor: 'rgba(255, 255, 255, 0.62)',
backdropFilter: 'blur(28px) saturate(200%)',
WebkitBackdropFilter: 'blur(28px) saturate(200%)',
border: '1px solid rgba(255, 255, 255, 0.6)',
boxShadow:
  '0 20px 60px -8px rgba(0,0,0,0.16),' +
  '0 4px 16px rgba(0,0,0,0.07),' +
  'inset 0 1px 0 rgba(255,255,255,0.95)',
```

| CSS 属性 | 作用 |
|----------|------|
| `rgba(255,255,255,0.62)` | 62% 不透明白色，透出背景内容 |
| `blur(28px)` | 模糊半径，越大越"磨砂" |
| `saturate(200%)` | 饱和度提升，让背景色彩更鲜艳（Apple 风格） |
| `inset 0 1px 0 rgba(...)` | 顶部内描边高光，模拟玻璃上表面的光泽 |

各图标本身也加了轻微毛玻璃背景，hover 时白色透明度加深：

```js
backgroundColor: hovered ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)',
border: '1px solid rgba(255,255,255,0.4)',
```

### 3.5 Tooltip 升级

Tooltip 也改为毛玻璃风格，与 Dock 风格统一：

```js
backgroundColor: 'rgba(12,12,12,0.85)',
backdropFilter: 'blur(8px)',
border: '1px solid rgba(255,255,255,0.12)',
```

---

## 四、积分悬浮卡 position:fixed 定位方案

### 4.1 问题根因

Sidebar 被 `Layout.js` 包裹在 `overflow-hidden` 容器中：

```jsx
// Layout.js
<div className="hidden md:block sticky top-0 h-screen overflow-hidden"
     style={{ width: collapsed ? 64 : 240 }}>
  <Sidebar />
</div>
```

`overflow: hidden` 会裁切所有子元素，包括 `position: absolute`。
`position: fixed` 可以脱离此裁切，但需要手动计算坐标。

### 4.2 坐标计算

```jsx
const show = () => {
  const rect = triggerRef.current.getBoundingClientRect();
  setCardPos({
    bottom: window.innerHeight - rect.top + 8,  // 卡片底部 = 窗口高 - 按钮顶部 + gap
    left: 8,                                      // 侧边栏左边距 8px
  });
};
```

卡片宽度设为 `224px`（侧边栏 240px - 左右各 8px），确保不超出侧边栏右边界。

---

## 五、验证结果

| 测试项 | 结果 |
|--------|------|
| Dock 入场动画 | ✅ spring 从下方弹出 |
| 鼠标移过图标放大 | ✅ 随距离平滑缩放，spring 回弹 |
| 图标向上生长 | ✅ transformOrigin: bottom center |
| 鼠标离开 Dock 归位 | ✅ mouseX → Infinity 触发回归 |
| 毛玻璃效果 | ✅ 背景模糊可见 |
| 积分卡片显示 | ✅ position:fixed 脱离 overflow:hidden |
| 鼠标移入卡片不消失 | ✅ 延迟关闭 + show() 取消定时器 |
| Upgrade 按钮可点击 | ✅ 改为 `<button>` + 无 pointerEvents 限制 |
| 控制台无错误 | ✅ |
| Imagen 生图 | 待重启 server 验证 `imagen-3.0-generate-001` |

---

## 六、已知限制

1. **Imagen 3 API 权限**：标准 Gemini API Key 可能不包含 Imagen 3 访问权限，需要在 Google Cloud Console 单独申请或使用 Vertex AI。建议生产环境以 `gemini-flash` 为主力，Imagen 作为高阶选项。

2. **毛玻璃降级**：`backdrop-filter` 在部分老版 Android Chrome 或 Firefox 仍不支持，降级为白色半透明背景，功能不受影响。

3. **Dock 遮挡底部内容**：Dock 固定在 `bottom: 20px`，页面底部内容可能被遮挡，建议各页面 padding-bottom 留 80px 以上。
