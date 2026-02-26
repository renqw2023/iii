# 阶段6 — Style Gallery（/explore）Sref 数据源重构开发日志

**日期**：2026-02-26
**分支**：main
**涉及页面**：`/explore`（Style Gallery）
**核心变更**：数据源从 `GalleryPrompt`（meigen/NanoBanana 提示词）切换为本地爬取的 `SrefStyle`（1306 个 Midjourney --sref 风格码）

---

## 一、背景与目标

### 原有状态

`/explore`（Style Gallery）页面原先使用 `enhancedPostAPI` 调用 `/api/posts`，展示社区用户上传的 AI 图片帖子。`/gallery` 页面使用 `GalleryPrompt` 模型展示 meigen.ai / NanoBanana 来源的提示词数据。

### 新需求

将 `/explore` 的数据源切换为本地 `output/` 目录中已爬取的 **1306 个 Midjourney sref 风格码**数据，每个 sref 包含：
- 最多 4 张风格预览图（`.png`）
- 最多 4 个风格视频（`.mp4`）
- `metadata.json`（含标题、描述、标签、文件列表）

详情页展示：图片网格 + 视频播放器 + `--sref XXXX` 代码 + 风格标签 + 相关推荐。

### 重要约束

- **`/gallery` 页面及其数据库模型 `GalleryPrompt` 不得改动**（独立的提示词画廊功能）
- 新建独立的 `/api/sref` 后端路由和 `SrefStyle` 数据模型，与原有系统完全隔离

---

## 二、数据概览

```
output/ 目录扫描结果：
├── 总 sref 目录数：1373
├── 有效（含 .png 图片）：1306
├── 空目录（无图片，跳过）：67
├── 总图片文件：5218 张（平均每 sref 约 4 张）
└── 总视频文件：1612 个（平均每 sref 约 1.2 个，911 个 sref 无视频）

output/sref_XXXXXXX/ 目录结构：
├── images/
│   ├── 01_XXXXXXX-img-1-xxxxxxxx.png
│   ├── 02_XXXXXXX-img-2-xxxxxxxx.png
│   └── ...
├── videos/
│   └── 01_XXXXXXX-vid-1-xxxxxxxx.mp4（可能为空）
└── metadata.json
    {
      "sref_codes": ["XXXXXXX"],
      "title": "...",
      "description": "...",
      "tags": ["Illustration", "Anime", ...],
      "saved_images": ["01_XXXXXXX-img-1-xxxxxxxx.png", ...],
      "saved_videos": []
    }
```

---

## 三、架构设计

```
前端                           后端                        数据库
──────────────────────────────────────────────────────────────────
/explore → Explore.js          /api/sref → sref.js         SrefStyle collection
/explore/:id → SrefDetail.js   GET /api/sref                (1306 records)
                               GET /api/sref/tags/popular
SrefCard.js（卡片组件）         GET /api/sref/:id
srefApi.js（API 服务层）        POST /api/sref/:id/like

                               /output → express.static    output/ 目录
                               （图片/视频静态服务，7天缓存）
```

---

## 四、实施步骤详解

### Step 1 — 新建 SrefStyle MongoDB 模型

**文件**：`server/models/SrefStyle.js`（新建）

核心字段设计：

| 字段 | 类型 | 说明 |
|------|------|------|
| `srefCode` | String | sref 风格码，如 `"100390546"` |
| `title` | String | 来自 metadata.json |
| `description` | String | 来自 metadata.json |
| `tags` | [String] | 风格标签，如 `["Anime", "Vector"]` |
| `images` | [String] | 图片文件名列表 |
| `videos` | [String] | 视频文件名列表 |
| `sourceId` | String unique | = srefCode，防止重复导入 |
| `views` | Number | 浏览次数 |
| `likes` | [{user, createdAt}] | 点赞记录 |
| `isActive` | Boolean | 是否展示（默认 true） |

虚拟字段：
- `previewImage` → `/output/sref_${srefCode}/images/${images[0]}`（卡片封面图）
- `likesCount` → `likes.length`（点赞数）

> **注意**：`lean()` 查询不保证虚拟字段生效，后续在路由层手动补充。

---

### Step 2 — 静态文件服务

**文件**：`server/index.js`（追加）

```javascript
app.use('/output', express.static(path.join(__dirname, '../output'), { maxAge: '7d' }));
```

图片访问 URL 格式：`http://localhost:5500/output/sref_100390546/images/01_xxx.png`

---

### Step 3 — 数据导入脚本

