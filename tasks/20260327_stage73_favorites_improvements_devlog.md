# Stage 73 — 收藏功能全面完善

**日期**: 2026-03-27
**Commit**: `e43f78f`
**分支**: main

---

## 一、背景与目标

收藏系统后端 API 完整（CRUD + 批量 check），FavoriteButton 组件也存在，但有 5 处关键缺陷导致实际使用体验差：

| 缺陷 | 影响 |
|------|------|
| SrefModal 无收藏按钮 | Sref 详情页完全无法收藏 |
| GalleryModal 收藏 UI 不更新 | 点击 bookmark 后图标不变，用户不知道是否成功 |
| 移动端卡片 overlay hover-only | touch 触发不了 hover，收藏按钮完全不可用 |
| 收藏页删除按钮 hover-only | 移动端无法删除收藏 |
| initialFavorited 永远是 false | 已收藏内容在列表页显示为未收藏状态 |

---

## 二、Fix 1 — GalleryModal 收藏 UI 实时更新

**文件**: `client/src/pages/Gallery/GalleryModal.js`

**根因**: 原有 `handleFavorite` 调用 `galleryAPI.toggleFavorite(id)`，该方法发请求后不更新本地状态。`prompt.isFavorited` 来自 react-query 缓存，缓存未刷新导致 UI 始终不变。

**方案**: 本地 `useState` + 乐观更新（optimistic update）：

```js
const [localFavorited, setLocalFavorited] = useState(false);
// 服务端数据加载后同步一次
useEffect(() => { if (prompt) setLocalFavorited(!!prompt.isFavorited); }, [prompt]);

const handleFavorite = async () => {
  if (!isAuthenticated) { openLoginModal(); return; }
  const prev = localFavorited;
  setLocalFavorited(!prev);           // 立即更新 UI
  try {
    if (prev) { await favoritesAPI.remove('gallery', id); toast.success('已取消收藏'); }
    else       { await favoritesAPI.add('gallery', id);   toast.success('收藏成功 ❤️'); }
  } catch { setLocalFavorited(prev); toast.error('操作失败'); }  // 失败时回滚
};
```

- 弃用 `galleryAPI.toggleFavorite`，改用 `favoritesAPI.add/remove`（直接操作收藏表）
- 新增 `favoritesAPI` 和 `useAuth` 的 import
- 模板中 `prompt.isFavorited` 全部替换为 `localFavorited`

---

## 三、Fix 2 — SrefModal 添加收藏按钮

**文件**: `client/src/pages/SrefModal.js`

SrefModal 的 footer 只有 Like + Share，从未有收藏入口。补全：

```jsx
// 新增 import
import { Bookmark } from 'lucide-react';
import { favoritesAPI } from '../services/favoritesApi';
import { useAuth } from '../contexts/AuthContext';

// 组件内（与 GalleryModal 完全对称的模式）
const [localFavorited, setLocalFavorited] = useState(false);
useEffect(() => { if (sref) setLocalFavorited(!!sref.isFavorited); }, [sref]);
const handleFavorite = async () => { /* 同 GalleryModal */ };

// footer 中插入（在 Like 和 Share 之间）
<button className={`dmodal-btn-icon ${localFavorited ? 'favorited' : ''}`}
        onClick={handleFavorite} title={localFavorited ? '取消收藏' : '收藏'}>
  <Bookmark size={18} fill={localFavorited ? 'currentColor' : 'none'} />
</button>
```

---

## 四、Fix 3 — 移动端卡片 overlay 始终可见

**问题根因**: `.gallery-card-overlay` 和 `.liblib-card-overlay` 默认 `opacity: 0`，只在 `:hover` 时显示。触摸设备无 hover 状态，收藏/操作按钮完全不可触达。

**文件**: `client/src/styles/gallery.css`（追加到已有 `@media (max-width: 767px)` 块内）：

```css
/* Card overlays: always visible on touch (no hover state) */
.gallery-card-overlay { opacity: 1; pointer-events: auto; }
```

**文件**: `client/src/components/Post/LiblibStyleCard.css`（新增 media block）：

