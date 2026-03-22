# Stage 49c — 积分定价调整 + 模型修复 + 错误提示国际化

**日期**: 2026-03-22
**分支**: main
**Commits**: `7e63473` → `7c8d871`

---

## 背景

上线前安全审计（Stage 49）完成后，针对积分系统盈利性、模型定价合理性、
Nanobanana 2 接口问题及错误提示语言适配进行了一轮集中修复。

---

## 一、积分定价调整（Stage 49b）

### 问题

原 Gemini 模型积分定价基于早期估算，未充分考虑 API 成本，存在亏损风险。
GPT Image 1.5 未锁定画质，`high` 质量成本 $0.167/张，严重超支。

### 分析（Pro 套餐基准：$19.9/2200cr → ¥0.065/cr）

| 模型 | 旧积分 | API 成本 | 旧利润率 |
|------|--------|----------|----------|
| Nanobanana (gemini25-flash) | 4cr = ¥0.26 | ~¥0.28 | **亏损** |
| Nanobanana 2 (gemini3-flash) | 6cr = ¥0.39 | ~¥0.36 | 8% |
| Nanobanana Pro (gemini3-pro) | 10cr = ¥0.65 | ~¥0.58 | 12% |
| GPT Image 1.5 (high) | 10cr = ¥0.65 | ¥1.20 | **亏损** |

### 修复

**文件**: `server/routes/generate.js`

| 模型 | 旧积分 | 新积分 | 新利润率 |
|------|--------|--------|----------|
| Nanobanana (gemini25-flash) | 4 | **8** | ~46% |
| Nanobanana 2 (gemini3-flash) | 6 | **18** | ~50%+ |
| Nanobanana Pro (gemini3-pro) | 10 | **18** | ~51% |
| GPT Image 1.5 | 10 | 10 | **54%**（锁定 medium） |

GPT Image 1.5 新增 `quality: 'medium'`，成本从 $0.167 降至 $0.042/张。

---

## 二、4K 积分显示修复

### 问题

Generate Image 按钮固定显示 `model.creditCost`，选择 4K 时不叠加 +5 附加费，
导致用户误判 2K 与 4K 定价相同。

### 修复

**文件**: `client/src/components/UI/Img2PromptPanel.js`

```js
// 修复前
{genModels.find(m => m.id === selectedGenModel)?.creditCost ?? '?'}

// 修复后 — 实时叠加 4K 附加费
{(() => {
  const base = genModels.find(m => m.id === selectedGenModel)?.creditCost ?? null;
  return base != null ? base + (resolution === '4K' ? 5 : 0) : '?';
})()}
```

4K 分辨率按钮同步标注 `+5`（锁定用户显示 `🔒`）。

---

## 三、Nanobanana 2 定位校正

### 背景

经调研确认，Nanobanana 2（`gemini-3.1-flash-image-preview`）于 2026-02-26 发布，
是整个 Nanobanana 系列的第二代，定位为"Pro 级画质 + Flash 速度"，
并非低配 Flash 变体，应高于 Nanobanana Pro 排列。

### Google Nano Banana 系列正确层级

| 品牌名 | API Model | 发布时间 | 定位 |
|--------|-----------|----------|------|
| Nano Banana | `gemini-2.5-flash-image` | 较早 | 原始版，快速稳定 |
| Nano Banana Pro | `gemini-3-pro-image-preview` | 2025 末 | 专业旗舰，原生 4K |
| Nano Banana 2 | `gemini-3.1-flash-image-preview` | 2026-02-26 | Pro 级画质 + Flash 速度，最新 |

### 修复

**文件**: `server/routes/generate.js`

- Nanobanana 2 移至 MODELS 数组第二位（仅次于 Nanobanana Pro，因为用户要求 Pro 为默认）
- description 从 `"Fast generation"` 改为 `"Pro-quality at Flash speed"`
- badge 改为 `"New"`
- creditCost 调整为 18（与 Pro 同价，Pro 级画质对等）

### 默认模型

用户明确要求 Nanobanana Pro 为默认选中模型：

- **服务端**：MODELS 数组中 Nanobanana Pro 排第一
- **前端**：`client/src/components/UI/Img2PromptPanel.js:88`
  ```js
  const preferred = available.find(m => m.id === 'gemini3-pro') ?? available[0];
  ```

---

## 四、generateLimiter 作用范围修复

### 问题

安全审计阶段将 `generateLimiter` 通过 `router.use()` 全局挂载，
导致 `GET /api/generate/models` 也被 rate limit 拦截，前端无法加载模型列表，
显示 "No models configured"。

### 修复

**文件**: `server/routes/generate.js`

```js
// 修复前 — 全局拦截所有路由
router.use(generateLimiter);

// 修复后 — 仅挂载到 AI 生成端点
router.post('/image', auth, generateLimiter, async (req, res) => { ... });
router.post('/video', auth, generateLimiter, async (req, res) => { ... });
```

---