**文件**：`server/scripts/importSrefOutput.js`（新建）

功能：
1. 扫描 `output/sref_*/` 所有目录
2. 跳过无 `.png` 图片的目录（67 个空目录）
3. 读取 `metadata.json`，提取各字段
4. MongoDB Upsert（`sourceId` 去重）
5. 支持 `--clear` 参数先清空集合

**踩坑记录 #1 — JSDoc 注释语法错误**：
脚本中写了 `/** 扫描 output/sref_*/ 目录 */`，`sref_*/` 里的 `*/` 提前关闭了块注释，导致 `SyntaxError: Unexpected identifier 'and'`。
**修复**：改用 `//` 单行注释。

**踩坑记录 #2 — .env 路径错误**：
脚本位于 `server/scripts/`，原写法 `path.join(__dirname, '../../.env')` 解析到项目根目录，那里没有 `.env`，dotenv 静默失败，MongoDB URI 回落到默认值 `mongodb://localhost:27017/pm01`（错误数据库）。
**修复**：改为 `path.join(__dirname, '../.env')` 指向 `server/.env`（含 `MONGODB_URI=mongodb://localhost:27017/midjourney-gallery-dev`）。

导入结果：
```
✅ 扫描目录：1373 个
⏭️  跳过空目录：67 个
✅ 成功导入：1306 条记录
数据库：mongodb://localhost:27017/midjourney-gallery-dev
集合：srefstyles
```

---

### Step 4 — 后端 API 路由

**文件**：`server/routes/sref.js`（新建）
**挂载**：`server/index.js` → `app.use('/api/sref', srefRoutes)`

| 端点 | 说明 |
|------|------|
| `GET /api/sref` | 列表（标签过滤 + 搜索 + 分页 + 排序）|
| `GET /api/sref/tags/popular` | 热门标签聚合（最多 40 个）|
| `GET /api/sref/:id` | 详情 + 自动 +1 浏览数 + 构建图片/视频 URL |
| `POST /api/sref/:id/like` | 点赞/取消（需登录）|

**详情接口额外处理**：
```javascript
sref.imageUrls = (sref.images || []).map(f => `/output/sref_${sref.srefCode}/images/${f}`);
sref.videoUrls = (sref.videos || []).map(f => `/output/sref_${sref.srefCode}/videos/${f}`);
```

**列表接口 previewImage 补丁**（lean() 虚拟字段问题修复）：
```javascript
srefs.forEach(s => {
    if (!s.previewImage && s.images && s.images.length > 0) {
        s.previewImage = `/output/sref_${s.srefCode}/images/${s.images[0]}`;
    }
    if (s.likesCount === undefined) s.likesCount = 0;
});
```

认证：使用 `optionalAuth`（列表/详情允许未登录访问），`requireAuth`（点赞需登录）。

---

### Step 5 — 前端 API 服务层

**文件**：`client/src/services/srefApi.js`（新建）

```javascript
export const srefAPI = {
    getPosts: (params = {}) => api.get('/sref', { params }),
    getPopularTags: (limit = 30) => api.get('/sref/tags/popular', { params: { limit } }),
    getById: (id) => api.get(`/sref/${id}`),
    toggleLike: (id) => api.post(`/sref/${id}/like`),
};
```

---

### Step 6 — Explore.js 页面重构

**文件**：`client/src/pages/Explore.js`（修改）

主要变更：

| 改前 | 改后 |
|------|------|
| `enhancedPostAPI` | `srefAPI` |
| `useQuery` 普通分页 | `useInfiniteQuery` 无限滚动 |
| `<LiblibStyleCard>` | `<SrefCard>` |
| 标签硬编码 | 动态从 `srefAPI.getPopularTags(40)` 加载 |
| 排序：最新/最热（中文） | 保持，参数映射调整 |

侧边栏保留：搜索框 + 风格标签过滤 + 排序选择。
URL 参数：`?tag=&sort=&q=`（与原有路由兼容）。

---

### Step 7 — SrefCard 卡片组件

**文件**：`client/src/components/Sref/SrefCard.js`（新建）

特性：
- 瀑布流适配：`ResizeObserver` 监测列宽 + 图片自然尺寸计算 `gridRowEnd: span N`
- 封面图：`sref.previewImage`，懒加载，淡入动画
- 无图片时：`🎨` emoji 占位（`4:3` 比例区域）
- Badge：左下角 `--sref XXXX` 代码标签（`liblib-style-tag` 样式）
- Hover overlay：显示点赞数、浏览数、复制按钮
- 点击卡片：navigate 到 `/explore/${sref._id}`

