# Stage 53–56 开发日志 — 支付体验完整闭环

**日期**: 2026-03-23
**分支**: main
**涉及 Stages**: 53-A, 53-B, 54-A, 54-B, 55, 56

---

## 概述

本次开发完成了支付体系的完整用户体验闭环，覆盖从「支付完成」到「查看发票」的全链路：

| Stage | 功能 | 状态 |
|-------|------|------|
| 53-A | 支付收据 Email + PDF 附件 | ✅ |
| 53-B | 购买成功庆祝 Modal | ✅ |
| 54-A | 积分不足拦截 Modal | ✅ |
| 54-B | 低积分预警 Banner | ✅ |
| 55 | 礼品兑换码系统（全栈） | ✅ |
| 56 | PDF 发票页面（浏览器 print） | ✅ |

---

## Stage 53-A — 支付收据 Email + PDF 附件

### 目标
Stripe webhook 成功后自动发送收据邮件，附带 PDF 发票文件。

### 新建文件

**`server/services/pdfService.js`**

使用 `pdfkit`（纯 Node.js，零浏览器依赖）在服务器端生成 A4 发票 PDF。

```
npm install pdfkit --save
```

设计参照 Anthropic / Replicate 发票风格：
- 左上角 `III.PICS` 品牌字样（黑色 III + 紫色 .PICS）
- 右侧 `Invoice` 大标题
- 三栏元数据：Invoice number / Date of issue / Status（绿色 Paid）
- FROM（III.PICS 信息） / BILL TO（用户名 + 邮箱）双栏布局
- 大字金额 headline（$XX.XX USD）+ 绿色 "✓ Paid" 确认
- 明细表（Description / Qty / Unit price / Amount）
- Subtotal / Tax / Total / Amount paid 汇总行
- 页脚注释 + 版权行

核心实现：收集 PDFDocument 的 `data` 事件 → `Buffer.concat(chunks)` → 返回 `Promise<Buffer>`

### 修改文件

**`server/services/emailService.js`**

三处关键改动：

1. **引入 pdfService**
   ```js
   const { generateInvoicePDF } = require('./pdfService');
   ```

2. **重写 `sendPurchaseReceiptEmail`**
   - 先调用 `generateInvoicePDF()` 生成 Buffer，失败时优雅降级（邮件仍正常发送，控制台警告）
   - 通过 nodemailer `attachments` 数组附加 PDF：
     ```js
     { filename: `INV-XXXXXXXX.pdf`, content: pdfBuffer, contentType: 'application/pdf' }
     ```
   - **邮件视觉重设计**（用户反馈：顶部蓝色渐变色块丑、背景不能用灰色）：
     - 背景色 `#f5f5f5`（灰色）→ `#ffffff`（纯白）
     - 移除 `height:4px; background:linear-gradient(90deg,#4f46e5,#7c3aed)` 顶部色条
     - 卡片改为白底 + `1px solid #e5e7eb` 细边框，与 Stripe 发票邮件风格一致
     - 移除"⬇ Download invoice"链接，改为文字说明："Your invoice is attached to this email as a PDF"
     - CTA 按钮改为跳转 `/orders`（"View Order History →"）

3. **更新 `_send()` 支持附件**
   ```js
   async _send(to, subject, html, attachments = []) {
     const mailOptions = {
       ...,
       ...(attachments.length > 0 ? { attachments } : {}),
     };
   }
   ```

**`server/routes/payments.js`**

- 引入 `emailService`
- `Order.create()` 成功后调用收据邮件，传入 `fullOrderId: String(newOrder._id)` 用于 PDF 发票号生成
- 用 try/catch 隔离，确保邮件失败不影响支付流程

---

## Stage 53-B — 购买成功庆祝 Modal

### 新建文件

**`client/src/components/UI/PurchaseSuccessModal.js`**

- AnimatePresence + framer-motion 动效：CheckCircle 图标 scale+fade in
- 紫色渐变 Header（`#4f46e5 → #7c3aed → #9333ea`）显示新增积分数（大字）
- Body：新余额展示卡片 + "Start Creating →" 按钮 + "View Order History →" 链接
- **居中方案**：用 `position:fixed; display:flex; align-items:center; justify-content:center; pointer-events:none` 容器包裹 motion.div，motion.div 自身不设 `top/left/transform`，避免 framer-motion 的 `y` transform 与 CSS `translate(-50%,-50%)` 冲突

### 修改文件

**`client/src/pages/Credits.js`**

- `?payment=success` 参数检测：原 `toast.success()` → 改为 `setShowSuccessModal(true)`，同步 invalidate `['credits-balance']` 刷新余额
- 新增 `purchasedCredits` state 用于 Modal 显示购买数量

---

