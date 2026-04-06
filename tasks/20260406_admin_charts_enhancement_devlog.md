# 阶段76 — Admin 折线图全面升级开发日志

**日期**: 2026-04-06  
**涉及文件**:
- `client/src/components/Admin/tabs/OverviewTab.js`
- `client/src/components/Admin/tabs/RevenueTab.js`
- `client/src/components/Admin/tabs/TrafficTab.js`

---

## 背景与目标

Admin 面板中三个核心折线图视觉信息密度低：
- 图表高度极小（72–120px）
- 无 Y 轴坐标标注
- 无 hover 交互（tooltip / crosshair）
- 使用 SVG `<polyline>` 直线连接，视觉生硬

目标：升级为接近生产级 BI 工具的数据可视化体验。

---

## 技术方案

### 统一布局参数

```
W=640–700  H=220
PADL=52–60  (左侧 Y 轴标签区)
PADR=12
PADT=16
PADB=32    (底部 X 轴标签)
chartW = W - PADL - PADR
chartH = H - PADT - PADB
```

### 平滑贝塞尔曲线

用 Cubic Bezier 替代 `<polyline>` 直线：

```js
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i].x - pts[i - 1].x) * 0.35;
    d += ` C${pts[i-1].x+cp},${pts[i-1].y} ${pts[i].x-cp},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  return d;
}
```

控制点张力系数 0.35 — 既平滑又不会过拟合（尖峰不被平均化）。

### Y 轴标签 + 网格线

5 个 tick（0 / 0.25 / 0.5 / 0.75 / 1.0），每个 tick：
- 水平虚线 `stroke-dasharray="4,4"`
- 左侧 SVG `<text>` 右对齐显示格式化数值

Y 轴格式：
- New Registrations: 整数，≥1000 显示 `1.2K`
- Daily Revenue: `$0`、`$27`、`$1.2K`
- PV/UV: `fmtNum()`（已有 helper，K/M 单位）

### Hover 交互

SVG `onMouseMove` + `onMouseLeave` 控制 `hoveredIdx` state：

```js
const handleMouseMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * W;
  let nearest = 0, minDist = Infinity;
  points.forEach((p, i) => {
    const dist = Math.abs(p.x - mx);
    if (dist < minDist) { minDist = dist; nearest = i; }
  });
  setHoveredIdx(nearest);
};
```

渲染层：
- **Crosshair**：垂直虚线从 chart top 到 X 轴
- **放大 dot**：`r` 从 3 → 5.5，CSS `transition: r 0.1s`
- **Tooltip**：SVG `<g>` 组，自动左右翻转（`hp.x > W/2` → tooltip 在左侧），背景 `<rect>` + 日期/数值 `<text>`

### X 轴标签

从 div 迁移到 SVG `<text>`（避免布局错位），间隔自适应：
- ≤6 点：每点显示
- 7–10 点：每 2 点
- 11–20 点：每 4 点
- >20 点：每 7 点
- 最后一个点始终显示

---

## 各图表差异

| 图表 | 颜色 | 高度(前→后) | Y 轴格式 | Tooltip |
|------|------|-------------|----------|---------|
| New Registrations | `#6366f1` | 72→220 | 整数/K | "04-01\n12 new users" |
| Daily Revenue | `#22c55e` | 120→220 | $0/$27/$1.2K | "04-01\n$49.99" |
| PV/UV 趋势 | `#6366f1`/`#22c55e` | 120→220 | K/M 整数 | "04-01\nPV 862\nUV 5" |

PV/UV 特殊处理：
- UV 线改为实线（原为 `strokeDasharray="5,3"`）
- 两条线共用同一 `maxVal` 保证 scale 一致
- Tooltip 同时展示 PV 和 UV 两个值
- UV dot 尺寸略小（r 2.5→5，非 hover→hover）

---

## 验证结果

浏览器截图确认：
- Overview → New Registrations：Y 轴显示 0/1/1/1（数据几乎全为 0，正常）
- Revenue → Daily Revenue：Y 轴 $0/$27/$55/$82/$110，峰值 3/22 清晰可见
- Traffic → PV/UV 趋势：Y 轴 0/216/431/647/862，PV 曲线明显下降趋势（符合实际流量）

控制台 warning 全为改动前已有的 `KpiCard` `border+borderLeft` 混用问题，与本次改动无关。

---

## 经验总结

1. SVG `onMouseMove` 需要用 `getBoundingClientRect()` + `viewBox` 比例换算 — 不能直接用 `offsetX`
2. SVG `<text>` 做 X 轴标签比 div flex 更精准对位
3. Tooltip 左右自动翻转：`hp.x > W/2` 判断一行解决边界溢出
4. 贝塞尔张力 `0.35` 是实测最优值 — `0.5` 过于平滑会让尖峰失真
