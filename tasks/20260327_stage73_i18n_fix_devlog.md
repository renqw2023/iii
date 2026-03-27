# Stage 73 补丁 — 收藏功能 i18n 修复

**日期**: 2026-03-27
**分支**: main

---

## 一、问题背景

Stage 73 实现收藏功能全面完善时，在三个 Modal 组件和 FavoriteButton 通用组件中直接硬编码了中文 toast 提示字符串：

| 字符串 | 出现位置 |
|--------|---------|
| `'已取消收藏'` | GalleryModal, SrefModal, SeedanceModal, FavoriteButton |
| `'收藏成功 ❤️'` | GalleryModal, SrefModal, SeedanceModal, FavoriteButton |
| `'操作失败'` / `'操作失败，请重试'` | GalleryModal, SrefModal, SeedanceModal, FavoriteButton |
| `'收藏'` / `'取消收藏'`（aria-label/title） | FavoriteButton |

**根本问题**：项目默认语言为英文（`en-US`），中文仅在用户手动切换 locale 时生效。硬编码中文字符串导致英文界面下所有收藏 toast 都显示中文，破坏多语言一致性。

---

## 二、修复方案

### Step 1 — i18n 词条补全

**文件**: `client/src/i18n/modules/gallery.js`

向 `actions` 追加（en-US / zh-CN / ja-JP 三个 locale）：

| key | en-US | zh-CN | ja-JP |
|-----|-------|-------|-------|
| `favoriteSuccess` | Saved to favorites | 收藏成功 | お気に入りに追加しました |
| `unfavoriteSuccess` | Removed from favorites | 已取消收藏 | お気に入りを解除しました |
| `favoriteFailed` | Action failed | 操作失败 | 操作に失敗しました |

**文件**: `client/src/i18n/modules/seedance.js`

同上，向 `actions` 追加相同三个 key（同样三个 locale）。

**文件**: `client/src/i18n/modules/favorites.js`

向 `actions` 追加（供通用 FavoriteButton 组件使用）：

| key | en-US | zh-CN | ja-JP |
|-----|-------|-------|-------|
| `favorite` | Save to favorites | 收藏 | お気に入りに追加 |
| `unfavorite` | Remove from favorites | 取消收藏 | お気に入りを解除 |
| `favoriteSuccess` | Saved to favorites | 收藏成功 | お気に入りに追加しました |
| `unfavoriteSuccess` | Removed from favorites | 已取消收藏 | お気に入りを解除しました |
| `favoriteFailed` | Action failed | 操作失败 | 操作に失敗しました |

### Step 2 — GalleryModal.js

**文件**: `client/src/pages/Gallery/GalleryModal.js`

替换 `handleFavorite` 中的三处硬编码：

```js
// Before
toast.success('已取消收藏');
toast.success('收藏成功 ❤️');
toast.error('操作失败');

// After
toast.success(t('gallery.actions.unfavoriteSuccess'));
toast.success(t('gallery.actions.favoriteSuccess'));
toast.error(t('gallery.actions.favoriteFailed'));
```

注：GalleryModal 已有 `useTranslation` + `t`，无需新增 import。

### Step 3 — SrefModal.js

**文件**: `client/src/pages/SrefModal.js`

SrefModal 原本无 `useTranslation`，补全：

```js
// 新增 import
import { useTranslation } from 'react-i18next';

// 组件内
const { t } = useTranslation();
```

替换同样的三处硬编码（使用 `gallery.actions.*` 命名空间，因 Sref 无独立 i18n 模块）：

```js
toast.success(t('gallery.actions.unfavoriteSuccess'));
toast.success(t('gallery.actions.favoriteSuccess'));
toast.error(t('gallery.actions.favoriteFailed'));
```

### Step 4 — SeedanceModal.js

**文件**: `client/src/pages/Seedance/SeedanceModal.js`

替换三处硬编码（使用 `seedance.actions.*`）：

```js
toast.success(t('seedance.actions.unfavoriteSuccess'));
toast.success(t('seedance.actions.favoriteSuccess'));
toast.error(t('seedance.actions.favoriteFailed'));
```

注：SeedanceModal 已有 `useTranslation` + `t`。

### Step 5 — FavoriteButton.js

**文件**: `client/src/components/UI/FavoriteButton.js`

新增 import + hook：

```js
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
```

替换 toast 消息（使用 `favorites.actions.*`）：

```js
toast.success(t('favorites.actions.unfavoriteSuccess'));
toast.success(t('favorites.actions.favoriteSuccess'));
toast.error(t('favorites.actions.favoriteFailed'));
```

替换 aria-label / title（使用 `favorites.actions.*`）：

```jsx
aria-label={favorited ? t('favorites.actions.unfavorite') : t('favorites.actions.favorite')}
title={favorited ? t('favorites.actions.unfavorite') : t('favorites.actions.favorite')}
```

同时将 `t` 加入 `useCallback` 依赖数组。

移除原有冗余注释（`// 取消收藏`、`// 添加收藏`、`// 回滚`）。

---

## 三、涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `client/src/i18n/modules/gallery.js` | 修改 | 三 locale 各加 3 个 key |
| `client/src/i18n/modules/seedance.js` | 修改 | 三 locale 各加 3 个 key |
| `client/src/i18n/modules/favorites.js` | 修改 | 三 locale 各加 5 个 key |
| `client/src/pages/Gallery/GalleryModal.js` | 修改 | 3 处硬编码 → t() |
| `client/src/pages/SrefModal.js` | 修改 | 新增 useTranslation + 3 处替换 |
| `client/src/pages/Seedance/SeedanceModal.js` | 修改 | 3 处硬编码 → t() |
| `client/src/components/UI/FavoriteButton.js` | 修改 | 新增 useTranslation + 5 处替换（toast×3 + aria-label + title） |

---

## 四、效果

| 语言设置 | 收藏成功 toast | 取消收藏 toast | 失败 toast |
|---------|-------------|-------------|-----------|
| en-US（默认）| Saved to favorites | Removed from favorites | Action failed |
| zh-CN | 收藏成功 | 已取消收藏 | 操作失败 |
| ja-JP | お気に入りに追加しました | お気に入りを解除しました | 操作に失敗しました |
