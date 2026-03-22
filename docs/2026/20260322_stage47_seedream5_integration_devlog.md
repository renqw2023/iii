# Stage 47：Seedream 5.0 图像生成模型接入

**日期**：2026-03-22
**分支**：main
**作者**：开发团队
**涉及文件**：
- `server/routes/generate.js`
- `server/.env`（新增 `ARK_API_KEY`）

---

## 一、目标

在 AI Generation 面板的 Generation Model 列表中，新增字节跳动豆包旗舰图像模型 **Doubao Seedream 5.0**（官方 API 模型 ID：`doubao-seedream-5-0-260128`），并完成：

1. 文生图（Text-to-Image）接入
2. 图生图（Image-to-Image）参考图传递
3. 积分扣除、生成记录持久化与已有流程的完整串联

---

## 二、背景与排查过程

### 2.1 端口 5500 EACCES 错误

服务器启动失败，报：

```
Error: listen EACCES: permission denied 0.0.0.0:5500
```

**根因**：Windows Hyper-V 会随机保留一批动态端口（本机保留范围包含 5421–5520），导致端口 5500 被系统占用，Node.js 无法绑定。

**解决方案**（不改端口号）：

```powershell
# 管理员 PowerShell
net stop winnat
netsh int ipv4 set dynamicport tcp start=49152 num=16384
net start winnat
```

执行后端口 5500 释放，服务器正常启动。

### 2.2 网络连通性问题（ConnectTimeoutError）

初次对接时，使用 npm 安装的 `undici` 包发起请求：

```
TypeError: fetch failed → ConnectTimeoutError (timeout: 10000ms)
```

**排查过程**：

- Seedance 视频生成（同为火山引擎服务）一直可用 → 查看其实现，发现使用的是 Node.js 全局 `fetch`（非 undici npm 包）
- 结论：Node.js 18+ 内置全局 `fetch` 能正常访问 `ark.cn-beijing.volces.com`，而 npm 安装的 `undici` 包网络栈在当前环境下无法连通

**修复**：Seedream handler 全部改用 Node.js 全局 `fetch`，移除 `undici` 依赖。

### 2.3 参考图传递格式问题

**第一次尝试**：服务端下载 CDN 图片 → 转 base64 → 以 `data:image/jpeg;base64,...` 格式传给 Volcengine API

**错误响应**：
```json
{
  "error": {
    "code": "InvalidParameter",
    "message": "The parameter `image` specified in the request is not valid: invalid url specified"
  }
}
```

**根因分析**：Volcengine Seedream API 的 `image` 字段要求 `https://` URL，不接受 `data:` URI 格式（尽管部分第三方文档声称支持 base64，实际 API 调用拒绝）。

**最终方案**：直接将参考图的原始 URL 传递给 `image` 字段，由 Volcengine 服务端自行抓取，绕过格式问题。

---

## 三、实现细节

### 3.1 环境变量

在 `server/.env` 中新增：

```env
# 火山引擎方舟 API Key（用于 Doubao Seedream 5.0）
# 获取地址：https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey
ARK_API_KEY=<your_key_here>
```

### 3.2 模型注册（MODELS 数组）

`server/routes/generate.js` 的 `MODELS` 数组中新增条目：

```js
{
  id: 'seedream-5-0',
  name: 'Seedream 5.0',
  provider: 'Doubao',
  apiModel: 'doubao-seedream-5-0-260128',
  creditCost: 8,
  available: () => !!process.env.ARK_API_KEY,
  description: 'Seedream 5.0 · 字节豆包旗舰图像模型',
  badge: 'New',
},
```

- `available()` 守卫：未配置 `ARK_API_KEY` 时模型不出现在列表中，API 调用返回 503
- `creditCost: 8`：与同档位 Imagen 4 Pro / GPT Image 保持一致

### 3.3 尺寸映射

Seedream 5.0 的 `size` 参数要求精确像素值，按 `aspectRatio` 映射（官方推荐值）：

| aspectRatio | size |
|-------------|------|
| `1:1`  | `2048x2048` |
| `4:3`  | `2304x1728` |
| `3:4`  | `1728x2304` |
| `16:9` | `2848x1600` |
| `9:16` | `1600x2848` |

不匹配时默认 `2048x2048`。

### 3.4 API 调用

