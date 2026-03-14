# Stage 38 补全 — 卡片 Hover 未完善项 开发日志

**日期**: 2026-03-14
**阶段**: Stage 38 patch
**开发者**: reki / Claude
**关联文档**: `tasks/20260314_meigen_card_hover_analysis.md`

---

## 一、背景

Stage 38 已完成 spotlight 光晕 + action-bar 框架，本次补全以下未实现项：

1. GalleryCard CTA "Copy Prompt" → 改为 **"Use Idea"**（填入生成面板）
2. GalleryCard 右列 → 新增 **X 来源链接按钮**（ExternalLink icon）
3. SrefCard 右列 → 新增 **X 来源链接按钮**（ExternalLink icon）
4. 修复按钮文字 i18n 国际化（默认英文，切中文后显示中文）

---

## 二、修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `client/src/components/Gallery/GalleryCard.js` | CTA 改 useIdea；加 ExternalLink；移除 Copy/toast/galleryAPI 废弃 import |
| `client/src/components/Sref/SrefCard.js` | 加 ExternalLink import；右列加 X 来源链接 |
| `client/src/styles/gallery.css` | `.gallery-action-btn` 加 `text-decoration: none` |
| `client/src/components/Post/LiblibStyleCard.css` | `.liblib-action-btn` 加 `text-decoration: none` |
| `client/src/i18n/modules/gallery.js` | `actions` 加 `useIdea` / `viewOnX` 三语翻译 |

---

## 三、详细变更记录

### 3.1 GalleryCard.js — CTA 改"使用创意"

**变更前**:
```jsx
import { Copy, Heart, Eye } from 'lucide-react';
// ...
const handleCopy = async (e) => {
  e.stopPropagation();
  await navigator.clipboard.writeText(prompt.prompt);
  galleryAPI.recordCopy(prompt._id);
  toast.success(t('gallery.actions.copySuccess'));
};
// ...
<button className="gallery-cta-btn" onClick={handleCopy}>
  <Copy size={11} /> Copy Prompt
</button>
```

**变更后**:
```jsx
import { Wand2, ExternalLink, Heart, Eye } from 'lucide-react';
import { useGeneration } from '../../contexts/GenerationContext';
// ...
const { setPrefill } = useGeneration();
const handleUseIdea = (e) => {
  e.stopPropagation();
  setPrefill({ prompt: prompt.prompt });
};
// ...
<button className="gallery-cta-btn" onClick={handleUseIdea}>
  <Wand2 size={11} /> {t('gallery.actions.useIdea')}
</button>
```

**调用链**:
```
handleUseIdea()
  → setPrefill({ prompt }) [GenerationContext]
  → Layout.js useEffect 监听 prefillJob
  → 自动打开 Img2PromptPanel
  → GenerateTab useEffect 消费 prefillJob → setPrompt(prefillJob.prompt)
```

同模式参考: `client/src/pages/GenerateHistory.js` line 121

**移除废弃 import**: `Copy`、`toast`、`galleryAPI`（handleCopy 删除后这三个彻底无用）

### 3.2 GalleryCard.js — 右列 X 来源链接

```jsx
{prompt.sourceUrl && (
  <a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer"
     className="gallery-action-btn" title={t('gallery.actions.viewOnX', 'View on X')}
     onClick={e => e.stopPropagation()}>
    <ExternalLink size={13} />
  </a>
)}
```

- `target="_blank"` + `rel="noopener noreferrer"` — 安全打开新标签
- `onClick={e => e.stopPropagation()}` — 防止触发父级卡片跳转详情
- 条件渲染（`sourceUrl` 存在时才显示），约 300 条记录有此字段

### 3.3 SrefCard.js — 右列 X 来源链接

同 GalleryCard，但使用 `liblib-action-btn` CSS class：

