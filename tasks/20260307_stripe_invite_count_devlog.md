# 阶段26 开发日志 — Stripe 积分购买 + 邀请使用计数

**日期**: 2026-03-07
**分支**: main
**Commit**: 待提交

---

## 背景与目标

对标 MeiGen.ai 竞品分析后确定两个核心缺口：

1. **积分付费渠道缺失**：用户仅能通过每日签到 +10 积分，无法购买积分包，变现能力为零。
2. **邀请正反馈缺失**：邀请码功能已有，但邀请人看不到自己的链接被用了多少次，缺乏激励闭环。

本阶段目标：接入 Stripe Checkout 一次性付款 + 邀请使用计数可视化，两个独立功能一起交付。

---

## 技术方案决策

### Stripe 集成方式

选择 **Stripe Checkout hosted page**（服务端创建 Session，前端直接跳转 URL），而非 Stripe Elements（前端嵌入式表单）。

**理由**：
- 零前端 Stripe SDK 依赖，`@stripe/stripe-js` 不安装
- Stripe 官方托管页面处理所有 PCI DSS 合规
- 开发成本低：后端 1 个 API → 前端 `window.location.href` 跳转
- 测试卡号可直接在 Stripe 托管页面使用，无需 mock

### 定价方案（对标 MeiGen，USD 定价面向欧美用户）

| 套餐 | 价格 | 积分 | 性价比 |
|------|------|------|--------|
| Starter | $9.99 | 1,000 | $0.01/credit |
| Pro | $19.99 | 2,200 | $0.0091/credit |
| Ultimate | $49.99 | 6,000 | $0.0083/credit |

Pro 和 Ultimate 有梯度折扣，鼓励升档。

### Webhook vs. Redirect 双保险

- **成功回调 URL** (`?payment=success`)：用于 UI 提示，立即刷新余额
- **Stripe Webhook** (`checkout.session.completed`)：用于真实积分发放，防止用户跳过回调直接关闭浏览器

两者职责分离：前端 redirect 只负责用户体验，后端 webhook 才是积分发放的唯一可靠来源。

### inviteUsedCount 实现

复用现有 `['credits-balance']` react-query 缓存——balance 接口本就在 DashboardHeader 加载时已命中缓存，在返回值里新增 `inviteUsedCount` 字段零额外请求。

---

## 实施步骤详情

### Step 1 — 安装 stripe

```bash
cd server && npm install stripe
```

安装的是 `stripe@17.x`（最新稳定版），纯 Node.js SDK，无前端依赖。

---

### Step 2 — `server/config/index.js` 加 stripe 配置节

在 `services` getter 末尾添加：

```js
stripe: {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'usd',
},
```

未配置时 secretKey 为空字符串，payments 路由会返回 `503 Payment service not configured`，不会 crash。

---

### Step 3 — `server/config/creditPlans.js`（新建）

将套餐定义抽为独立配置文件，payments 路由和 webhook 处理都从同一来源读取，避免数据不一致。

```js
module.exports = [
  { id: 'starter',  name: 'Starter',  price: 9.99,  credits: 1000 },
  { id: 'pro',      name: 'Pro',      price: 19.99, credits: 2200 },
  { id: 'ultimate', name: 'Ultimate', price: 49.99, credits: 6000 },
];
```

---

### Step 4 — `server/routes/payments.js`（新建）

三个端点：

#### `GET /api/payments/plans`（公开）
返回套餐列表，无需登录。前端可在未登录时显示定价，提升转化。

#### `POST /api/payments/create-checkout`（需 auth 中间件）
核心逻辑：
1. 按 `planId` 查找套餐（防止伪造价格）
2. 调用 `stripe.checkout.sessions.create()`
3. 在 `metadata` 里写入 `{ userId, planId, credits }`——webhook 发放积分时从这里读取
4. 返回 `{ url: session.url }`

`unit_amount` 用 `Math.round(plan.price * 100)` 转换为 cents，避免浮点数问题。

#### `POST /api/payments/webhook`（无 auth，Stripe 签名验证）
1. 用 `stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)` 验证签名
2. 只处理 `checkout.session.completed` 事件
3. `User.findByIdAndUpdate(userId, { $inc: { credits } })` 原子操作加积分
4. 写 `CreditTransaction`（reason: `'purchase'`）供流水展示

**关键**：使用 `req.rawBody`（原始字符串）而非 `req.body`（解析后的对象），Stripe 签名验证要求原始 body。

---

### Step 5 — `server/index.js` 注册路由 + raw body 中间件

在 `express.json()` **之前**插入中间件：

```js
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { req.rawBody = data; next(); });
  } else {
    next();
  }
});
```

只对 webhook 路径生效，不影响其他接口。然后注册路由：

```js
app.use('/api/payments', paymentsRoutes);
```

---

### Step 6 — `server/models/User.js` 加 `inviteUsedCount`

```js
inviteUsedCount: {
  type: Number,
  default: 0
},
```

放在 `invitedBy` 字段后，语义连贯。MongoDB 的 schema 新增字段向后兼容，现有文档自动返回 `0`（default）。

---

### Step 7 — `server/routes/auth.js` 邀请奖励处加计数

找到 `inviter.save()` 后插入一行：

```js
await User.findByIdAndUpdate(user.invitedBy, { $inc: { inviteUsedCount: 1 } });
```

