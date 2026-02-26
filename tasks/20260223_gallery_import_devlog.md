# Gallery 数据导入开发日志
**日期**: 2026-02-23
**目标**: 将 NanoBanana Pro 数据同步到 Gallery 页面，前端显示效果对齐 meigen.ai

---

## 一、项目现状（会话开始时）

### 技术栈
- 前端：React 18 + TailwindCSS + Framer Motion + react-query + i18next
- 后端：Express.js + Mongoose/MongoDB（port 5500）
- 数据库：`mongodb://localhost:27017/midjourney-gallery-dev`

### 已存在的文件（本次会话前已完成）
| 文件 | 状态 |
|------|------|
| `server/models/GalleryPrompt.js` | ✅ 已完成 |
| `server/routes/gallery.js` | ✅ 已完成，含筛选/搜索/点赞/收藏/copy计数 |
| `server/routes/seedance.js` | ✅ 已完成 |
| `server/scripts/importNanoBanana.js` | ⚠️ 存在但有 bug（本次修复） |
| `server/scripts/importSeedance.js` | ✅ 存在（未测试） |
| `client/src/pages/Gallery/GalleryList.js` | ✅ 已完成 |
| `client/src/pages/Gallery/GalleryDetail.js` | ✅ 已完成 |
| `client/src/components/Gallery/GalleryCard.js` | ✅ 存在（本次优化） |
| `client/src/components/Gallery/ModelFilter.js` | ✅ 已完成 |
| `client/src/components/Gallery/TagFilter.js` | ✅ 已完成 |
| `client/src/services/galleryApi.js` | ✅ 已完成 |
| `client/src/styles/gallery.css` | ✅ 存在（本次修改） |
| `_data_sources/nanobanana/README.md` | ✅ 已克隆到本地 |
| `_data_sources/seedance/video-urls.json` | ✅ 已克隆到本地 |

### 路由注册（已确认）
- 后端 `server/index.js`：`app.use('/api/gallery', galleryRoutes)` ✅
- 前端 `client/src/App.js`：`<Route path="gallery" element={<GalleryList />} />` ✅
- 前端 proxy：`client/package.json` → `"proxy": "http://localhost:5500"` ✅
- 前端 API baseURL：`/api`（通过 proxy 转发到 5500）✅

---

## 二、发现的 Bug（importNanoBanana.js）

### Bug 1：图片 URL 提取格式错误 ❌
- **原代码**：`sectionContent.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)`（只匹配 Markdown 格式）
- **实际格式**：README 使用 HTML 格式 `<img src="https://cms-assets.youmind.com/..." width="700">`
- **结果**：所有条目 `previewImage` 字段为空字符串
- **修复**：改为优先匹配 `/<img\s+src="(https?:\/\/[^"]+)"/i`，兼容 Markdown 格式作为退路

### Bug 2：sourceId 冲突 ❌
- **原代码**：`sourceId: \`nanobanana-${pos.number}\``
- **问题**：README 有两个区块（Featured 区 + All Prompts 区），两个区都有 `No.1`、`No.2`... 导致 sourceId 重复冲突，后面的覆盖前面的
- **修复**：改为全局递增计数器，`sourceId: \`nanobanana-g${globalIdx}\``

### Bug 3：作者信息未提取 ❌
- **原代码**：无 author 提取逻辑，`sourceAuthor` 始终为空
- **实际格式**：README 每条有 `- **Author:** [Nicolechan](https://x.com/stark_nico99)` 格式
- **修复**：新增正则 `/\*\*Author:\*\*\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i`

### Bug 4：描述字段使用 prompt 截断 ❌
- **原代码**：`description: promptText.substring(0, 500)`（截断 prompt 正文作为描述）
- **实际格式**：README 每条有专门的 `#### 📖 Description` 小节
- **修复**：优先提取 Description 小节内容

### Bug 5：Featured 判断逻辑错误 ❌
- **原代码**：`isFeatured: pos.number <= 9`（按序号判断）
- **实际标识**：README 用 `![Featured](https://img.shields.io/badge/⭐-Featured-gold)` badge 标记
- **修复**：改为检测 `sectionContent.includes('⭐-Featured')`

---

## 三、本次修改的文件

### 1. `server/scripts/importNanoBanana.js`
**改动范围**：完全重写 `parseNanoBananaReadme()` 函数（约 60 行 → 110 行）

