# Stage 60 — Generation Panel 稳定性 + Loading UX 升级

**日期**: 2026-03-24
**分支**: main
**涉及文件**:
- `server/routes/generate.js`
- `client/src/components/UI/GenerationCard.js`
- `client/src/index.css`

---

## 背景 / 问题

用户反馈 AI Generation 面板多个模型同时失效，本地与生产环境均出现。经排查：

| 模型 | 现象 | 根因 |
|------|------|------|
| Nanobanana Pro (`gemini-3-pro-image-preview`) | 持续 503 UNAVAILABLE | Google Preview API 高峰期服务不可用 |
| Nanobanana 2 (`gemini-3.1-flash-image-preview`) | 120s 后 TimeoutError | Google Preview API 响应极慢 / 超时 |
| Seedream 5.0 / Generate Video | 偶发 500 | 网络层错误（fetch failed / ECONNRESET）被当 500 返回 |

---

## 修改内容

### 1. `server/routes/generate.js`

#### 1.1 模型状态管理
两个 Gemini 3.x 模型经排查 API ID 正确（已通过 Google 官方文档核实）：
- `gemini-3-pro-image-preview` — Nanobanana Pro（Pro 级，advanced reasoning）
- `gemini-3.1-flash-image-preview` — Nanobanana 2（Flash 级，optimized for speed）

因 Preview API 不稳定曾临时下线，本次**恢复上线**：
```js
// Nanobanana Pro
available: () => !!process.env.GEMINI_API_KEY,

// Nanobanana 2
available: () => !!process.env.GEMINI_API_KEY,
```

#### 1.2 超时配置
保持原值，给模型足够时间响应：
```js
// Pro 模型 180s，Flash 模型 120s
const geminiTimeout = modelId === 'gemini3-pro' ? 180000 : 120000;
```

> 注：503 由 Gemini 错误处理立即返回（无需等待超时），TimeoutError 由 catch 捕获返回 504。
> 用户侧体验已由 Loading UI 优化补偿（见下）。

#### 1.3 网络层错误处理（新增）
原来网络异常（fetch 连接失败）被包在 500 返回，现在分类处理：

```js
} catch (error) {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    return res.status(504).json({ message: '生成超时...' });
  }
  // 网络层错误（DNS 失败、连接被拒、TCP 重置等）
  const msg = error?.message || '';
  const causeCode = error?.cause?.code || '';
  if (msg === 'fetch failed' || causeCode === 'ECONNRESET'
      || causeCode === 'ENOTFOUND' || causeCode === 'ECONNREFUSED') {
    return res.status(502).json({ message: 'AI 服务暂时不可用，请稍后重试' });
  }
  res.status(500).json({ message: '生成失败，请稍后重试' });
}
```

HTTP 状态码语义：
- `502` — 上游 AI 服务网络不可达（非代码 bug）
- `503` — 上游 AI 服务明确返回 UNAVAILABLE
- `504` — 请求超时
- `500` — 其他未预期错误

---

### 2. `client/src/components/UI/GenerationCard.js`

#### 2.1 问题
Loading 状态下进度条固定在 8%，全程不动（最长等待 3 分钟），用户无法判断是否在工作。

#### 2.2 时间驱动动画进度（新增）

```js
// 每个模型的预期生成时长（ms）
const MODEL_DURATION = {
  'gemini3-pro':     180000,
  'gemini3-flash':   120000,
  'gemini25-flash':   60000,
  'imagen4-pro':      60000,
  'imagen4-fast':     40000,
  'seedream-5-0':     90000,
  'seedance-1-5-pro': 300000,
};
```

使用 `requestAnimationFrame` 驱动 ease-out 曲线，从 8% 平滑推进至 92%（保留 8% 余量给最终完成的 100% 跳跃）：

```js
const raw = elapsed / duration;
const eased = 1 - Math.pow(1 - Math.min(raw, 1), 2);  // ease-out quadratic
const target = startPct + (92 - startPct) * eased;
setAnimPct(Math.min(Math.round(target), 92));
```

#### 2.3 阶段性提示文字（新增）

| 进度区间 | 显示文字 |
|---------|---------|
| 0–19% | `Generating…` |
| 20–39% | `Processing your prompt…` |
| 40–64% | `Creating artwork…` |
| 65–79% | `Refining details…` |
| 80–91% | `High demand — taking a little longer…` |
| 92%+ | `Almost there, hang tight…` |

#### 2.4 三点跳动动画（新增）
视觉上明确表示"进行中"，防止用户误以为卡死：
```jsx
{[0, 1, 2].map(i => (
  <span key={i} style={{
    width: 5, height: 5, borderRadius: '50%',
    backgroundColor: '#9ca3af',
    animation: `pulseDot 1.4s ease-in-out ${i * 0.2}s infinite`,
  }} />
))}
```

#### 2.5 模型名 Badge（新增）
Loading 卡片左上角显示当前使用的模型名（如 "Nanobanana Pro"），方便用户判断等待预期。

---

### 3. `client/src/index.css`

新增 `@keyframes pulseDot`：
```css
@keyframes pulseDot {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1.2); }
}
```

---

## API 模型 ID 核实记录

通过 [Google 官方文档](https://ai.google.dev/gemini-api/docs/image-generation) 确认：

| 代号 | 正式模型 ID | 特性 |
|------|------------|------|
| Nanobanana Pro | `gemini-3-pro-image-preview` | Professional asset production, advanced reasoning |
| Nanobanana 2 | `gemini-3.1-flash-image-preview` | Speed optimized, high-volume, up to 14 reference images |
| Nanobanana | `gemini-2.5-flash-image` | Fast & stable, high-volume, low-latency |

所有模型均支持：text-to-image、image editing、多参考图、512/1K/2K/4K 分辨率、多种比例。

---

## 验证

- [x] `GET /api/generate/models` 返回全部模型（含 gemini3-pro, gemini3-flash）
- [x] 503 错误立即返回用户友好提示（无需等待超时）
- [x] TimeoutError → 504 正确捕获
- [x] 网络层错误 → 502 返回（不再显示通用 500）
- [x] Loading 卡片进度条随时间平滑推进
- [x] 阶段文字、跳动小点、模型名 badge 渲染正常
- [x] 浏览器无新增 JS 错误

---

## 已知限制

- Google Gemini 3.x Preview 模型目前仍处于高峰期不稳定状态，可能出现 503；用户侧已有友好提示，可降级使用 Imagen 4 / Nanobanana。
- 进度条为估算动画，实际完成时间因 Google 服务器负载而异。
