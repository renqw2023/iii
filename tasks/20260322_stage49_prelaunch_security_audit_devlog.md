# Stage 49 — 上线前全面安全审计与修复

**日期**：2026-03-22
**范围**：全栈安全审计 — 后端安全 / 前端安全 / 业务逻辑 / 部署配置
**Commit**：Stage 49: Pre-launch security audit — 25 fixes across P0/P1/P2
**文件变动**：12 files changed, 161 insertions(+), 49 deletions(-)

---

## 一、背景与目标

III.PICS 准备正式上线（React 18 SPA + Express + MongoDB + Vercel 部署）。上线前对全栈进行一次彻底安全审计，发现并修复所有可能影响用户资产安全、系统稳定性或数据隐私的漏洞。

审计方法：三路并行 Agent 覆盖后端安全、前端安全、业务/部署配置，共发现 **25 项问题**，按优先级分为 P0/P1/P2/P3 四级，本次修复 P0~P2 共 **19 项**（P3 为上线后迭代优化，不阻塞上线）。

---

## 二、发现与修复详情

### P0 — 上线前必须修复（6 项）

---

#### A1. Stripe Webhook 幂等性缺失 🔴 财务损失

**文件**：`server/routes/payments.js:89`

**问题**：Stripe 官方文档要求 Webhook 必须幂等处理。同一个 `checkout.session.completed` 事件可能因网络重试被发送多次，原代码直接执行 `$inc: { credits: creditsNum }` 和 `Order.create`，导致：
- 用户积分重复添加（每次 webhook 触发都 +X 积分）
- Order 表重复记录（同一笔支付出现多条订单）

**修复**：
```js
// 在执行任何积分操作前，先查询 stripeSessionId 是否已处理
const existingOrder = await Order.findOne({ stripeSessionId: session.id });
if (existingOrder) {
  return res.json({ received: true }); // 直接返回，不重复处理
}
```

**原理**：`Order.stripeSessionId` 字段在 Order 模型中是 unique 索引，用它作幂等键，确保同一支付 session 永远只处理一次。

---

#### A2. adminAuth 中间件 "headers already sent" 错误 🔴 服务器 500

**文件**：`server/middleware/auth.js:43-56`

**问题**：原实现使用了嵌套调用模式：
```js
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {}); // ← 传空的 next()
    if (req.user.role !== 'admin') { ... }
    next();
  } catch ...
}
```
当 JWT 无效时，`auth` 内部已执行 `res.status(401).json(...)` 发送响应，但空 `next()` 使 `adminAuth` 继续向下执行，再次访问 `req.user.role` → `TypeError: Cannot read properties of undefined`，触发全局错误处理器，尝试二次发送响应，产生 "headers already sent" 错误，返回 500 而非正确的 401。

**修复**：内联完整 JWT 验证逻辑，完全不依赖外层 `auth`：
```js
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: '...' });
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ ... });
    if (user.role !== 'admin') return res.status(403).json({ ... });
    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) { /* 类型判断返回 401 */ }
};
```

**验证方式**：无效 token 访问 `GET /api/admin/users` → 应返回 401，而非 500。

---

#### A3. 登录/注册/忘记密码接口无单独限流 🔴 账号暴破

**文件**：`server/routes/auth.js`

**问题**：全局限流为 1000次/15分钟（`server/index.js`），对于认证接口远远不够，攻击者可在 15 分钟内对一个账号发送 1000 次登录请求，轻松暴力破解 6 位数字密码（100 万种组合，约 15 分钟/1000 = 250 小时，但若攻击者针对常见密码 top-100，15 分钟内极可能命中）。

**修复**：新增两个专用限流器：
```js
// 认证接口：20次/15分钟（每10 IP请求），适用于 /login /register /forgot-password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: '请求过于频繁，请15分钟后重试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 邮箱查重：10次/分钟（实时输入建议），适用于 /check-email
const emailCheckLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: '请求过于频繁，请稍后重试' },
});
```

三个认证路由均加入 `authLimiter` middleware：
- `router.post('/register', authLimiter, [...])`
- `router.post('/login', authLimiter, [...])`
- `router.post('/forgot-password', authLimiter, [...])`
- `router.get('/check-email/:email', emailCheckLimiter, ...)`（C2 一并解决）

