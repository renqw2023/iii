# 阶段 66 开发日志 — Hero 实时统计 + GPT Image 同步增量修复

**日期**: 2026-03-26
**Commits**: `be0501e` → `(本次)`
**分支**: main

---

## 背景

首页 Hero 区域的四组统计数字存在两处问题：

1. **GPT Image 数量错误**：数值来自 `Generation` 集合（用户生成图片，仅 26 条），而非实际的 GPT Image prompt 数据（`GalleryPrompt.model='gptimage'`，545 条）。
2. **GPT Image 自动同步每次全量运行**：`syncGptImage.js` 每次从第 1 页开始遍历所有数据直到末尾（42 页 × 50 = 2100 条），其中绝大多数是已有数据，浪费大量时间和网络请求，且存在中途超时的风险。

---

## 修复 1 — Stats API 数据源修正

**文件**: `server/routes/seo.js`

### 问题根因

`GET /api/seo/stats` 的第四项统计使用了错误的 Model：

```js
// 修复前
const Generation = require('../models/Generation');
// ...
Generation.countDocuments()  // 只有 26 条用户生成图
```

用户在 `/gallery?model=gptimage` 页面看到的是 `GalleryPrompt` 集合中 `model='gptimage'` 的记录，共 545 条。

### 修复

```js
// 修复后 — 四项统计全部使用正确数据源
const [srefCount, galleryCount, seedanceCount, generationCount] = await Promise.all([
  SrefStyle.countDocuments({ isActive: true }),         // 1,346 → 1K+
  GalleryPrompt.countDocuments({ model: 'nanobanana' }), // 13,101 → 13K+
  SeedancePrompt.countDocuments(),                       // 1,047 → 1K+
  GalleryPrompt.countDocuments({ model: 'gptimage' }),   // 545 → 545+
]);
```

同时移除了不再需要的 `Generation` model 导入。

### 实际数据（2026-03-26）

| 卡片 | Model | 实际值 | 显示 |
|------|-------|--------|------|
| Midjourney Styles | SrefStyle (isActive) | 1,346 | 1K+ |
| NanoBanana Pro | GalleryPrompt (nanobanana) | 13,101 | 13K+ |
| Seedance 2.0 | SeedancePrompt | 1,047 | 1K+ |
| GPT Image | GalleryPrompt (gptimage) | 545 | 545+ |

---

## 修复 2 — GPT Image 同步增量化

**文件**: `server/services/syncGptImage.js`

### 问题根因

`syncGptImages()` 函数每次从 `offset=0` 开始全量遍历 meigen.ai API：

```
同步日志示例（修复前）：
[GPT-Image-Sync] 共抓取 225 条 GPT Image 数据 (42 页)  ← 总共请求了 2100 条才筛出 225 条
[GPT-Image-Sync] 图片: +0 ⏭434 ❌0 | 数据: +225 🔄0 ❌0
```

- 42 页 × 50 = 2100 次 API 条目扫描，耗时 105.6 秒
- 434 张图片全部 skipped（本地文件已存在）
- 每次重启服务器都要重新遍历全部历史数据

### 修复策略：DB 预加载 + 连续已知页提前停止

```js
// 1. 启动前加载已有 sourceId 集合
const existingIds = new Set(
    await GalleryPromptModel.find({ model: 'gptimage' }).distinct('sourceId')
);
// DB 已有 N 条记录，仅同步新增

// 2. 每页只处理新数据
const gptImages = images.filter(img => img.model === TARGET_MODEL);
const newItems = gptImages.filter(img => !existingIds.has(`meigen-gptimage-${img.id}`));
allItems.push(...newItems); // 只推入真正新增的条目

// 3. 连续 2 页全为已知数据时提前停止
if (gptImages.length > 0 && newItems.length === 0) {
    consecutiveKnownPages++;
    if (consecutiveKnownPages >= 2) {
        console.log('⏹ 连续 2 页均已同步，提前停止');
        break;
    }
} else {
    consecutiveKnownPages = 0;
}
```

### 效果对比

| 指标 | 修复前 | 修复后（无新数据时）|
|------|--------|-------------------|
| 请求页数 | 42 页（全量） | ~3 页（到达已同步位置即停止） |
| 耗时 | ~105 秒 | ~5 秒 |
| 图片下载 | 全部 skip | 只处理真正新增的 |

### 为什么用"连续 2 页"而非"1 页"

meigen.ai 的数据并非严格按时间排序，相邻页可能出现轻微乱序（某条旧数据被编辑后排名靠前）。连续 2 页作为停止阈值，能容纳偶发的乱序而不误停。

---

## 其他同步说明

修复后的同步预期日志：

```
[GPT-Image-Sync] 🔄 开始同步 meigen.ai GPT Image 数据...
[GPT-Image-Sync]   📦 DB 已有 545 条记录，仅同步新增
[GPT-Image-Sync]   ⏹ 连续 2 页均已同步，提前停止（共 3 页）
[GPT-Image-Sync]   📊 新增 0 条 GPT Image 数据 (共请求 3 页)
[GPT-Image-Sync] ✅ 同步完成 (3.2s) | 图片: +0 ⏭0 ❌0 | 数据: +0 🔄0 ❌0
```

有新数据时：

```
[GPT-Image-Sync]   📦 DB 已有 545 条记录，仅同步新增
[GPT-Image-Sync]   📊 新增 12 条 GPT Image 数据 (共请求 5 页)
[GPT-Image-Sync] ✅ 同步完成 (18.4s) | 图片: +12 ⏭0 ❌0 | 数据: +12 🔄0 ❌0
```

---

## 文件变更索引

| 文件 | 改动 |
|------|------|
| `server/routes/seo.js` | 移除 Generation import；第四项统计改为 `GalleryPrompt({ model: 'gptimage' })`；NanoBanana 也改为按 model 精确过滤 |
| `server/services/syncGptImage.js` | 启动前预加载 existingIds；每页过滤已知条目；连续 2 页全已知时提前停止；去除重复的 `require('../models/GalleryPrompt')` |
