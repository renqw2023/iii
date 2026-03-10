# 阶段30 开发日志 — 双积分体系 + 多模型扩展 + Hover 积分卡 + 模型选择器修复

**日期**: 2026-03-09
**Commit 范围**: 阶段29（f173ff7）→ 阶段30
**涉及文件**: 7 个

---

## 一、背景与目标

对标 MeiGen.ai，完善积分体系与生图模型配置。核心诉求：

| 需求 | 旧状态 | 新状态 |
|------|--------|--------|
| 注册欢迎奖励 | 50 积分 | 80 积分 |
| 免费额度 | 无 | freeCredits 40/天，0:00 UTC+8 自动刷新 |
| 积分扣除顺序 | 直接扣 credits | 先扣 freeCredits，再扣 credits |
| 生图模型数量 | 2 | 7（含占位与 comingSoon） |
| Header 积分 hover | 无 | MeiGen 风格明细卡片 + 进度条 |
| Reverse Prompt 模型选择 | 静态装饰 | 真实下拉，可切换 GPT-4o / GPT-4o Mini |
| img2prompt 积分扣除 | 单积分 | 双积分（freeCredits 优先） |

---

## 二、文件改动详情

### 1. `server/models/User.js`

**新增两个字段：**

```js
freeCredits: {
  type: Number,
  default: 40          // 新用户默认给 40 免费额度
},
lastFreeCreditsRefreshAt: {
  type: Date,
  default: null        // 每日刷新时间戳，null = 今天还未刷新
},
```

**设计意图**：
- `freeCredits` 与 `credits` 完全独立，前者每天归零重置，后者永不过期。
- `lastFreeCreditsRefreshAt` 使用"惰性刷新"策略：不依赖 cron，由接口在请求时检查是否跨天，若是则自动将 `freeCredits` 重置为 40。

---

### 2. `server/routes/auth.js`

**本地注册（邮箱验证通过时）：**

```js
// 旧
const REGISTER_BONUS = 50;
user.credits = (user.credits || 0) + REGISTER_BONUS;

// 新
const REGISTER_BONUS = 80;
user.credits = (user.credits || 0) + REGISTER_BONUS;
user.freeCredits = 40;  // 首日免费额度
```

**Google OAuth 新用户注册：**

```js
// 旧
credits: 50,

// 新
credits: 80,
freeCredits: 40,
```

**设计意图**：
新用户首次注册可用额度：80（永久）+ 40（当日免费）= 共 **120 积分**，大幅提升首次体验。

---

### 3. `server/routes/credits.js`

**新增 `refreshFreeCreditsIfNeeded(user)` 工具函数：**

```js
async function refreshFreeCreditsIfNeeded(user) {
  const now = new Date();
  if (!isSameDay(user.lastFreeCreditsRefreshAt, now)) {
    user.freeCredits = DAILY_FREE_AMOUNT;      // 40
    user.lastFreeCreditsRefreshAt = now;
    await user.save();
  }
}
```

- `isSameDay` 使用 UTC+8 时区比较，避免跨时区误差。
- 函数通过 `module.exports.refreshFreeCreditsIfNeeded` 导出，供 `generate.js` 和 `tools.js` 复用。

**`/balance` 接口更新：**

```js
// 旧返回
{ credits, checkedInToday, dailyAmount }

// 新返回
{ credits, freeCredits, dailyFreeAmount: 40, checkedInToday, dailyAmount }
```

---

### 4. `server/routes/generate.js`（完整重写）

#### 4.1 MODELS 数组扩展至 7 个

| id | 显示名 | provider | 费用 | 条件 |
|----|--------|----------|------|------|
| `gpt-image-1` | GPT Image 1.5 | OpenAI | 8c | OPENAI_API_KEY |
| `gemini-flash` | Nanobanana 2 | Google | 5c | GEMINI_API_KEY |
| `imagen-fast` | Nanobanana Pro | Google | 6c | GEMINI_API_KEY |
| `imagen-pro` | Nanobanana Ultra | Google | 10c | GEMINI_API_KEY |
| `dall-e-3` | DALL·E 3 | OpenAI | 8c | OPENAI_API_KEY |
| `cogview-flash` | Z Image Turbo | Zhipu | 4c | ZHIPU_API_KEY |
| `midjourney-niji` | Midjourney Niji 7 | — | — | comingSoon: true |

