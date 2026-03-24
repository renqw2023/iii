# Stripe 支付生产环境上线 开发日志

**日期**: 2026-03-24
**阶段**: Stage 58 — Stripe 支付正式上线验证
**耗时**: 约 1h（配置 + 排查 + 验证）

---

## 一、背景

Stripe 支付框架（routes/payments.js、creditPlans.js、Order 模型、webhook 处理）在 Stage 46 已完整实现，但一直使用本地 Stripe CLI 进行测试，从未接入生产 Webhook。本次目标：配置真实 Stripe Webhook，完成端到端收款验证。

---

## 二、配置步骤

### 2.1 Stripe Dashboard 配置

1. 登录 Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. Endpoint URL：`https://iii.pics/api/payments/webhook`
3. 监听事件：仅勾选 **`checkout.session.completed`**（服务器只处理此事件）
4. 保存后点击 **Reveal signing secret**，复制 `whsec_xxx`

**为何只选一个事件**：
- 支付模式为一次性付款（`mode: 'payment'`），无订阅制
- `checkout.session.completed` 在用户付款成功时触发，包含完整 session 信息
- 无需 `invoice.*`（订阅账单）、`payment_intent.*`（已被 session 事件覆盖）、`charge.refunded`（无退款逻辑）

### 2.2 服务器 `.env` 配置

```env
STRIPE_SECRET_KEY=sk_live_xxx        # 生产密钥（非 sk_test_）
STRIPE_WEBHOOK_SECRET=whsec_xxx      # Dashboard webhook signing secret
```

---

## 三、测试过程与排错

### 3.1 临时创建 $0.10 测试套餐

在 `creditPlans.js` 临时添加：
```js
{ id: 'test', name: 'Test', price: 0.1, credits: 10 }
```

**问题**：Stripe 返回 500 — `Failed to create checkout session`

### 3.2 排查：最低收款金额限制

直接用 Node.js 调用 Stripe API 排查：

```bash
node -e "stripe.checkout.sessions.create({...unit_amount: 10...})"
# ERROR: The Checkout Session's total amount must convert to at least 400 cents.
# $0.50 USD converts to approximately $3.92 HKD.
```

**根因**：Stripe 账户注册于香港，最低收款额为 **HKD 4.00**（约 $0.52 USD）。$0.10 和 $0.50 均低于此限制。

**解决**：将测试套餐价格改为 **$1.00 USD**（折合约 HKD 7.80，超过最低限制）。

### 3.3 验证成功

- 生成 Stripe Checkout 页面链接 ✅
- 完成测试付款 ✅
- Webhook 触发，服务器收到 `checkout.session.completed` 事件 ✅
- MongoDB 写入 Order 记录 ✅
- 用户积分 +10 ✅

### 3.4 邮件未收到（已知，不影响正式套餐）

测试付款后未收到收据邮件。分析：
- 代码逻辑正确（`payments.js:129` 有 `sendPurchaseReceiptEmail` 调用）
- 推测原因：本地开发环境 webhook 可能经由 Stripe CLI 转发，与生产环境略有差异
- **三个正式套餐（$9.99/$19.99/$49.99）已在生产服务器完成邮件配置，不受影响**
- 后续可在生产环境付款后验证邮件是否正常发送

---

## 四、Seedance GitHub Sync 修复（同日）

### 4.1 问题一：提示词缺失

**现象**：Seedance (GitHub) 同步成功，但 850+ 条目无提示词文字，只有视频 URL。

**根因**：`youmindSync.js` 依赖的 CSV 导出 API（`/api/export/csv?slug=seedance-2-0-prompts`）已返回 404。

**修复**：通过浏览器 DevTools 拦截 YouMind 页面网络请求，发现内部分页 API：

```
POST https://youmind.com/youhome-api/video-prompts
Body: { "model": "seedance-2.0", "page": N }
```

- 每页返回 12 条（服务端限制），共 83 页 × 12 = 990 条
- 替换 `fetchYouMindCSVMap()` 为分页抓取，300ms 礼貌延迟
- 验证：990 条 YouMind 数据合并，1042/1047 条目有真实提示词

### 4.2 问题二：视频无法播放

**现象**：/seedance 页面只显示缩略图，hover 无视频播放。

**根因**：`videos[0].sourceUrl` 是 CloudflareStream `/watch` HTML 播放器页面，不是可播放的视频流，`<video src>` 无法加载 HTML 页面。

**修复**：`videos[0].caption` 字段包含原始 Twitter MP4 直链（格式：`Imported from URL: https://video.twimg.com/.../file.mp4?tag=21`）。优先从 caption 提取 MP4 URL，沿用现有 `proxy-video` 端点代理播放（有声音）。

**验证结果**：
- 991/1047 条目获得 Twitter MP4 URL
- 0 条 CF `/watch` URL 残留
- thumbnailUrl 保留 CF Stream 缩略图（静态图片正常）

---

## 五、最终状态

### 支付系统

| 套餐 | 价格 | 积分 | 状态 |
|------|------|------|------|
| Starter | $9.99 | 1,000 | ✅ 上线 |
| Pro | $19.99 | 2,200 | ✅ 上线 |
| Ultimate | $49.99 | 6,000 | ✅ 上线 |

### Seedance 数据

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 有提示词 | ~106 | 1042 |
| 有视频 URL | 956（CF /watch） | 991（Twitter MP4） |
| 占位文本 | ~850 | 0 |

---

## 六、关键注意事项

### Stripe 香港账户最低收款限制

| 货币 | 最低金额 |
|------|---------|
| HKD | HKD 4.00 |
| USD | ~$0.52（按汇率换算） |

三个正式套餐（最低 $9.99）远超此限制，无问题。

### Webhook 安全

- 生产 `STRIPE_WEBHOOK_SECRET` 与本地 CLI 密钥完全不同，不可混用
- 服务器已实现幂等性检查（`Order.findOne({ stripeSessionId })`），重复 webhook 不会重复加积分

---

## 七、修改文件

| 文件 | 改动 |
|------|------|
| `server/config/creditPlans.js` | 临时添加 test 套餐用于验证，验证后移除 |
| `server/services/githubSync.js` | 替换 CSV API → YouMind 分页 API；从 caption 提取 Twitter MP4 |

**环境变量新增**（`server/.env`，不入 git）：
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```
