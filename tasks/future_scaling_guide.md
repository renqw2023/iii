# III.PICS 后期扩展开发指南

> **触发原则**：不要提前优化。按实际监控数据触发对应阶段的升级。
>
> 监控指标来源：服务器日志 `console.error` 频率、用户投诉、API Dashboard 用量曲线。

---

## 升级路线图

| 阶段 | 触发条件 | 预计工作量 |
|------|---------|----------|
| **现状**（已上线） | — | — |
| **阶段 1**：Redis 队列 | 日活 500+ 或用户投诉"生成失败/超时" | 3~5 天 |
| **阶段 2**：API Key 池 | 单 Key 触顶，大量 429 且重试无效 | 1~2 天 |
| **阶段 3**：多实例部署 | 单机 CPU/内存成为瓶颈 | 视运维配置 |

---

## 阶段 1 — Redis 异步队列

### 触发条件

- 日活用户 ≥ 500，或
- 错误日志中 `503 Server is busy` 频率 > 5%，或
- 用户反馈频繁出现"生成失败请重试"

### 核心问题

当前架构是**同步请求**：HTTP 请求在 AI 生成期间（5~30s）保持连接。

```
问题1：连接长时间占用 → Node.js 事件循环压力
问题2：用户刷新/关闭页面 → 请求中断但 AI 调用继续（浪费 API 配额）
问题3：多实例部署后 activeConcurrency 进程内变量失效
```

### 解决方案：Bull + Redis

#### 依赖安装

```bash
# 服务器端
npm install bull ioredis

# Redis 安装（Ubuntu）
sudo apt install redis-server
sudo systemctl enable redis
```

#### 架构变化

```
现在（同步）：
  POST /api/generate/image → 等待 AI → 返回图片 URL

改后（异步）：
  POST /api/generate/image → 创建 Job → 立即返回 { jobId, status: 'pending' }
  GET  /api/generate/job/:jobId → 轮询状态
  WebSocket event: 'generation:done' → 推送结果
```

#### 核心代码结构

**`server/queues/imageQueue.js`**（新建）

```js
const Bull = require('bull');

const imageQueue = new Bull('image-generation', {
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 2,           // 失败自动重试 1 次
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100, // 只保留最近 100 条成功记录
    removeOnFail: 200,
  },
});

// 并发控制：每个 provider 最多同时处理 N 个 job
imageQueue.process('google',  5, require('./processors/googleProcessor'));
imageQueue.process('openai',  3, require('./processors/openaiProcessor'));
imageQueue.process('zhipu',   5, require('./processors/zhipuProcessor'));
imageQueue.process('doubao',  5, require('./processors/doubaoProcessor'));

module.exports = imageQueue;
```

**`server/routes/generate.js`** 接口改动

```js
// 改前：直接调用 AI，等待结果
router.post('/image', auth, async (req, res) => {
  const result = await callAI(...);
  res.json({ imageUrl: result.url });
});

// 改后：提交任务，立即返回 jobId
router.post('/image', auth, async (req, res) => {
  // 积分检查（同前）
  const job = await imageQueue.add(provider, {
    userId: req.userId,
    prompt, modelId, aspectRatio, resolution,
    referenceImageData, creditCost: totalCreditCost,
  }, { priority: user.hasPurchasedBefore ? 1 : 2 }); // 付费用户高优先级

  res.json({ jobId: job.id, status: 'pending' });
});

// 新增：查询 job 状态
router.get('/job/:jobId', auth, async (req, res) => {
  const job = await imageQueue.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const state = await job.getState(); // waiting/active/completed/failed
  const result = job.returnvalue;

  res.json({ jobId: job.id, status: state, result: result || null });
});
```

**前端轮询逻辑**（`client/src/hooks/useGenerationJob.js`，新建）

```js
const useGenerationJob = () => {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);

  const submit = async (params) => {
    setStatus('pending');
    const { data } = await api.post('/generate/image', params);
    setJobId(data.jobId);

    // 开始轮询，每 3 秒查一次
    intervalRef.current = setInterval(async () => {
      const { data: job } = await api.get(`/generate/job/${data.jobId}`);
      if (job.status === 'completed') {
        clearInterval(intervalRef.current);
        setStatus('done');
        setResult(job.result);
      } else if (job.status === 'failed') {
        clearInterval(intervalRef.current);
        setStatus('error');
      }
    }, 3000);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);
  return { submit, status, result };
};
```

**WebSocket 推送（更好的 UX，替代轮询）**

项目已安装 `socket.io`，在 processor 完成后推送：

```js
// processor 处理完成后
io.to(`user:${userId}`).emit('generation:done', { jobId, imageUrl });

// 前端
socket.on('generation:done', ({ jobId, imageUrl }) => {
  setResult(imageUrl);
  setStatus('done');
});
```

### 积分处理变化

异步架构下，积分必须在**提交任务时预扣**，避免用户提交多个任务但只有积分检查时够：

```js
// 提交时预扣（原子操作，见 creditsUtils.js）
const { ok } = await deductCredits(user, totalCreditCost);
if (!ok) return res.status(402).json({ message: '积分不足' });

// 生成失败时退款
await User.findByIdAndUpdate(userId, { $inc: { credits: totalCreditCost } });
await recordTransaction(userId, 'refund', `生成失败退款 - ${jobId}`, ...);
```

### 优先级队列（付费用户插队）

```js
// Bull 优先级：数字越小越优先
const priority = user.hasPurchasedBefore ? 1 : 3;
// 付费用户: priority 1 → 优先处理
// 免费用户: priority 3 → 等待空闲槽位
```

---

## 阶段 2 — API Key 池

### 触发条件

- 服务器日志中 `429` 错误频率持续 > 10%（重试后仍然 429），或
- AI API Dashboard 显示单 Key 接近每日配额上限

