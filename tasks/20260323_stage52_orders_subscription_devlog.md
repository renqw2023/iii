# Stage 52 开发日志 — 用户订单历史 & 我的套餐页面

**日期**: 2026-03-23
**阶段**: Stage 52
**状态**: ✅ 完成

---

## 背景与目标

用户完成 Stripe 积分购买后，缺少两个关键入口：

1. **历史订单**：无法查阅过去的充值记录
2. **当前套餐**：无法直观了解自己所属的套餐等级及积分消耗情况

本阶段新增 `/orders`（购买记录列表）和 `/subscription`（我的套餐）两个页面，并在侧边栏 Account 下拉菜单中注册导航入口。

---

## 实施内容

### 后端（`server/routes/payments.js`）

新增两个 API 端点：

#### GET /api/payments/orders（需 auth）

```js
Order.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50)
// 返回字段：planId, planName, amountUSD, currency, credits, status, createdAt, stripeSessionId
```

- 最多返回 50 条
- 按创建时间倒序
- 字段选择精简（不暴露 stripePaymentIntentId）

#### GET /api/payments/current-plan（需 auth）

```js
// 逻辑：取所有已完成订单，找出等级最高的套餐
const PLAN_ORDER = ['free', 'starter', 'pro', 'ultimate'];
const best = orders.reduce((prev, cur) =>
  PLAN_ORDER.indexOf(cur.planId) > PLAN_ORDER.indexOf(prev.planId) ? cur : prev,
  { planId: 'free', planName: 'Free', credits: 0, createdAt: null }
);
```

返回结构：
```json
{
  "planId": "pro",
  "planName": "Pro",
  "purchasedAt": "2026-03-15T10:00:00Z",
  "totalPurchased": 1700,   // 所有订单积分之和（用于进度条分母）
  "ordersCount": 2
}
```

`totalPurchased` 是该用户历史所有已完成订单的积分总量，用于前端计算剩余百分比。

---

### 前端 API 服务（`client/src/services/creditsApi.js`）

```js
getOrders:      () => axios.get('/api/payments/orders',       { headers: getAuthHeaders() }),
getCurrentPlan: () => axios.get('/api/payments/current-plan', { headers: getAuthHeaders() }),
```

---

### 新建页面

#### `/orders`（`client/src/pages/Orders.js`）

| 状态 | 表现 |
|------|------|
| 加载中 | 3 行 Skeleton 占位符（animate-pulse） |
| 空状态 | ShoppingBag 大图标 + "No orders yet" + "Add Credits" 按钮 |
| 有数据 | 每行：套餐名 / 购买时间 / 金额+币种 / 积分数 / 状态徽章 |

状态徽章：
- `completed` → 绿色圆角徽章（CheckCircle）
- `refunded` → 红色圆角徽章（XCircle）

#### `/subscription`（`client/src/pages/Subscription.js`）—— 重新设计（v2）

**核心设计原则**：只显示当前用户所处的套餐（不展示所有套餐），风格对齐 Add Credits 页面（渐变卡片）。

**套餐卡片**（按 planId 使用不同渐变色）：
| planId | 渐变 |
|--------|------|
| free | `#6b7280 → #9ca3af`（灰色） |
| starter | `#3b82f6 → #60a5fa`（蓝色） |
| pro | `#6366f1 → #8b5cf6`（紫色） |
| ultimate | `#f59e0b → #fb923c`（橙金色） |

**卡片内容**：
- 顶部：套餐名 + 状态徽章（Active 绿色 / Depleted 红色）
- 购买日期 / "Free tier — resets daily"
- 积分剩余：`remaining / total` + 百分比数字（大字号）
- 进度条：绿色（> 40%）/ 橙色（≤ 40%）/ 红色（0% / depleted）
- 免费套餐附加说明：重置时间提示

**积分计算逻辑**：
```js
// 免费用户：freeCredits / dailyFree
// 付费用户：paidCredits / totalPurchased（所有历史购买总量）
const remaining = isFree ? freeCredits : paidCredits;
const total     = isFree ? dailyFree   : totalPurchased;
const pct       = total > 0 ? Math.round((remaining / total) * 100) : 0;
const depleted  = remaining === 0;
```

**Depleted 状态**（积分为 0 时）：
- 状态徽章变红色 "Depleted"
- 进度条变红
- CTA 按钮变红色 "Add Credits"

**底部 CTA 区域**：
- 免费用户：灰色卡片 + "Unlock permanent credits" + Upgrade 按钮 → `/credits`
- 付费用户：显示购买次数/总量 + Add Credits 按钮 → `/credits`
- 底部 "View order history →" 链接 → `/orders`

---

### 路由注册（`client/src/App.js`）

```jsx
// ProtectedRoute 块内
<Route path="orders"       element={<Orders />} />
<Route path="subscription" element={<Subscription />} />
```

---

### 侧边栏（`client/src/components/Layout/Sidebar.js`）

新增 lucide-react import：`ShoppingBag, CreditCard`

Account 下拉菜单 settings 数组追加：
```js
{ icon: ShoppingBag,  label: t('sidebar.orders'),        to: '/orders' },
{ icon: CreditCard,   label: t('sidebar.subscription'),  to: '/subscription' },
```

位置：Favorites 之后、Docs 之前。

---

### 国际化（`client/src/i18n/modules/sidebar.js`）

| key | zh-CN | en-US | ja-JP |
|-----|-------|-------|-------|
| `orders` | 订单记录 | Order History | 注文履歴 |
| `subscription` | 我的套餐 | Subscription | サブスクリプション |

---

## 验证截图说明

| 场景 | 结果 |
|------|------|
| `/orders`（无购买记录） | 正确显示空状态 ShoppingBag + "No orders yet" |
| `/subscription`（Free 用户） | 灰色渐变卡片，22/40 credits，55%，Active 状态，底部 Upgrade CTA |
| Sidebar Account 下拉 | "Order History" + "Subscription" 两个菜单项正常显示 |

> 注：后端新路由（GET /orders, GET /current-plan）需要服务端重启后生效。前端渲染逻辑在 API 404 时正确回退到 Free 套餐默认值，不崩溃。

---

## 修改文件清单

| 文件 | 操作 |
|------|------|
| `server/routes/payments.js` | 追加 GET /orders + GET /current-plan（v2 含 totalPurchased） |
| `client/src/services/creditsApi.js` | 追加 getOrders / getCurrentPlan |
| `client/src/pages/Orders.js` | **新建** |
| `client/src/pages/Subscription.js` | **新建**（v2 重新设计，单卡片+进度条） |
| `client/src/App.js` | 注册 /orders + /subscription 路由 |
| `client/src/components/Layout/Sidebar.js` | 追加 ShoppingBag/CreditCard import + 2 个菜单项 |
| `client/src/i18n/modules/sidebar.js` | 追加 orders / subscription i18n key（三语） |

---

## 已知限制 & 后续 TODO

1. **服务端需重启**：新路由在 `node index.js` 进程重启前不生效（无 nodemon 热重载）
2. **进度条分母精度**：`totalPurchased` 是历史所有订单积分之和；若用户多次充值不同套餐，分母会累加（e.g., 购买了 Starter 500 + Pro 1200 = 1700），这是预期行为
3. **Subscription 页面无时间维度**：当前积分是一次性购买（无订阅周期），若后续引入月度订阅制，需增加 `expiresAt` 字段和倒计时 UI
