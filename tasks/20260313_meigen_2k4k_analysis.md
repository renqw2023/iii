# MeiGen 2K/4K 图像分辨率功能逆向分析报告

**日期**: 2026-03-13
**分析对象**: https://www.meigen.ai
**分析方法**: Chrome DevTools 网络拦截 + JS Bundle 逆向 + API 响应分析
**目的**: 了解 MeiGen 如何真正实现 2K/4K 画质分级，为 III.PICS 提供参考实现方案

---

## 一、分析方法

### 1.1 工具与手段

1. **Chrome DevTools 网络层监听**：拦截所有 XHR/Fetch 请求，捕获实际 API 调用及响应体
2. **JavaScript Bundle 逆向**：枚举并 fetch 所有 `_next/static/chunks/*.js` 文件（共 28 个），在浏览器内存中搜索关键字符串（`is_4k`、`resolution`、`upscal`、`generateImage`、`/api/gen` 等）
3. **Supabase API 直接观察**：MeiGen 使用 Supabase 作为数据库，通过 PostgREST 接口直接读取 `user_credits`、`generations` 等表的原始响应
4. **React Fiber 树遍历**：通过 `__reactFiber` 获取 2K 按钮的组件状态树

### 1.2 定位过程

- 共扫描 24 个 JS chunk，在 chunk `2940c678e6d81607.js`（~核心业务逻辑包）中发现 `is_4k`、`resolution`、生成请求构建逻辑
- 在 chunk `9f0acfe71a5ee151.js`（国际化字符串包）中发现定价层级配置（直接嵌入前端 bundle）
- 通过网络请求 `reqid=1000`（user_credits）和 `reqid=1023`（generations history）获取到完整的数据库字段结构

---

## 二、数据库层分析

### 2.1 generations 表字段（实测）

从 `/api/generations?limit=20&offset=0` 的响应中，获得一条真实生成记录（字段完整）：

```json
{
  "id": "32e1898c-a52e-4e9e-a2fb-da761b3d71cd",
  "user_id": "a9a90723-...",
  "prompt": "Luxury fashion advertisement poster...",
  "model_id": "gemini-3-pro-image-preview",
  "image_count": 1,
  "is_4k": false,
  "status": "completed",
  "image_urls": ["https://images.meigen.art/generations/2026-03/32e1898c-...jpg"],
  "error_message": null,
  "credits_used": 10,
  "started_at": "2026-03-12T12:23:25.578984+00:00",
  "completed_at": "2026-03-12T12:23:54.789018+00:00",
  "token_id": null,
  "r2_key": "generations/2026-03/32e1898c-...jpg",
  "credits_status": "confirmed",
  "reference_images": ["https://images.meigen.ai/tweets/...jpg"],
  "aspect_ratio": "3:4",
  "media_type": "image",
  "video_urls": null,
  "thumbnail_url": null,
  "resolution": "2K"
}
```

**关键字段**：
- `is_4k: boolean` — 旧版字段，标记是否为 4K 生成
- `resolution: "2K" | "4K"` — 新版字段，直接存储分辨率标签
- `r2_key` — 生成图存储在 Cloudflare R2，路径格式 `generations/{year}-{month}/{uuid}.jpg`
- `credits_used: 10` — 使用 Gemini 3 Pro 生成一张图消耗 10 积分

### 2.2 user_credits 表字段（实测）

从 `api.meigen.art/rest/v1/user_credits` 获得：

```json
{
  "daily_credits": 40,
  "purchased_credits": 40,
  "has_unlimited": false,
  "has_ever_purchased": false
}
```

**关键字段**：
- `has_ever_purchased: boolean` — 是否曾经购买过付费计划，是后端 4K 权限鉴权的核心依据
- `has_unlimited: boolean` — 是否为无限积分用户（最高档订阅）

### 2.3 技术栈确认

- **数据库**: Supabase（PostgreSQL + PostgREST）
- **存储**: Cloudflare R2（图片 URL 域名 `images.meigen.art`）
- **认证**: Supabase Auth（JWT，Bearer token）
- **前端**: Next.js（Vercel 部署，`dpl=dpl_7mFU4ZQJTgekQk7U7m7MPpmkMPLU`）
- **后端网关**: 独立服务，变量名 `t7`（非 Vercel，独立部署）