### 核心问题

单 API Key 有 RPM（每分钟请求数）和 RPD（每日请求数）双重限制：

```
Gemini 3 Pro（免费层）: RPM ≈ 10, RPD = 50
Gemini 2.5 Flash（免费层）: RPM ≈ 15, RPD = 1500

当日活用户 > 500 时，RPD 可能在当天被耗尽
```

### 解决方案：Key 轮询池

#### 准备工作

1. 注册 2~3 个独立 Google Cloud 账号（不同邮箱）
2. 每个账号启用 Gemini API，获取独立 API Key
3. 将 Key 写入 `.env`：

```env
GEMINI_API_KEY_1=AIza...key1
GEMINI_API_KEY_2=AIza...key2
GEMINI_API_KEY_3=AIza...key3
```

#### 实现：智能 Key 选择器

**`server/utils/apiKeyPool.js`**（新建）

```js
const keys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

// 每个 Key 的状态跟踪
const keyStats = keys.map(key => ({
  key,
  rpm: 0,            // 当前分钟内请求数
  isRateLimited: false,
  rateLimitUntil: 0, // 解除限制的时间戳
}));

// 每分钟重置 rpm 计数
setInterval(() => {
  const now = Date.now();
  keyStats.forEach(stat => {
    stat.rpm = 0;
    if (stat.isRateLimited && now > stat.rateLimitUntil) {
      stat.isRateLimited = false;
    }
  });
}, 60 * 1000);

/**
 * 获取当前最空闲且未被限速的 Key
 */
function getAvailableKey() {
  const available = keyStats.filter(s => !s.isRateLimited && s.rpm < 8); // 留 2 个余量
  if (available.length === 0) return null; // 全部限速，触发 503
  // 选 rpm 最低的
  return available.reduce((a, b) => a.rpm <= b.rpm ? a : b);
}

/**
 * 标记某个 Key 被限速（429 返回时调用）
 */
function markRateLimited(key, retryAfterSeconds = 60) {
  const stat = keyStats.find(s => s.key === key);
  if (stat) {
    stat.isRateLimited = true;
    stat.rateLimitUntil = Date.now() + retryAfterSeconds * 1000;
  }
}

function incrementRpm(key) {
  const stat = keyStats.find(s => s.key === key);
  if (stat) stat.rpm++;
}

module.exports = { getAvailableKey, markRateLimited, incrementRpm };
```

#### 在 generate.js 中使用

```js
const { getAvailableKey, markRateLimited, incrementRpm } = require('../utils/apiKeyPool');

// 替换原来的 process.env.GEMINI_API_KEY
const keyObj = getAvailableKey();
if (!keyObj) {
  return res.status(503).json({ message: '当前服务繁忙，请稍后重试' });
}
incrementRpm(keyObj.key);

const geminiRes = await fetch(
  `https://...?key=${keyObj.key}`, // 使用池中的 key
  { ... }
);

if (geminiRes.status === 429) {
  const retryAfter = parseInt(geminiRes.headers.get('Retry-After') || '60');
  markRateLimited(keyObj.key, retryAfter); // 冷却该 key
  // retryFetch 自动用下一个可用 key 重试
}
```

#### 注意事项

- 多账号 Key 池需要每个账号独立绑定支付方式（否则违反 Google ToS）
- 建议先升级到 Google 付费层（按需计费），付费层的 RPM 远高于免费层
- OpenAI Key 同理，创建多个 Project，每个 Project 使用独立 Key

---

## 阶段 3 — 多实例部署

### 触发条件

- 单机 CPU 使用率持续 > 70%，或
- 内存不足导致频繁 OOM

### 关键前提

进入多实例后，当前 `activeConcurrency`（进程内变量）**立即失效**。

必须先完成**阶段 1**（Redis 队列），因为 Redis 天然支持跨实例的任务分发：

```
实例 A ─┐
实例 B ─┼─→ Redis Queue ─→ Worker Pool（可跨实例）
实例 C ─┘
```

Bull 的 Worker 天然支持多实例消费同一个队列，无需额外改动。

---

## 开发优先级 Checklist

### 上线前（已完成）✅

- [x] Per-user 限流（60次/小时）
- [x] 全局并发限制（per-provider in-memory）
- [x] 429 自动重试一次（retryFetch）
- [x] 超时处理（AbortSignal.timeout）

### 日活 200+ 时

- [ ] 监控告警：接入 Sentry（`SENTRY_DSN` 已预留但为空）
- [ ] 日志结构化：记录每次 AI 调用的耗时、modelId、成功/失败
- [ ] API 配额仪表板：Admin Panel 新增 "API 用量" 标签页

### 日活 500+ 时

- [ ] **Redis + Bull 异步队列**（见阶段 1 详细方案）
- [ ] **WebSocket 推送**生成结果（socket.io 已安装，替代轮询）
- [ ] 付费用户优先级队列

### 单 Key 触顶时

- [ ] **API Key 池**（见阶段 2 详细方案）
- [ ] 升级 Google/OpenAI 到付费计划（RPM 提升 10~100x）

---

## 当前未开启模型的启用方法

| 模型 | 所需操作 |
|------|---------|
| GPT Image 1.5 / DALL·E 3 | 获取 OpenAI API Key → `server/.env` 添加 `OPENAI_API_KEY=sk_...` |
| Z Image Turbo (CogView-3-Flash) | 注册智谱 AI（免费）→ 获取 Key → `ZHIPU_API_KEY=xxx` |
| Imagen 4 Pro/Fast | 已配置（使用 `GEMINI_API_KEY`），若前端不显示检查前端模型列表缓存 |

配置后**重启 server**，模型自动出现在前端选择器。

