# 阶段32 — 积分系统完整闭环 + 生图引擎升级

**日期**: 2026-03-10
**分支**: main
**涉及文件**: 11个文件（10 M + 1 新建）

---

## 一、背景与目标

积分系统基础架构已存在，但存在多处关键 Bug 导致无法真正运转：

| 问题 | 影响 |
|------|------|
| `CreditTransaction.reason` enum 缺少 `purchase` / `img2prompt` / `admin_deduct` | Stripe 充值回调和 img2prompt 写库均报 ValidationError |
| `deductCredits()` 在 generate.js 和 tools.js 各自维护 | 逻辑重复、易产生不一致 |
| 前端 `creditsApi.js` 缺少支付方法 | 充值前后端脱节 |
| `CreditsModal` 按钮跳转 `/credits?plan=` 需二次点击 | 用户体验断裂 |
| `REASON_LABELS` 缺少 `img2prompt` / `admin_deduct` | 流水页显示原始 key |
| 缺少管理员手动赠积分/扣积分接口 | 运营无法干预 |
| img2prompt 依赖 OpenAI Vision（需另配 Key） | 已有 Gemini Key 但功能不可用 |
| 生图模型列表含已废弃的 `gemini-2.0-flash-exp` / `imagen-3.x` | API 报错 404 |
| img2prompt 传入相对路径 `/ImageFlow/...` 时 `fetch()` 崩溃 | URL 解析异常 |
| `maxOutputTokens: 500` 导致 Prompt 被截断 | 输出不完整 |

目标：修复所有 Bug，打通「注册→签到→消费→充值→流水」完整闭环，并升级生图引擎至最新 Gemini 3。

---

## 二、详细改动

### 2.1 server/models/CreditTransaction.js — 补全 enum

```js
// 新增三个 reason 值
'admin_deduct',   // 管理员扣除
'img2prompt',     // 图生文消耗
'purchase',       // 充值购买
```

**影响**：修复 Stripe webhook 写库 ValidationError 和 img2prompt 流水写库失败。

---

### 2.2 server/utils/creditsUtils.js（新建）

提取两个路由中重复的积分扣除逻辑为共用模块：

```js
deductCredits(user, cost)
  → 先扣 freeCredits，再扣 credits；余额不足返回 { ok: false }

recordDeductTransactions(userId, reason, note, freeDeducted, paidDeducted, freeBalance, paidBalance)
  → 按实际扣除额分别写免费/付费流水
```

**调用方**：`generate.js`、`tools.js`、`credits.js`（admin/deduct）。

---

### 2.3 server/routes/generate.js — 生图模型全面升级

| 旧模型 | 状态 | 新模型 |
|--------|------|--------|
| `gemini-2.0-flash-exp` | ❌ 已废弃 | `gemini-3-pro-image-preview`（Gemini 3 Pro） |
| — | — | `gemini-3.1-flash-image-preview`（Gemini 3.1 Flash） |
| `imagen-3.0-generate-001` | ❌ 已关闭 | `imagen-4.0-generate-001`（Imagen 4 Pro） |
| `imagen-3.0-fast-generate-001` | ❌ 已关闭 | `imagen-4.0-fast-generate-001`（Imagen 4 Fast） |

路由处理器中对应的 `modelId` 匹配条件同步更新：
- `gemini-flash` → `gemini3-pro || gemini3-flash`
- `imagen-fast || imagen-pro` → `imagen4-fast || imagen4-pro`

删除内联 `deductCredits()`，改用 `creditsUtils`，流水记录简化为一行调用。

---

### 2.4 server/routes/tools.js — img2prompt 全面重写

**模型迁移**：OpenAI Vision → Gemini Vision

| 项目 | 旧 | 新 |
|------|----|----|
| API | OpenAI `/v1/chat/completions` | Gemini `generateContent` |
| Key | `OPENAI_API_KEY` | `GEMINI_API_KEY` |
| 模型 | `gpt-4o`（hardcode） | `gemini-3-flash-preview`（默认，前端可选） |
| 前端模型参数 | 传入但对应 OpenAI 模型名 | 校验白名单后传给 Gemini |

**相对路径 Bug 修复**：

`fetch('/ImageFlow/...')` → Node.js fetch 不接受相对 URL，程序崩溃。

