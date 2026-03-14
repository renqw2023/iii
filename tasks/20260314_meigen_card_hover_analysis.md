# MeiGen.ai 图片卡片 Hover 交互逆向分析

**分析日期**: 2026-03-14
**目标网站**: https://www.meigen.ai/
**分析方法**: Chrome DevTools MCP + JavaScript DOM/CSSOM 运行时探查 + React Fiber 树遍历
**分析者**: reki / Claude

---

## 一、总结

MeiGen.ai 的图片卡片 hover 交互由以下技术驱动：

| 技术 | 用途 |
|------|------|
| **Tailwind CSS `group/group-hover`** | 主控制机制：hover 触发子元素 opacity 切换 |
| **`opacity-0` → `group-hover:opacity-100`** | 所有覆盖层均常驻 DOM，仅用 opacity 显隐 |
| **`transition-opacity duration-300`** | 300ms 淡入淡出动画 |
| **`backdrop-blur-md`** | 按钮毛玻璃效果 |
| **JavaScript `mousemove`** | 鼠标跟踪光晕（radial-gradient inline style 更新） |
| **Next.js + Tailwind + shadcn/ui** | 整体技术栈 |

---

## 二、卡片 DOM 完整结构

### 2.1 卡片根容器

```html
<div class="group relative rounded-xl bg-card text-card-foreground cursor-pointer overflow-hidden">
```

**关键设计**：
- `group` — Tailwind group 父级，所有子元素的 `group-hover:` 前缀以此触发
- `relative` — 为绝对定位的覆盖层提供定位上下文
- `overflow-hidden` — 确保圆角不被子元素溢出破坏
- `cursor-pointer` — 整个卡片可点击

### 2.2 完整层次架构

```
div.group.relative.rounded-xl.overflow-hidden          ← [卡片根]
│
├── [L1] div.pointer-events-none.absolute.inset-0      ← 鼠标光晕层（JS驱动）
│         .opacity-0.transition-opacity.duration-300
│         .group-hover:opacity-100
│         (background: radial-gradient 由 mousemove 实时更新)
│
├── [L2] div.absolute.inset-px.rounded-xl.bg-card      ← 卡片背景层
│         (提供白色/深色底，确保光晕层有对比)
│
├── [L3] div.pointer-events-none.absolute.inset-px     ← 边框高光层
│         .rounded-xl.opacity-0
│         .transition-opacity.duration-300
│         .group-hover:opacity-100
│         (hover 时卡片四周出现 1px 亮边)
│
└── [L4] div.relative.overflow-hidden.rounded-xl       ← 图片+内容主容器
          │
          ├── img.absolute.inset-0.h-full.w-full        ← 主图（absolute fill）
          │     .object-cover
          │
          ├── div.absolute.inset-0                      ← 渐变遮罩层
          │     .bg-gradient-to-t
          │     .from-black/80.via-black/20.to-transparent
          │     .opacity-0.transition-opacity.duration-300
          │     .group-hover:opacity-100
          │
          └── div.absolute.bottom-4.left-4.right-4      ← 底部操作区
                .flex.items-end.justify-between
                .opacity-0.transition-opacity.duration-300
                .group-hover:opacity-100
                │
                ├── [左侧] 作者信息 + CTA 按钮
                │
                └── [右侧] 功能图标按钮组
```

---

## 三、底部操作区详细拆解

### 3.1 左侧 — 作者信息区

```html
<div class="flex flex-col gap-2.5">

  <!-- 作者 -->
  <a class="flex items-center gap-2 transition-opacity hover:opacity-80"
     href="https://twitter.com/username">
    <img class="h-8 w-8 rounded-full object-cover bg-muted" />  <!-- 32px 头像 -->
    <div class="flex flex-col">
      <div class="flex items-center gap-1">
        <span class="text-sm font-semibold text-white drop-shadow-md">作者名</span>
      </div>
      <span class="text-xs text-white/70">@handle</span>
    </div>
  </a>

  <!-- 统计数据 -->
  <div class="flex items-center gap-3 text-xs text-white/80 ml-1">
    <span class="flex items-center gap-1">
      <svg><!-- Heart 心形图标 --></svg>
      540                                    <!-- X(Twitter) 点赞数 -->
    </span>
    <span class="flex items-center gap-1">
      <svg><!-- BarChart3 柱状图图标 --></svg>
      22.9K                                  <!-- 浏览次数 -->
    </span>
    <span>8d ago</span>                      <!-- 相对时间 -->
  </div>

  <!-- 主 CTA 按钮 -->
  <button class="flex w-fit items-center gap-1.5 rounded-lg
                  bg-white px-3 py-1.5 text-xs font-medium text-black
                  transition-colors hover:bg-white/90">
    <svg><!-- ArrowLeftRight / Shuffle 图标 --></svg>
    使用创意
  </button>

</div>
```

