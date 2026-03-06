# FanGallery 组件开发日志

**日期**: 2026-03-06
**阶段**: 20
**目标**: 将首页 Sref / Gallery 两个预览 section 从 masonry `gallery-grid` 改造为放射状"大图居中、两侧递减"的 FanGallery 展示方式，加入鼠标视差移动效果，以及 hover 时被悬停图片变为最大的交互。

---

## 一、背景与动机

首页两个内容预览区（Sref Gallery 和 Prompt Gallery）使用标准 masonry 网格（`gallery-grid`），展示 8 张卡片。这种布局：
- 信息密度高但视觉冲击力弱
- 卡片等大，缺乏层次感
- 无动效，用户停留意愿低

改造目标：用放射状大图布局（中心最大、两侧递减），配合鼠标视差和 hover 动态放大，提升首页视觉吸引力与内容探索欲。

---

## 二、设计方案

### 布局逻辑

展示 **11 张图片**，以中心为最大，向两侧对称递减：

```
位置索引:  0     1     2     3     4    [5]    6     7     8     9    10
尺寸(w×h): 56×80 86×115 116×155 150×200 188×250 [225×300] 188×250 150×200 116×155 86×115 56×80
偏移中心:  -5    -4    -3    -2    -1   [0]    +1    +2    +3    +4    +5
```

- 容器 `overflow: hidden`，最两侧图片在窄屏自然裁切，形成"peek"效果
- `align-items: center` 纵向居中，形成山峰剪影
- 图片间距 8px gap，`object-fit: cover`，圆角 10px

**数据策略**：API limit 改为 15（buffer），过滤无 previewImage 的条目后取前 11。

---

## 三、技术实现

### 3.1 FanGallery 组件架构

**文件**: `client/src/components/Home/FanGallery.js`

组件 Props：
```jsx
<FanGallery
  items={array}              // 原始数据
  getImage={(item) => url}   // 提取图片 URL
  getAlt={(item) => string}  // 提取 alt 文字
  onItemClick={(item) => {}} // 点击回调
/>
```

**核心设计原则**：
- 视差动画完全走 `requestAnimationFrame + DOM ref`，**不触发 React re-render**，保证 60fps
- hover 尺寸变化用 `useState(hoveredIdx)`，触发 React re-render 重新计算 inline `style.width/height`，由 CSS `transition` 驱动过渡动画
- 两条更新路径分离，互不干扰

### 3.2 鼠标视差

```
mouseX 归一化: (clientX - rect.left) / rect.width - 0.5  →  [-0.5, +0.5]
mouseY 归一化: 同上

各图 X 偏移 = mouseX × (positionOffset × 22px)
各图 Y 偏移 = mouseY × -10px（全部轻微浮动）

平滑插值: currentPos = lerp(currentPos, targetPos, 0.08)  →  每帧收敛 8%
```

| 参数 | 值 | 说明 |
|---|---|---|
| `PARALLAX_X_STEP` | 22px | 每级位置的横向偏移系数 |
| `PARALLAX_Y_AMP` | 10px | 纵向浮动幅度 |
| `LERP_FACTOR` | 0.08 | 插值系数，值越小越丝滑 |

鼠标离开容器：`mouseTarget → {0, 0}`，lerp 自动将所有图片归位，无需额外重置逻辑。

### 3.3 Hover 最大化

**第一版**（scale 方案）：
```js
// RAF 循环中读取 hoveredIdx ref
// 被悬停: scale(1.22), 其余: scale(0.97)
```
问题：scale 只是视觉放大，实际宽高不变，布局空间不重分配，体验不够自然。

**第二版**（动态尺寸方案，最终采用）：

```js
function getSize(i, count, hoveredIdx) {
  const centerPos = Math.floor(count / 2);
  if (hoveredIdx < 0) {
    const offset = Math.abs(i - centerPos);
    return FAN_SIZES[Math.max(0, 5 - offset)]; // 默认对称
  }
  const dist = Math.abs(i - hoveredIdx);
  return FAN_SIZES[Math.max(0, 5 - dist)];     // 以悬停图为新中心
}
```

效果：**山峰中心随鼠标动态迁移**——鼠标停在哪张图，那张图就成为最大值（225×300），相邻图按距离递减，其余图获得较小尺寸。

```css
.fan-item {
  transition: width 0.32s cubic-bezier(0.22, 1, 0.36, 1),
              height 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
```

CSS transition 驱动 width/height 的平滑过渡，easing 选用 `cubic-bezier(0.22, 1, 0.36, 1)`（类 spring，快出慢收）。

### 3.4 z-index 策略

```js
const refPos = hIdx >= 0 ? hIdx : centerPos;
const zDist  = Math.abs(i - refPos);
el.style.zIndex = String(20 - zDist);
```

悬停图 z=20，向两侧每步减 1，保证最大图始终在视觉最前层。

---

## 四、CSS 新增

**文件**: `client/src/styles/gallery.css`（末尾追加）

```css
.fan-container     /* flex row, overflow:hidden, height:320px, gap:8px */
.fan-item          /* flex-shrink:0, relative, transition width/height */
.fan-img           /* 100% × 100%, object-fit:cover, border-radius:10px */
```

---

## 五、Home.js 改动

**文件**: `client/src/pages/Home.js`

| 改动点 | before | after |
|---|---|---|
| sref API limit | 8 | 15 |
| gallery API limit | 8 | 15 |
| sref 预览渲染 | `<div className="gallery-grid">` | `<FanGallery ...>` |
| gallery 预览渲染 | `<div className="gallery-grid">` | `<FanGallery ...>` |
| 新增 import | — | `useNavigate`, `FanGallery` |

---

## 六、交互完整描述

| 状态 | 表现 |
|---|---|
| 默认 | 11 张图对称分布，中心最大，两侧递减 |
| 鼠标进入容器 | 开始视差响应 |
| 鼠标移动 | 各图按距中心的偏移量横向位移（中心图不动，最外侧图位移 ±5×22=±110px） |
| hover 某图 | 该图尺寸变为 225×300，相邻图按距离递减，CSS transition 0.32s 过渡 |
| 鼠标离开容器 | 视差归位（lerp→0），尺寸恢复默认对称分布 |
| 点击图片 | 跳转详情页，携带 `state: { fromList: true }` |

---

## 七、涉及文件汇总

| 文件 | 操作 | 行数变化 |
|---|---|---|
| `client/src/components/Home/FanGallery.js` | 新建 | +109行 |
| `client/src/styles/gallery.css` | 追加 | +38行 |
| `client/src/pages/Home.js` | 修改 | +16行 / -10行 |

---

## 八、已知限制 & 后续优化方向

- **移动端**：无 hover 事件，静态展示默认对称布局，不触发视差（可接受）
- **图片数量不足 11**：自动从尺寸数组中段取值，仍保持对称，不会报错
- **图片加载**：`loading="lazy"`，首屏外图片延迟加载
- **后续可考虑**：touch 设备实现 tap-to-enlarge；图片加载骨架屏；infinite scroll 预取

---

## Result

- FanGallery 组件已实现并集成到首页两个预览 section
- 视差 + hover 最大化 + 点击跳转全部就绪
- 构建无报错（react-scripts build 输出仅 browserslist 警告）
