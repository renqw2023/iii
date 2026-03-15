# Stripe 生产上线操作手册

> 适用于 III.PICS 项目
> 代码框架已完整就绪，本文档只涉及密钥配置与上线操作

---

## 一、本地测试（Stripe CLI 方式）

### Step 1：获取 Stripe 测试密钥

1. 登录 [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. 左上角确认开启 **Test mode**（开关显示橙色标签）
3. 导航到 **Developers → API keys**
4. 复制 **Secret key**（格式：`sk_test_xxx`）
   - 注意：不需要 Publishable key，前端无 Stripe.js 集成

### Step 2：安装 & 登录 Stripe CLI

```bash
# Windows 推荐下载 exe（或使用 scoop）
# 下载地址：https://stripe.com/docs/stripe-cli#install

stripe --version          # 验证安装成功
stripe login              # 打开浏览器授权，绑定你的账户
```

### Step 3：配置 server/.env

在 `server/.env` 中添加（暂时先填 sk_test，webhook secret 下一步获取）：

```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=          # 先留空
CLIENT_URL=http://localhost:3100
```

### Step 4：启动 Stripe CLI 监听

**新开终端**（保持运行，不要关闭）：

```bash
stripe listen --forward-to localhost:5500/api/payments/webhook
```

终端会打印：

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxx (^C to quit)
```

将这个 `whsec_xxx` 填入 `.env` 的 `STRIPE_WEBHOOK_SECRET=`，然后**重启 server**。

### Step 5：全流程测试

1. 打开 `http://localhost:3100`
2. 登录账号 → 点击积分页 → 点击任意套餐（如 Starter $9.99）
3. 跳转 Stripe 测试支付页，使用测试卡：

   | 字段 | 值 |
   |------|----|
   | 卡号 | `4242 4242 4242 4242` |
   | 有效期 | 任意未来日期（如 `12/26`） |
   | CVC | 任意3位（如 `123`） |

4. 点击支付 → 应跳回 `/credits?payment=success`

### Step 5 验证清单

- [ ] Stripe CLI 终端显示 `200 POST /api/payments/webhook`
- [ ] 页面 toast 显示 "Payment successful! Credits added to your account."
- [ ] 积分余额正确增加（1000 / 2200 / 6000）
- [ ] MongoDB 中 `CreditTransaction` 新增一条 `reason:'purchase', walletType:'paid'` 记录
- [ ] `User.hasPurchasedBefore` 变为 `true`（在 4K 生图中可验证权限）

### 已知注意事项

- Stripe CLI 的 `whsec_` 每次重新 `stripe listen` 都会变，**只用于本地测试，不要提交到代码**
- 测试失败常见原因：
  - rawBody 为空 → 确认 server 完全重启（不是热重载）
  - `CLIENT_URL` 未设置 → success_url 跳错域名
  - webhook secret 与 CLI 当次会话不匹配 → 重新 copy 并重启 server

---

## 二、生产上线操作

### Step 1：切换到生产密钥

1. Stripe Dashboard 左上角**关闭 Test mode**（切换到 Live mode）
2. **Developers → API keys** → 复制 **Secret key**（格式：`sk_live_xxx`）
3. 生产服务器 `.env` 替换：

```env
STRIPE_SECRET_KEY=sk_live_xxx
CLIENT_URL=https://iii.pics
```

### Step 2：注册生产 Webhook

1. Dashboard → **Developers → Webhooks → Add endpoint**
2. **Endpoint URL**：`https://iii.pics/api/payments/webhook`
3. **监听事件**：仅选 `checkout.session.completed`（不要选其他事件）
4. 创建后，点击 endpoint → **Reveal signing secret** → 复制 `whsec_xxx`
5. 生产服务器 `.env` 填入：

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

6. 重启生产服务器

### Step 3：上线前必做验证清单

- [ ] 生产服务器 `CLIENT_URL` 设置为 `https://iii.pics`（否则支付后跳回错误域名）
- [ ] Webhook endpoint 状态显示 "Enabled"
- [ ] Dashboard → Webhooks → 选中 endpoint → **Send test event**（发送 `checkout.session.completed`）验证服务器能收到并返回 200
- [ ] 监控首笔真实支付的 `CreditTransaction` 记录是否正常写入 MongoDB
- [ ] 确认 `User.hasPurchasedBefore` 在真实支付后变为 `true`

### Step 4：价格与展示说明

| 套餐 | 前端展示 | Stripe 实际扣款 |
|------|---------|----------------|
| Starter | $9.9 | **$9.99** |
| Pro | $19.9 | **$19.99** |
| Ultimate | $49.9 | **$49.99** |

> 前端 CreditsModal 少显示一位小数（视觉问题），实际扣款以后端 creditPlans.js 为准，Stripe 结算页显示正确金额，无需修改代码。
> 如需对齐，修改 `client/src/components/UI/CreditsModal.js` 中的价格显示即可。

---

## 三、回滚预案

| 场景 | 操作 |
|------|------|
| 停止接收付款 | Stripe Dashboard → Webhooks → 选中 endpoint → **Disable** |
| 完全关闭支付功能 | 生产服务器 `.env` 清空 `STRIPE_SECRET_KEY`，重启服务器 → `/api/payments/create-checkout` 自动返回 503 |
| 退款 | Stripe Dashboard → Payments → 找到订单 → Refund |
| 误增积分 | 使用管理员 API `POST /api/credits/admin/deduct { userId, amount }` |

---

## 四、关键文件索引（无需改动）

| 文件 | 作用 |
|------|------|
| `server/routes/payments.js` | GET /plans · POST /create-checkout · POST /webhook |
| `server/config/creditPlans.js` | 套餐定义（价格/积分数量） |
| `server/index.js:38-48` | rawBody 中间件（Stripe 签名验证必须，在 express.json 之前） |
| `server/models/CreditTransaction.js` | 流水记录模型 |
| `client/src/pages/Credits.js` | ?payment=success 着陆 + 购买按钮 |
| `client/src/components/UI/CreditsModal.js` | 套餐卡片展示 |

---

## 五、Stripe Dashboard 监控

上线后建议关注：

- **Dashboard → Payments** — 查看真实支付记录
- **Dashboard → Developers → Webhooks** — 查看 webhook 投递状态（是否全部 200）
- **Dashboard → Developers → Logs** — API 调用日志，排查 checkout session 创建失败

---

*文档创建：2026-03-15*
*适用版本：Stage 41（Stripe 支付上线）*