关键改动：
```javascript
// 图片提取：HTML <img> 格式优先
const htmlImgMatch = sectionContent.match(/<img\s+src="(https?:\/\/[^"]+)"/i);
if (htmlImgMatch) imageUrl = htmlImgMatch[1];

// 作者提取
const authorMatch = sectionContent.match(/\*\*Author:\*\*\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i);
if (authorMatch) { sourceAuthor = authorMatch[1]; sourceUrl = authorMatch[2]; }

// Description 小节提取
const descMatch = sectionContent.match(/####\s*📖\s*Description\s*\n([\s\S]*?)(?=\n####|\n###|$)/);

// sourceId 全局唯一
const sourceId = `nanobanana-g${pos.globalIdx}`;

// Featured 按 badge 判断
const isFeaturedByBadge = sectionContent.includes('⭐-Featured');
```

### 2. `client/src/styles/gallery.css`
```css
/* 修改前 */
.gallery-card-image { aspect-ratio: 4/3; }

/* 修改后（对齐 meigen.ai 正方形卡片） */
.gallery-card-image { aspect-ratio: 1/1; }
```

### 3. `client/src/components/Gallery/GalleryCard.js`
- 卡片预览文字从 `prompt.prompt`（完整 prompt）改为 `prompt.description || prompt.prompt`
- 图片加载中增加骨架动画（`animate-pulse` 渐入）

---

## 四、数据导入结果

```bash
# 命令
cd E:\pm01\server
node scripts/importNanoBanana.js --limit 10

# 结果
总条数: 10
有图片: 10/10  ← 全部有预览图（修复前全部为空）
Featured: 9
作者信息: 完整（Nicolechan, Mansi Sanghani, 宝玉, VoxcatAI 等）
```

**导入的数据示例**：
| sourceId | 标题 | 作者 | 图片 |
|----------|------|------|------|
| nanobanana-g1 | Wide quote card with portrait... | Nicolechan | ✅ |
| nanobanana-g2 | Premium liquid glass Bento grid... | Mansi Sanghani | ✅ |
| nanobanana-g3 | Hand-drawn style header image... | 工藤 晶 | ✅ |
| nanobanana-g4 | Watercolor map of Germany... | Florian Gallwitz | ✅ |
| nanobanana-g9 | Profile / Avatar - Ultra-Realistic... | Synthia | ✅ |

---

## 五、当前未解决问题 🚨

### 问题：前端 Gallery 页面显示空（最高优先级）

**已确认不是问题的**：
- ✅ MongoDB 有数据（10条，`isActive: true, isPublic: true`）
- ✅ 后端路由正确注册（`/api/gallery`）
- ✅ 前端路由正确（`/gallery` → `GalleryList`）
- ✅ 前端 proxy 配置正确（`http://localhost:5500`）
- ✅ API 响应结构匹配（后端返回 `{prompts, pagination}`，前端读 `data?.data?.prompts`）

**待排查的方向**：
1. 浏览器 Network 面板：`/api/gallery` 请求的实际状态码和响应体
2. 浏览器 Console：是否有 CORS 错误、JS 错误
3. 后端是否真的在处理请求（server log）

**下一步**：
- 已安装 `chrome-devtools` MCP（`claude mcp add chrome-devtools npx chrome-devtools-mcp@latest`）
- 重启 Claude Code 后用 MCP 连接浏览器 DevTools 直接查看网络请求和控制台报错

---

## 六、全量导入命令（测试通过后执行）

```bash
# 全量导入（约 9000+ 条 NanoBanana Pro）
cd E:\pm01\server
node scripts/importNanoBanana.js

# 导入 Seedance 视频数据
node scripts/importSeedance.js
```

---

## 七、meigen.ai 对齐清单

| 功能 | 状态 |
|------|------|
| 模型筛选栏（All/NanoBanana/Midjourney/GPT Image） | ✅ 已实现（ModelFilter.js） |
| 标签筛选行（横向滚动） | ✅ 已实现（TagFilter.js） |
| 卡片正方形图片（1:1） | ✅ 本次修复 |
| 卡片：模型 Badge 左上角 | ✅ 已实现 |
| 卡片：标题 + 描述截断 | ✅ 本次修复（用 description） |
| 卡片：作者 @handle | ✅ 本次修复（提取了 sourceAuthor） |
| 卡片：likes + views | ✅ 已实现 |
| Hover：显示 Copy/Like/Bookmark 按钮 | ✅ 已实现 |
| 搜索框（Ctrl+K） | ✅ 已实现 |
| 分页 | ✅ 已实现 |
| 图片懒加载 + 骨架占位 | ✅ 本次优化 |
| 详情页：完整 prompt + 一键复制 | ✅ 已实现 |
| 详情页：相关推荐 | ✅ 已实现 |
| 响应式（4→2→1列） | ✅ 已实现 |

---

## 八、环境信息

- Node.js: v22.15.1
- 后端端口: 5500
- 数据库: `mongodb://localhost:27017/midjourney-gallery-dev`
- 前端端口: 3000（默认 CRA）
- 数据源路径: `E:\pm01\_data_sources\nanobanana\README.md`
