# Stage 69 — 分享卡片系统（Gallery & Sref Share Card）

**日期**: 2026-03-26
**分支**: main
**涉及文件**: 6 个新建 / 4 个修改

---

## 需求背景

用户希望在 Gallery 详情 Modal 和 Sref 详情 Modal 中加入"分享"按钮，点击后弹出一张精美的图片卡片，用户可下载后分享到 Instagram、小红书、Pinterest 等平台。

设计原则：**图片即内容**——不展示冗长 prompt，Gallery 以图为主角，Sref 突出 `--sref XXXXXXX` code。

---

## 技术选型

| 依赖 | 用途 |
|------|------|
| `html2canvas@1.4.1` | 将隐藏 DOM 模板截图为 Canvas，导出 PNG |
| `qrcode.react` | 生成 SVG 二维码，与 html2canvas 兼容 |

---

## 卡片设计规格

### Gallery 卡片（800×1000px，4:5 比例）

```
┌──────────────────────┐
│                      │
│   图片区域（88%高度）  │  ← object-fit: cover
│   previewImage 或    │
│   images[0]          │
│                      │
├──── 渐变遮罩叠加 ─────┤
│ ✦ III.PICS     [QR] │  ← 底部品牌条 96px，#0a0a0a
└──────────────────────┘
```

- QR 内容：`https://iii.pics/gallery/{prompt._id}`
- 右侧文字：`Scan to view original` / `iii.pics`

### Sref 卡片（800×1000px，4:5 比例）

```
┌──────────────────────┐
│  [图1]  │  [图2]    │
│─────────┼──────────  │  ← 2×2 网格，取 imageUrls[0–3]
│  [图3]  │  [图4]    │     占 520px（52%高度）
├──────────────────────┤
│ Midjourney Style Ref │  ← 标签，12px uppercase
│ --sref  6437453132   │  ← 主角大字 40px bold monospace
│ title（若有）        │
│ #3D  #Pop  #Gradient │  ← tags，最多4个
│ ✦ III.PICS     [QR] │  ← 品牌 + 二维码
└──────────────────────┘
```

- QR 内容：`https://iii.pics/explore/{sref._id}`
- 右侧文字：`Scan for details` / `Copy sref code`

---

## 新建文件

### `client/src/components/ShareCard/GalleryShareCard.js`
- `React.forwardRef` 包裹，接受 `prompt` prop
- 固定尺寸 800×1000，`position:absolute; left:-9999px` 离屏渲染
- 图片通过 `/api/tools/proxy-image?url=...` 代理（解决 CORS，见下方问题记录）
- 底部 96px 品牌条：logo + `QRCodeSVG`

### `client/src/components/ShareCard/SrefShareCard.js`
- 2×2 CSS Grid，`gridTemplateRows` 根据图片数量动态切换（≤2 张单行，>2 张双行）
- `--sref {code}` 使用 SF Mono/Fira Code monospace，40px，fontWeight 800
- 渐变遮罩从网格底部过渡到信息区

### `client/src/components/ShareCard/ShareCardModal.js`
- `createPortal` 挂到 `document.body`，避免 z-index 冲突
- `framer-motion` scale 动画（0.94→1）
- **定位方案**：外层 `position:fixed; inset:0; display:flex; align/justify:center; pointerEvents:none`，内层 `pointerEvents:auto` — 避免 framer-motion scale 与 `transform:translate(-50%,-50%)` 冲突导致弹窗被裁切
- `setTimeout(120ms)` 后才调用 html2canvas，给 DOM 一帧渲染时间
- `scale:2` 输出 1600×2000px 高清图

---

## 修改文件

### `client/src/pages/Gallery/GalleryModal.js`
- `handleShare` 从 `navigator.share` 改为 `setShowShareCard(true)`
- 末尾加 `<ShareCardModal type="gallery" data={prompt} onClose={...} />`

### `client/src/pages/SrefModal.js`
- Footer 加 `Share2` 按钮（紧邻 Like 按钮）
- 同上集成 `<ShareCardModal type="sref" data={sref} onClose={...} />`

### `server/routes/tools.js`
- 新增 `GET /api/tools/proxy-image?url=...` 端点（见 CORS 修复）

---

## Stage 69b — 三项优化（同日）

用户反馈三点改进需求：

### 1. 全英文
将卡片模板和弹窗 UI 中的所有中文替换：

