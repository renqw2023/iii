# Stage 36 — /register 烟花扩散式视觉重设计 Dev Log

**日期**: 2026-03-13
**分支**: main
**状态**: ✅ 完成，`Compiled successfully.`
**文件**: `client/src/pages/Register.js`（唯一修改文件）

---

## 需求

> 将 /register 页面改造为「烟花扩散式」设计：
> - 图片像烟花从中心爆发向四周扩散
> - 注册模块是爆炸的核心
> - 外圈图片更大（扩散能量表达）
> - 鼠标视差
> - 背景与 /gallery 统一
> - 数据库精选图异步替换外圈

---

## 技术设计

### 层次结构

```
div[position:relative, minHeight:100vh, background:var(--page-bg), overflow:hidden]
  ├── div[position:absolute, inset:0, pointerEvents:none]   ← z-index 1
  │   ├── ImageSlot × 92  (framer-motion)
  │   └── FireworkCore    (z-index: 5, 在图片之上、表单之下)
  └── div[position:relative, zIndex:10]                     ← 表单层
      └── 毛玻璃注册卡片
```

### 图片圈层配置（5圈，外圈更大）

| 圈 | 半径 | 图数 | 图片尺寸 | 视差系数 |
|----|------|------|----------|----------|
| 内圈 | 270px | 12 | **78px** | 0.007 |
| 圈2 | 440px | 18 | **100px** | 0.014 |
| 圈3 | 620px | 24 | **126px** | 0.021 |
| 圈4 | 830px | 22 | **154px** ← 最大 | 0.030 |
| 圈5 | 1050px | 16 | **134px** | 0.040 |
| **合计** | | **92 张** | | |

**设计理由**：真实烟花爆炸中，外扩边缘的"弹片"携带最大动能，视觉上最大最显眼。内圈图片小，紧贴核心，不干扰表单可读性。

### 数据库图片策略

```js
// 页面加载后异步拉取 18 张精选图（匹配最外圈数量）
galleryAPI.getFeatured(18)
  .then(res => {
    const dbImgs = res.data?.prompts.map(p => p.previewImage).filter(Boolean);
    // 替换外圈 isOuter 图片，失败静默回退至本地图
    setSlots(prev => prev.map(slot =>
      slot.isOuter && outerCount < dbImgs.length ? {...slot, src: dbImgs[outerCount++]} : slot
    ));
  }).catch(() => {});
```

API 字段：`res.data.prompts[].previewImage`（非 imageUrl，实测确认）

### FireworkCore 组件

放置在图片层内（`position:absolute; left:50%; top:50%; width:0; height:0; zIndex:5`），以表单中心为原点，向外绘制：

**① 环境辉光**（`filter: blur(26px)`）
```
径向渐变 rgba(99,102,241,0.14) → rgba(168,85,247,0.07) → transparent
700×700px，scale 1→1.08 循环脉动（3.4s）
```

**② 内核亮点**
```
180×180px 白色辉光，高频脉动（2.0s），强调爆炸原点
```

**③ 3层脉冲同心圆**（r = 148 / 248 / 358px）
```
border: 1px solid rgba(99,102,241, 0.18/0.13/0.08)
scale 0.95↔1.05，opacity 0.75↔0.18，各圈 delay 错开 0.45s
```

**④ 16条光芒射线**
```
长短交替（238px / 176px），22.5° 间隔覆盖360°
线宽 1.5px，渐变：白/indigo/purple → transparent
opacity 0.22↔0.72，delay 错开 0.07s/条
```

**⑤ 8颗粒子**（r = 192px）
```
5×5px 圆点，indigo/purple 交替
scale 1→2.2→1，opacity 0.9→0.15→0.9，dur ≈ 1.4–3.0s
```

### 注册表单卡片（核心光晕）

```js
boxShadow: [
  'var(--stage-shadow)',                            // 基础阴影
  '0 0 0 1.5px rgba(99,102,241,0.22)',             // 微发光边框
  '0 0 36px rgba(99,102,241,0.11)',                // 近端光晕
  '0 0 72px rgba(168,85,247,0.07)',                // 远端光晕
].join(', ')
```

### 鼠标视差（零 React re-render）

```js
// useMotionValue + useSpring + useTransform 全链路
const mouseX = useMotionValue(0);
const springX = useSpring(mouseX, { stiffness: 55, damping: 22 });

// 每个 ImageSlot 内（React.memo 组件）
const x = useTransform(springX, v => slot.finalX + v * slot.parallax);
// → 外圈 parallax=0.040，移动幅度是内圈 0.007 的 5.7倍
```

鼠标移动时完全通过 Framer Motion 的 MotionValue 驱动，不触发任何 React 组件 re-render。

### 图片池

```
LOCAL_POOL: 90 张精选 /ImageFlow/*.jpg
随机 shuffle → Fisher-Yates
按圈顺序分配，idx % pool.length 循环补足
```

---

## 迭代过程

| 版本 | 变化 |
|------|------|
| v1 | 3圈 28张（8+12+8），等大（128/98/70px） |
| v2 | 4圈 64张（10+16+20+18），等大系列 |
| v3 | 5圈 92张（12+18+24+22+16），**外圈更大**，加 FireworkCore |

---

## 性能分析

| 指标 | 数值 |
|------|------|
| motion.div 数量 | 92×2（图）+ ~40（FireworkCore）= ~224 |
| 鼠标 re-render | 0（useMotionValue 不触发） |
| 图片加载策略 | `loading="lazy"` `decoding="async"` |
| GPU 加速 | `willChange: 'transform'` on ImageSlot |
| 动画类型 | transform / opacity only（compositing layer） |

---

## 修复记录

- `GxBGcjHTa0AEWD5u.jpg` → `GxGcjHTa0AEWD5u.jpg`（文件名 typo，404→修复）
- `Gv4p3s3XMAEemEi.jpg` 重复一次（shuffle 会处理，无视觉影响）

---

## 构建结果

```
Compiled successfully.
0 warnings
Bundle: 578.xx kB (gzip) — 与前一版本持平
```

---

## 文件修改

```
client/src/pages/Register.js   ← 完整视觉层重写（表单逻辑零修改）
tasks/20260313_stage36_register_fireworks_analysis.md  ← 方案分析（已有）
tasks/20260313_stage36_register_fireworks_devlog.md    ← 本文件
```