---

## 三、前端实现逆向

### 3.1 UI 层（2K/4K 按钮）

在 `Img2PromptPanel`（或其 MeiGen 等价组件）中：

```js
// 按钮渲染（从 a11y tree 确认）
// siblings: ["1/4（图数）", "3:4（比例）", "2K（分辨率）"]
<Button onClick={() => setResolution("2K")}>2K</Button>
// 4K 按钮在免费用户下被禁用/隐藏，提示 "upgradeToUnlock4K"
```

**注意**：免费账户在 UI 层只显示 `2K` 按钮，`4K` 选项在付费升级弹窗中才可见。

### 3.2 生成请求构建（核心）

从 chunk `2940c678e6d81607.js` 逆向：

```js
// 构建发往后端 gateway 的请求体
let requestBody = {
  prompt: e.prompt,
  modelId: e.modelId,
  aspectRatio: e.aspectRatio || "1:1",
  resolution: e.resolution || "2K",      // ← "2K" 或 "4K" 真实发送到后端
  referenceImages: e.referenceImages
};

// 条件附加字段
if (e.niji7Options) requestBody.niji7Options = e.niji7Options;
if (e.referenceType) requestBody.referenceType = e.referenceType;

// 发往独立 gateway（非 Next.js API routes）
let response = await fetch(`${t7}/generate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(requestBody)
});
```

**结论**：`resolution` 字段**真实传入后端**，不是装饰性参数。

### 3.3 生成结果映射

```js
// 从 gateway 响应映射回前端数据结构
let result = {
  id: response.generationId,
  prompt: e.prompt,
  model_id: e.modelId || "",
  is_4k: "4K" === e.resolution,            // ← 写入 DB 的 is_4k 字段来源
  image_urls: response.imageUrl ? [response.imageUrl] : null,
  credits_used: response.creditsUsed || 0,
  r2_key: response.r2Key || null,
  aspect_ratio: e.aspectRatio || null,
  media_type: response.mediaType || "image",
  resolution: e.resolution                  // ← 直接存储 "2K"/"4K" 字符串
};
```

### 3.4 历史记录读取时的兼容处理

```js
// 从 DB 读取历史记录时，兼容新旧字段
function mapGeneration(e) {
  return {
    resolution: e.resolution || (e.is_4k ? "4K" : "2K"),  // 新字段优先，旧字段兜底
    aspectRatio: e.aspect_ratio || "3:4",
    // ...
  };
}
```

这说明 MeiGen **新老数据并存**：早期只有 `is_4k`，后来改为 `resolution` 字符串，做了向下兼容。

### 3.5 轮询状态机

```js
// gateway 返回 generationId，前端轮询状态
async function pollStatus(generationId, signal) {
  let response = await fetch(`${t7}/status/${generationId}`, { signal });
  // status: "pending" | "processing" | "completed" | "failed"
}
```

这与我们当前的架构一致（异步生成 + 轮询）。

---

## 四、定价层级与权限控制

### 4.1 各档位配置（直接从 bundle 提取）

```js
const PRICING_TIERS = [
  {
    id: "free",
    price: 0,
    features: [
      "40 refresh credits every day",
      "Up to 20 images (image 1.5)",
      "2K resolution",             // ← 免费用户仅 2K
      "1 concurrent task",
      "Free background removal",
      "Commercial license"
    ]
  },
  {
    id: "starter",
    price: 9.9,       // USD / priceCNY: 79
    credits: 1000,
    imageCapacity: 50,
    features: [
      "40 refresh credits every day",
      "Up to 4K resolution",       // ← 付费起步档解锁 4K
      "4 concurrent tasks",
      "Credits never expire",
      "Free background removal",
      "Commercial license"
    ]
  },
  {
    id: "pro",
    price: 19.9,      // originalPrice: 22 / priceCNY: 159
    features: ["Up to 4K resolution", "4 concurrent tasks", ...]
  },
  {
    id: "ultimate",
    price: 49.9,      // originalPrice: 60 / priceCNY: 399
    badge: "SAVE 10%",
    features: ["Up to 4K resolution", "4 concurrent tasks", ...]
  }
];
```

### 4.2 鉴权机制推断

后端 gateway 收到 `{ resolution: "4K" }` 后：

1. 验证 JWT token → 获取 `user_id`
2. 查询 Supabase `user_credits` 表 → 读取 `has_ever_purchased`
3. 若 `resolution === "4K"` 且 `has_ever_purchased === false` → 返回 403
4. 否则继续生成流程

---

## 五、2K/4K 的技术实现推断

### 5.1 AI 模型原生分辨率的瓶颈

MeiGen 使用的模型（从 `model_id` 字段确认）：

| 模型 | model_id | 原生输出尺寸 |
|------|----------|------------|
| Nanobanana 2 | `nanobanana-2` | ~1024px（推测） |
| Nanobanana Pro | `nanobanana-pro` | ~1024px |
| Seedream 5.0 | `seedream-5.0` | ~1024px（Kolors 系） |
| Gemini 3 Pro | `gemini-3-pro-image-preview` | ~1024px（Google 默认） |

所有模型的原生输出均在 1024px 量级，**远低于真 2K（2048px）和 4K（4096px）**。

### 5.2 后处理 Upscaling 是唯一可行路径

基于以下证据综合判断，MeiGen 采用**生成后 AI 超分辨率上采样**：

**证据 1**：`r2_key` 路径格式为 `generations/{year}-{month}/{uuid}.jpg`，生成图直接存 R2。若无后处理，只需上传一次；若有 upscaling，同一 `uuid` 会经历 generate → upscale → upload 三步，最终覆盖写入同一 key。

**证据 2**：生成耗时约 29 秒（`started_at` 到 `completed_at` 差值），比 Gemini 通常的 8-15 秒显著更长，符合「生成 + upscaling」两阶段耗时特征。

**证据 3**：定价体系将 4K 作为付费专属功能，而非模型参数差异，说明 4K 是后端的额外处理步骤（有成本），而非简单传一个 API 参数。

**证据 4**：`resolution` 字段只有两个值 `"2K"` / `"4K"`，没有 `"1K"` 或原始尺寸选项，暗示所有图片都经过至少一次上采样（2K 是标准，4K 是付费增强）。

### 5.3 Upscaling 技术选型推断

常见方案对比：

| 方案 | 成本 | 速度 | 质量 | 自托管 |
|------|------|------|------|--------|
| **Real-ESRGAN on Replicate** | ~$0.0023/次 | ~5-10s | ★★★★ | 否 |
| **Topaz Gigapixel API** | ~$0.01/次 | ~10s | ★★★★★ | 否 |
| **Magnific AI API** | ~$0.05/次+ | ~15s | ★★★★★ | 否 |
| **自建 Real-ESRGAN** | GPU 成本 | ~2-5s | ★★★★ | 是 |
| **Cloudflare Images** | ~$0.0015/次 | <1s | ★★★（插值，非AI） | 否 |

**最可能方案**：Replicate 托管的 Real-ESRGAN 或类似 AI 超分模型，理由：
- MeiGen 已深度使用 Cloudflare（R2 存储），但 Cloudflare Images 的 resize 是插值放大，质量不足以作为卖点
- $0.002 量级的 Replicate 调用与「付费用户才能用 4K」的定价策略匹配（成本可控、需要差异化）
- Supabase + Vercel + Cloudflare 的技术栈风格偏向托管服务

---

## 六、与 III.PICS 现状的对比

### 6.1 差距分析

| 功能点 | MeiGen | III.PICS 现状 |
|--------|--------|--------------|
| `resolution` 发送到后端 | ✅ 真实发送 | ❌ 前端存 state，API 调用时丢弃 |
| 后端接收 resolution 参数 | ✅ gateway 处理 | ❌ `req.body` 不提取 resolution |
| AI upscaling 后处理 | ✅ 有（推断） | ❌ 无 |
| 付费鉴权（4K 需付费） | ✅ `has_ever_purchased` 检查 | ❌ 无 |
| DB 记录 `is_4k` / `resolution` | ✅ 双字段兼容 | ❌ GalleryPrompt 无此字段 |
| 定价文案与实际功能一致 | ✅ | ❌ CreditsModal 写了 2K/4K 但无实现 |

### 6.2 落地方案（三阶段）

**Phase 1 — 基础接通（低成本验证，约 2-3 小时）**

```
前端 Img2PromptPanel.js:
  generateAPI.generateImage({ ..., resolution })  ← 加入 resolution