解决方案：加入静态目录映射，相对路径直接读本地文件系统：
```js
const STATIC_ROOTS = [
  { prefix: '/uploads/',   dir: '../../uploads' },
  { prefix: '/ImageFlow/', dir: '../../client/public/ImageFlow' },
  { prefix: '/Circle/',    dir: '../../client/public/Circle' },
  { prefix: '/output/',    dir: '../../output' },
];
```
绝对 URL 仍走 HTTP `fetch()`。

**Prompt 截断修复**：
- `maxOutputTokens: 500` → `1024`
- 响应解析从 `parts[0].text` → `parts.map(p => p.text).join('')`（Gemini 有时拆分 parts）

---

### 2.5 server/routes/credits.js — 新增管理员接口

**POST /api/credits/admin/grant**
- 需 auth + `user.role === 'admin'`
- Body: `{ userId, amount, note }`
- 给目标用户 `credits += amount`，写 `admin_grant` 流水

**POST /api/credits/admin/deduct**
- 需 auth + admin
- Body: `{ userId, amount, note }`
- 复用 `deductCredits()`，先扣 freeCredits 再扣 credits
- 写 `admin_deduct` 流水

---

### 2.6 server/routes/payments.js — create-checkout 加 customer_email

```js
const user = await User.findById(req.userId).select('email');
// stripe.checkout.sessions.create() 中加入：
customer_email: user?.email || undefined,
```

Stripe 结账页预填用户邮箱，提升转化率。

---

### 2.7 server/.env — Stripe 占位符

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

附注：新版 Stripe Dashboard 中 Webhook 入口在 **Workbench → Webhooks 标签 → Create an event destination → Webhook endpoint**。

---

### 2.8 client/src/services/creditsApi.js — 新增三个方法

```js
getPlans()            → GET /api/payments/plans
createCheckout(planId)→ POST /api/payments/create-checkout
adminGrant(userId, amount, note) → POST /api/credits/admin/grant
```

---

### 2.9 client/src/components/UI/CreditsModal.js — 直接发起支付

原来：点击套餐卡 → `navigate('/credits?plan=starter')` → 需再次点击 Buy Now

现在：
```js
const handlePlanClick = async (plan) => {
  if (!isAuthenticated) { onClose(); openLoginModal(); return; }
  const res = await creditsAPI.createCheckout(plan.id);
  window.location.href = res.data.url;  // 直接跳 Stripe
};
```

引入 `react-hot-toast` 错误提示。

---

### 2.10 client/src/pages/Credits.js — 流水页强化

补充 `REASON_LABELS`：
```js
admin_deduct: '管理员扣除',
img2prompt:   '图像分析',
// purchase 已有
```

流水列表加入 `tx.note` 小字说明（截断显示，max-width 200px）。

---

### 2.11 client/src/components/UI/Img2PromptPanel.js — 前端模型同步

- `REVERSE_MODELS` 从 GPT-4o/GPT-4o-mini → **Gemini 3 Flash / Gemini 2.5 Flash**
- `GenerateTab` 优先模型从已删除的 `imagen-pro` → `gemini3-pro`

---

## 三、关键技术决策

### 为什么 img2prompt 改用 Gemini 而不是保留 OpenAI？

1. 项目已配置 `GEMINI_API_KEY`，无需额外密钥
2. Gemini 3 Flash 视觉理解能力与 GPT-4o-mini 相当，且免费额度更充裕
3. 减少外部依赖，降低运营成本

### 为什么 Imagen 3 → Imagen 4？

Google 于 2026 年初正式关闭 Imagen 3 API，直接调用返回 404。Imagen 4 API 调用格式完全兼容（同为 `:predict` 端点），无需修改请求结构。

### 为什么相对路径读文件系统而不是拼接 localhost URL？

服务器（:5500）未挂载 `/ImageFlow/` 静态目录，只有客户端开发服务器（:3100）服务该路径。生产环境两者可能在不同机器上。直接读文件系统最可靠，且无网络开销。

---

## 四、已知限制 & 后续

| 项目 | 状态 | 说明 |
|------|------|------|
| `gemini-3-pro-image-preview` | Preview | 部分 Key 可能需白名单，报 403 时降级到 `gemini-3.1-flash-image-preview` |
| Stripe 充值 | 待配置 | 填入真实 `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` 即可上线 |
| OpenAI Key | 未配置 | GPT Image 1.5 / DALL·E 3 模型在列表中存在但不显示，填入 Key 后自动激活 |
| Zhipu Key | 未配置 | Z Image Turbo 同上 |
| 管理员赠积分 UI | 缺失 | 目前只有 API，需给 admin 账号配置 Dashboard 页面 |