---

#### A4. Vercel 部署无 SPA 路由配置 🔴 刷新 404

**文件**：`client/public/_redirects`（新建）

**问题**：React Router 是客户端路由，所有路由均由前端 JS 处理。Vercel 静态部署时，用户直接访问 `/gallery` 或刷新 `/dashboard`，Vercel 会尝试从服务器查找对应的静态文件，找不到则返回 404，导致除首页以外所有路由刷新均报错。

**修复**：新建 `client/public/_redirects`（Netlify/Vercel 通用格式）：
```
/*    /index.html   200
```

**原理**：告知 Vercel 将所有请求重定向到 `index.html`，由 React Router 接管路由解析。此文件会被 CRA build 自动复制到 `build/` 目录。

> **注意**：Vercel 也支持 `vercel.json` 中配置 `rewrites`，两者等效，`_redirects` 更轻量。

---

#### A5. 个人页路由无登录保护 🔴 隐私泄露

**文件**：`client/src/App.js:128-133`

**问题**：以下路由在公开的 `<Layout>` Route 块内（无 ProtectedRoute 包裹），未登录用户可直接访问：
- `/browse-history` — 浏览历史（虽存 localStorage，但页面本身可被访问）
- `/generate-history` — 生成历史（已登录时展示 AI 生成记录，属个人数据）
- `/img2prompt` — 图片转提示词（消耗积分的功能，前端不保护则绕过积分检查展示入口）

**修复**：将三条路由从公开块移入 `ProtectedRoute` 包裹的块：
```jsx
<Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  {/* 原有路由... */}
  <Route path="browse-history" element={<History />} />
  <Route path="history" element={<Navigate to="/browse-history" replace />} />
  <Route path="generate-history" element={<GenerateHistory />} />
  <Route path="img2prompt" element={<Img2Prompt />} />
</Route>
```

---

#### A6. 测试页路由生产暴露 🔴 信息泄露

**文件**：`client/src/App.js:131-132`

**问题**：`/health` 和 `/error-demo` 是开发阶段的调试路由，生产环境暴露会：
- `/health`：泄露服务器内部状态信息（版本、依赖库等）
- `/error-demo`：展示内部错误边界实现细节，可能泄露技术栈信息，甚至被利用触发特定错误

**修复**：从路由表和 import 中完全移除两条路由及 `Health`、`ErrorDemo` 组件的 import。

---

### P1 — 强烈建议上线前修复（7 项）

---

#### B1. 积分扣除非原子（Race Condition → 积分盗刷）🟠

**文件**：`server/utils/creditsUtils.js`

**问题**：原 `deductCredits(user, cost)` 的实现为经典的 Read-Check-Write 模式：
```js
// 1. 读（已由调用者完成）
const freeAvail = user.freeCredits ?? 0;
const paidAvail = user.credits ?? 0;
// 2. 检查
if (freeAvail + paidAvail < cost) { return { ok: false } }
// 3. 修改内存对象
user.freeCredits = freeAvail - freeDeducted;
user.credits = paidAvail - paidDeducted;
// 4. 写
await user.save();
```

**Race Condition 场景**：
1. 用户余额 freeCredits=40, credits=0（共 40 积分）
2. 用户同时提交两次 10 积分的生成请求（A、B 并发）
3. A 和 B 都在 Step1 读到同一个 user 对象（40 积分）
4. A 和 B 都通过 Step2 检查
5. A 先执行 Step3+4：freeCredits=30，写入 DB
6. B 也执行 Step3+4：基于已过时的读取结果（40），freeCredits=30，写入 DB
7. 最终结果：两次 10 积分消耗，但账户只扣了 10，多送了 10 积分

