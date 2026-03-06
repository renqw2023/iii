# 阶段18 开发日志 — 首页吸引力改造

**日期：** 2026-03-06
**分支：** main
**涉及文件：** `client/src/components/Home/Hero.js` · `client/src/i18n/modules/home.js` · `client/src/styles/gallery.css` · `client/src/pages/Home.js`

---

## 背景

首页存在四个用户体验短板，经确认后实施改造：

| 问题 | 现象 |
|---|---|
| Hero 标语空洞 | "Inspire • Imagine • Innovate" 是硬编码英文口号，不传达内容价值 |
| 数字统计无动感 | 10K+ / 5K+ / 100K+ 静态文字，首屏无视觉活力 |
| 预览面板白边过大 | `padding: 2rem` 导致三个卡片面板视觉上"空旷" |
| 缺少社交证明 | 三个 section 没有任何活跃感标识 |

---

## 变更 A — i18n 更新（`client/src/i18n/modules/home.js`）

### 修改 `hero.slogan`
- **ZH 旧值：** `"激发灵感 • 释放想象 • 推动创新"`
- **ZH 新值：** `"风格参数 · 提示词库 · AI 视频 — 一站发现"`
- **EN 旧值：** `"Inspire • Imagine • Innovate"`
- **EN 新值：** `"Sref Styles · Prompt Library · AI Video — All in One"`
- **JA 新增：** `"Sref · プロンプト · AI動画 — 一箇所で発見"`

### 修改 `hero.subtitle`
- **ZH 旧值：** `"探索精美的 Midjourney 风格参数，激发你的创作灵感"`
- **ZH 新值：** `"每日精选更新 · 三语言支持 · 完全免费探索"`
- **EN 旧值：** `"Explore beautiful Midjourney style parameters and inspire your creativity"`
- **EN 新值：** `"Curated daily · Trilingual · Free to explore"`
- **JA 新值：** `"毎日キュレーション · 三言語対応 · 完全無料"`

### 新增 `hero.randomBtn`
- ZH: `"随机发现"` / EN: `"Surprise Me"` / JA: `"ランダム探索"`

### 新增 `latestSref/Gallery/Video.activity`
- ZH: `"今日更新"` / EN: `"Updated today"` / JA: `"本日更新"`（三个 section 各自独立 key）

---

## 变更 B — Hero.js 标语结构调整

**文件：** `client/src/components/Home/Hero.js`

### 移除硬编码英文口号
```jsx
// 删除：
<p className="text-2xl sm:text-3xl font-semibold text-primary-600 mb-2">
  Inspire • Imagine • Innovate
</p>
```
改为单行 `hero.slogan`（内容具体，支持 i18n 三语切换），字号从 `text-2xl sm:text-3xl` 降为 `text-lg sm:text-xl`，视觉层级更合理。

### 移除多余的 subtitle
原来 `hero.slogan` 与 `hero.subtitle` 双行都显示，现在：
- `hero.slogan`：一行内容导向描述（较大字）
- `hero.subtitle`：一行行动号召（较小字）
- 去掉了原先独占一行的大段描述 `<p className="text-xl sm:text-2xl">`

---

## 变更 C — 随机发现按钮 + Lightbox

**新增 import：** `Shuffle`, `X` from lucide-react；`useNavigate` from react-router-dom

**新增 state：**
```js
const [randomImg, setRandomImg] = useState(null);
```

**第三个 CTA 按钮（Ghost 风格）：**
```jsx
<button onClick={() => {
  const idx = Math.floor(Math.random() * backgroundImages.length);
  setRandomImg(backgroundImages[idx]);
}} style={{ border: '1.5px solid rgba(100,116,139,0.35)', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.7)', color: '#475569', backdropFilter: 'blur(4px)' }}>
  <Shuffle /> {t('home.hero.randomBtn')}
</button>
```

**Lightbox 实现：**
- `position: fixed; inset: 0` 全屏遮罩，`background: rgba(0,0,0,0.75)`
- 内部容器 `max-width: 90vw; max-height: 90vh`
- 右上角 `<X>` 关闭按钮（绝对定位）
- 底部 footer 含 "浏览作品 →" 链接，点击后同步关闭 lightbox 并跳转 `/explore`
- 点击遮罩背景也可关闭
- CSS class：`.hero-lightbox` / `.hero-lightbox-inner` / `.hero-lightbox-close` / `.hero-lightbox-footer` / `.hero-lightbox-link`

---

## 变更 D — Count-Up 动画

**新增 hook（Hero.js 组件外定义）：**
```js
const useCountUp = (target, duration = 1800) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
};

const formatCount = (val) => val >= 1000 ? Math.round(val / 1000) + 'K+' : val + '+';
```

**三个统计值：**
```js
const posts = useCountUp(10000);   // → "10K+"
const users = useCountUp(5000);    // → "5K+"
const shares = useCountUp(100000); // → "100K+"
```

动画在组件 mount 时立即触发，duration 1800ms，ease-out cubic 缓动（先快后慢），视觉上从 0 流畅跳动到目标值。

---

## 变更 E — 预览区白边压缩（`client/src/styles/gallery.css`）

| 选择器 | 属性 | 旧值 | 新值 |
|---|---|---|---|
| `.home-dark-area` | `padding` | `2rem 2.5rem 4rem` | `1.5rem 2rem 3rem` |
| `.home-content-section` | `margin` | `0 0 2rem` | `0 0 1.25rem` |
| `.home-content-section` | `padding` | `2rem` | `1.25rem 1.5rem` |
| `.home-content-section .home-section-header` | `margin-bottom` | `1.5rem`（继承） | `0.875rem`（覆盖） |

---

## 变更 F — Lightbox CSS（`client/src/styles/gallery.css` 末尾追加）

```css
.hero-lightbox { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
.hero-lightbox-inner { position: relative; background: #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.6); max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; }
.hero-lightbox-img { max-width: 90vw; max-height: 80vh; object-fit: contain; display: block; }
.hero-lightbox-close { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.6); border: none; cursor: pointer; color: #fff; }
.hero-lightbox-footer { padding: 0.75rem 1rem; display: flex; justify-content: flex-end; }
.hero-lightbox-link { color: #818cf8; font-size: 0.875rem; font-weight: 600; text-decoration: none; }
```

---

## 变更 G — 活跃感 Badge（`client/src/pages/Home.js`）

三个预览 section（Sref / Gallery / Video）的标题 `<div>` 内，`<h2>` 下方各加：

```jsx
<span className="home-section-activity-badge">● {t('home.latestSref.activity')}</span>
```

对应 CSS（`.home-section-activity-badge`）：
```css
display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; color: #22c55e; letter-spacing: 0.02em; margin-top: 0.2rem;
```

---

## 验证结果

| 验证点 | 状态 |
|---|---|
| 首页加载数字从 0 跳动到 10K+/5K+/100K+ | ✅ |
| 点击「Surprise Me」弹出 lightbox | ✅ |
| lightbox 关闭（✕/遮罩/浏览全部）均正常 | ✅ |
| 三个预览面板间距明显压缩 | ✅ |
| 每个面板标题下绿色「● Updated today」badge | ✅ |
| 语言切换：EN/ZH/JA 所有新文案正确响应 | ✅ |
| DevTools 控制台：0 个 error / warn | ✅ |

---

## Result

阶段18 全部 7 项变更已完成并通过浏览器验证。首页 Hero 区信息密度更高、视觉活力增强，预览区布局更紧凑，社交证明感提升。
