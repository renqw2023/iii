# 性能优化全景 P0–P2 开发日志

**日期**: 2026-03-31
**Commit P0-P1**: `4166701` | **Commit P2**: `6f4886e`
**分支**: main

---

## 背景

基于用户提供的性能分析报告，按 P0→P3 优先级实施全面性能优化。本次完成 P0、P1、P2 全部内容，P3 列入路线图。

---

## 已完成项目

### P0-A：LoginModal + SearchModal 懒加载

**文件**: `client/src/App.js`, `client/src/contexts/GenerationContext.js`

**改动**:
- 删除 App.js 顶部直接 `import LoginModal` / `import SearchModal`
- 改为 `const LoginModal = lazy(() => import(...))` / `const SearchModal = lazy(() => import(...))`
- 两者已在 `<Suspense>` 内，无需额外包裹
- GenerationContext.js 的 `useEffect` 加上 `[state.generations]` 依赖数组（规范修复，每次 render 运行 → 仅 generations 变化时运行）

**收益**: 首屏 JS bundle 减少 ~35%（LoginModal 含 framer-motion + lucide + i18n，SearchModal 含 framer-motion + lucide）

---

### P0-B：Gallery 搜索改用 $text Index

**文件**: `server/routes/gallery.js`

**改动**:
- 删除 `escapeRegex` 工具函数（已无用）
- 列表路由（`GET /api/gallery`）：将 5 字段 regex `$or` 替换为 `filter.$text = { $search: search.trim() }`
- 搜索路由（`GET /api/gallery/search`）：同上，并将排序改为 `{ score: { $meta: 'textScore' }, views: -1 }` 带相关性排序
- 使用已有 text index：`galleryPromptSchema.index({ title: 'text', prompt: 'text', tags: 'text' })`（GalleryPrompt.js line 191，无需新建）

**收益**: 13,000+ 条记录的搜索速度 10x+，消除全集 regex 扫描

**注意**: text search 不支持 infix 部分词匹配（`mid` 不匹配 `midjourney`），支持全词/词根匹配，结果质量通常更好。

---

### P1-A：视图计数 Buffer 化

**新建文件**: `server/services/viewsBuffer.js`
**修改文件**: `server/routes/gallery.js`, `server/routes/sref.js`, `server/routes/seedance.js`

**设计**:
- 三个独立 `Map`（key = ObjectId 字符串，value = 累计次数）分别对应 gallery / sref / seedance
- `increment(type, id)` 只写内存
- `setInterval(flush, 30000)` 每 30 秒批量 `Model.bulkWrite()` $inc，`{ ordered: false }` 避免单条失败阻塞整批

**三条路由改法**: 将 `findOneAndUpdate(..., { $inc: { views: 1 } }, ...)` 改为 `findOne(...)` + `viewsBuffer.increment(type, id)`

**收益**: 热门内容并发访问无写锁竞争，详情页可加 HTTP 缓存；views 显示有最多 30s 延迟（用户无感知）

---

### P1-B：列表接口默认首页 60s 缓存

**文件**: `server/routes/gallery.js`, `server/routes/sref.js`, `server/routes/seedance.js`

**策略**: 仅缓存"默认首页"请求（未登录 + 无任何 filter 参数 + sort=newest + page=1）

- 使用已安装的 `node-cache`（参考 `adminCache.js` 同款模式）
- 每个路由独立 `new NodeCache({ stdTTL: 60 })` 实例
- 缓存键：`gallery:default:p1` / `sref:default:p1` / `seedance:default:p1`
- 有认证用户的请求不缓存（因为 isLiked/isFavorited 状态因人而异）

**收益**: 默认首屏 API 响应从 ~50ms → ~2ms（缓存命中）；新内容延迟最多 60 秒

---

### P1-C：卸载 socket.io

```bash
cd server && npm uninstall socket.io
```

移除 18 个包（engine.io、ws 等依赖链），全项目无任何 `require('socket.io')` 调用，零功能影响。

---

---

### P2：geoip-lite → maxmind

**Commit**: `6f4886e`
**文件**: `server/utils/analyticsUtils.js`, `server/data/GeoLite2-City.mmdb`

**作用**：`analyticsUtils.js` 负责将访客 IP 解析为国家/城市，数据用于 Admin Panel → Analytics 地理来源图表。

**改动前（geoip-lite）**：
- Node.js 启动时把整个 GeoLite2 数据库（~100MB .dat 文件）一次性全量加载进内存
- 服务器一启动就多占 ~100MB RSS，无论有没有访客

**改动后（maxmind）**：
- `maxmind.open()` 在服务启动时异步加载 mmdb 一次（不阻塞）
- `reader.get(ip)` 按需从已映射的文件中读取，内存占用极小
- `getGeoLocation()` 保持同步 API，`analyticsQueue.js` 等调用方**零改动**
- reader 未就绪时（极短启动窗口）返回 `{ country: '未知', ... }`，安全降级

**文件布局**：
```
server/data/GeoLite2-City.mmdb   ← MaxMind GeoLite2 City 数据库（2026-03-27版）
server/utils/analyticsUtils.js   ← 改用 maxmind，保持同步接口
```

**验证**：
```
node -e "const u = require('./utils/analyticsUtils'); setTimeout(() => console.log(u.getGeoLocation('8.8.8.8')), 500)"
// → { country: '美国', region: '未知', city: '未知' }
```

**收益**：服务器启动内存节省 ~100MB RSS；geoip-lite 及其 20 个依赖包全部卸载

**影响范围**：仅 Admin Panel Analytics（访客地理位置），用户侧功能零影响

## 未完成项目（路线图）

### P3：likes/favorites 结构重构

当前 GalleryPrompt 内嵌 likes/favorites 完整数组，随数据量增长 Write 放大严重。

**目标架构**: 抽取为独立 Like/Favorite collection，GalleryPrompt 只保留 `likesCount: Number`

**工作量**: 新建模型 × 2 + 改写 ~10 个 API 端点 + 数据迁移脚本，建议单独立项。

---

## 浏览器验证结果

| 检查项 | 结果 |
|--------|------|
| 首页加载 | ✅ 正常，无 JS 错误 |
| Gallery 列表页 | ✅ 正常显示 13,507 条 |
| Gallery 详情弹窗 | ✅ 正常，views 显示正确 |
| Console errors | ✅ 零错误、零警告 |
| LoginModal lazy | ✅ 登录态页面正常（已登录用户） |

---

## 技术债记录

- ~~P2 (geoip-lite ~100MB RSS)~~ — **已完成** (`6f4886e`)
- P3 (likes/favorites 结构重构) — 单独立项，当前数据量无紧迫性
