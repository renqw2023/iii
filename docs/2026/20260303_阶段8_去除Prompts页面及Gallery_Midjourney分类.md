# 阶段8：去除 Prompts 页面及 Gallery Midjourney 分类

> **开发日期**：2026-03-03  
> **开发人员**：AI Assistant  
> **状态**：✅ 已完成

## 概述

本次更新移除了 `/prompts` 页面的所有前端入口（路由、导航、SEO），以及从 `/gallery` 页面中去除了 🎨 Midjourney 模型分类筛选。Prompts 功能已有独立内容，Midjourney 分类同理，无需在当前站点重复展示。

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `client/src/App.js` | 移除 `PromptList`、`PromptDetail`、`CreatePrompt` 的 import 及对应 3 条 Route |
| `client/src/components/Layout/Header.js` | 移除 `/prompts` 和 `/create-prompt` 导航项，移除 `Lightbulb` 图标导入 |
| `client/src/hooks/useSEO.js` | 移除 `usePromptsSEO` 和 `usePromptSEO` 两个 Hook 及其 default export 条目 |
| `client/src/components/Gallery/ModelFilter.js` | 从 MODELS 数组中移除 `{ key: 'midjourney', label: 'Midjourney', icon: '🎨' }` |
| `client/src/pages/Gallery/GalleryList.js` | 从 Helmet meta description 中移除 "Midjourney" 文字 |

## 详细变更

### 1. 去除 `/prompts` 页面入口

#### App.js 路由移除
```diff
-import CreatePrompt from './pages/CreatePrompt';
-import PromptList from './pages/PromptList';
-import PromptDetail from './pages/PromptDetail';

-<Route path="prompts" element={<PromptList />} />
-<Route path="prompt/:id" element={<PromptDetail />} />
-<Route path="create-prompt" element={<CreatePrompt />} />
```

#### Header.js 导航移除
```diff
-  Lightbulb,

-  { path: '/prompts', label: t('nav.prompts'), icon: Lightbulb },
-  { path: '/create-prompt', label: t('nav.createPrompt'), icon: Lightbulb },
```

#### useSEO.js SEO Hook 移除
```diff
-export const usePromptsSEO = () => { ... };
-export const usePromptSEO = (prompt) => { ... };

 export default {
   ...
-  usePromptsSEO,
-  usePromptSEO
 };
```

### 2. 去除 Gallery Midjourney 分类

#### ModelFilter.js
```diff
 const MODELS = [
     { key: 'all', label: 'All', icon: '🔥' },
     { key: 'nanobanana', label: 'NanoBanana Pro', icon: '🍌' },
-    { key: 'midjourney', label: 'Midjourney', icon: '🎨' },
     { key: 'gptimage', label: 'GPT Image', icon: '🤖' },
 ];
```

#### GalleryList.js meta
```diff
-<meta name="description" content="...NanoBanana Pro, Midjourney, GPT Image..." />
+<meta name="description" content="...NanoBanana Pro, GPT Image..." />
```

## 保留说明

以下内容**未删除**，仅断开了前端路由入口：
- 后端 API：`server/routes/prompts.js`
- 数据模型：`server/models/PromptPost.js`
- 前端组件源文件：`client/src/pages/PromptList.js`、`PromptDetail.js`、`CreatePrompt/` 等
- Gallery 后端数据中 model 为 `midjourney` 的记录仍存在于数据库

## 验证结果

- ✅ 导航栏不再显示「提示词库」和「创建提示词」入口
- ✅ Gallery 模型过滤器仅显示 All / NanoBanana Pro / GPT Image
- ✅ 访问 `/prompts` 路径将匹配 404 页面
- ✅ 其他页面功能不受影响
