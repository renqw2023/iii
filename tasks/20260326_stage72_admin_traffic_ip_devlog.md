# Stage 72 — Admin Traffic Top IPs 完整显示 + /generate-history 移动端适配

**日期**: 2026-03-26
**Commits**: `b7bf271` → `(当前)`
**分支**: main

---

## 一、/generate-history 移动端适配（Stage 71 补丁）

**Commit**: `b7bf271`

### 问题根因

`GenerateHistory.js` 第 277 行：

```js
marginRight: 'calc(320px + 32px)',
```

桌面端为右侧固定的 `Img2PromptPanel`（宽 320px）留出空间，合理。
移动端（390px 屏）无该面板，导致内容区可用宽度仅剩约 **38px**，页面完全不可用。

### 修复方案

新增 `isMobile` 判断（与 `App.js` 的 `MobileHomeRedirect` 保持同一模式）：

```js
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
```

**三处修改**：

| 位置 | 改前 | 改后 |
|------|------|------|
| 浮动白卡 `marginRight` | `'calc(320px + 32px)'` | `isMobile ? 16 : 'calc(320px + 32px)'` |
| Active generations `CardGrid` | `minCardWidth={...? 340 : 220}` | `minCardWidth={...? (isMobile ? 320 : 340) : (isMobile ? 160 : 220)}` |
| DB history `CardGrid` | 同上 | 同上 |

**移动端布局结果（390px 屏）**：
- 可用宽度：390 - 32 = **358px**
- 图片网格：`minmax(160px, 1fr)` → **2 列**
- 视频网格：`minmax(320px, 1fr)` → **1 列全宽**
- 桌面端：`isMobile = false`，所有值与改前完全一致

---

## 二、Admin Traffic — Top IPs 显示完整 IP（Stage 72）

### 问题根因

`server/middleware/visitTracker.js` 第 51 行：

```js
ip: ip.replace(/(\d+)$/, 'x'),  // mask last octet for privacy
```

出于隐私保护，记录时将 IP 最后一段替换为 `x`（如 `203.0.113.x`）。
结果在 Admin 面板的 Top IPs 列表中，最后一段永远显示为 `x`，无法识别具体来源，不满足安全审计需求（筛查异常 IP、DDoS 溯源等）。

### 修复方案

**文件**: `server/middleware/visitTracker.js`

```js
// Before
ip: ip.replace(/(\d+)$/, 'x'),  // mask last octet for privacy

// After
ip,
```

直接存储原始 IP，不做任何脱敏处理。Admin 面板为内部工具，完整 IP 对安全运营有实际价值。

### 注意事项

- **历史数据**：改动前写入 DB 的记录最后一段仍为 `x`（无法回填）。新记录将存储完整 IP。
- **前端无需修改**：`TrafficTab.js` 直接渲染 `{item.ip}`，显示什么取决于 DB 中存储的值。

---

## 三、涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `client/src/pages/GenerateHistory.js` | 修改 | 新增 `isMobile`，修复移动端 `marginRight` + `CardGrid minCardWidth` |
| `server/middleware/visitTracker.js` | 修改 | 移除 IP 末段脱敏，完整记录原始 IP |