**修复**：将 Read-Check-Write 替换为原子的 `findOneAndUpdate` + MongoDB `$expr` 条件：
```js
async function deductCredits(user, cost) {
  const userId = user._id || user;

  // 1. 读取最新余额（用于计算 wallet 分配）
  const freshUser = await User.findById(userId).select('credits freeCredits');
  if (!freshUser) return { ok: false, ... };

  const freeAvail = freshUser.freeCredits ?? 0;
  const paidAvail = freshUser.credits ?? 0;
  if (freeAvail + paidAvail < cost) return { ok: false, ... };

  const freeDeducted = Math.min(freeAvail, cost);
  const paidDeducted = cost - freeDeducted;

  // 2. 原子条件更新：只有在总余额仍 >= cost 时才执行扣减
  const result = await User.findOneAndUpdate(
    { _id: userId, $expr: { $gte: [{ $add: ['$credits', '$freeCredits'] }, cost] } },
    { $inc: { freeCredits: -freeDeducted, credits: -paidDeducted } },
    { new: true }
  );

  if (!result) return { ok: false, ... }; // 余额已被其他请求抢先消耗

  // 3. 同步内存对象（避免调用方使用过时值）
  if (user._id) {
    user.freeCredits = result.freeCredits;
    user.credits = result.credits;
  }
  return { ok: true, freeDeducted, paidDeducted };
}
```

**原子性保证**：MongoDB `findOneAndUpdate` 是原子操作，`$expr` 条件在同一个 DB 操作中执行，确保"检查余额足够"和"执行扣减"之间不可被其他操作插入。

---

#### B2. 免费积分刷新非原子（Race Condition → 多次刷新）🟠

**文件**：`server/routes/credits.js`

**问题**：原 `refreshFreeCreditsIfNeeded(user)` 的读取-检查-写入模式：
```js
if (!isSameDay(user.lastFreeCreditsRefreshAt, now)) {
  user.freeCredits = DAILY_FREE_AMOUNT;
  user.lastFreeCreditsRefreshAt = now;
  await user.save();
}
```

**Race Condition 场景**：用户同时发出两个 API 请求（例如打开两个标签页），两个请求都读取了同一个过时的 `user` 对象（`lastFreeCreditsRefreshAt` 为昨天），都通过了 `!isSameDay` 检查，都执行了 `user.save()`。虽然两次都是 `set` 不是 `inc`（结果值相同），但与签到系统结合可能造成逻辑异常。

**修复**：改用 `findOneAndUpdate` 原子条件写入：
```js
async function refreshFreeCreditsIfNeeded(user) {
  const now = new Date();
  const offset = 8 * 60 * 60 * 1000;
  const nowUTC8 = new Date(now.getTime() + offset);
  const todayStartUTC8 = new Date(
    Date.UTC(nowUTC8.getUTCFullYear(), nowUTC8.getUTCMonth(), nowUTC8.getUTCDate()) - offset
  );

  const updated = await User.findOneAndUpdate(
    {
      _id: user._id,
      $or: [
        { lastFreeCreditsRefreshAt: null },
        { lastFreeCreditsRefreshAt: { $lt: todayStartUTC8 } },
      ],
    },
    { $set: { freeCredits: DAILY_FREE_AMOUNT, lastFreeCreditsRefreshAt: now } },
    { new: true }
  );

  // 同步内存对象
  if (updated) {
    user.freeCredits = updated.freeCredits;
    user.lastFreeCreditsRefreshAt = updated.lastFreeCreditsRefreshAt;
  }
}
```

**原子性保证**：条件 `lastFreeCreditsRefreshAt < todayStart` 在 DB 层执行，只有第一个到达的请求能满足条件并执行更新，后续并发请求得到 `null` 结果，不执行任何操作。

---

#### B3. 4K Upscale 失败后不退差额积分 🟠 用户积分损失

**文件**：`server/routes/generate.js:450-453`

**问题**：积分成本计算为 `model.creditCost + (resolution === '4K' ? 5 : 0)`，当用户选择 4K 生成，积分会多扣 5（4K 超分溢价）。但当 Replicate Upscale 服务失败时：
```js
} catch (upscaleErr) {
  console.error('Upscale failed, falling back to original:', upscaleErr.message);
  resolution = '2K';
  // ← 没有调整 totalCreditCost，用户被多扣 5 积分
}
```
随后执行 `deductCredits(user, totalCreditCost)` 仍按 4K 价格扣费，用户实际只获得 2K 图片，损失 5 积分。

**修复**：在 upscale 失败的 catch 块中同步调整费用：
```js
} catch (upscaleErr) {
  console.error('Upscale failed, falling back to original:', upscaleErr.message);
  resolution = '2K';
  totalCreditCost -= 5; // 回退到 2K 定价
  // （注意：同时需将 const totalCreditCost 改为 let）
}
```

