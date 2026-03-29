# Video Feed Feature Pack — 开发日志

**日期**: 2026-03-29
**阶段**: TikTok Video Feed 功能增强
**Commit**: e59d20b（基础版）→ 本次增量

---

## 背景

上一版完成了基础 TikTok 风格视频流，本次需增加 4 个交互功能：

| # | 功能 | 入口 | 结果 |
|---|------|------|------|
| 1 | 点击头像 → 作者主页 | 右侧列顶部头像 | `/video?author=xxx` 作者筛选视频流 |
| 2 | 默认开启声音 | 组件初始化 | `muted=false`，autoplay 失败时优雅降级 |
| 3 | 点击标题 → 完整 Prompt | 底部标题文字 | 底部 Sheet 弹出，支持复制 |
| 4 | 点击旋转唱片 → 跳转生成页 | 右下角旋转唱片 | 带 prompt 跳转 `/generate-history`，GenerationContext 预填充 |

---

## 技术选型分析

### Feature 1 — 作者主页

**问题**: 后端 `/api/seedance` 不支持 `authorName` 过滤，只有 `search`（MongoDB 全文检索）。

**方案**:
- 不修改后端，直接用 `search=authorName` 实现近似过滤
- 前端 `VideoFeed.js` 读取 URL param `?author=xxx`，传 `search` 给 API
- 路由仍是 `/video`（加 query param），不新增路由
- `VideoFeed.js` 根据 `authorFilter` 切换 Header 标题显示："Videos by @xxx"

**注意**: `search` 是 MongoDB `$text` 全文检索，对 authorName 效果取决于字段是否建了文本索引。如果 authorName 没索引，退回到展示全部视频并加文字提示。

**入口**: `VideoFeedItem.js` 头像 `onClick` → `navigate('/video?author=xxx')`

---

### Feature 2 — 默认开启声音

**问题**: 浏览器 Autoplay Policy 要求视频必须静音才能自动播放（特别是 iOS Safari）。
**如果 `muted=false`，`video.play()` 会被 reject。**

**方案（两步降级）**:
```js
// 第一步：尝试带声音自动播放
video.muted = false;
video.play().catch(() => {
  // 第二步：失败时静音重试（保留 autoplay）
  video.muted = true;
  setMuted(true);
  video.play().catch(() => {});
});
```

初始 state: `useState(false)` — 目标带声音。
当被浏览器阻止时，自动 fallback 到 muted，体验顺滑。

---

### Feature 3 — 完整 Prompt Sheet

**实现**: 底部 slide-up Sheet（纯 CSS transition，无额外依赖）

```
promptSheetOpen: boolean state
点击标题 → setPromptSheetOpen(true)
Sheet: position:fixed; bottom:0; left:0; right:0
       transform: translateY(0/100%) transition 0.3s
内容: 完整 prompt 文本 + 复制按钮 + 关闭按钮
背景遮罩: rgba(0,0,0,0.6)
```

新建 `PromptSheet.js` 组件（独立，可复用）。

---

### Feature 4 — 旋转唱片跳转生成页

**问题**: `/video` 是独立路由（不套 Layout），DesktopDock（生成面板）不在此页面渲染。
跳转后需要回到有 DesktopDock 的 Layout 页面。

**分析**:
- `GenerationContext` 的 `setPrefill({ prompt, mediaType, modelId })` 会预填充生成面板
- 跳转到 `/generate-history` — 该页在 Layout 内，DesktopDock 可见（包含 Generate Video 按钮）
- 移动端 DesktopDock 在 `/generate-history` 右侧，但因 `marginRight: isMobile ? 16 : calc(320px+32px)` 调整，面板可能收起
- 解决：跳转时追加 `?tab=video` param，让 GenerateHistory 自动切换到 Video 生成模式（如已支持）；或展示 toast 引导

**最终方案（最稳可靠）**:
1. `setPrefill({ prompt, mediaType: 'video', modelId: 'seedance-1-5-pro' })`
2. `navigate('/generate-history')`
3. Toast: "✅ Prompt loaded — tap Generate Video to start"
4. `/generate-history` 页面会在 GenerationContext 预填充后，用户点 Generate Video 按钮即可触发

**用户感知（affordance）**:
- 唱片下方固定显示白色小标签 `"Use Prompt"` + ✨ 图标
- 唱片旋转边框加金色 glow 效果，视觉上区别于普通按钮
- 点击时短暂 scale-up 动画反馈

---

## 文件变更清单

```
client/src/pages/VideoFeed/
  ├── VideoFeed.js          ← 修改：读 ?author param，过滤 API，切换 header
  ├── VideoFeedItem.js      ← 修改：Feature 1/2/3/4 全部加入
  └── PromptSheet.js        ← 新建：全屏 prompt 详情底部 Sheet
```

**不变**: `RotatingDisc.js`、`MobileDock.js`、`App.js`、所有服务端代码

---

## 测试 Checklist

- [ ] 头像点击 → URL 变为 `/video?author=xxx`，header 显示 "Videos by @xxx"
- [ ] 返回键退回全量视频流
- [ ] 第一个视频有声音播放（非静音）
- [ ] 无声音场景（浏览器阻止）自动降级为静音，不崩溃
- [ ] 点击视频标题 → PromptSheet 滑出
- [ ] Sheet 内可复制完整 prompt
- [ ] Sheet ESC / 点遮罩关闭
- [ ] 旋转唱片有 "Use Prompt" 标签
- [ ] 点击唱片 → toast + 跳转 `/generate-history`，生成面板提示词预填充
- [ ] 桌面端访问 `/video` → 仍重定向 `/seedance`
- [ ] 控制台无报错
