# Stage 45 开发日志 — Admin Panel 重构

**日期**: 2026-03-17
**分支**: main
**Commit 关联**: Stage 45（待提交）
**开发者**: Claude Code + reki

---

## 背景与动机

原有 `/admin` 面板基于早期 UGC 发布模式构建，管理 Posts / Prompts 内容，与当前平台定位（AI 图像生成工具）严重脱节。具体问题：

- 展示的是 Posts/Prompts 表格，与业务无关
- 没有积分流水可查，无法监控平台消费行为
- 没有 KPI 仪表板，无法实时掌握平台健康度
- 用户表格缺少积分/认证方式/最后在线等关键字段
- 用户行为（lastActiveAt）从未被更新

---

## 架构决策

| 决策 | 说明 |
|------|------|
| **保留后端旧路由** | `admin.js` 中 Posts/Prompts 路由不删除，避免引入风险 |
| **仅重构前端** | AdminPanel.js 完全重写为新 4-tab 架构 |
| **无新 npm 依赖** | 折线图用 inline SVG 实现，不引入 recharts |
| **CSS 变量规范** | 全部使用 `var(--bg-card)` / `var(--accent-primary)` 等变量，适配深色主题 |
| **Revenue 暂显示 Credits Sold** | Stripe webhook 未存储美元金额，显示积分数代替 |

---

## 改动详情

### 1. `server/middleware/auth.js` — lastActiveAt 节流更新

**问题**: `analytics.lastActiveAt` 字段从未被更新，导致 Overview KPI 中 Active Users (30d) 数据失真。

**方案**: 在 `auth()` 中间件成功路径 `next()` 之后，fire-and-forget 方式更新该字段，添加 1 分钟节流防止高频写入：

```js
const now = new Date();
const lastActive = user.analytics?.lastActiveAt;
if (!lastActive || (now - lastActive) > 60_000) {
  User.updateOne({ _id: user._id }, { $set: { 'analytics.lastActiveAt': now } }).catch(() => {});
}
```

**注意**: 放在 `next()` 之后，不阻塞请求响应。

---

### 2. `server/services/adminCache.js` — Credits KPI + 用户字段扩展

**新增 CreditTransaction 聚合**（5 项，与现有 Promise.all 合并）：

| 字段 | 查询 |
|------|------|
| `newUsersToday` | `User.countDocuments({ createdAt: { $gte: todayStart } })` |
| `creditsIssuedToday` | `CreditTransaction` type=earn, createdAt>=今天 |
| `creditsConsumedToday` | `CreditTransaction` type=spend, createdAt>=今天 |
| `totalGenerations` | reason in [generate_image, generate_video] 总计数 |
| `dailyRegistrations` | 近 7 天每日注册，聚合后补全缺失日期为 0 |

**用户列表字段扩展**：
`.select()` 新增：`role authProvider credits freeCredits hasPurchasedBefore inviteUsedCount`

**status='all' 修复**：
原来 status='all' 仍然只查 `isActive: true`，改为不加过滤条件（显示全部用户包括被封禁的）。

---

### 3. `server/routes/admin.js` — 新增 GET /admin/transactions

**路径**: `GET /api/admin/transactions`
**权限**: adminAuth
**无缓存**（实时查询）

**支持的 Query 参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` / `limit` | number | 分页，默认 1/30 |
| `type` | `earn\|spend\|all` | 交易类型 |
| `reason` | enum | 具体原因，all 不过滤 |
| `walletType` | string | free/paid/mixed |
| `userId` | ObjectId | 指定用户 |
| `search` | string | 搜索 email/username，最多解析 50 个 userId |
| `dateFrom` / `dateTo` | ISO date | 时间范围 |
| `sort` / `order` | string | 排序字段与方向 |

**Populate**: `userId → username email avatar`

---

### 4. `server/routes/credits.js` — grant/deduct 后清缓存

两个 admin 操作成功后调用 `adminCache.clearCache('stats')`，确保 Overview KPI 实时刷新。

---

### 5. `client/src/services/api.js` — adminAPI 扩展

新增：
```js
getTransactions: (params) => api.get('/admin/transactions', { params }),
deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
```

---

### 6. `client/src/services/creditsApi.js` — adminDeduct

新增：
```js
adminDeduct: (userId, amount, note) =>
  axios.post('/api/credits/admin/deduct', { userId, amount, note }, { headers: getAuthHeaders() }),
