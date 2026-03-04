# 阶段9：meigen.ai GPT Image (Image 1.5) 内容导入

> **开发日期**：2026-03-03 ~ 2026-03-04  
> **开发人员**：AI Assistant  
> **状态**：✅ 已完成

## 概述

从 meigen.ai 网站抓取全部 **GPT Image (Image 1.5)** 模型生成的 AI 图片及提示词内容，下载图片到本地，并导入 MongoDB 数据库。在 `/gallery` 页面的 `gptimage` 模型筛选中展示。

## 数据源分析

| 项目 | 详情 |
|------|------|
| 来源网站 | https://www.meigen.ai/ |
| API 端点 | `GET /api/images?offset=N&limit=50&sort=newest` |
| 目标模型 | `GPT Image`（API 返回数据的 model 字段值） |
| 图片 CDN | `https://images.meigen.ai/tweets/{tweetId}/{index}.jpg` |
| 总页数 | 54 页（每页 50 条） |
| 筛选结果 | 323 条 GPT Image 记录 |
| 图片总数 | 580 张（部分记录含多张图片） |
| 图片总大小 | 102.54 MB |

## 新增文件清单

| 文件 | 说明 |
|------|------|
| `server/scripts/importGptImage.js` | GPT Image 数据导入脚本（抓取 API + 下载图片 + 导入 MongoDB） |
| `client/public/ImageFlow/gptimage/*.jpg` | 580 张本地化图片文件 |

## 技术实现

### importGptImage.js 导入脚本

**功能架构**：分为 4 个步骤

1. **API 数据抓取**
   - 使用 Node.js 原生 `https` 模块分页请求 meigen.ai API
   - 每页 50 条，自动翻页直到 `hasMore === false`
   - 从返回结果中筛选 `model === "GPT Image"` 的条目
   - 请求间隔 500ms 避免限流

2. **图片下载**
   - 目标目录：`client/public/ImageFlow/gptimage/`
   - 文件命名：`{tweetId}_{imageIndex}.jpg`
   - 支持多图条目（部分推文含 2~4 张图）
   - 增量模式：已存在文件自动跳过
   - 下载间隔 200ms

3. **数据转换**
   - 自动分类：复用 `extractStyle`/`extractSubject`/`extractUseCase` 逻辑
   - 字段映射：meigen.ai API → GalleryPrompt 模型
   - 标签自动生成：`gpt-image`, `image-1.5` + 风格/主题标签
   - 高赞（>500 likes）自动标记为 `isFeatured`

4. **MongoDB 导入**
   - 使用 `findOneAndUpdate` + `upsert` 防重复
   - `sourceId` 格式：`meigen-gptimage-{tweetId}`

**命令行参数**：
```bash
node scripts/importGptImage.js              # 完整导入
node scripts/importGptImage.js --dry-run    # 干跑（不下载/不写入）
node scripts/importGptImage.js --skip-download  # 仅导入数据
node scripts/importGptImage.js --limit 10   # 限制条数
```

### 数据模型映射

| meigen.ai 字段 | GalleryPrompt 字段 | 说明 |
|---|---|---|
| `id` | `sourceId` | `meigen-gptimage-{id}` |
| `title` | `title` | 截断 200 字 |
| `prompt` | `prompt` | 截断 10000 字 |
| `prompt[:300]` | `description` | 截取前 300 字 |
| — | `model` | 固定 `'gptimage'` |
| — | `dataSource` | 固定 `'meigen'` |
| — | `sourcePlatform` | 固定 `'meigen'` |
| `author.username` | `sourceAuthor` | `@username` 格式 |
| `author.profileUrl` | `sourceUrl` | 推特个人主页 |
| 本地路径 | `previewImage` | `/ImageFlow/gptimage/{id}_0.jpg` |
| `stats.views` | `views` | 初始浏览量 |

## 导入结果统计

### 执行摘要

| 指标 | 数值 |
|------|------|
| API 页数扫描 | 54 页 |
| GPT Image 记录 | 323 条 |
| 图片下载 | 580 张 (102.54 MB) |
| 下载失败 | 0 |
| 数据库新增 | 323 条 |
| 数据库错误 | 0 |

### 作者分布 (Top 10)

| 作者 | 数量 |
|------|------|
| @meng_dagg695 | 48 |
| @TechieBySA | 41 |
| @Naiknelofar788 | 34 |
| @Sheldon056 | 17 |
| @saniaspeaks_ | 14 |
| @mehvishs25 | 11 |
| @Strength04_X | 10 |
| @harboriis | 9 |
| @john_my07 | 8 |
| @Gdgtify | 7 |

### 风格分类分布

| 分类 | 数量 |
|------|------|
| photography | 169 |
| other | 89 |
| cinematic-film-still | 38 |
| 3d-render | 13 |
| illustration | 5 |
| sketch-line-art | 4 |
| ink-chinese-style | 2 |
| isometric | 1 |
| chibi-q-style | 1 |
| anime-manga | 1 |

### 主题分类分布

| 分类 | 数量 |
|------|------|
| portrait-selfie | 80 |
| other | 67 |
| product | 32 |
| food-drink | 30 |
| fashion-item | 24 |
| character | 19 |
| animal-creature | 16 |
| text-typography | 14 |
| influencer-model | 13 |
| abstract-background | 8 |
| architecture-interior | 7 |
| landscape-nature | 7 |
| diagram-chart | 4 |
| cityscape-street | 1 |
| group-couple | 1 |

## 验证结果

- ✅ API 分页抓取完整（54 页，直到 `hasMore === false`）
- ✅ 580 张图片全部下载成功（0 失败）
- ✅ 323 条记录全部导入 MongoDB（0 错误）
- ✅ 图片本地化存储于 `client/public/ImageFlow/gptimage/`
- ✅ Gallery 页面 Model 筛选器中含 "GPT Image" 选项
- ✅ 脚本支持增量运行（重复执行不会重复下载/创建）

## 保留说明

- 图片已完全本地化，不依赖 meigen.ai 的外部链接
- `sourceId` 使用 `meigen-gptimage-{tweetId}` 格式，可安全重复运行脚本进行增量更新
- 脚本可定期运行以获取 meigen.ai 新增的 GPT Image 内容
