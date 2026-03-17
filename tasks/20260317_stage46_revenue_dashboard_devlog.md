# Stage 46: Admin Revenue Dashboard — 开发日志

**日期**: 2026-03-17
**分支**: main
**状态**: ✅ 完成

---

## 背景与动机

项目三套餐（Starter $9.99 / Pro $19.99 / Ultimate $49.99）已通过 Stripe 完成支付流程，但 webhook 从未保存 USD 金额——`CreditTransaction` 的 `purchase` 记录只有积分数量。原有 Payments tab 明确标注 `"Stripe USD amount pending"`，缺乏任何收入分析能力。

本阶段目标：**补全 USD 收入记录 + 新增专用 Revenue 后台看板**，替换功能单薄的 Payments tab。

---

## 架构决策

### 为什么新建 Order 模型而不扩展 CreditTransaction？

- **职责分离**：积分流水记录用户资产变动，Order 记录商业交易；二者语义不同
- **扩展性**：Order 便于未来加退款（status: refunded）、多货币、发票编号
- **查询隔离**：收入聚合不需要扫描大量积分流水记录，性能更好

### 缓存策略

新增独立 `revenueCache`（5分钟 TTL），与已有的 statsCache/analyticsCache/listCache 平行。period 参数作为缓存 key 后缀（`admin:revenue:30d`），各周期独立缓存。

---

## 变更文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `server/models/Order.js` | 新建 | Order Mongoose 模型 |
| `server/routes/payments.js` | 修改 | webhook 补写 Order |
| `server/services/adminCache.js` | 修改 | revenueCache + getCachedRevenue |
| `server/routes/admin.js` | 修改 | GET /admin/revenue 端点 |
| `client/src/services/api.js` | 修改 | adminAPI.getRevenue |
| `client/src/components/Admin/tabs/RevenueTab.js` | 新建 | Revenue 看板组件 |
| `client/src/pages/AdminPanel.js` | 修改 | 替换 payments → revenue nav |

---

## 详细实现记录

### Step 1 — `server/models/Order.js`

```js
// 核心字段
userId       ObjectId ref User, required, index
planId       enum [starter, pro, ultimate]
planName     String（"Starter"）
amountUSD    Number（9.99）
credits      Number（1000）
currency     String, default 'usd'
stripeSessionId  String, unique sparse
stripePaymentIntentId  String
status       enum [completed, refunded], default 'completed'
createdAt    Date, default now, index
```

复合索引：`{ createdAt: -1 }` + `{ planId: 1, createdAt: -1 }`

### Step 2 — webhook 补写 Order

在 `checkout.session.completed` 处理块内，`CreditTransaction.create` 之后追加：

```js
await Order.create({
  userId,
  planId,
  planName: plan?.name || planId,
  amountUSD: (session.amount_total || 0) / 100,
  credits: creditsNum,
  currency: session.currency || 'usd',
  stripeSessionId: session.id,
  stripePaymentIntentId: session.payment_intent || null,
  status: 'completed',
});
```

顺带重构：将 `creditPlans.find(p => p.id === planId)` 结果存到 `plan` 变量，CreditTransaction 和 Order 共用，避免重复查找。

### Step 3 — `adminCache.getCachedRevenue(period)`

8个并行 Promise：

1. **summaryAgg** — 指定周期内 totalRevenue + totalOrders
2. **revenueToday** — 今日 00:00 起（不受 period 影响）
3. **revenueThisMonth** — 本月1日起
4. **ordersToday** — 今日订单数
5. **ordersThisMonth** — 本月订单数
6. **planBreakdownRaw** — 按 planId group，sum amountUSD
7. **dailyRevenueRaw** — 固定过去30天（图表用，不随 period 变化）
8. **recentOrders** — 最近10笔，populate userId

返回结构：
```json
{
  "summary": { totalRevenue, totalOrders, revenueToday, revenueThisMonth,
               ordersToday, ordersThisMonth, avgOrderValue },
  "planBreakdown": [{ planId, planName, price, color, orders, revenue, pct }],
  "dailyRevenue":  [{ date, revenue, orders }],   // 30天，缺失日填0
  "recentOrders":  [...]
}
```

planBreakdown 中预置三套餐颜色（Starter=#6366f1 / Pro=#3b82f6 / Ultimate=#f59e0b）和价格。

### Step 4 — GET /admin/revenue

```
GET /api/admin/revenue?period=30d
```

period 白名单校验（防止 cache key 注入），调用 `adminCache.getCachedRevenue(period)`。

### Step 5 — RevenueTab.js 组件

**Period Selector**：右上角 4 按钮（7D/30D/90D/ALL），切换后重新请求。

**4个 Summary Cards**：
- Total Revenue（绿 #22c55e）— 含 totalOrders 副信息
- This Month（蓝 #3b82f6）— 含 ordersThisMonth
- Today（琥珀 #f59e0b）— 含 ordersToday
- Avg Order Value（紫 #8b5cf6）

**3个 Plan Breakdown Cards**：横排，含套餐价格 badge、大字 USD 金额、订单数、彩色进度条（占比%）。前端做了 `filledPlans` 补全逻辑——即使某套餐从未售出也显示空卡，保证始终3列。

**30日收入 SVG Area Chart**：
- 复用 OverviewTab 同款 SVG 模式（polyline + area fill + defs linearGradient）
- 渐变色改为绿色 `#22c55e`
- 每5天显示一个 X 轴标签（`filter((_, i) => i % 5 === 0 || i === data.length - 1)`）
- 右上角显示 period 总收入

**Recent Orders 表格**：6列（Time / User / Plan badge / Amount / Status badge / Session ID前12位），用户 avatar 有图显示图，无图显示首字母头像，skeleton loading。

### Step 6 — AdminPanel.js 替换

- 图标 `ShoppingBag` → `DollarSign`
- NAV 条目 `payments` → `revenue`
- import `PaymentsTab` → `RevenueTab`
- render block `activeTab === 'payments'` → `activeTab === 'revenue'`
- PaymentsTab.js 文件保留（未删除）

---

## 关于 PaymentsTab 的处理

原 PaymentsTab 提供分页的积分购买流水（CreditTransaction，reason=purchase）。该功能在 Transactions tab 中通过 `reason` 过滤器可以访问，Revenue tab 的 Recent Orders 也覆盖了最近10笔，因此决定**不另行保留入口**，直接替换。

---

## 验证结果

```
react-scripts build → Compiled successfully (+1.58 KB)
node -e "require('./server/routes/admin')" → Routes OK
node -e "require('./server/models/Order')" → OK
```

空数据库下所有字段返回 0，前端不崩溃（fmt(null) → "$0.00"，planBreakdown 前端补全3张空卡）。

---

## 遗留 / 后续

- Stripe 尚未配置密钥，Order 记录需上线后才会有真实数据（框架完整，无需改代码）
- 退款场景：手动更新 Order.status = 'refunded'，Revenue 聚合中 `$match: { status: 'completed' }` 会自动排除
- 4K CDN 转存（replicate.delivery URL 约1小时过期）仍待处理