**`/models` 接口行为**：
```js
// 已配置 KEY 的模型 + comingSoon 占位 都展示
MODELS.filter(m => m.available() || m.comingSoon)
```

#### 4.2 新增 API 实现

**GPT Image 1.5（`gpt-image-1`）**：使用 `/v1/images/generations`，返回 `b64_json`，写入本地文件。

**Google Imagen（`imagen-fast` / `imagen-pro`）**：使用 `imagegeneration` predict endpoint：
```
POST /v1beta/models/{model}:predict
{ instances: [{ prompt }], parameters: { sampleCount: 1 } }
→ predictions[0].bytesBase64Encoded
```

**Zhipu CogView-3-flash（`cogview-flash`）**：
```
POST https://open.bigmodel.cn/api/paas/v4/images/generations
{ model: 'cogview-3-flash', prompt }
→ data[0].url → fetch → 写文件
```

#### 4.3 `deductCredits(user, cost)` 辅助函数

```js
async function deductCredits(user, cost) {
  const freeAvail = user.freeCredits ?? 0;
  const paidAvail = user.credits ?? 0;
  if (freeAvail + paidAvail < cost) return { ok: false };

  const freeDeducted = Math.min(freeAvail, cost);
  const paidDeducted = cost - freeDeducted;
  user.freeCredits = freeAvail - freeDeducted;
  user.credits     = paidAvail - paidDeducted;
  await user.save();
  return { ok: true, freeDeducted, paidDeducted };
}
```

**扣除流水**：`freeDeducted > 0` 和 `paidDeducted > 0` 分别记两条 CreditTransaction，note 前缀 `[免费]` / `[付费]`，便于后台审计。

**响应新增字段**：
```js
res.json({ imageUrl, creditsLeft: user.credits, freeCreditsLeft: user.freeCredits, modelName })
```

---

### 5. `server/routes/tools.js`

**修复双积分扣除 + 支持模型参数：**

旧代码：
```js
user.credits -= CREDIT_COST;  // 直接扣，不管 freeCredits
```

新代码：
```js
await refreshFreeCreditsIfNeeded(user);         // 惰性刷新
const { ok } = await deductCredits(user, CREDIT_COST);  // 先 free 后 paid
```

**支持 `model` 参数：**
```js
const ALLOWED_MODELS = {
  'gpt-4o':      'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
};
const openaiModel = ALLOWED_MODELS[req.body?.model] ?? 'gpt-4o';
```

- 前端传 `model: 'gpt-4o-mini'` → 后端使用 `gpt-4o-mini`（更快、更省钱）
- 未知模型 ID 自动降级到 `gpt-4o`，防止注入攻击

**响应新增字段**：`freeCreditsLeft`

---

### 6. `client/src/components/UI/CreditsDisplay.js`（核心 UI 改造）

完整重写，新增 hover 弹出积分明细卡片。

**交互机制**：
```jsx
<div
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
>
  {/* 积分数字 */}
  {hovered && <HoverCard />}
</div>
```

**卡片布局（MeiGen 风格）**：

```
┌─────────────────────────────────────────┐
│ Free                      [+ Add Credits]│
│                                          │
│ ✦ Credits                           80  │
│ ↺ Free Daily Credits               35/40│
│ ██████████████░░░░░░░░░░░░░░░░░░░░       │
│  ⬤ Daily credits used first             │
└─────────────────────────────────────────┘
```

**进度条逻辑**：
```jsx
const freeUsedPct = Math.round(((dailyFree - freeCredits) / dailyFree) * 100);
const freeLeftPct = Math.round((freeCredits / dailyFree) * 100);

// 已用 → 蓝色 #6366f1
// 剩余 → 黄色 #fbbf24
// 背景 → 灰色 #f3f4f6
```