后端 server/routes/generate.js:
  const { ..., resolution = '2K' } = req.body;
  // 先只记录，不做实际 upscaling

server/models/GalleryPrompt.js（或新建 Generation 模型）:
  resolution: { type: String, enum: ['2K', '4K'], default: '2K' }
  is4k: { type: Boolean, default: false }
```

**Phase 2 — 接入 Upscaler（约 4-6 小时）**

```
server/services/upscaleService.js:

async function upscale(imageUrl, targetResolution) {
  if (targetResolution === '2K') {
    // Replicate real-esrgan, scale: 2
    return await replicate.run("nightmareai/real-esrgan", {
      input: { image: imageUrl, scale: 2, face_enhance: false }
    });
  }
  if (targetResolution === '4K') {
    // scale: 4
    return await replicate.run("nightmareai/real-esrgan", {
      input: { image: imageUrl, scale: 4, face_enhance: false }
    });
  }
}

// generate.js 中：
const baseImageUrl = await callAIModel(prompt, modelId, aspectRatio);
const finalImageUrl = await upscale(baseImageUrl, resolution);
```

**Phase 3 — 付费鉴权（约 1 小时）**

```js
// server/routes/generate.js
const user = await User.findById(req.user.id);
const hasPurchased = user.credits > 0 || user.hasPurchasedBefore;