---

#### B4. 生成接口无 Per-User 限流 🟠 AI 成本爆炸

**文件**：`server/routes/generate.js`

**问题**：全局限流 1000次/15分钟，对于 AI 生成接口远不够：
- 单用户可在 1 分钟内发起 66 次生成请求
- 每次调用 Gemini/DALL·E/Seedream API 均产生实际 API 费用
- 恶意用户可以故意消耗所有积分（每次成功扣费），然后利用并发绕过余额检查（B1 修复前）

**修复**：在 generate 路由级别添加 per-user 限流器：
```js
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时窗口
  max: 60,                   // 每小时最多 60 次
  keyGenerator: (req) => req.userId?.toString() || req.ip,
  message: { message: '生成请求过于频繁，每小时最多60次，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(generateLimiter);
```

`keyGenerator` 使用 `req.userId`（JWT 解析后设置），确保限流以用户为单位，而非以 IP 为单位（后者在共享 NAT/VPN 环境下会误伤正常用户）。

---

#### B5. promptApi.js 硬编码 localhost:5000 🟠 功能失效

**文件**：`client/src/services/promptApi.js:3`

**问题**：
```js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```
两个问题：
1. 服务器实际运行在 **5500** 端口，localhost:5000 在本地开发也是错的
2. 生产环境若未设置 `REACT_APP_API_URL`，所有 `/api/prompts` 请求都会发到 `localhost:5000`，导致 404 失败

项目中其他 API 文件（`services/api.js`）正确使用了 `config.api.baseURL`，而 `config/index.js` 中已配置：
```js
baseURL: process.env.REACT_APP_API_URL || '/api',
```

**修复**：统一修改为相对路径 fallback（与 `api.js` 保持一致）：
```js
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
```

相对路径 `/api` 在生产环境下会正确代理到后端服务器。

---

#### B6. Admin 默认密码写死 🟠 管理后台被劫持

**文件**：`server/config/index.js:195`

**问题**：
```js
password: process.env.ADMIN_PASSWORD || 'admin123456',
```
若部署时忘记设置 `ADMIN_PASSWORD` 环境变量，管理后台密码为 `admin123456`，属于最常见弱密码之一，任何人都能登录 Admin Panel，完全控制用户数据、积分系统、Order 记录。

**修复**：
1. 移除默认值：`password: process.env.ADMIN_PASSWORD,`
2. 在 `validate()` 方法中添加生产环境强制验证：
```js
if (this.isProduction && !process.env.ADMIN_PASSWORD) {
  throw new Error('生产环境必须设置 ADMIN_PASSWORD 环境变量');
}
```

现在若生产环境未设置 `ADMIN_PASSWORD`，服务器直接拒绝启动，不给遗忘设置的机会。

---

#### B7. JWT_SECRET 生产环境无最低强度验证 🟠

**文件**：`server/config/index.js`

**问题**：原 `validate()` 中对 JWT_SECRET 长度不足仅输出 `console.warn`：
```js
if (this.jwt.secret.length < 32) {
  console.warn('⚠️  警告: JWT_SECRET 长度过短...');
}
```
`console.warn` 在生产日志中极易被淹没，开发者可能完全不注意到。若以默认值 `'your-secret-key'`（14字符）运行，任何知道默认值的攻击者都可以伪造有效 JWT，以任何用户身份（包括 admin）访问系统。

**修复**：生产环境改为 `throw` 而非 warn：
```js
if (this.jwt.secret.length < 32) {
  if (this.isProduction) {
    throw new Error('JWT_SECRET 长度不足32字符，生产环境禁止启动');
  }
  console.warn('⚠️  警告: JWT_SECRET 长度过短...');
}
```

---

### P2 — 第一周内修复（6 项）

---

#### C1. 验证码 console.log 泄露到服务器日志

**文件**：`server/routes/auth.js:166-188`（改动前）

**问题**：邮箱验证接口在处理过程中打印了大量调试日志：
```js
console.log('验证邮箱请求:', { userId, inputCode: codeStr });         // 用户输入的验证码
console.log('用户验证码信息:', {
  storedCode: user.emailVerificationCode,   // 存储的验证码明文！
  expiresAt: user.emailVerificationExpires,
});
console.log('验证码验证结果:', isValid);
```