**[Add Credits] 按钮**：内联引入 `CreditsModal`，点击后设 `creditsModalOpen(true)`，无需通过父组件 prop 传递。

---

### 7. `client/src/components/UI/Img2PromptPanel.js`

#### 7.1 ReverseTab 模型选择器修复（Bug Fix）

**问题根因**：模型 div 仅有 `ChevronDown` 图标，**没有任何 onClick、state 或下拉逻辑**，是纯静态装饰元素。

**修复方案**：

新增常量：
```js
const REVERSE_MODELS = [
  { id: 'gpt-4o',      name: 'GPT-4o Vision',     badge: null   },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini Vision', badge: 'Fast' },
];
```

新增状态：
```js
const [selectedRevModel,  setSelectedRevModel]  = useState('gpt-4o');
const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
```

点击外部关闭（`useEffect` + `useRef`）：
```js
useEffect(() => {
  const handler = (e) => {
    if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
      setModelDropdownOpen(false);
    }
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);
```

下拉 UI：绝对定位浮层，白底 + shadow，每个选项 hover 高亮，选中项 `✓` 标记 + 蓝色。

`runGenerate` 传递模型：
```js
formData.append('model', selectedRevModel);
// 或
{ imageUrl, model: selectedRevModel }
```

#### 7.2 余额显示格式更新

ReverseTab 和 GenerateTab 底部余额均更新：

```jsx
// 旧
Balance: <strong>{credits}</strong> credits

// 新
Free: <strong style={{ color: '#fbbf24' }}>{freeCredits}</strong>
{' · '}
Credits: <strong style={{ color: '#6b7280' }}>{credits}</strong>
```

生图成功后同步更新 freeCredits 到 AuthContext：
```js
updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft });
```

---

## 三、积分消耗流程（最终）

```
用户触发生图 / 反推
        ↓
refreshFreeCreditsIfNeeded()
  └─ 若今日未刷新 → freeCredits = 40
        ↓
deductCredits(user, cost)
  freeCredits 余量 ≥ cost → 全扣 free
  freeCredits 余量 < cost → free 扣完，剩余扣 paid
  合计不足 → 返回 402
        ↓
记录 CreditTransaction（[免费] 和/或 [付费] 前缀）
        ↓
响应：{ creditsLeft, freeCreditsLeft, imageUrl/prompt }
        ↓
前端 updateUser({ credits, freeCredits })
CreditsDisplay hover 卡实时更新进度条
```

---

## 四、新增 ENV 变量

```bash
# server/.env
ZHIPU_API_KEY=...            # Z Image Turbo（cogview-3-flash），免费注册可用
VOLCENGINE_ACCESS_KEY=...    # Seedream 系列（可选，待审核）
VOLCENGINE_SECRET_KEY=...
```

- `GEMINI_API_KEY` / `OPENAI_API_KEY` 已存在，无需新增。
- Midjourney Niji 7 标记 `comingSoon: true`，无需 API Key，前端仅展示占位。

---

## 五、已知问题与后续

| 项目 | 状态 | 说明 |
|------|------|------|
| Imagen Fast/Pro | 🟡 待验证 | Google Imagen API endpoint 需确认是否在当前项目 API Key 权限范围内 |
| cogview-flash | 🟡 需配置 KEY | 注册智谱 AI 免费可得，配置后立即启用 |
| Midjourney Niji 7 | 🔴 占位 | 无官方 API，comingSoon: true |
| freeCredits 刷新冲突 | ℹ️ 低风险 | 极端并发下两个请求同时触发刷新，最差结果是刷新两次（幂等，无害） |
| 旧用户 freeCredits 字段 | ℹ️ 自动补全 | 旧用户首次触发 `/balance` 或生图时，`refreshFreeCreditsIfNeeded` 检测 `lastFreeCreditsRefreshAt = null` → 自动设为 40 |