## Stage 54-A — 积分不足拦截 Modal

### 新建文件

**`client/src/components/UI/InsufficientCreditsModal.js`**

- 显示当前 freeCredits / 付费 credits 双钱包余额
- 醒目红色"Need X more credits"差额提示
- 三个套餐卡片（Starter / Pro / Ultimate），点击直接调用 `creditsAPI.createCheckout(planId)` 跳转 Stripe
- "Maybe Later" 灰色关闭按钮

### 修改文件

**`client/src/components/UI/ImageGenPanel.js`**

```js
// handleGenerate() 入口前置检查
const totalAvail = (user?.freeCredits ?? 0) + (user?.credits ?? 0);
if (currentModel && totalAvail < currentModel.creditCost) {
  setShowInsufficientModal(true);
  return;
}
```

---

## Stage 54-B — 低积分预警 Banner

**`client/src/components/UI/ImageGenPanel.js`**（同上文件继续）

在生成按钮上方插入（阈值 20 积分）：

```jsx
const LOW_THRESHOLD = 20;
{isAuthenticated && totalAvail > 0 && totalAvail < LOW_THRESHOLD && (
  <div style={{ background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.35)', ... }}>
    <Zap size={12} /> Only {totalAvail} credits left
    <Link to="/credits">Add more →</Link>
  </div>
)}
```

---

## Stage 55 — 礼品兑换码系统（全栈）

### 新建文件

**`server/models/GiftCode.js`**

```js
{
  code:      String, unique         // 格式：GIFT-XXXX-XXXX（crypto.randomBytes）
  credits:   Number, required
  maxUses:   Number, default: 1
  usedCount: Number, default: 0
  usedBy:    [{ userId: ObjectId, usedAt: Date }]  // 防重复使用
  createdBy: ObjectId, ref: 'User'
  expiresAt: Date                   // 可选过期时间
  isActive:  Boolean, default: true
  note:      String                 // 管理员备注
}
```

**`client/src/components/Admin/tabs/GiftCodesTab.js`**

Admin Panel 新 Tab：
- 生成表单（credits / 数量 / 使用次数 / 过期日期 / 备注）
- 生成结果：码列表 + "Copy All" 一键复制
- 分页码管理表：code / credits / 使用情况 / 状态 / Deactivate 按钮

### 修改文件

**`server/routes/credits.js`** — 新增 4 个接口

| 接口 | 说明 |
|------|------|
| `POST /api/credits/redeem` | 用户兑换码：校验有效性→增加积分→记录流水 |
| `POST /api/credits/admin/generate-codes` | 批量生成 GIFT-XXXX-XXXX 码 |
| `GET /api/credits/admin/gift-codes` | 分页查询所有码 |
| `PATCH /api/credits/admin/gift-codes/:code/deactivate` | 停用指定码 |

`redeem` 端点校验链：`isActive` → 未过期 → `usedCount < maxUses` → 用户未使用过（查 `usedBy`）→ 原子更新积分 + CreditTransaction 记录

**`client/src/services/creditsApi.js`** — 新增

```js
redeem: (code) => axios.post('/api/credits/redeem', { code }, { headers }),
adminGenerateCodes: (data) => axios.post('/api/credits/admin/generate-codes', data, { headers }),
adminGetGiftCodes: (page) => axios.get(`/api/credits/admin/gift-codes?page=${page}`, { headers }),
adminDeactivateCode: (code) => axios.patch(`/api/credits/admin/gift-codes/${code}/deactivate`, {}, { headers }),
```

**`client/src/pages/Credits.js`** — 新增兑换码区块

- 绿色调卡片（`#f0fdf4` 背景 + `#bbf7d0` 边框）
- Monospace 输入框，自动转大写（`toUpperCase()`）
- "Redeem" 按钮 → 调用 `handleRedeem()` → 成功 toast + invalidate balance

**`client/src/pages/AdminPanel.js`** — 新增 Gift Codes Tab

```js
{ id: 'giftcodes', label: 'Gift Codes', icon: Gift }
{activeTab === 'giftcodes' && <GiftCodesTab />}
```

---

## Stage 56 — PDF 发票页面

### 新建文件

**`client/src/pages/Invoice.js`**

- 从 URL `searchParams` 读取发票数据（`plan / amount / credits / currency / date / orderId`）
- 采用 Anthropic/Replicate 风格：白底、Invoice 大标题、III.PICS 品牌 Logo
- `useEffect(() => { setTimeout(() => window.print(), 600) }, [])` — 自动弹出浏览器打印对话框
- `@media print` CSS 隐藏 `.no-print` 元素，`@page { size: A4; margin: 1.2cm; }`
- 手动"Download / Print PDF"按钮（`.no-print`，屏幕显示）