```

**文件名修复**: 原文件为 `creditsAPI.js`，但全项目 7 处均 import `creditsApi`（小写），导致 Windows 生产环境构建失败。统一重命名为 `creditsApi.js`。

---

### 7. 新建 Admin Tab 组件

目录：`client/src/components/Admin/tabs/`

#### OverviewTab.js

6 个 KPI 卡片：
- Total Users（全部活跃用户）
- New Today（今日新注册）
- Active (30d)（30天内活跃）
- Total Generations（全部生图/视频次数）
- Credits Issued Today（今日发放积分）
- Credits Spent Today（今日消费积分）

7 天注册折线图（inline SVG，无外部依赖）：
- `polyline` 连线 + 每个数据点 `circle`
- 自动归一化 Y 轴（max 值填满高度）
- 底部显示 MM-DD 日期标签

#### UsersTab.js

表格列：Avatar+Username | Email | Auth(Google/Local icon) | Credits(paid+free badges) | Last Seen | Invites | Status | Actions

**Last Seen 格式化**：
- < 1min → "just now"
- < 1h → "Xm ago"
- < 24h → "Xh ago"
- 其他 → 本地日期

**Actions 下拉菜单**（MoreHorizontal 图标触发）：
- Ban / Unban（调用 PUT /admin/users/:id/status）
- Grant Credits（弹出 modal）
- Deduct Credits（弹出 modal）
- Delete（confirm 弹窗，调用 DELETE /admin/users/:id）

**CreditsModal**：输入 amount + note，调用 creditsAPI.adminGrant / adminDeduct，成功后 toast + 刷新列表。

#### TransactionsTab.js

过滤栏：User 搜索 | Type 下拉 | Reason 下拉（11 个枚举值）| DateFrom | DateTo

表格列：Time | User(username+email) | Type badge(EARN/SPEND) | Amount(+/-带颜色) | Reason | Wallet | Balance After

所有过滤变化 → `useEffect` 自动触发 API 调用（`page` 重置为 1）。

#### PaymentsTab.js

复用 `getTransactions({ reason: 'purchase' })`，显示：Time | User | Credits Sold | Wallet | Balance After | Note

顶部说明：暂显示 Credits Sold（Stripe USD 金额存储为未来功能）。

---

### 8. `client/src/pages/AdminPanel.js` — 完全重写

原文件 600+ 行，充满旧 Posts/Prompts 逻辑，重写为 ~110 行 tab shell：

**结构**：
```
AdminPanel
├── Header（标题 + 副标题）
├── Tab Bar（4 个 tab 按钮，active 高亮用 accent-primary）
├── Tab Content（条件渲染，lazy-load 各 tab）
└── Toast（3s 自动消失，fixed bottom-right）
```

**Admin Guard**：`user.role !== 'admin'` → `navigate('/')` + 渲染 "Access denied"。

---

## 文件变更清单

```
server/middleware/auth.js              修改（+8行）
server/services/adminCache.js          修改（+70行，重写getCachedStats）
server/routes/admin.js                 修改（+57行，新增transactions端点）
server/routes/credits.js               修改（+2行，clearCache调用）
client/src/services/api.js             修改（+5行）
client/src/services/creditsApi.js      重命名（creditsAPI→creditsApi）+ 新增adminDeduct
client/src/pages/AdminPanel.js         完全重写（600行→110行）
client/src/components/Admin/tabs/OverviewTab.js      新建
client/src/components/Admin/tabs/UsersTab.js         新建
client/src/components/Admin/tabs/TransactionsTab.js  新建
client/src/components/Admin/tabs/PaymentsTab.js      新建
```

---

## 遇到的问题与解决

### 问题 1：creditsAPI.js 文件名大小写不一致

**现象**：`react-scripts build` 提示 7 个 `Module not found: Cannot find file: 'creditsApi.js' does not match the corresponding name on disk: 'creditsAPI.js'`

**根因**：Windows 文件系统大小写不敏感（开发时不报错），但 Webpack 在生产构建时严格检查大小写。文件名 `creditsAPI.js`，但 7 处 import 写的是 `creditsApi`。

**解决**：`mv creditsAPI.js creditsApi.js`，统一小写 `Api`，并更新 `UsersTab.js` 中的 import 路径。

### 问题 2：`config.db.uri` → 实际是 `config.database.uri`

调试脚本中的小问题，config 对象的 key 是 `database` 而非 `db`。

---

## 验证结果

- `react-scripts build` → **编译成功，无错误**（仅有 Browserslist 版本过时的提示，与本次无关）
- ESLint 清理：`ActionsMenu` 中的 `onClose` 参数改为 `_onClose` 消除 no-unused-vars 警告

---

## 后续优化建议

| 优先级 | 内容 |
|--------|------|
| 中 | Stripe webhook 存储 `amountUSD` 字段，Payments tab 显示真实收入 |
| 低 | Overview 折线图支持点击日期查看当日注册用户列表 |
| 低 | Users tab 支持列排序（点击表头） |
| 低 | Transactions tab 支持 CSV 导出 |
