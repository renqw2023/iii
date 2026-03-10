# 阶段29 — 多模型文生图功能 开发日志

**日期**: 2026-03-09
**分支**: main
**开发者**: Claude Sonnet 4.6

---

## 目标

在 III.PICS 中实现多模型 AI 文生图功能，对标 MeiGen.ai，集成到现有 Generate 面板（Img2PromptPanel）的第二 Tab，同时修复 Gallery 卡片拖拽无法填入 Prompt 的问题。

---

## 架构决策

### 1. 不新建独立面板，整合进现有 Generate 面板

**原方案**：新建独立的 `ImageGenPanel`，在 Dock 添加 Wand2 按钮触发。
**实际方案**：文生图作为 Generate 面板的第二 Tab（`Generate Image`），与反推功能并列。

**理由**：
- 减少 Dock 图标数量，保持 UI 简洁
- 两个功能共享同一入口，用户习惯一致
- 整合后面板宽度不变（320px），布局更紧凑

### 2. 模型配置静态化

模型列表硬编码在 `server/routes/generate.js`，通过 `available()` 函数动态过滤未配置 API Key 的模型，前端拉取 `/api/generate/models` 展示当前可用模型。不使用数据库存储模型配置。

### 3. 图片存储方案

生成图片 base64 → 写入 `server/uploads/generated/` → 返回静态 URL（复用已有 `/uploads` 静态服务）。不使用云存储，保持简单。

### 4. 拖拽机制修正

**原问题**：Gallery 卡片拖拽数据只包含 `{ image: url }`，Generate Image Tab 读取 `parsed.prompt` 字段，永远为 undefined，无法填入 Prompt。

**修复方案**：在 `GalleryCard.js` 的 `handleDragStart` 中同时写入 `prompt` 字段：
```js
{ image: prompt.previewImage, prompt: prompt.prompt || '' }
```

两个 Tab 的拖拽行为分离：
- **Reverse Prompt Tab**：优先读 `parsed.image` → 调用反推 API
- **Generate Image Tab**：优先读 `parsed.prompt` → 直接填入（无 API，瞬时）；若只有 `parsed.image` 则提示用户切换到 Reverse 标签

---

## 文件改动清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `server/routes/generate.js` | **新建** | GET /models + POST /image，Gemini Flash + DALL·E 3 实现 |
| `server/index.js` | 修改 | 注册 `app.use('/api/generate', generateRoutes)` |
| `client/src/services/generateApi.js` | **新建** | `getModels()` + `generateImage()` axios 封装 |
| `client/src/components/UI/Img2PromptPanel.js` | **重写** | 拆为 ReverseTab + GenerateTab 两个子组件，主面板加 Tab 切换 |
| `client/src/components/Gallery/GalleryCard.js` | 修改 | dragStart 数据增加 `prompt` 字段 |
| `client/src/components/UI/DesktopDock.js` | 修改 | 移除 Wand2 按钮和 `onImageGenClick` prop（整合后不需要） |
| `client/src/components/Layout/Layout.js` | 修改 | 移除 `imageGenOpen` state 和 `ImageGenPanel` 相关代码 |
| `client/src/components/UI/ImageGenPanel.js` | 新建（未使用） | 独立面板实现，已被整合方案替代，保留备用 |

---

## server/routes/generate.js 设计

### 模型配置表
```js
const MODELS = [
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'Google',
    apiModel: 'gemini-2.0-flash-preview-image-generation',
    creditCost: 5,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Fast & creative',
  },
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    provider: 'OpenAI',
    apiModel: 'dall-e-3',
    creditCost: 8,
    available: () => !!process.env.OPENAI_API_KEY,
    description: 'High quality',
    badge: 'HD',
  },
];
```

### GET /api/generate/models
公开接口，无需登录。返回当前已配置 API Key 的模型列表（过滤掉 `available()` 为 false 的模型）。

### POST /api/generate/image
需要登录（JWT）。

**请求体**：
```json
{ "prompt": "...", "modelId": "gemini-flash", "aspectRatio": "1:1" }
```

**响应**：
```json
{ "imageUrl": "/uploads/generated/gen_xxx.png", "creditsLeft": 95, "modelName": "Gemini Flash" }
```

**积分扣除**：复用 `CreditTransaction` 模型，`reason: 'generate_image'`。

**Gemini 实现**：直接 fetch `generativelanguage.googleapis.com`，使用 `responseModalities: ['TEXT', 'IMAGE']`，解析 `inlineData.data`（base64）→ 写文件。

**DALL·E 3 实现**：调用 OpenAI `/v1/images/generations`，下载返回的临时 URL 图片 → 写文件。