**"使用创意" 按钮功能**：将该卡片的 prompt 填入右侧生成面板，触发文生图流程。

### 3.2 右侧 — 功能按钮组

```html
<div class="flex items-center gap-2">

  <!-- 按钮1：收藏/存入集合 -->
  <button class="rounded-lg p-2 backdrop-blur-md transition-colors
                  bg-foreground/10 text-white hover:bg-foreground/20">
    <svg><!-- Layers 图层叠加图标（3层矩形） --></svg>
  </button>

  <!-- 按钮2：查看原帖（X/Twitter） -->
  <a class="rounded-lg bg-foreground/10 p-2 text-white backdrop-blur-md
             transition-colors hover:bg-foreground/20"
     href="https://twitter.com/...原帖链接...">
    <svg><!-- X(Twitter) Logo --></svg>
  </a>

</div>
```

---

## 四、各元素功能说明

| 元素 | 图标（Lucide/自定义） | 功能 | 样式特点 |
|------|----------------------|------|---------|
| 作者头像+名字 | — | 跳转 Twitter 用户主页 | 白色文字 + drop-shadow-md |
| ❤️ 点赞数 | `Heart`（heart icon） | 展示原帖 X 点赞数（仅展示） | text-white/80 text-xs |
| 📊 浏览数 | `BarChart3` | 展示原帖 X 浏览数（仅展示） | text-white/80 text-xs |
| 时间 | — | 相对时间（"8d ago"） | text-white/80 text-xs |
| **使用创意** | `ArrowLeftRight`/Shuffle | **核心 CTA**：prompt 填入生成面板 | bg-white text-black，无毛玻璃 |
| **🗂 收藏** | `Layers`（三层叠加） | 保存到收藏夹 | backdrop-blur-md，bg-foreground/10 |
| **𝕏 来源** | X Logo（自定义 SVG） | 跳转原 Twitter/X 帖子 | backdrop-blur-md，A 链接 |

---

## 五、CSS 技术解析

### 5.1 Tailwind group/group-hover 机制

```css
/* Tailwind 编译后等效于 */
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
```

所有覆盖层**常驻 DOM**，初始 `opacity: 0`，hover 时切换为 `opacity: 1`。
**无 JS 事件监听控制显隐**，纯 CSS 状态机。

### 5.2 渐变遮罩

```css
background: linear-gradient(to top,
  rgba(0,0,0,0.80) 0%,    /* from-black/80 */
  rgba(0,0,0,0.20) 50%,   /* via-black/20 */
  transparent     100%    /* to-transparent */
);
```

作用：确保底部按钮和文字在任何图片背景下都清晰可读。

### 5.3 毛玻璃按钮

```css
/* bg-foreground/10 + backdrop-blur-md */
background-color: rgba(0, 0, 0, 0.10);   /* 暗色 10% 透明背景 */
backdrop-filter: blur(12px);              /* 背景虚化 */
```

毛玻璃效果使按钮融入图片，同时保持视觉层次感。

### 5.4 鼠标光晕（JavaScript 驱动）

光晕层（L1）的 background 在 DOM 中为空（`none`），由 JS `mousemove` 事件实时更新 inline style：

```javascript
// 推测实现（Next.js 组件内）
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  glowLayer.style.background =
    `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
});

card.addEventListener('mouseleave', () => {
  glowLayer.style.background = 'none';
});
```

效果：鼠标在卡片上移动时，出现跟随鼠标的柔和白色光晕，增强立体感。

### 5.5 动画参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 过渡属性 | `opacity` | 只过渡透明度，不影响布局 |
| 过渡时长 | `300ms` | `duration-300` |
| 过渡函数 | `ease` (默认) | Tailwind transition 默认 |
| 图片尺寸 | `object-cover` | 填充裁剪，不变形 |

---

## 六、React 组件结构（推断）

基于 React Fiber 树分析，卡片组件层次：

```
MasonryGrid（ul）
  └── CardWrapper（li）
        └── PromptCard（div.group.relative）  ← 本次分析的组件
              ├── SpotlightGlow              （L1，JS控制）
              ├── CardBackground             （L2）
              ├── BorderHighlight            （L3）
              └── ImageContainer             （L4）
                    ├── <img>
                    ├── GradientOverlay
                    └── ActionBar
                          ├── AuthorInfo
                          │     ├── Avatar
                          │     ├── Username
                          │     ├── Stats（likes, views, time）
                          │     └── UsePromptButton
                          └── ActionButtons
                                ├── SaveButton（Layers icon）
                                └── SourceLink（X icon）