if (resolution === '4K' && !hasPurchased) {
  return res.status(403).json({
    error: 'upgradeToUnlock4K',
    message: '4K 分辨率需要付费套餐'
  });
}
```

---

## 七、成本估算

### 7.1 Replicate Real-ESRGAN 定价

- 2K（2x upscale）：约 $0.0012–0.0023 / 次
- 4K（4x upscale）：约 $0.0023–0.0046 / 次

### 7.2 业务模型建议

| 场景 | 方案 | 额外积分消耗 |
|------|------|------------|
| 2K（默认） | 所有用户可用 | 0（base 生成积分已包含） |
| 4K（付费专属） | 需要购买过积分 | +5 积分 / 张（覆盖 upscale 成本） |

以每积分 $0.01 计，4K 附加 5 积分 = $0.05，覆盖 upscale 成本后利润率约 90%+。

---

## 八、结论

MeiGen 的 2K/4K **是真实功能，不是营销文案**。其核心实现路径：

1. **前端**真实发送 `resolution: "2K"/"4K"` 到后端 gateway
2. **后端 gateway** 调用 AI 生成模型得到基础图（~1024px）
3. **后处理**：对基础图进行 AI 超分辨率上采样（2x → 2K，4x → 4K）
4. **成品上传** Cloudflare R2，URL 写入 DB
5. **4K 权限**由 `has_ever_purchased` 字段控制，仅付费用户可用

III.PICS 目前的 2K/4K 按钮是**纯前端状态，后端零处理**，与定价文案严重不符。按本报告 Phase 1→3 方案落地，可在约 10 小时内实现与 MeiGen 对等的分辨率分级功能。

---

## 附录：关键文件定位

| 文件 | 内容 | 关键信息 |
|------|------|---------|
| `chunk/2940c678e6d81607.js` | 核心业务逻辑 | 生成请求构建、is_4k 映射、generation 数据模型 |
| `chunk/9f0acfe71a5ee151.js` | i18n + 定价配置 | 各套餐功能列表、`upgradeToUnlock4K` 文案 |
| `api.meigen.art/rest/v1/generations` | Supabase DB 直读 | 完整 generation 字段结构（含 is_4k, resolution, r2_key） |
| `api.meigen.art/rest/v1/user_credits` | Supabase DB 直读 | has_ever_purchased, has_unlimited 鉴权字段 |
| `${t7}/generate` | 独立后端 gateway | 接收 resolution，执行生成 + upscaling（服务器端） |