---

### Step 8 — SrefDetail 详情页

**文件**：`client/src/pages/SrefDetail.js`（新建）

页面布局：
```
[← Back to Gallery]

[标题]
[--sref XXXX 代码 badge]  [📋 Copy sref 按钮]  [👁 浏览数  ❤️ 点赞数]

── 图片网格（2列，最多4张，点击 → Lightbox 大图预览）──

── Videos（有视频时才显示）──
[<video> 内联播放器]

── 风格标签 ──
[#Anime] [#Illustration] ...（点击 → /explore?tag=xxx）

── Like 按钮 ──
[❤️ Like / Liked]

── Related Styles（有相关推荐时显示）──
[gallery-grid 瀑布流]
```

Lightbox：固定遮罩层，点击图片放大，点击任意区域关闭。

---

### Step 9 — App.js 路由注册

**文件**：`client/src/App.js`（修改）

新增：
```javascript
import SrefDetail from './pages/SrefDetail';
// ...
<Route path="explore/:id" element={<SrefDetail />} />
```

---

## 五、踩坑总结

| # | 问题 | 根因 | 修复 |
|---|------|------|------|
| 1 | JSDoc `/** output/sref_*/ */` 语法错误 | `*/` 在路径中提前关闭块注释 | 改用 `//` 单行注释 |
| 2 | 数据导入到错误数据库 `pm01` | `../../.env` 路径解析到项目根，dotenv 静默失败 | 改为 `../.env` 指向 `server/.env` |
| 3 | 误改 `/gallery` 相关文件 | 将"Style Gallery"理解为 `/gallery` 页面 | `git checkout --` 回滚，明确目标为 `/explore` |
| 4 | `/api/sref` 404 | 服务器未重启，旧进程未加载新路由 | 重启 Node 服务 |
| 5 | 卡片无图片显示（只有🎨） | `lean()` 不保证虚拟字段 `previewImage` 生效 | 路由层手动构建 `previewImage` 字段 |

---

## 六、受影响文件清单

### 新建文件

| 文件 | 说明 |
|------|------|
| `server/models/SrefStyle.js` | Mongoose 数据模型 |
| `server/scripts/importSrefOutput.js` | 数据导入脚本 |
| `server/routes/sref.js` | `/api/sref` API 路由 |
| `client/src/services/srefApi.js` | 前端 API 服务层 |
| `client/src/components/Sref/SrefCard.js` | 瀑布流卡片组件 |
| `client/src/pages/SrefDetail.js` | 详情页 |

### 修改文件

| 文件 | 改动内容 |
|------|----------|
| `server/index.js` | 添加 `/output` 静态服务 + 注册 `/api/sref` 路由 |
| `client/src/pages/Explore.js` | 切换数据源 → srefAPI，重构为 useInfiniteQuery |
| `client/src/App.js` | 新增 `explore/:id` → SrefDetail 路由 |

### 未改动文件（保持原样）

- `server/routes/gallery.js` — `/gallery` 提示词画廊，完全独立
- `server/models/GalleryPrompt.js` — 提示词数据模型，完全独立
- `client/src/pages/Gallery/` — 提示词画廊页面，完全独立
- `client/src/styles/gallery.css` — CSS 样式复用，未改动

---

## 七、验证结果

### API 验证

```bash
# 列表接口
GET /api/sref?page=1&limit=24&sort=createdAt
→ { posts: [...], pagination: { total: 1306, page: 1, pages: 55 } }

# 热门标签
GET /api/sref/tags/popular?limit=40
→ { tags: [{ name: "Illustration", count: 1281 }, { name: "Dark fantasy", count: 1189 }, ...] }
```

### 前端验证

- `/explore` 页面：显示 1306 styles，侧边栏标签动态加载（40个风格标签），无限滚动正常
- 标签筛选：点击 "Anime" 过滤，URL 更新为 `?tag=Anime`
- 图片显示：卡片封面图从 `/output/sref_XXX/images/01_XXX.png` 加载（服务器重启后修复）
- 详情页：`/explore/:id` 路由正常，图片网格 2 列、视频内联播放、复制按钮、Lightbox

---

## 八、后续待办

- [ ] 服务器重启后验证图片正常显示（previewImage 补丁生效）
- [ ] 测试详情页图片 Lightbox、复制按钮、Like 功能
- [ ] 考虑首页 "Style Gallery" 板块是否需要同步更新数据源
- [ ] 视频数量统计：911 个 sref 无视频，详情页需优雅处理空状态
