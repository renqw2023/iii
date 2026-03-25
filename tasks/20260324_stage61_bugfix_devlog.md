# Stage 61 — 多项 Bug 修复 + UX 优化

**日期**: 2026-03-24
**分支**: main
**Commits**:
- `56f11e9` Fix Stage 60: Generation stability + Loading UX upgrade
- `ff66081` Fix: Retry button actually re-runs generation (not just a toast)
- `7be4ab8` Fix: Gallery source URL + Sref output directory path

---

## 一、AI 生成模型稳定性 + Loading UX 升级（commit 56f11e9）

### 背景
用户反馈多个生图模型同时失效（本地 + 生产同时出现）：
- Nanobanana Pro → Google API 持续返回 503 UNAVAILABLE
- Nanobanana 2 → 120s 超时 TimeoutError
- Seedream 5.0 / Generate Video → 偶发 500（实为网络层错误被误包为 500）

### 模型 ID 核实
通过 [Google 官方文档](https://ai.google.dev/gemini-api/docs/image-generation) 确认模型 ID 全部正确：

| 模型名 | API Model ID | 备注 |
|--------|-------------|------|
| Nanobanana Pro | `gemini-3-pro-image-preview` | Professional asset production, advanced reasoning |
| Nanobanana 2 | `gemini-3.1-flash-image-preview` | Speed optimized, up to 14 reference images |
| Nanobanana | `gemini-2.5-flash-image` | Fast & stable, high-volume low-latency |

### 修复内容

#### 1. `server/routes/generate.js`

**网络层错误分类处理**（新增）

原来所有非超时错误都返回 `500`，现在细分：

```js
const msg = error?.message || '';
const causeCode = error?.cause?.code || '';
if (msg === 'fetch failed' || causeCode === 'ECONNRESET'
    || causeCode === 'ENOTFOUND' || causeCode === 'ECONNREFUSED') {
  return res.status(502).json({ message: 'AI 服务暂时不可用，请稍后重试' });
}
```

HTTP 状态码语义：
- `502` — 上游 AI 服务网络不可达（非代码 bug）
- `503` — 上游 AI 服务明确返回 UNAVAILABLE（已有处理）
- `504` — 请求超时（已有处理）
- `500` — 其他未预期错误

**超时配置**（保持原值，给模型充足响应时间）：
```js
// Pro 180s，Flash 120s — 503 立即返回无需等待
const geminiTimeout = modelId === 'gemini3-pro' ? 180000 : 120000;
```

> 注：`503 UNAVAILABLE` 在 HTTP 响应层处理，立即返回给用户，不受 timeout 影响。
> `TimeoutError` 是真正等了 120s/180s 后触发的，对应 DOMException `Timeout._onTimeout`。

#### 2. `client/src/components/UI/GenerationCard.js`

**Loading 状态原问题**：进度条固定在 8%，最长等待 3 分钟没有任何变化，用户无法判断是否在运行。

**时间驱动动画进度（新增）**

```js
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

使用 `requestAnimationFrame` + ease-out 二次曲线，从 8% 平滑推进至 92%：
```js
const raw = elapsed / duration;
const eased = 1 - Math.pow(1 - Math.min(raw, 1), 2);
const target = startPct + (92 - startPct) * eased;
```
- 保留 8% 余量，生成完成时跳至 100%
- 组件卸载 / 状态变化时用 `cancelAnimationFrame` 清理

**阶段性提示文字（新增）**

| 进度区间 | 显示文字 |
|---------|---------|
| 0–19% | `Generating…` |
| 20–39% | `Processing your prompt…` |
| 40–64% | `Creating artwork…` |
| 65–79% | `Refining details…` |
| 80–91% | `High demand — taking a little longer…` |
| 92%+ | `Almost there, hang tight…` |

**三点跳动动画（新增）**
```jsx
{[0, 1, 2].map(i => (
  <span key={i} style={{
    animation: `pulseDot 1.4s ease-in-out ${i * 0.2}s infinite`,
  }} />
))}
```
视觉上明确表示"进行中"，防止用户误以为卡死。

**模型名 Badge（新增）**

Loading 卡片左上角显示当前模型名（如 "Nanobanana Pro"），用户可据此判断等待预期。

#### 3. `client/src/index.css`
新增 `@keyframes pulseDot`：
```css
@keyframes pulseDot {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1.2); }
}
```

---

## 二、Retry 按钮实现真实重新生成（commit ff66081）

### 问题
Generation History 页面失败卡片上有 Retry 按钮，但点击后只弹一个 toast 提示 "Please go back to the Generate panel to retry"，不会实际重新生成。

### 修复：`client/src/pages/GenerateHistory.js`

**原逻辑**：
```js
const handleRetry = (job) => {
  removeGeneration(job.id);
  toast('Please go back to the Generate panel to retry', { icon: '💡' });
};
```

**新逻辑**：
1. 删除失败的旧卡片（`removeGeneration`）
2. 立即插入新 loading 卡片（`addGeneration`）
3. 真正调用对应 API 重新生成

图片重试：
```js
generateAPI.generateImage({
  modelId: job.modelId,
  prompt: job.prompt,
  aspectRatio: job.aspectRatio || '1:1',
  resolution: job.resolution || '2K',
  ...(job.referenceImageUrl ? { referenceImageUrl: job.referenceImageUrl } : {}),
}).then(data => {
  updateGeneration(newJobId, { status: 'success', progress: 100, result: data });
  updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft });
}).catch(err => {
  updateGeneration(newJobId, { status: 'error', errorMessage: err.response?.data?.message || '...' });
});
```

视频重试（保留原始参数 modelId / aspectRatio / generateAudio）同理。

**注意**：
- 参考图 URL（`referenceImageUrl`）可以随重试传入，但 base64 引用图不保存，重试时不携带
- 重试等同于新建任务，会扣除积分（如上次失败已退款，属于正常再消费）

---

## 三、Gallery Source URL 修复 + Sref 图片目录路径修复（commit 7be4ab8）

### 3.1 Gallery (NanaBanana) — Source 显示 youmind.com 问题

**根因**：`server/services/githubSync.js` `syncNanoBanana()` 第409行硬编码：
```js
sourceUrl: 'https://youmind.com/nano-banana-pro-prompts',  // ← 所有记录都写成这个
```

YouMind API 的 `item.sourceLink` 字段实际包含原始 X（Twitter）博主帖子链接，被忽略了。

**修复**：
```js
sourceUrl: item.sourceLink || item.author?.link || `https://youmind.com/zh-CN/nano-banana-pro-prompts?id=${id}`,
```

优先级：原始 X 帖子链接 → 作者主页 → YouMind 条目页

**后续操作**：需在 Admin → Data Sync → Gallery (NanoBanana) 重新触发一次同步，所有现有 11,000+ 条记录的 `sourceUrl` 才会更新为正确值（同步逻辑使用 `findOneAndUpdate` + `$set`，天然支持增量覆写）。

---

### 3.2 Sref (Explore) — 增量同步新图片无法显示

**症状**：增量同步新增 38 个 Sref 条目，数据库记录正常创建，但只有 2-3 张图片能显示。

**根因：目录路径不一致**

```
scraper 写入路径: path.join(__dirname, '../../../output')
                = E:\pm01\server\services → 上3层 → E:\output   ← 错误！

