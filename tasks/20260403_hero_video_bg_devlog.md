# 阶段75 — Hero 左列视频背景开发日志

**日期**: 2026-04-03  
**影响文件**: `client/src/components/Home/Hero.js`, `client/public/hero-bg.mp4`  
**提交**: 见 git log

---

## 背景与目标

首页 Hero 左列（38% 宽度）原本使用静态 CSS 渐变背景（暗色模式：深紫调径向渐变 + `#08000f`；亮色模式：粉紫/橙色多段渐变）。用户希望将本地视频文件作为左列背景，提升视觉吸引力，同时：

- **无缝循环**：视频仅 8 秒，原生 `loop` 属性存在 0-2 帧硬切，需消除可见衔接点
- **水印遮罩**：视频右下角有水印，用 CSS 渐变遮盖
- **双模式支持**：亮色/暗色模式均显示视频背景（亮色为主要使用模式）
- **文字可读性**：半透明 overlay 保证标题、按钮、统计数字清晰可读

---

## 视频规格

| 属性 | 值 |
|------|---|
| 原始路径 | `E:\pm01\video.mp4` |
| 公开路径 | `/hero-bg.mp4`（`client/public/`） |
| 分辨率 | 720×1280（竖版 9:16） |
| 时长 | 8 秒 |
| 编码 | H.264, 24fps, ~881 kbps |
| 文件大小 | ~1 MB |

竖版比例完美契合 Hero 左列的高窄形态，`object-fit: cover` 自动裁切填满。

---

## 技术方案

### 1. 视频部署

CRA（Create React App）约定：`client/public/` 目录下的文件直接映射到根 URL，无需 webpack 处理，`src="/hero-bg.mp4"` 即可访问。

### 2. 双 video 交叉淡化（无缝循环）

原生 `loop` 在大多数浏览器存在短暂硬切（1-2 帧黑帧或跳帧）。解决方案：

```
Video A (opacity=1) 播放中
         │
         ▼ currentTime >= 7.0s
Video B 从 0s 开始播放，opacity 0→1（0.8s CSS transition）
Video A opacity 1→0
         │
         ▼ Video B currentTime >= 7.0s
Video A 从 0s 重新播放，opacity 0→1
Video B opacity 1→0
         │ 无限循环 ↩
```

**核心代码**（`Hero.js`）：

```js
const videoARef = useRef(null);
const videoBRef = useRef(null);

useEffect(() => {
  const vA = videoARef.current;
  const vB = videoBRef.current;
  if (!vA || !vB) return;

  let active = 'a';
  const CROSSFADE_AT = 7.0; // 距结尾 1 秒开始交叉

  const onAUpdate = () => {
    if (active === 'a' && vA.currentTime >= CROSSFADE_AT) {
      active = 'b';
      vB.currentTime = 0;
      vB.play().catch(() => {});
      vB.style.opacity = '1';
      vA.style.opacity = '0';
    }
  };
  const onBUpdate = () => {
    if (active === 'b' && vB.currentTime >= CROSSFADE_AT) {
      active = 'a';
      vA.currentTime = 0;
      vA.play().catch(() => {});
      vA.style.opacity = '1';
      vB.style.opacity = '0';
    }
  };

  vA.addEventListener('timeupdate', onAUpdate);
  vB.addEventListener('timeupdate', onBUpdate);
  vA.play().catch(() => {});

  return () => {
    vA.removeEventListener('timeupdate', onAUpdate);
    vB.removeEventListener('timeupdate', onBUpdate);
    vA.pause();
    vB.pause();
  };
}, []);
```

CSS 过渡在 `.hero-video-bg` 中定义：
```css
.hero-video-bg {
  transition: opacity 0.8s ease;
}
```

`timeupdate` 事件约每 250ms 触发一次，`active` 变量防止重复触发。

### 3. DOM 层级

```
split-hero-left (position: relative)
  ├── <video> A        position: absolute, z-index: 0, opacity: 1（初始可见）
  ├── <video> B        position: absolute, z-index: 0, opacity: 0（初始隐藏）
  ├── overlay div      position: absolute, z-index: 1（可读性遮罩）
  ├── watermark div    position: absolute, z-index: 2（右下角水印遮罩）
  ├── orb (sun/moon)   position: absolute, z-index: 20（主题切换球）
  └── left-content     position: relative,  z-index: 3（文字+按钮，从1改为3）
```

`.split-hero-left-content` 的 `z-index` 从原来的 `1` 改为 `3`，确保浮于 overlay 之上。

### 4. 双模式 Overlay

| 模式 | Overlay 颜色 | 效果 |
|------|-------------|------|
| 暗色 | `rgba(8,0,15,0.55) → rgba(8,0,15,0.3)` 向右渐淡 | 与 `#08000f` 融合，营造深邃感 |
| 亮色 | `rgba(255,255,255,0.6) → rgba(255,255,255,0.35)` 向右渐淡 | 磨砂玻璃感，文字清晰可读 |

左侧不透明度高于右侧，因为文字内容集中在左侧，右侧靠近视频右边缘，透出更多视频画面。

### 5. 水印遮罩

```css
/* 右下角 180×70px 渐变，颜色随主题变化 */
暗色: linear-gradient(135deg, transparent 30%, rgba(4,0,8,0.92) 100%)
亮色: linear-gradient(135deg, transparent 30%, rgba(240,240,240,0.95) 100%)
```

渐变方向 `135deg`（右上→左下）自然融合，无硬边。

### 6. inline background 变更

原 `split-hero-left` 的 `style={{ background: isDark ? ... : ... }}` 改为 `'transparent'`，视觉效果完全由视频层和 overlay 层承担。`.split-hero` 的根背景色 `#08000f` 作为视频加载前的兜底色。

---

## 已知限制 & 后续优化方向

| 项目 | 说明 |
|------|------|
| 移动端 | Hero 左列在移动端不展示（已由 Phase 70/71 的 3-tab Dock 替代），视频不影响移动体验 |
| 视频加载 | `preload="auto"` 在移动网络可能消耗流量；如需优化可改为 `preload="metadata"` + Intersection Observer 触发 |
| 水印精确位置 | 当前遮罩为固定 180×70px，若视频更换需重新测量水印位置微调尺寸 |
| 4K 部署 | 视频 ~1MB，适合当前直接放 public/；若后续引入 CDN 可替换 src 为 CDN URL |
| 交叉点微调 | `CROSSFADE_AT = 7.0`（距尾 1 秒）；若视频内容在尾部有突变可调至 6.5 |

---

## 验证记录

- ✅ 亮色模式：视频背景显示，文字清晰，无 console 错误
- ✅ 暗色模式：视频背景显示，深色叠加，风格统一
- ✅ 8 秒后交叉淡化：循环无明显硬切
- ✅ 右下角水印：被渐变遮罩覆盖
- ✅ z-index 层级：文字/按钮/orb 均正常显示于视频之上