使用原子 `$inc` 而非先读后写，防止并发场景下计数不准。发生在 `inviter.save()` 之后，不影响主流程，且被现有的 try/catch 覆盖（即使失败也不影响注册）。

---

### Step 8 — `server/routes/credits.js` balance 返回 `inviteUsedCount`

```js
// before
User.findById(req.userId).select('credits lastCheckinAt')

// after
User.findById(req.userId).select('credits lastCheckinAt inviteUsedCount')
```

返回值加一个字段：

```js
inviteUsedCount: user.inviteUsedCount || 0,
```

`|| 0` 兼容老文档（字段未迁移时为 undefined）。

---

### Step 9 — `client/src/pages/Credits.js` 购买套餐区域

**新增**：
- `useQuery(['credit-plans'])` 拉取套餐列表（staleTime 5 分钟，极低频更新）
- `useEffect` 检测 `?payment=success` / `?payment=cancelled` query param，toast 提示 + 刷新 balance
- `handlePurchase(planId)` → POST create-checkout → `window.location.href = url`
- 购买套餐 Grid UI（3列卡片，响应式 sm:grid-cols-3）

**替换**："如何获得积分"提示块 → 购买套餐卡片（原信息已在邀请码区域和 Dashboard 有展示，重复度高）

**REASON_LABELS** 加入 `purchase: '积分购买'`，流水展示正常。

---

### Step 10 — `client/src/components/Dashboard/DashboardHeader.js` 邀请计数

```jsx
// 引入
import { useQuery } from 'react-query';
import { creditsAPI } from '../../services/creditsApi';

// 组件内
const { data: balanceData } = useQuery(
  ['credits-balance'],
  () => creditsAPI.getBalance().then(r => r.data.data),
  { staleTime: 60000, enabled: !!user }
);

// 邀请码展示行
{balanceData?.inviteUsedCount !== undefined && (
  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
    · {balanceData.inviteUsedCount} used
  </span>
)}
```

react-query 缓存命中（`['credits-balance']` 在 Credits 页和 CreditsDisplay 组件均已查询），Dashboard 打开时通常零额外网络请求。

---

## 关键问题与解决

### 问题：Stripe webhook 签名验证失败

**原因**：`express.json()` 会将 body 解析为对象，`stripe.webhooks.constructEvent` 需要原始字符串。
**解决**：在 `express.json()` 之前注册 raw body 中间件，仅对 `/api/payments/webhook` 路径生效。

### 问题：服务器未热重载

**现象**：`/api/payments/plans` 返回 404，`/api/health` 正常。
**原因**：服务器以 `node index.js` 启动（非 nodemon），文件变更不自动重载。
**解决**：需手动重启服务器；`node -e "require('./routes/payments')"` 确认模块加载无报错后通知用户重启。

### 问题：`inviteUsedCount` 老用户默认值

**原因**：现有 MongoDB 文档无此字段，直接读取返回 `undefined`。
**解决**：`user.inviteUsedCount || 0` 在 API 层兜底；前端用 `!== undefined` 判断是否展示（0 次也展示）。

---

## 文件改动总结

| 文件 | 类型 | 行数变化 |
|------|------|---------|
| `server/package.json` | 改 | +1 (stripe 依赖) |
| `server/config/index.js` | 改 | +5 (stripe 节点) |
| `server/config/creditPlans.js` | **新建** | +6 |
| `server/routes/payments.js` | **新建** | +110 |
| `server/index.js` | 改 | +14 (中间件 + 路由) |
| `server/models/User.js` | 改 | +4 (inviteUsedCount) |
| `server/routes/auth.js` | 改 | +1 ($inc inviteUsedCount) |
| `server/routes/credits.js` | 改 | +3 (字段 select + 返回) |
| `client/src/pages/Credits.js` | 改 | +74 (套餐 UI) |
| `client/src/components/Dashboard/DashboardHeader.js` | 改 | +13 (计数展示) |

总计：**新增 ~231 行，修改 ~10 行**

---

## 环境变量配置说明

```env
# server/.env
STRIPE_SECRET_KEY=sk_test_...       # Stripe Dashboard → Developers → API keys
STRIPE_WEBHOOK_SECRET=whsec_...     # stripe listen 输出的签名密钥
```

**本地测试流程**：
1. 安装 Stripe CLI：`scoop install stripe` 或官网下载
2. 登录：`stripe login`
3. 转发 webhook：`stripe listen --forward-to localhost:5500/api/payments/webhook`
4. 复制输出的 `whsec_...` 填入 `.env`
5. 使用测试卡 `4242 4242 4242 4242`（任意到期日/CVV）

**上线前**：将 `sk_test_` 换为 `sk_live_`，在 Stripe Dashboard 注册生产 webhook。

---

## 不改动的组件（确认）

- `MobileDock.js` — Credits 按钮已链接 `/credits`，无需改动
- `Header.js` / `CreditsDisplay.js` — 积分显示常驻，无需改动

---

## 后续优化建议

1. **幂等性保护**：webhook 可能被 Stripe 重复投递，建议记录 `session.id` 并去重
2. **Purchase 邮件通知**：支付成功后发送确认邮件（现有 nodemailer 基础设施已就绪）
3. **套餐后台配置**：将 creditPlans 从静态文件移至数据库，支持动态调价
4. **积分有效期**：当前永不过期，未来可考虑付费积分 vs 赠送积分分类管理