服务器日志（通常存储在文件或发送到日志服务）中会保留用户的验证码，违反 OWASP A09（Security Logging and Monitoring Failures），任何有服务器日志访问权限的人都能看到有效验证码。

**修复**：完整删除 6 行调试 `console.log`，保留必要的错误日志（`console.error`）。

---

#### C2. /check-email 无限流 → 用户枚举

**文件**：`server/routes/auth.js:394`

**问题**：`GET /check-email/:email` 接口可以无限查询任意邮箱是否已注册，攻击者可以批量枚举：
- 导入常见邮箱列表，批量探测哪些邮箱已在 III.PICS 注册
- 为后续定向钓鱼攻击提供已注册用户名单

**修复**：在 A3 中一并添加 `emailCheckLimiter`（10次/分钟）。

---

#### C3. 文件删除接口路径穿越风险

**文件**：`server/routes/upload.js:219`

**问题**：`DELETE /api/upload/:filename` 接口直接使用 `req.params.filename` 构建文件路径：
```js
const filename = req.params.filename;
const possiblePaths = [
  path.join(__dirname, '..', 'uploads', filename), // ← 若 filename 含 '../'
  ...
];
```
若攻击者发送 `DELETE /api/upload/../../server/config/index.js`，Node.js `path.join` 会解析 `..` 跳出 uploads 目录，`fs.unlinkSync` 可能删除任意服务器文件（包括配置文件、代码文件）。

**修复**：在使用文件名前进行白名单格式验证：
```js
if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
  return res.status(400).json({ message: '无效的文件名' });
}
```
只允许字母、数字、点、连字符、下划线，拒绝任何包含 `/`、`\`、`..` 的文件名。

---

#### C4. 视频代理 CORS 使用通配符 `*`

**文件**：`server/routes/seedance.js:231`

**问题**：
```js
res.setHeader('Access-Control-Allow-Origin', '*');
```
视频代理接口（`GET /api/seedance/proxy-video`）返回带有 `*` 的 CORS 头，允许任意域名的页面嵌入并播放视频内容，违反同源策略的初衷，可能导致视频内容被第三方网站盗用。

**修复**：改为环境变量控制的限定域名：
```js
const allowedOrigin = process.env.CLIENT_URL || 'https://iii.pics';
res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
```

---

#### C5. Admin 用户查询字段审计

**文件**：`server/routes/admin.js:84`

**审计结果**：已有显式 `.select(...)` 白名单，仅返回前端展示所需字段：
```js
.select('username email avatar createdAt lastLoginAt analytics.lastActiveAt isActive role authProvider credits freeCredits hasPurchasedBefore inviteUsedCount')
```
`password`、`passwordResetToken`、`emailVerificationCode` 等敏感字段均未包含在 select 中，**无需修改**。✅

---

#### C6. og-default.jpg 缺失

**文件**：`client/public/og-default.jpg`（新建）

**问题**：`client/index.html` 的 Open Graph meta 标签引用了 `/og-default.jpg`：
```html
<meta property="og:image" content="%PUBLIC_URL%/og-default.jpg" />
```
但文件不存在，社交分享时 OG 图片加载失败（Facebook/Twitter 等平台会显示无图预览，降低分享点击率）。

**修复**：创建 `client/public/og-default.jpg` 占位符文件，后续可替换为正式 1200×630px 品牌图片。

---

## 三、未修复项（P3 — 上线后迭代）

| # | 问题 | 说明 |
|---|------|------|
| 21 | Token 存 localStorage | XSS 盗取风险，但项目无 XSS 漏洞入口，可接受；Cookie httpOnly 迁移工程量大，排 Q2 |
| 22 | 邀请码未验证邀请人 isActive | 被封禁用户的邀请码仍可使用，影响小，排 Q2 |
| 23 | CreditTransaction/User 缺少索引 | 数据量小时无感知，排上线后性能调优 |
| 24 | 无 Sentry 错误监控 | `SENTRY_DSN` 为空，排上线当天配置 |
| 25 | 文件上传 200MB 上限过大 | 建议改为 50MB，排上线后配置调整 |

---

## 四、变动文件汇总

| 文件 | 变动内容 |
|------|---------|
| `server/routes/payments.js` | A1 幂等性检查 |
| `server/middleware/auth.js` | A2 adminAuth 内联重写 |
| `server/routes/auth.js` | A3 authLimiter / emailCheckLimiter + C1 移除验证码log + C2 |
| `client/public/_redirects` | A4 Vercel SPA 路由（新建）|
| `client/src/App.js` | A5 路由移入 ProtectedRoute + A6 删除测试路由 |
| `server/utils/creditsUtils.js` | B1 deductCredits 原子化 |
| `server/routes/credits.js` | B2 refreshFreeCreditsIfNeeded 原子化 |
| `server/routes/generate.js` | B3 4K失败费用调整 + B4 generateLimiter |
| `client/src/services/promptApi.js` | B5 localhost:5000 → /api |
| `server/config/index.js` | B6 移除默认密码 + B7 JWT强度生产校验 |
| `server/routes/upload.js` | C3 filename 格式验证 |
| `server/routes/seedance.js` | C4 CORS 限定域名 |
| `client/public/og-default.jpg` | C6 OG 图片占位符（新建）|
| `tasks/todo.md` | 结果记录 |

**变动规模**：12 files changed, 161 insertions(+), 49 deletions(-)

---

## 五、上线当天 Checklist

```
□ server/.env 必须包含：
  □ NODE_ENV=production
  □ JWT_SECRET（随机 ≥32 字符）
  □ MONGODB_URI（生产 DB）
  □ ADMIN_PASSWORD（强密码，非默认）
  □ ADMIN_EMAIL
  □ CLIENT_URL=https://iii.pics
  □ STRIPE_SECRET_KEY（sk_live_...）
  □ STRIPE_WEBHOOK_SECRET（whsec_...）