---

## Img2PromptPanel 重构

### 组件结构
```
Img2PromptPanel (主面板)
├── Tab 切换行 [Reverse Prompt | Generate Image]
├── ReverseTab (Tab 1)
│   ├── Card1: 反推入口（拖图/点击）
│   ├── Card2: 上传参考图
│   ├── Card3: Prompt 文本框
│   ├── 宽高比 + 分辨率选择
│   ├── FAQ 折叠
│   ├── 模型展示（GPT-4o Vision）
│   └── Generate Prompt 按钮（⚡2）
└── GenerateTab (Tab 2)
    ├── 模型 Tabs（动态，从 /api/generate/models 获取）
    ├── Prompt 文本框（支持 Gallery 卡片拖入）
    ├── 宽高比选择 [1:1 | 4:3 | 3:4 | 16:9]
    ├── Generate Image 按钮（⚡N，根据选中模型）
    └── 结果区（图片 + 下载 + 复制链接）
```

### Tab 切换设计
```jsx
<div style={{ display: 'flex', gap: 4, padding: '4px', backgroundColor: MUTED, borderRadius: 10 }}>
  <button style={TAB_STYLE(tab === 'reverse')} onClick={() => setTab('reverse')}>
    Reverse Prompt
  </button>
  <button style={TAB_STYLE(tab === 'generate')} onClick={() => setTab('generate')}>
    Generate Image
  </button>
</div>
```

活跃 Tab：白色背景 + shadow，非活跃：透明背景灰色文字。

---

## 拖拽数据格式（修复后）

### GalleryCard 拖拽数据
```js
// 修复前
{ image: 'https://...' }

// 修复后
{ image: 'https://...', prompt: '一段英文 prompt...' }
```

### Img2PromptPanel 各区域的处理

| 拖入区域 | 读取字段 | 行为 |
|----------|----------|------|
| ReverseTab Card1/3 | `parsed.image` | 调用 img2prompt API（扣 2 积分） |
| GenerateTab Prompt 框 | `parsed.prompt` | 直接填入文本框（无 API，瞬时） |
| GenerateTab Prompt 框 | 仅 `parsed.image`（无 prompt） | toast 提示切换到 Reverse 标签 |

---

## 积分消耗规则

| 操作 | 模型 | 消耗 |
|------|------|------|
| 图生文（Reverse Prompt） | GPT-4o Vision | 2 积分 |
| 文生图 | Gemini Flash | 5 积分 |
| 文生图 | DALL·E 3 | 8 积分 |

---

## 环境变量配置（server/.env）

```bash
# 文生图 — 至少配置一个
GEMINI_API_KEY=你的_Google_AI_Studio_Key
OPENAI_API_KEY=你的_OpenAI_Key   # 同时用于 img2prompt

# Stripe（积分购买，独立功能）
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

配置后重启 server，`GET /api/generate/models` 返回可用模型，Generate Image Tab 自动出现模型 Tabs。

---

## 已知限制

1. **SrefCard 无 prompt 文本**：Sref 卡片只有 `srefCode`（如 `1234567890`），拖入 Generate Image Tab 会提示切换到 Reverse Tab 反推。未来可考虑从 Sref 详情中读取相关描述字段。

2. **生成图片本地存储**：图片存在 `server/uploads/generated/`，部署到 Vercel + 自有服务器模式时，生成图片只在服务器本地。考虑未来迁移到云存储（如 Cloudflare R2）。

3. **Gemini 模型名称**：当前使用 `gemini-2.0-flash-preview-image-generation`，该模型为预览版，稳定性可能有变化，关注 Google AI Studio 更新。

4. **DALL·E 3 临时 URL**：OpenAI 返回的图片 URL 有效期约 1 小时，代码已在返回前将其下载到本地，不受此影响。

---

## 排错记录

### HMR 残留错误：`ImageGenPanel is not defined`

**症状**：修改 Layout.js 移除 `ImageGenPanel` 后，浏览器报 ReferenceError。

**原因**：CRA HMR（Hot Module Replacement）在连续多次热更新后，中间补丁引用了中间状态的变量。这是 HMR 的已知边界情况。

**解决**：强制完整刷新（Ctrl+Shift+R 或 DevTools "Hard Reload"）重新加载完整 bundle，绕过 HMR 补丁链。

---

## 下一步

- 配置 `GEMINI_API_KEY` 并重启 server → 测试完整生成流程
- 生成的图片目前无管理界面，考虑在 Dashboard 增加"我的生成"历史记录
- 考虑 SrefCard 拖拽时附带更丰富的提示信息（如风格描述）
