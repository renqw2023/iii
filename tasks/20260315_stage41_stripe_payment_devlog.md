# Stage 41 — Stripe 支付本地调试 + 上线规划

**日期**: 2026-03-15
**状态**: ✅ 本地全流程跑通

---

## 目标

代码框架在 Stage 26 已完整实现（payments.js / creditPlans.js / CreditsModal / Credits.js），
本阶段目标是配置环境、排查 Bug，跑通完整支付 → 积分入账闭环。

---

## 修复的 Bug

### Bug 1：STRIPE_SECRET_KEY 未加载

**症状**: 前端报 "Payment service not configured"
**根因**: `server/.env` 中 `STRIPE_SECRET_KEY` 行被注释掉（`#` 前缀），且测试密钥被误填到了 `REPLICATE_API_KEY=` 同一行
**修复**: 手动整理 `.env`，将 `sk_test_xxx` 正确赋值给 `STRIPE_SECRET_KEY`

---

### Bug 2：metadata.userId 类型错误

**症状**: `StripeInvalidRequestError: Metadata values must be strings, but for key userId you passed in a value of type hash`
**根因**: `req.userId` 是 MongoDB ObjectId 对象，Stripe metadata 要求所有值为字符串
**文件**: `server/routes/payments.js`
**修复**:
```js
// 修复前
metadata: { userId: req.userId, ... }

// 修复后
metadata: { userId: String(req.userId), ... }
```

---

### Bug 3：stream encoding 冲突导致 webhook 500

**症状**: 支付成功后积分不增加，server 报 `InternalServerError: stream encoding should not be set`
**根因**: rawBody 中间件对 webhook 路由调用了 `req.setEncoding('utf8')` 读取流，之后 `express.json()` 无差别应用到所有路由，再次尝试读同一个已消耗的流，`raw-body` 抛出异常
**文件**: `server/index.js`
**修复**: 让 `express.json()` 和 `express.urlencoded()` 跳过 `/api/payments/webhook` 路由：

```js
// 修复前
app.use(express.json({ limit: config.server.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.server.bodyLimit }));

// 修复后
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') return next();
  express.json({ limit: config.server.bodyLimit })(req, res, next);
});
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') return next();
  express.urlencoded({ extended: true, limit: config.server.bodyLimit })(req, res, next);
});
```

---

## 验证结果

本地测试环境（`sk_test_xxx` + Stripe CLI `stripe listen`）：

| 验证点 | 结果 |
|--------|------|
| Stripe CLI 终端 | `200 POST /api/payments/webhook` ✅ |
| 支付后跳回页面 | `/credits?payment=success` + toast ✅ |
| 积分余额增加 | Ultimate 套餐 +6000 积分 ✅ |
| CreditTransaction 记录 | `reason:'purchase', walletType:'paid'` ✅ |

---

## 新增文件

- `tasks/stripe_production_guide.md` — 完整的生产上线操作手册，包含：
  - 切换生产密钥步骤
  - 注册生产 Webhook 流程
  - 上线前验证清单
  - 回滚预案

---

## 生产上线待办

详见 `tasks/stripe_production_guide.md`，核心步骤：

1. Stripe Dashboard → Live mode → 复制 `sk_live_xxx`
2. 生产服务器 `.env` 替换 `STRIPE_SECRET_KEY`
3. Dashboard → Webhooks → Add endpoint → `https://iii.pics/api/payments/webhook`
4. 获取生产 `whsec_xxx` 填入生产服务器 `.env`
5. 重启生产服务器