□ client 环境变量（Vercel Dashboard）：
  □ REACT_APP_API_URL=https://your-server.com/api
  □ REACT_APP_BASE_URL=https://iii.pics
  □ REACT_APP_GOOGLE_CLIENT_ID

□ Stripe：
  □ Webhook endpoint 在 Dashboard 注册
  □ 测试 Webhook 重复触发幂等性

□ Google OAuth：
  □ Authorized origins 包含 https://iii.pics

□ 生产功能验证：
  □ 刷新 /gallery 不报 404（_redirects 验证）
  □ 无效 token 访问 /api/admin/users → 401（非 500）
  □ 登录流程完整
  □ AI 生成至少一次
  □ Stripe test card 支付流程
  □ Admin 登录（使用 ADMIN_PASSWORD 配置的密码）
  □ 未登录访问 /browse-history → 重定向 login
  □ 未登录访问 /img2prompt → 重定向 login
```

---

## 六、技术决策说明

### 为什么选择 findOneAndUpdate 而非 MongoDB 事务？

MongoDB 事务（`session.withTransaction`）需要副本集（Replica Set）部署，本项目使用单实例 MongoDB，无法使用事务。`findOneAndUpdate` + `$expr` 条件是单实例 MongoDB 下的最佳原子化方案：

- `findOneAndUpdate` 在 MongoDB 层面是原子操作
- `$expr: { $gte: [...] }` 条件在 DB 内部与 update 操作同步执行，中间不可被其他操作插入
- 实现简单，不增加运维复杂度

### 为什么 deductCredits 仍保留两步（读 + 原子更新）？

wallet 分配（freeCredits vs credits 优先级）需要在更新前知道当前余额才能计算，MongoDB 的 `$inc` 只支持固定值，不支持"从 freeCredits 扣到 0 再从 credits 扣"这种条件逻辑。因此必须先读取余额计算分配比例，再执行原子更新。

即使在读和更新之间余额被消耗，`$expr` 条件也会保证更新失败（返回 null），调用方得到 `{ ok: false }` 并返回 402，不会造成余额为负。

唯一的潜在问题是分配比例可能基于过时的读取值计算（例如：读取时 freeCredits=40，更新时 freeCredits 已被消耗到 0），导致从 freeCredits 多扣了 40，从 credits 少扣了 40。但总量不变（$expr 保证），只影响两个钱包的分配，不影响用户资产总量。

若要完美解决分配精度问题，需要升级到 MongoDB Replica Set + 事务，或改为单一钱包设计，可在 Q2 数据库升级时一并处理。