### 修改文件

**`client/src/pages/Orders.js`**

每行订单右侧新增打印图标按钮：
```jsx
<button onClick={() => window.open(`/invoice/${order._id}?` + new URLSearchParams({
  plan: order.planName, amount: order.amountUSD, credits: order.credits,
  currency: order.currency, date: order.createdAt, orderId: order._id
}), '_blank')}>
  <Printer size={14} />
</button>
```

**`client/src/App.js`**

```jsx
<Route path="invoice/:orderId" element={<Invoice />} />
```

---

## Bug 修复记录

### Bug 1：Invoice 页面 URL 参数全为空

**症状**：从 Orders 页打开 `/invoice/:orderId?plan=...` 后，`searchParams` 返回空值（`search: ""`）

**根因**：React Router ProtectedRoute 在 auth 状态加载前先重定向到 `/login`，`Login.js` 使用 `from?.pathname` 还原跳转时丢弃了 `.search` 部分（query params）

**修复**（`client/src/pages/Login.js`）：
```js
// 修复前
const from = location.state?.from?.pathname || '/';
navigate(from, { replace: true });

// 修复后
const from = location.state?.from || { pathname: '/' };
navigate(from, { replace: true });   // 传入完整 location 对象（含 .search）
```

### Bug 2：PurchaseSuccessModal 未居中

**根因**：framer-motion 的 `y` transform 动画会覆盖 CSS `translate(-50%, -50%)`，导致 modal 偏移

**修复**：改用 flex 居中容器包裹 motion.div，motion.div 不设 `top/left/transform` CSS

### Bug 3：GiftCodesTab.js ESLint — Duplicate key 'border'

**原因**：`S.btn` 对象内 `border: 'none'` 后又有条件 `border: primary ? 'none' : '...'`

**修复**：移除第一个静态 `border: 'none'`，保留条件表达式

---

## i18n 版权年份更新

三个语言包统一修正：

| 文件 | 修改 |
|------|------|
| `en-US.json` | `"© 2025 III.PICS"` → `"© 2026 III.PICS"` |
| `ja-JP.json` | 同上 |
| `zh-CN.json` | `"©  III.PICS. 保留所有权利。2025"` → `"© 2026 III.PICS. 保留所有权利。"` |

---

## 文件改动总览

| 文件 | 类型 | 说明 |
|------|------|------|
| `server/services/pdfService.js` | 新建 | PDFKit 服务端发票生成 |
| `server/services/emailService.js` | 修改 | 引入 PDF 附件 + 视觉重设计 |
| `server/routes/payments.js` | 修改 | webhook 调用收据邮件 |
| `server/models/GiftCode.js` | 新建 | 兑换码数据模型 |
| `server/routes/credits.js` | 修改 | redeem + admin 码管理接口 |
| `server/package.json` | 修改 | 新增 pdfkit 依赖 |
| `client/src/components/UI/PurchaseSuccessModal.js` | 新建 | 购买成功庆祝弹窗 |
| `client/src/components/UI/InsufficientCreditsModal.js` | 新建 | 积分不足拦截弹窗 |
| `client/src/components/Admin/tabs/GiftCodesTab.js` | 新建 | Admin 兑换码管理 Tab |
| `client/src/pages/Invoice.js` | 新建 | 浏览器打印发票页 |
| `client/src/pages/Credits.js` | 修改 | 购买成功 Modal + 兑换码区块 |
| `client/src/pages/Orders.js` | 修改 | 打印发票按钮 |
| `client/src/pages/Login.js` | 修改 | Bug 修复：保留 location.search |
| `client/src/pages/AdminPanel.js` | 修改 | Gift Codes Tab 接入 |
| `client/src/services/creditsApi.js` | 修改 | redeem + admin 码管理 API |
| `client/src/App.js` | 修改 | 注册 /invoice/:orderId 路由 |
| `client/src/i18n/locales/*.json` | 修改 | 版权年份 2025→2026 |

---

## 验证要点

- **收据邮件**：触发 `stripe listen --forward-to localhost:5500/api/payments/webhook` 完成支付 → 收到邮件带 PDF 附件（白底，无蓝色渐变色条）
- **购买成功 Modal**：访问 `/credits?payment=success` → 弹出居中庆祝 Modal，显示积分数和新余额
- **积分不足 Modal**：余额为 0 时点 Generate → 弹出拦截 Modal（含套餐卡片）
- **低积分 Banner**：将账户积分设为 10（< 20）→ 生成面板上方出现橙色警告
- **兑换码**：Admin 生成码 → Credits 页输入 → 积分增加；重复使用报错
- **发票页面**：Orders 页点打印图标 → 新窗口弹出打印对话框，发票格式清晰