```

---

## 七、与 III.PICS 现状对比

| 功能 | MeiGen.ai | III.PICS 现状 |
|------|-----------|--------------|
| hover 渐变遮罩 | ✅ 从底部黑色渐变 | ❌ 无 |
| "使用创意" CTA | ✅ bg-white 按钮 + 图标 | ✅ 有（"Use Idea"/"Regenerate"） |
| 作者头像+名字 | ✅ hover 时显示 | ❌ 无 |
| 点赞/浏览统计 | ✅ 展示原帖数据 | ❌ 无 |
| 毛玻璃功能按钮 | ✅ backdrop-blur-md | ❌ 无 |
| 收藏按钮（Layers） | ✅ | ❌ 无 |
| 来源链接（X 图标） | ✅ | ❌ 无 |
| 鼠标跟踪光晕 | ✅ JS radial-gradient | ❌ 无 |
| 边框高光 | ✅ | ❌ 无 |
| 300ms 淡入动画 | ✅ | 部分（现有按钮无动画） |

---

## 八、复刻实现路线（Stage 38 规划）

### 最小可行版（MVP）

```jsx
// GalleryCard / SrefCard 通用 Hover Overlay 组件
const CardHoverOverlay = ({ prompt, author, likes, views, time, sourceUrl }) => (
  <>
    {/* 渐变遮罩 */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20
                    to-transparent opacity-0 transition-opacity duration-300
                    group-hover:opacity-100 pointer-events-none" />

    {/* 底部操作区 */}
    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between
                    opacity-0 transition-opacity duration-300 group-hover:opacity-100">

      {/* 左：作者 + stats + CTA */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <img src={author.avatar} className="h-7 w-7 rounded-full object-cover" />
          <div>
            <p className="text-xs font-semibold text-white drop-shadow-sm">{author.name}</p>
            <p className="text-[10px] text-white/60">{author.handle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/70 ml-0.5">
          <span>❤️ {likes}</span>
          <span>👁 {views}</span>
          <span>{time}</span>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5
                           text-xs font-medium text-black hover:bg-white/90 transition-colors">
          <ArrowLeftRight size={12} />
          使用创意
        </button>
      </div>

      {/* 右：功能按钮 */}
      <div className="flex flex-col gap-1.5">
        <button className="rounded-lg p-1.5 backdrop-blur-md bg-white/10
                           text-white hover:bg-white/20 transition-colors">
          <Layers size={14} />
        </button>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank"
             className="rounded-lg p-1.5 backdrop-blur-md bg-white/10
                        text-white hover:bg-white/20 transition-colors">
            <XIcon size={14} />
          </a>
        )}
      </div>
    </div>
  </>
);

// 卡片根容器必须加 group + relative + overflow-hidden
<div className="group relative rounded-xl overflow-hidden cursor-pointer">
  <img ... />
  <CardHoverOverlay {...props} />
</div>
```

### 进阶版（加鼠标光晕）

```javascript
// useSpotlight hook
const useSpotlight = (ref) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const glow = el.querySelector('[data-glow]');

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      glow.style.background =
        `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.10) 0%, transparent 65%)`;
      glow.style.opacity = '1';
    };
    const onLeave = () => { glow.style.opacity = '0'; };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [ref]);
};
```

---

## 九、关键设计原则（可复用）

1. **覆盖层常驻 DOM** — 用 `opacity` 控制而非 `display/visibility`，避免 hover 闪烁
2. **pointer-events-none** — 光晕和装饰层设置此属性，不干扰下层点击事件
3. **`overflow-hidden` 在根容器** — 确保所有绝对定位子元素被裁切到圆角内
4. **`backdrop-blur-md` 慎用** — 毛玻璃性能开销较大，仅用于图标按钮（小面积）
5. **统一 300ms 过渡** — 所有 hover 动画用相同时长，视觉一致性
6. **文字可读性** — 在图片上叠加文字必须用 `drop-shadow-md` 或 `text-shadow`，确保各种图片背景下均可读

---

## 相关文件

- MeiGen 首页分析：`tasks/20260306_meigen_analysis.md`
- 2K/4K 功能分析：`tasks/20260313_meigen_2k4k_analysis.md`
- 下一阶段复刻计划：`tasks/todo.md`（Stage 38）