## 五、Gemini 生成超时修复

### 问题

所有 Gemini 模型统一使用 90s 超时，Nanobanana Pro（高质量图像）生成时间常超 90s，
导致 `DOMException [TimeoutError]`，前端报"生成失败"而非友好提示。

### 修复

**文件**: `server/routes/generate.js`

```js
// 模型专属超时
const geminiTimeout = modelId === 'gemini3-pro' ? 180000 : 120000;
//  Nanobanana Pro: 180s（3分钟）
//  Nanobanana 2 / Nanobanana: 120s（2分钟）
```

catch 块区分错误类型：

```js
if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
  return res.status(504).json({ message: t(req, '生成超时，请尝试更简短的描述...', 'Generation timed out...') });
}
```

---

## 六、Gemini 503 过载错误友好提示

### 问题

`gemini-3.1-flash-image-preview` 作为新发布模型，Google 服务端偶发 503 UNAVAILABLE，
原来统一返回 `"Gemini 服务错误: ..."` 令用户困惑。

### 修复

```js
if (geminiRes.status === 503 || errBody?.error?.status === 'UNAVAILABLE') {
  return res.status(503).json({ message: t(req,
    `${model.name} 当前访问量过高，请稍后重试或切换其他模型`,
    `${model.name} is experiencing high demand. Please try again later or switch to another model.`
  )});
}
if (geminiRes.status === 429) {
  return res.status(429).json({ message: t(req, 'API 请求过于频繁...', 'API rate limit exceeded...') });
}
```

---

## 七、错误提示国际化（zh/en）

### 问题

所有错误提示均为中文，英文界面用户看到中文报错。

### 方案

**服务端**（`server/routes/generate.js`）：

```js
const isZh = (req) => {
  const bodyLang = req.body?.lang || '';
  if (bodyLang) return bodyLang.toLowerCase().startsWith('zh');
  return (req.headers['accept-language'] || '').toLowerCase().startsWith('zh');
};
const t = (req, zh, en) => isZh(req) ? zh : en;
```

**客户端**（`client/src/services/generateApi.js`）：

```js
import i18n from '../i18n';
const withLang = (body) => ({ ...body, lang: i18n.language || 'en' });

generateImage: (body) => api.post('/generate/image', withLang(body), ...),
generateVideo: (body) => api.post('/generate/video', withLang(body), ...),
```

覆盖范围：rate limit、积分不足、4K 鉴权、所有模型错误、超时、生成失败。

检测优先级：`body.lang` → `Accept-Language` → 默认英文。

---

## 八、Nanobanana 2 接口修复（核心 Bug）

### 问题

每次调用 Nanobanana 2 均返回错误，用户误以为模型高峰期不可用。

### 根因

经查阅 [官方文档](https://ai.google.dev/gemini-api/docs/image-generation)，
`gemini-3.1-flash-image-preview` 与其他 Gemini 图像模型不同，
**必须**在 `generationConfig` 中传入 `imageConfig`，否则 API 拒绝请求。

其他模型（`gemini-2.5-flash-image`、`gemini-3-pro-image-preview`）该字段为可选。

### 修复

**文件**: `server/routes/generate.js`

```js
generationConfig: {
  responseModalities: ['TEXT', 'IMAGE'],
  // gemini-3.1-flash-image-preview requires explicit imageConfig
  ...(modelId === 'gemini3-flash' ? {
    imageConfig: {
      aspectRatio: aspectRatio || '1:1',
      imageSize: '2K',
    },
  } : {}),
},
```

### API Key

`gemini-3.1-flash-image-preview` 使用与其他 Gemini 模型相同的 `GEMINI_API_KEY`，
无需在 `.env` 添加新密钥。

---

## 变更文件汇总

| 文件 | 变更内容 |
|------|----------|
| `server/routes/generate.js` | 积分定价、GPT quality、模型排序/描述、generateLimiter 范围、超时、503处理、i18n、imageConfig |
| `client/src/services/generateApi.js` | withLang 注入 i18n.language |
| `client/src/components/UI/Img2PromptPanel.js` | 4K 积分显示、默认模型 ID |

---

## Commits

| Hash | 说明 |
|------|------|
| `7e63473` | Stage 49b: Gemini 积分定价调整 + GPT Image medium 锁定 |
| `93f4edb` | Fix: 4K 积分显示实时反映 +5 溢价 |
| `b97808e` | Fix: Nanobanana 2 优先级 + generateLimiter 范围 + 超时修复 |
| `773c3f0` | Fix: Gemini 503/过载错误友好提示 |
| `8269497` | i18n: generate 路由所有错误提示双语化 |
| `0110ea8` | Fix: 恢复 Nanobanana Pro 为默认首选模型（服务端排序） |
| `d7dd419` | Fix: 默认生图模型改为 Nanobanana Pro（前端 ID） |
| `7c8d871` | Fix: Nanobanana 2 imageConfig 必填 + 语言检测改用 i18n.language |
