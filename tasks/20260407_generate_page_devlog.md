# 阶段79：/generate 独立 AI Generation 页面

**日期**: 2026-04-07  
**目标**: 将落地页 CTA 从 `/create`（提示词分享表单）重定向至真正的 AI 生成功能，新建 `/generate` 独立页面完整复刻 AI Generation 面板功能。

---

## 背景

三个落地页（Wan2.7 / Veo 3.1 / Seedance 2.0）的 CTA 按钮指向 `/create`（`CreatePost.js`，一个 Midjourney 提示词上传表单），与落地页宣传的 AI 生成能力完全不符。真正的 AI 生成功能在 `Img2PromptPanel.js`（固定定位侧滑面板），通过 `DesktopDock` 触发。

---

## 实现内容

### 新建文件
- `client/src/pages/GeneratePage.js` — 完整 AI 生成独立页面

### 修改文件
- `client/src/App.js` — 新增 `/generate` 路由（Layout 组，有侧边栏）
- `client/src/pages/Landing/Wan27Gallery.js` — 2 个 CTA 链接 `/create` → `/generate`
- `client/src/pages/Landing/Veo31Gallery.js` — 2 个 CTA 链接 `/create` → `/generate`
- `client/src/pages/Landing/Seedance20Guide.js` — 2 个 CTA 链接 `/create` → `/generate`

### 未修改
- `client/src/components/UI/Img2PromptPanel.js` — 源面板完全不变

---

## GeneratePage 功能设计

### 布局
两栏布局，白色毛玻璃卡片（对标 `generate-history` 风格）：
- **左栏（360px固定）**: 生成表单，可滚动
- **右栏（flex-1）**: 实时结果面板，可滚动

### 左栏 — Generate Image Tab（完整复刻 ReverseTab）
- **Reverse Prompt 卡片**: 拖入/上传图片 → 调用 `/api/tools/img2prompt` 反推 Prompt（扣2积分）
- **Reference Image 卡片**: 支持最多4张参考图，Gallery 卡片拖入/本地上传，去重逻辑
- **Prompt 文本框**: 支持 Gallery 卡片拖入自动填充，已反推结果 readOnly 展示 + Copy 按钮
- **宽高比选择器**: 左右箭头切换 1:1 / 4:3 / 3:4 / 16:9（标注当前/总数）
- **分辨率选择**: 2K / 4K（4K 对未付费用户显示 🔒 锁定）
- **Vision Model 下拉**: Gemini 3 Flash / Gemini 2.5 Flash，点击外部自动关闭
- **Analyze 按钮**: 需先上传图片才可用，带积分成本徽章
- **Generation Model Pills**: 动态从 `generateAPI.getModels()` 获取，含积分/badge
- **Generate Image 按钮**: `addGeneration()` 写入 Context，后台异步请求，结果实时更新右栏

### 左栏 — Generate Video Tab（完整复刻 VideoTab）
- **Model Pills**: Seedance 1.5 / Seedance 2.0(Soon) / Wan 2.7 / Veo 3.1 Lite/Fast/HD
- **Wan2.7 Sub Mode**: Text→Video / Image→Video / Ref+Video / Video Edit（条件显示）
- **Mode 切换器**: Text to Video / 1st Frame / 1st+Last（非 Wan 模型）
- **Frame Upload**: FrameZone + VideoZone 按条件渲染（Wan needsImage/needsVideo）
- **Prompt 文本框**: 支持 Gallery 卡片拖入
- **Duration**: Veo 离散按钮（4/6/8s），Seedance/Wan 滑块（4-12s）
- **分辨率**: 按模型动态过滤（Veo/Wan 无480p）
- **宽高比**: T2V 6选项 / I2V 7选项（含 adaptive）
- **Generate Audio 开关**: i2v 模式/Veo 时显示，含每秒额外积分提示
- **Generate Video 按钮**: 上传帧文件 → `addGeneration()` → 异步视频生成

### 右栏 — Results Panel
- 实时展示 `activeGenerations`（Context 全局状态）中进行中/成功/失败的任务
- 展示最近20条历史记录（`generationHistoryAPI.getHistory({ limit: 20 })`）
- 生成成功后自动刷新历史（去重：已存 DB 的 active job 自动移入历史区）
- 重用 `GenerationCard` 组件（含进度条、下载、复制URL、Retry、Delete 操作）
- 空态引导文案
- "All History" 跳转 `/generate-history`

---

## 关键决策

| 决策 | 理由 |
|------|------|
| 路由放在 `Layout` 组而非 `HomeLayout` | 需要侧边栏 + mesh 背景，与项目整体风格统一 |
| 不需要 `ProtectedRoute` | 游客可浏览页面，仅在点击 Generate/Analyze 时触发登录弹窗 |
| `onGenerated` 不跳转，停留在当前页 | 结果实时显示在右栏，无需页面切换 |
| 不修改 `Img2PromptPanel.js` | 保持源功能完全不变，避免引入 bug |
| 右栏 `ResultsPanel` 独立组件 | 隔离历史数据获取逻辑，避免状态污染左侧表单 |

---

## 验证结果

- `/generate` 页面加载正常，两栏布局，Generate Image / Video 两个 tab 完整可用
- 右栏历史记录正确渲染（已有20条历史）
- 控制台无任何 error / warning
- 落地页三个 CTA 全部指向 `/generate`（快照验证 uid 链接）
- `Img2PromptPanel` 源面板功能不受影响

---

## 积分成本说明（对标源面板）

| 操作 | 积分 |
|------|------|
| Reverse Prompt (Analyze) | 2 |
| Generate Image (by model) | 4-18 |
| 4K 附加费 | +5 |
| Seedance 视频 720p 5s | 34 |
| Veo 3.1 视频 720p 5s | 150 |
| Wan 2.7 视频 720p 5s | 65 |