```js
} else if (modelId === 'seedream-5-0') {
  const sizeMap = { ... };
  const seedreamSize = sizeMap[aspectRatio] || '2048x2048';

  const seedreamRes = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(120000),   // 120s 超时（大尺寸生成耗时较长）
    body: JSON.stringify({
      model: 'doubao-seedream-5-0-260128',
      prompt,
      size: seedreamSize,
      output_format: 'png',
      watermark: false,
      sequential_image_generation: 'disabled',
      // 图生图：直接传递 URL，Volcengine 服务端抓取图片
      ...(referenceImageUrl ? { image: referenceImageUrl } : {}),
    }),
  });

  // 响应包含临时 URL（24h 有效），立即下载保存到本地
  const imgUrl = seedreamData.data?.[0]?.url;
  const imgFetch = await fetch(imgUrl, { signal: AbortSignal.timeout(60000) });
  fs.writeFileSync(filePath, Buffer.from(await imgFetch.arrayBuffer()));
}
```

**关键设计决策**：
- 使用全局 `fetch`（非 npm 包），与 `videoService.js` 中 Seedance 的做法一致
- 超时 120s（其他模型普遍 60-90s），留余量给大尺寸生成
- 生成结果 URL 仅 24 小时有效，立即下载存本地磁盘
- 参考图仅支持 URL 模式（图库拖拽来源）；本地上传的 base64 图片暂不支持作为参考图

### 3.5 参考图传递设计

| 参考图来源 | 前端传参 | Seedream 处理 |
|-----------|---------|--------------|
| 图库拖拽（CDN URL）| `referenceImageUrl` | 直接传 `image: url` |
| 本地文件上传 | `referenceImageData` (base64) | 暂不支持（跳过参考图）|

其他模型（Gemini 系列）参考图走 base64 `inlineData` 路径，**本次未修改**。

### 3.6 其他修改

- 参考图 CDN 下载超时：从 10s → 30s（避免海外节点到 CDN 的偶发超时）

---

## 四、API 端点说明

| 项目 | 值 |
|------|---|
| 生图端点 | `POST https://ark.cn-beijing.volces.com/api/v3/images/generations` |
| 认证方式 | `Authorization: Bearer <ARK_API_KEY>` |
| 官方模型 ID | `doubao-seedream-5-0-260128` |
| `size` 格式 | `{width}x{height}` 精确像素，如 `2048x2048` |
| 参考图字段 | `image`（字符串 URL） |
| 响应结构 | `{ data: [{ url: "https://..." }] }` |
| 结果 URL 有效期 | 约 24 小时 |

---

## 五、积分定价

| 模型 | 积分/次 | 对比 |
|------|---------|------|
| Seedream 5.0 | 8 | = Imagen 4 Pro |
| Nanobanana 2 (Gemini Flash) | 6 | |
| Nanobanana (Gemini 2.5 Flash) | 4 | |

4K 超分（Replicate Real-ESRGAN）额外 +5 积分，同其他模型规则一致。

---

## 六、已知限制与后续优化

| 项 | 状态 | 说明 |
|----|------|------|
| 本地上传参考图 | ⚠️ 暂不支持 | base64 被 API 拒绝；可考虑先上传至自有 OSS/对象存储再传 URL |
| 图生图只支持单张参考图 | ✅ 当前设计 | API 支持多图（`image_urls[]`），可后续扩展 |
| 端口 5500 Hyper-V 保留 | ✅ 已解决 | 执行 `net stop/start winnat` 恢复；重启机器后可能需要重新执行 |
| 生产环境部署 | ℹ️ 待办 | 需在生产服务器的 `.env` 中配置 `ARK_API_KEY` |

---

## 七、测试验证

1. **文生图**：在 Generation 面板选择 Seedream 5.0，输入 prompt，正常生成并展示图片
2. **图生图**：从图库拖拽一张图到参考图区域，配合 prompt 生成，API 接收 URL 正常
3. **积分扣除**：生成后 freeCredits/credits 按 8 积分正确扣减
4. **生成记录**：`/generate-history` 页面正常展示 Seedream 5.0 生成条目

---

## 八、文件变更汇总

```
server/routes/generate.js     ← 新增 MODELS 条目 + Seedream handler（约 +64 行）
server/.env                   ← 新增 ARK_API_KEY（本地，不入 git）
```

`undici` npm 包在排查阶段安装后发现无效，已通过 `npm uninstall undici` 移除。