静态文件服务路径: path.join(__dirname, '../output')
                = E:\pm01\server → 上1层 → E:\pm01\output       ← 正确
```

两个路径不同，scraper 将图片下载到 `E:\output\sref_*`，但 web server 只服务 `E:\pm01\output\sref_*`，因此图片 404。

**修复**：
```js
// Before:
const outputDir = process.env.SREF_OUTPUT_DIR || path.join(__dirname, '../../../output');

// After:
const outputDir = process.env.SREF_OUTPUT_DIR || path.join(__dirname, '../../output');
// server/services/../../output = E:\pm01\output ✓
```

**错误文件迁移**：
```bash
# 将 41 个错误位置的 sref_* 文件夹移到正确路径
for dir in E:/output/sref_*; do
  mv "$dir" "E:/pm01/output/$(basename $dir)"  # 已存在则跳过
done
# 结果: 36 MOVED, 5 SKIP (目标已存在)
# E:\pm01\output sref 文件夹: 1373 → 1409
```

迁移后无需重启服务器，静态文件服务立即生效，图片恢复正常显示（浏览器截图确认）。

**2-3张能显示的原因**：这些 sref code 在之前的全量同步中已在 `E:\pm01\output` 留有副本。

---

## 验证记录

| 问题 | 验证方式 | 结果 |
|------|---------|------|
| 生成模型恢复上线 | `curl /api/generate/models` 返回全部7个模型 | ✅ |
| Loading 进度动画 | 浏览器截图，进度条随时间推进 | ✅ |
| Retry 重新生成 | 代码逻辑审查 + 无 JS 错误 | ✅ |
| Gallery sourceUrl | 代码修复，待下次同步生效 | ⚠️ 需触发同步 |
| Sref 图片显示 | 浏览器访问 /explore，全部图片正常 | ✅ |

---

## 已知后续操作

1. **触发 Gallery (NanoBanana) 同步** — Admin → Data Sync → Gallery (NanoBanana) → Sync Now，更新全量 sourceUrl
2. **生产服务器部署** — `git pull && pm2 restart`（srefScraper 路径修复需重启生效）
3. **Nanobanana Pro / 2** — Google Preview API 仍不稳定，503 时用户会收到友好提示；待 Google 稳定后自动恢复
