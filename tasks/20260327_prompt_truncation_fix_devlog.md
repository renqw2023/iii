# 提示词截断修复 — Gallery / Seedance

**日期**: 2026-03-27
**分支**: main

---

## 一、问题描述

用户反映 `/gallery` 中部分提示词显示被截断，内容不完整。

---

## 二、根本原因分析

### 原因 1 — Mongoose Schema maxlength 硬限制

| 模型 | 字段 | 原限制 | 问题 |
|------|------|--------|------|
| `GalleryPrompt` | `prompt` | `maxlength: 10000` | 超过 1 万字符的提示词被 Mongoose 验证拒绝或静默截断 |
| `SeedancePrompt` | `prompt` | `maxlength: 15000` | 超过 1.5 万字符的视频提示词同理 |

MongoDB 本身对字符串字段无长度限制（文档 BSON 上限为 16MB），这些 maxlength 是人为添加的不必要约束。

### 原因 2 — 同步服务写入前截断

| 文件 | 行 | 原代码 | 影响 |
|------|-----|--------|------|
| `githubSync.js` | 157 | `prompt: promptText.substring(0, 10000)` | NanaBanana 画廊提示词超过 1 万字符时被丢弃 |
| `githubSync.js` | 251 | `uniquePrompt.substring(0, 15000)` | Seedance 提示词超过 1.5 万字符时被丢弃 |
| `youmindSync.js` | 199 | `content.substring(0, 15000)` | YouMind CSV 导入时同样截断 |

数据在写入数据库之前已被截断，导致数据库中存储的本身就是不完整的内容。

### 未受影响的部分

- `srefScraper.js` 的 `title.substring(0, 300)` 和 `description.substring(0, 1000)` — Sref 样式无 `prompt` 字段，标题和描述截断合理，保留
- 前端 CSS / JS — `GalleryModal` 正文区域无任何 `substring` 或 `line-clamp` 截断，显示层本身无问题
- API 路由 — gallery / seedance 路由均未对 `prompt` 字段做 select 投影限制

---

## 三、修复清单

### Fix 1 — GalleryPrompt schema

**文件**: `server/models/GalleryPrompt.js`

```js
// Before
prompt: { type: String, required: true, maxlength: 10000, trim: true }

// After
prompt: { type: String, required: true, trim: true }
```

### Fix 2 — SeedancePrompt schema

**文件**: `server/models/SeedancePrompt.js`

```js
// Before
prompt: { type: String, required: true, maxlength: 15000, trim: true }

// After
prompt: { type: String, required: true, trim: true }
```

### Fix 3 — githubSync Gallery 段

**文件**: `server/services/githubSync.js` (NanaBanana 解析段)

```js
// Before
prompt: promptText.substring(0, 10000),

// After
prompt: promptText,
```

### Fix 4 — githubSync Seedance 段

**文件**: `server/services/githubSync.js` (Seedance README 解析段)

```js
// Before
prompt: uniquePrompt.substring(0, 15000) || descriptionLines.join('\n').substring(0, 15000),

// After
prompt: uniquePrompt || descriptionLines.join('\n'),
```

### Fix 5 — youmindSync Seedance CSV 段

**文件**: `server/services/youmindSync.js`

```js
// Before
prompt: content.length > 10 ? content.substring(0, 15000) : description.substring(0, 15000),

// After
prompt: content.length > 10 ? content : description,
```

---

## 四、涉及文件

| 文件 | 操作 |
|------|------|
| `server/models/GalleryPrompt.js` | 删除 `prompt.maxlength: 10000` |
| `server/models/SeedancePrompt.js` | 删除 `prompt.maxlength: 15000` |
| `server/services/githubSync.js` | 删除两处 prompt substring（gallery + seedance） |
| `server/services/youmindSync.js` | 删除一处 prompt substring |

---

## 五、注意事项

- **已入库的截断数据**：此次修复只影响**新同步**的数据。历史上已被截断写入数据库的记录需要重新触发 DataSync 才能用完整内容覆盖（`upsert` 逻辑会更新已有记录的 `prompt` 字段）。
- **MongoDB 无上限担忧**：提示词原文均为 ASCII/UTF-8 英文，即便最长的 NanaBanana 提示词也在几万字符以内，远低于 16MB BSON 限制。
- **description 字段保留限制**：各模型的 `description.maxlength` 仍保留（2000-3000 字符），该字段仅用于 SEO meta description，不是核心提示词内容。
