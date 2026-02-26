# Gallery 空白修复开发日志
**日期**: 2026-02-25
**目标**: 排查并修复 Gallery 页面数据不显示（空白）的问题
**关联上一日志**: `tasks/20260223_gallery_import_devlog.md`

---

## 一、会话开始时的项目现状（继承自 2026-02-23）

### 技术栈
- 前端：React 18 + TailwindCSS + Framer Motion + react-query + i18next（**端口 3100**）
- 后端：Express.js + Mongoose/MongoDB（**端口 5500**）
- 数据库：`mongodb://localhost:27017/midjourney-gallery-dev`

### 上一会话已完成的工作
| 文件 | 状态 |
|------|------|
| `server/scripts/importNanoBanana.js` | ✅ 5个bug全部修复，重写 parseNanoBananaReadme() |
| `client/src/styles/gallery.css` | ⚠️ 上一会话自行改为1:1比例（未经用户指示，待确认是否符合需求） |
| `client/src/components/Gallery/GalleryCard.js` | ⚠️ 上一会话自行增加骨架动画（未经用户指示，待确认） |
| MongoDB 数据 | ✅ 已导入10条 NanoBanana Pro 数据，含图片、作者、描述 |

### 上一会话遗留的未解决问题
- 🚨 **前端 Gallery 页面显示空白**（`0 prompts found`）
- 上一会话判断可能原因：Network 面板请求状态、Console 报错、后端是否处理请求

### 重要说明（用户纠正）
上一会话将"卡片1:1比例"和"骨架动画"作为成果汇报，但这两项**均未经用户指示**，属于自作主张。用户要求是**100%复刻 https://www.meigen.ai/ UI 样式**，未经确认的自行改动不应作为完成项列出。

---

## 二、本次会话排查过程

### Step 1：确认 MCP 工具可用
- chrome-devtools MCP 上一会话已安装，本次会话启动后验证可用
- 调用 `list_pages` 成功返回结果，工具正常

### Step 2：导航到 Gallery 页面，取快照
```
http://localhost:3100/gallery
```
快照结果：页面 UI 框架完整（标题、搜索框、筛选按钮均正常渲染），但显示：
```
0 prompts found
🔍 No prompts found. Try adjusting your filters.
```

### Step 3：抓取 Network 请求
```
GET http://localhost:5500/api/gallery?page=1&limit=24&sort=newest
状态：[net::ERR_CONNECTION_REFUSED]
```
**关键发现**：前端直接请求 `http://localhost:5500`（不走 proxy），但后端连接被拒绝。

> 注：前端 `client/package.json` 配置了 `"proxy": "http://localhost:5500"`，但生产构建或某些配置下 CRA proxy 不生效，前端代码直接向 5500 发请求，被 Windows 网络栈拒绝。

### Step 4：检查后端端口监听状态
```bash
netstat -ano | findstr ":5500"
# 结果：
TCP    [::1]:5500    [::]:0    LISTENING    19008
```

**根本原因定位**：

| 项目 | 值 |
|------|----|
| 后端实际监听地址 | `[::1]:5500`（**IPv6 loopback**） |
| 浏览器请求地址 | `http://localhost:5500`（Windows 解析为 `127.0.0.1` **IPv4**） |
| 结果 | IPv4 的 5500 端口无监听 → `ERR_CONNECTION_REFUSED` |

**原因链**：`server/config/index.js` 中 `host` 默认值为 `'localhost'`，Node.js 在 Windows 上将 `localhost` 解析为 IPv6 `::1`，而浏览器直接访问 `http://localhost:5500` 走 IPv4 `127.0.0.1`，两者不匹配。

---

## 三、修复方案

### 修改文件：`server/config/index.js`

**改动位置**：`server` 配置块的 `host` 字段

```javascript
// 修改前
host: process.env.HOST || 'localhost',

// 修改后
host: process.env.HOST || '0.0.0.0',
```

**原理**：`0.0.0.0` 表示监听所有网络接口，同时覆盖 IPv4（`127.0.0.1`）和 IPv6（`::1`），浏览器无论用哪种方式解析 `localhost` 都能连上。

---

## 四、操作步骤

1. 修改 `server/config/index.js`（已完成）
2. 用户在后端终端 `Ctrl+C` 停止服务
3. 重新运行 `node index.js`
4. 刷新浏览器 `http://localhost:3100/gallery` 验证数据显示

---

## 五、待验证

- [ ] 重启后端后 Gallery 页面是否正常显示数据
- [ ] `netstat` 确认端口从 `[::1]:5500` 变为 `0.0.0.0:5500`

---

## 六、遗留问题（本次会话未处理）

### 6.1 UI 复刻（最高优先级，下一步）
- 用户明确要求：**100% 复刻 https://www.meigen.ai/**
- 上一会话自行修改了 `gallery.css`（1:1比例）和 `GalleryCard.js`（骨架动画），**均需重新对照 meigen.ai 确认是否正确**
- 待操作：用 chrome-devtools MCP 打开 meigen.ai，逐项对比并对齐

### 6.2 全量数据导入
- 当前 MongoDB 只有10条测试数据
- 全量导入命令（测试通过后执行）：
```bash
cd E:\pm01\server
node scripts/importNanoBanana.js        # 全量 NanoBanana Pro（约9000+条）
node scripts/importSeedance.js          # Seedance 视频数据
```

---

## 七、环境信息

| 项目 | 值 |
|------|----|
| Node.js | v22.15.1 |
| 前端端口 | **3100**（注意：不是默认的3000） |
| 后端端口 | 5500 |
| 数据库 | `mongodb://localhost:27017/midjourney-gallery-dev` |
| 数据源路径 | `E:\pm01\_data_sources\nanobanana\README.md` |

---

## 八、经验教训（补充到 lessons.md）

### 【环境】Windows 上 Node.js 默认 host 'localhost' 解析为 IPv6
- `host: 'localhost'` → Node 监听 `[::1]`（IPv6）
- 浏览器 `http://localhost:PORT` → Windows 解析为 `127.0.0.1`（IPv4）
- 两者不匹配 → `ERR_CONNECTION_REFUSED`
- **规则**：本地开发服务器 host 应设为 `0.0.0.0`，或明确写 `127.0.0.1`

### 【调试】Network 面板的错误类型决定排查方向
- `ERR_CONNECTION_REFUSED` → 端口未监听或地址不匹配，先查 `netstat`
- `404` → 路由未注册
- `CORS error` → 跨域配置问题
- `401/403` → 认证/权限问题
- 不要在没有看 Network 面板之前猜原因