| 原文 | 替换为 |
|------|--------|
| 分享卡片 | Share Card |
| 正在生成卡片… | （改为骨架屏，见下） |
| 生成失败，请重试 | Generation failed — please try again |
| 下载图片（1600×2000px） | Download Image (1600×2000px) |
| 保存到相册后可直接分享... | Save and share to Instagram, Pinterest, or anywhere you like |
| 扫码查看原图 | Scan to view original |
| 扫码查看详情 | Scan for details |
| 复制 sref 代码 | Copy sref code |

### 2. 复制链接按钮
- 在 Download 按钮左侧新增图标按钮（52px 宽，`Link` icon）
- 点击后写入 `navigator.clipboard`，降级方案用 `execCommand('copy')`
- 成功后 `Link` icon → `Check` icon（紫色），2秒后复原
- 链接内容：`https://iii.pics/gallery/{id}` 或 `https://iii.pics/explore/{id}`

### 3. 精美骨架屏加载动画
替换原来的黑屏 + Spinner，改为与卡片结构完全对应的骨架屏：

**Gallery 骨架**：
- 88% 高度的深色图片区域，叠加 `shimmer-sweep` 扫光动画
- 10% 底部条：3个占位块（logo / 文字条 / QR方块）

**Sref 骨架**：
- 2×2 暗色格子，每格独立 shimmer，`animationDelay` 错开 0.15s
- 下方文字区：3行宽度各异的占位条 + 3个小 tag 占位块

**Shimmer 动画**：
```css
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.shimmer-sweep {
  position: absolute; inset: 0;
  background: linear-gradient(90deg,
    transparent 0%, rgba(255,255,255,0.045) 40%,
    rgba(255,255,255,0.09) 50%,
    rgba(255,255,255,0.045) 60%, transparent 100%);
  animation: shimmer 1.8s ease-in-out infinite;
}
```

---

## 问题记录

### Bug 1 — framer-motion scale 与 transform 定位冲突
**症状**：弹窗底部被裁切（`bottom: 1222px > vh: 1014px`）
**根因**：framer-motion 内部使用 `transform` 实现 scale，与 CSS `transform: translate(-50%, -50%)` 相互覆盖，导致定位计算错误
**修复**：改用 `position:fixed; inset:0; display:flex; alignItems:center; justifyContent:center` 的包裹 div 居中，完全不依赖 transform

### Bug 2 — Gallery 分享卡片图片区域全黑
**症状**：生成的卡片中图片区域为纯黑，底部品牌条正常
**根因**：Gallery 图片 URL 来自外部 CDN（Replicate 等），CDN 不返回 CORS 响应头，html2canvas 无法读取跨域图片像素，即使设置了 `useCORS: true` + `allowTaint: true`
**修复**：
1. 在 `server/routes/tools.js` 新增 `GET /api/tools/proxy-image` 端点
   - 用 Node.js `fetch` 服务端拉取外部图片并流式返回
   - `Cache-Control: public, max-age=86400`（24h 缓存）
   - SSRF 防护：拦截 `localhost`、`127.x`、`10.x`、`192.168.x`、`172.16-31.x`
   - Content-Type 校验：非 `image/*` 拒绝返回
   - 超时：10s `AbortSignal.timeout`
2. `GalleryShareCard` 将 `imgSrc` 改为 `/api/tools/proxy-image?url=<encoded>`
3. 去掉 `<img crossOrigin="anonymous">`（现在是同源请求，不需要）

---

## 验证结果

- Sref 分享卡片：2×2 网格正常（本例只有2张图，显示为单行），`--sref 6437453132` 大字清晰，tags 正确
- Gallery 分享卡片：修复前图片区全黑，修复后通过代理正常渲染（待下次测试确认）
- 复制链接：可用
- 骨架屏：完整匹配卡片结构

---

## 文件变更汇总

| 文件 | 操作 |
|------|------|
| `client/src/components/ShareCard/GalleryShareCard.js` | 新建 → 修改（CORS 代理 + 英文） |
| `client/src/components/ShareCard/SrefShareCard.js` | 新建 → 修改（英文） |
| `client/src/components/ShareCard/ShareCardModal.js` | 新建 → 修改（英文 + 复制链接 + 骨架屏） |
| `client/src/pages/Gallery/GalleryModal.js` | 修改（集成 ShareCardModal） |
| `client/src/pages/SrefModal.js` | 修改（Share 按钮 + 集成 ShareCardModal） |
| `server/routes/tools.js` | 修改（新增 proxy-image 端点） |