```jsx
{sref.sourceUrl && (
  <a href={sref.sourceUrl} target="_blank" rel="noopener noreferrer"
     className="liblib-action-btn" title="View on X"
     onClick={e => e.stopPropagation()}>
    <ExternalLink size={13} />
  </a>
)}
```

SrefCard CTA 保持 "Copy Code" 不变（sref 无 prompt 文本，无法填入生成面板）。

### 3.4 CSS 补丁 — `<a>` 标签去除下划线

`gallery.css` 和 `LiblibStyleCard.css` 的按钮 class 均加：
```css
text-decoration: none;
```

原因：`.gallery-action-btn` / `.liblib-action-btn` 被 `<a>` 标签复用后，浏览器默认会给链接加下划线，影响视觉。

### 3.5 i18n 修复 — 翻译键定位到 gallery.js 模块

**问题**：初次将 `useIdea` 加到 `locales/en-US.json`，显示仍为 key 字符串。

**根因分析**：
```js
// i18n/index.js 的合并逻辑（浅合并）
const resources = {
  'en-US': {
    translation: {
      ...enUS,                               // locales/en-US.json（先加载）
      ...modularResources['en-US'].translation  // modules/（后加载，覆盖同名 key）
    }
  }
};
```

由于 `modules/gallery.js` 存在，它的 `gallery` 整个对象会**完全替换** `locales/en-US.json` 中的 `gallery`（浅合并，非深合并）。因此对 locales JSON 的修改被丢弃。

**正确修法**：直接在 `modules/gallery.js` 的 `actions` 对象里添加新键：

```js
// en-US
actions: {
  // ...existing...
  useIdea: 'Use Idea',
  viewOnX: 'View on X',
}

// zh-CN
actions: {
  // ...existing...
  useIdea: '使用创意',
  viewOnX: '在 X 查看',
}

// ja-JP
actions: {
  // ...existing...
  useIdea: 'アイデアを使用',
  viewOnX: 'Xで見る',
}
```

**教训**：本项目 i18n 有模块化系统（`modules/` 目录），凡涉及已有模块的翻译，**必须修改对应 module 文件**，不能改 locales JSON。

---

## 四、两个心形按钮说明

用户发现卡片 hover 时有 2 个 Heart 图标，分工如下：

| 位置 | 代码 | 作用 |
|------|------|------|
| 左列 `gallery-card-stats-overlay` | `<Heart size={11}/> {prompt.likesCount}` | **只读展示**：显示该 prompt 在数据库中的点赞总数 |
| 右列 `gallery-overlay-actions` | `<button onClick={handleLike}>` | **交互按钮**：点击调用 API 为当前用户点赞，状态变更为 `isLiked` |

设计依据：对标 MeiGen.ai —— 左侧 Heart 展示原帖 X 点赞数（仅展示），右侧是收藏/功能操作区。两者职责不同，不算重复。

---

## 五、验证结果

- `/gallery` a11y 树确认每张卡片包含：`button "Use Idea"` / `button "Like"` / `link "View on X"` ✅
- 无 JS console error ✅
- 英文默认环境显示 "Use Idea"，切中文后显示"使用创意" ✅
- `<a>` 标签 `stopPropagation` 防穿透验证：点击 X 链接不触发卡片详情跳转 ✅

---

## 六、对照文档进度更新

对照 `20260314_meigen_card_hover_analysis.md` § 七：

| 功能 | 状态 |
|------|------|
| hover 渐变遮罩 | ✅ 完成 |
| "Use Idea" CTA + setPrefill | ✅ 完成（本次） |
| 作者文字 `@handle` | ✅ 有（无头像） |
| 点赞/浏览统计 | ✅ 完成 |
| 毛玻璃功能按钮 | ✅ 完成 |
| 收藏按钮 | ✅ 完成（FavoriteButton，图标为心形而非 Layers） |
| 来源链接（X）| ✅ 完成（本次，ExternalLink icon） |
| 鼠标跟踪光晕 | ✅ 完成 |
| 边框高光层 | ⬜ 未实现（低难度，box-shadow 即可） |
| 作者圆形头像 | ⬜ 未实现（见下方待办） |

