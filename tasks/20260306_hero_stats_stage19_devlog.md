# 阶段19 开发日志 — Hero 统计数据真实化 & CTA 精简

**日期：** 2026-03-06
**分支：** main
**涉及文件：** `client/src/components/Home/Hero.js` · `client/src/i18n/modules/home.js`

---

## 背景与需求

阶段18 完成首页吸引力改造后，用户提出进一步优化：

1. **统计数据失真** — `10K+` / `5K+` / `100K+` 均为虚构数字，无法建立真实信任感
2. **统计标签空洞** — "精美作品" / "创作者" / "参数分享" 未指向具体平台
3. **CTA 按钮冗余** — "开始创作"（链接 `/create`）与"浏览作品"（链接 `/explore`）对首页访客过于宽泛，需要移除，只保留"随机发现"钩子

---

## 数据采集

通过浏览器内 fetch 调用真实 API，获取各平台实际内容数量：

```js
// 调用结果
sref API  → pagination.total = 1306   // Midjourney --sref 风格参数
gallery stats API → models:
    { name: "nanobanana", count: 100 }  // NanoBanana Pro 提示词
    { name: "gptimage",   count: 328 }  // GPT Image 提示词
```

**原始 API 响应节选：**
```json
{
  "total": 428,
  "models": [
    { "name": "gptimage",   "count": 328 },
    { "name": "nanobanana", "count": 100 }
  ]
}
```

> Seedance 视频（584条）未纳入 Hero 统计，因用户指定展示三大图片生成平台。

---

## 变更 A — i18n 统计标签替换（三个语种）

**文件：** `client/src/i18n/modules/home.js`

| locale | 旧 key → 旧值 | 新 key → 新值 |
|---|---|---|
| zh-CN | `stats.posts` → "精美作品" | `stats.midjourney` → "Midjourney 风格" |
| zh-CN | `stats.users` → "创作者" | `stats.nanobanana` → "NanoBanana Pro" |
| zh-CN | `stats.shares` → "参数分享" | `stats.gptimage` → "GPT Image" |
| en-US | `stats.posts` → "Beautiful Works" | `stats.midjourney` → "Midjourney Styles" |
| en-US | `stats.users` → "Creators" | `stats.nanobanana` → "NanoBanana Pro" |
| en-US | `stats.shares` → "Parameter Shares" | `stats.gptimage` → "GPT Image" |
| ja-JP | `stats.posts` → "美しい作品" | `stats.midjourney` → "Midjourney スタイル" |
| ja-JP | `stats.users` → "クリエイター" | `stats.nanobanana` → "NanoBanana Pro" |
| ja-JP | `stats.shares` → "パラメータ共有" | `stats.gptimage` → "GPT Image" |

> NanoBanana Pro / GPT Image 为品牌名，三语言保持一致不翻译。

---

## 变更 B — Hero.js 统计目标值 & 图标

**文件：** `client/src/components/Home/Hero.js`

### Count-up 目标值
```js
// 旧（虚构数字）
const posts  = useCountUp(10000);   // → "10K+"
const users  = useCountUp(5000);    // → "5K+"
const shares = useCountUp(100000);  // → "100K+"

// 新（真实数据）
const mjCount = useCountUp(1306);   // → "1K+"   (Midjourney sref)
const nbCount = useCountUp(100);    // → "100+"  (NanoBanana Pro)
const gpCount = useCountUp(328);    // → "328+"  (GPT Image)
```

`formatCount` 函数保持不变：`val >= 1000 ? Math.round(val/1000) + 'K+' : val + '+'`

### 图标替换
| 位置 | 旧图标 | 新图标 | 背景色 |
|---|---|---|---|
| 第1格（Midjourney） | `Palette` (primary) | `Wand2` (primary) | `bg-primary-100` |
| 第2格（NanoBanana Pro） | `Users` (secondary) | `Banana` (yellow) | `bg-yellow-100` |
| 第3格（GPT Image） | `TrendingUp` (green) | `ImageIcon` (green) | `bg-green-100` |

### 统计 label 键名更新
```jsx
// 旧
{t('home.hero.stats.posts')}
{t('home.hero.stats.users')}
{t('home.hero.stats.shares')}

// 新
{t('home.hero.stats.midjourney')}
{t('home.hero.stats.nanobanana')}
{t('home.hero.stats.gptimage')}
```

---

## 变更 C — 移除 CTA 按钮

**文件：** `client/src/components/Home/Hero.js`

### 移除的两个按钮
```jsx
// 移除：
<Link to="/create" className="btn btn-primary text-lg px-8 py-4 group">
  {t('home.hero.createButton')}
  <ArrowRight className="w-5 h-5 ml-2 ..." />
</Link>

<Link to="/explore" className="btn btn-secondary text-lg px-8 py-4">
  {t('home.hero.exploreButton')}
</Link>
```

### 保留的按钮
```jsx
// 仅保留：
<button onClick={...} /* Surprise Me / 随机发现 / ランダム探索 */>
  <Shuffle /> {t('home.hero.randomBtn')}
</button>
```

**保留理由：** "随机发现"是有探索欲驱动的钩子按钮，直接触发图片 lightbox，交互反馈即时。"开始创作"和"浏览作品"的落地页对首次访客过于通用，精简后 Hero 聚焦感更强。

**import 检查：** `ArrowRight` 仍在 lightbox footer（"浏览作品 →"链接）中使用，import 保留不删。

---

## 验证结果

| 验证点 | 期望 | 实际 |
|---|---|---|
| Midjourney 数字 | 从 0 动画到 1K+ | ✅ |
| NanoBanana Pro 数字 | 从 0 动画到 100+ | ✅ |
| GPT Image 数字 | 从 0 动画到 328+ | ✅ |
| Wand2 图标（蓝紫色） | 第1格显示 | ✅ |
| Banana 图标（黄色） | 第2格显示 | ✅ |
| ImageIcon 图标（绿色） | 第3格显示 | ✅ |
| CTA 区仅一个按钮 | 只剩"随机发现" | ✅ |
| 语言切换 EN | "Midjourney Styles / NanoBanana Pro / GPT Image" | ✅ |
| 语言切换 JA | "Midjourney スタイル / NanoBanana Pro / GPT Image" | ✅ |
| DevTools 控制台 | 0 error / 0 warn | ✅ |

---

## 显示格式说明

`formatCount` 对三个真实数字的格式化结果：

| 原始值 | 格式化 | 说明 |
|---|---|---|
| 1306 | `1K+` | `Math.round(1306/1000) = 1` |
| 100 | `100+` | 小于 1000，直接 `100+` |
| 328 | `328+` | 小于 1000，直接 `328+` |

---

## Result

阶段19 三项变更全部完成并通过浏览器验证。Hero 统计区现在展示三大平台的真实内容数量，图标与品牌视觉对应，CTA 精简为单一探索钩子，用户意图更清晰。
