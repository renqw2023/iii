# Sitemap 构建时自动生成（prebuild 钩子）

**日期**: 2026-03-30
**文件**: `server/scripts/generateSitemaps.js`, `client/package.json`, `server/package.json`, `.gitignore`

---

## 问题背景

之前 sitemap XML 文件（`sitemap.xml`, `sitemap-seedance.xml` 等）是手动生成后提交进 git，存在两个问题：

1. **生产服务器 `git pull + npm run build` 无法自动更新 sitemap**：XML 文件由 git 管控，每次内容更新必须本地重新生成 → commit → push → 服务器 pull → 重新 build，链路长且手动
2. **大量 XML 文件污染 git 历史**：sitemap-gallery.xml（11,795 条）等文件每次变更都会产生巨大 diff

---

## 解决方案：prebuild 钩子

`npm` 的 `prebuild` 生命周期钩子在每次 `npm run build` **之前**自动执行，无需额外命令。

### 新部署流程

```bash
git pull                  # 拉取最新代码
cd server && npm install  # (如有新依赖)
cd ../client && npm run build
#   ↑ 自动先执行 prebuild：
#     1. 连接 MongoDB
#     2. 生成所有 sitemap → 写入 client/public/
#     3. 断开 MongoDB
#   ↑ 再执行 react-scripts build：
#     client/public/ 内容全部打包进 client/build/
#   结果：nginx 直接服务包含最新 sitemap 的静态文件
```

---

## 变更详情

### 1. `server/scripts/generateSitemaps.js`（新建）

独立的一次性执行脚本：
- 通过 `dotenv` 加载 `server/.env`（路径用 `__dirname` 确保从任意目录调用都正确）
- 支持 `MONGODB_URI` / `MONGO_URI` 两个环境变量名，兜底 dev 默认值
- 连接超时 15s，失败时打印 WARNING 后以 **exit(0)** 退出，不阻断 build
- 成功后主动关闭 mongoose 连接再退出

### 2. `client/package.json`

```diff
+ "prebuild": "node ../server/scripts/generateSitemaps.js",
  "build": "react-scripts build",
```

### 3. `server/package.json`

```diff
+ "generate-sitemaps": "node scripts/generateSitemaps.js",
```

方便在不执行 build 的情况下单独刷新 sitemap（如内容大规模更新后）。

### 4. `.gitignore`

```
# Sitemap & robots — generated at build time via prebuild script, not committed
client/public/sitemap*.xml
client/public/robots.txt
```

同时用 `git rm --cached` 移除了已跟踪的5个文件：
- `client/public/sitemap.xml`
- `client/public/sitemap-main.xml`
- `client/public/sitemap-images.xml`
- `client/public/sitemap-seedance.xml`
- `client/public/robots.txt`

---

## 验证

```bash
cd server && node scripts/generateSitemaps.js
# [generateSitemaps] Connecting to MongoDB…
# [generateSitemaps] Connected. Generating sitemaps…
# Sitemap saved: sitemap.xml
# Sitemap saved: sitemap-zh-CN.xml
# ...
# Sitemap saved: sitemap-seedance.xml
# Sitemap saved: robots.txt
# All sitemaps generated successfully!
# [generateSitemaps] All sitemaps written to client/public/
```

生成文件：`sitemap.xml` + 3个语言版 + `sitemap-sref.xml` + `sitemap-gallery.xml` + `sitemap-seedance.xml` + `sitemap-images.xml` + `sitemap-videos.xml` + `sitemap-main.xml` + `robots.txt`，共 11 个文件。

---

## 注意事项

- `prebuild` 脚本需要 `server/node_modules` 已安装（即 `server/` 目录下执行过 `npm install`）
- 若 MongoDB 不可达，脚本会打印 WARNING 并跳过，build 照常进行（使用 `client/public/` 中已有的旧文件，若无则 build 中不含 sitemap）
- Vercel 等纯静态 CI/CD 平台无 MongoDB 访问权限，prebuild 会跳过（无副作用）