---

## 七、遗留项 & 难度评估

### 7.1 边框高光层（难度：⭐ 极简单）

CSS 5 行：
```css
.gallery-card {
  transition: box-shadow 0.3s ease;
}
.gallery-card:hover {
  box-shadow: 0 0 0 1px rgba(255,255,255,0.18), 0 8px 32px rgba(0,0,0,0.5);
}
```

### 7.2 作者头像（两方案）

**方案 A — 字母头像（难度：⭐⭐ 简单，约 30 分钟）**
- 无后端改动
- 取 `sourceAuthor` 首字母，CSS 生成彩色圆圈（背景色由 hash 决定）
- 缺点：非真实头像，但视觉效果统一且美观

**方案 B — 真实 X 头像（难度：⭐⭐⭐ 中等，2-3 小时）**
1. `server/models/GalleryPrompt.js` 加 `sourceAuthorAvatar: String` 字段
2. 数据导入脚本（或新建 migration script）抓取 X 头像 URL
3. 运行 DB migration 更新现有 431 条记录
4. GalleryCard.js `<img>` 展示，加 fallback 到字母头像
- 关键障碍：X/Twitter API v2 需要 Bearer Token，且头像 URL 需要存储（不能实时 fetch，会被 rate limit）

**建议**：先做字母头像（零后端改动），等有 Twitter API 凭证时再升级为真实头像。

---

## 八、补丁修复 — 卡片右列图标混淆 & 分享按钮错误

**日期**: 2026-03-14（同日追加）

### 8.1 问题描述

用户反馈 `/gallery` hover 卡片时，右列出现：
1. **两个心形图标** — Like 按钮（Heart）和收藏按钮（FavoriteButton 也用 Heart），视觉完全一致，无法区分
2. **ExternalLink 按钮语义错误** — 设计意图是"分享图片"，实现的却是跳转到 X.com 原贴

### 8.2 修改内容

**`client/src/components/UI/FavoriteButton.js`**
- 新增 `iconType` prop（默认 `'heart'`，传入 `'bookmark'` 时渲染 Bookmark 图标）
- Bookmark 激活色 `#818cf8`（靛蓝）以区别于 Like 的 `#ef4444`（红色）

```jsx
// 调用方式
<FavoriteButton iconType="bookmark" ... />
```

**`client/src/components/Gallery/GalleryCard.js`**
- `FavoriteButton` 传入 `iconType="bookmark"` → 右列收藏变为书签图标
- 移除 `ExternalLink`/`View on X` 按钮（用户误解为分享按钮）
- 新增 `handleShare` → 复制当前图片详情页 URL 到剪贴板，toast 提示 "Link copied!"
- 按钮改为 `Share2` 图标（`lucide-react`）
- import: 移除 `ExternalLink`，加入 `Share2`、`Bookmark`、`toast`

**最终右列按钮组（从上到下）**：
| 图标 | 功能 |
|------|------|
| `Heart` | Like（点赞，调用 API） |
| `Bookmark` | 收藏（FavoriteButton，书签样式） |
| `Share2` | 分享（复制 `/gallery/${id}` 到剪贴板） |

### 8.3 已撤销的错误修改

中途错误地将左列 stats 的 `Heart` 改成了 `Flame`，影响范围：
- `gallery-card-stats-overlay` 里 `<Heart size={11} />` 展示 X 平台点赞数（只读，非按钮）
- 已还原回 `Heart`，左列 stats 不是混淆来源

### 8.4 i18n 根因记录

初次将翻译键加到 `locales/en-US.json`，显示 key 字符串。
根因：`i18n/index.js` 用浅合并，`modules/gallery.js` 的整个 `gallery` 对象覆盖 locales JSON。
**规则：本项目翻译键必须加在 `modules/` 对应文件，不能改 locales JSON。**