```css
@media (max-width: 767px) {
  .liblib-card-overlay { opacity: 1; pointer-events: auto; }
}
```

桌面端继续走 `.gallery-card:hover .gallery-card-overlay { opacity: 1 }` 规则，行为不变。

---

## 五、Fix 4 — 收藏页删除按钮移动端常驻

**文件**: `client/src/pages/Favorites.js`

给删除按钮加 class `fav-remove-btn`：
```jsx
className="fav-remove-btn absolute right-3 top-3 rounded-full p-2 opacity-0 transition-opacity group-hover:opacity-100"
```

**文件**: `client/src/styles/gallery.css`（同一 `@media (max-width: 767px)` 块）：
```css
.fav-remove-btn { opacity: 1 !important; }
```

---

## 六、Fix 5 — 卡片列表 initialFavorited 批量 check

**问题**: `FavoriteButton` 的 `initialFavorited` prop 永远是 `false`（默认值），已收藏的内容在列表页显示为未收藏（空心图标）。

**方案**: 列表数据加载后，调用 `favoritesAPI.check(type, ids)` 批量查询，将结果存入 Set，渲染卡片时传入 `initialFavorited`。

**文件**: `client/src/pages/Gallery/GalleryList.js`
```js
const [favoritedSet, setFavoritedSet] = useState(new Set());

useEffect(() => {
  if (!isAuthenticated || !prompts.length) return;
  favoritesAPI.check('gallery', prompts.map(p => p._id))
    .then(res => {
      const map = res.data?.data || {};
      setFavoritedSet(new Set(Object.keys(map).filter(k => map[k])));
    }).catch(() => {});
}, [prompts.length, isAuthenticated]);

// 渲染
<GalleryCard initialFavorited={favoritedSet.has(prompt._id)} ... />
```

**文件**: `client/src/pages/Explore.js` — 同样模式，`targetType='sref'`

**文件**: `client/src/components/Gallery/GalleryCard.js` — 接收 `initialFavorited` prop 并传给 `FavoriteButton`

**文件**: `client/src/components/Sref/SrefCard.js` — 同上

**注意**: 依赖 `[prompts.length, isAuthenticated]`，未登录时跳过 check（减少无效请求）。

---

## 七、涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `client/src/pages/Gallery/GalleryModal.js` | 修改 | 本地 localFavorited + favoritesAPI，废弃 galleryAPI.toggleFavorite |
| `client/src/pages/SrefModal.js` | 修改 | 新增 Bookmark 按钮 + handleFavorite 逻辑 |
| `client/src/pages/Favorites.js` | 修改 | 删除按钮加 fav-remove-btn class |
| `client/src/pages/Gallery/GalleryList.js` | 修改 | 批量 check + favoritedSet |
| `client/src/pages/Explore.js` | 修改 | 批量 check + favoritedSet |
| `client/src/components/Gallery/GalleryCard.js` | 修改 | 接收并传递 initialFavorited |
| `client/src/components/Sref/SrefCard.js` | 修改 | 接收并传递 initialFavorited |
| `client/src/styles/gallery.css` | 修改 | @media 移动端: overlay 常驻 + fav-remove-btn 常驻 |
| `client/src/components/Post/LiblibStyleCard.css` | 修改 | @media 移动端: liblib overlay 常驻 |

---

## 八、验证结果

| 场景 | 结果 |
|------|------|
| 移动端 /gallery — 卡片操作栏常驻 | ✅ 无需 hover，直接可见 |
| 移动端 /explore — Sref 操作栏常驻 | ✅ 同上 |
| 移动端 /favorites — 删除红心常驻 | ✅ 右上角始终可见 |
| 桌面端 /gallery — hover overlay 不变 | ✅ 无 overlay 常驻，只有 hover 才显示 |
| GalleryModal 收藏状态更新 | ✅ 点击后立即变色 + toast |
| SrefModal 新收藏按钮 | ✅ footer 新增 bookmark，点击有反馈 |
| 控制台错误 | ✅ 无报错 |
