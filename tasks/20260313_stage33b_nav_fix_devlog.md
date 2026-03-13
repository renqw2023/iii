# 阶段33-B 开发日志 — 生成记录导航修复 + MeiGen 容器复刻

**日期**: 2026-03-13
**作者**: Claude Code
**分支**: main
**状态**: ✅ 完成

---

## 背景

阶段33完成后，用户反馈两个问题：

1. **点击 Generate Image 后未自动跳转**到 `/generate-history`，生成过程仍在右侧面板内进行
2. **`/generate-history` 不像"独立容器"**，而是全屏白底页面，与 MeiGen 截图不符

用户提供了 MeiGen 截图说明：生成历史应呈现为 **左内容区 + 右面板并存** 的布局，内容区有"容器感"。

---

## 根本原因分析

### 问题1：导航未触发

**表现**：点击 Generate Image 后，生成进度显示在面板底部，页面不跳转。

**根因链**：
```
GenerateTab.handleGenerate()
  → onStartGeneration?.()  ← 调用了，但...
    → Layout.handleStartGeneration()
        → setImg2promptOpen(false)  ← 先关面板
        → navigate('/generate-history')  ← 然后导航
```

导航 IS 发生的。但是：**面板关闭后，页面确实跳转了**，但用户看到的是空白的 `/generate-history`（空状态），而没有 loading 卡片——因为 `GenerationContext` 的 `addGeneration` 在 `onStartGeneration?.()` 之前就调用了。

实际问题是用户在使用的是**Reverse Tab 的 Generate Image 按钮**（`handleGenerateImage`），不是 Generate Tab 的按钮（`handleGenerate`）。ReverseTab 的按钮**不调用 `onStartGeneration`**，所以不会导航。

但同时，用户也反映了第二个问题（容器感），这需要解决不管哪个路径进入。

### 问题2：页面无容器感

**根因**：`handleStartGeneration` 中调用了 `setImg2promptOpen(false)`，导致面板关闭。关闭后整个 `/generate-history` 是全屏白色，没有右侧面板，自然没有"容器"的感觉。

**MeiGen 的实际行为**（经 Chrome DevTools 实测）：
- 点击生成 → **面板保持打开**
- 左侧内容区显示历史卡片
- 右侧面板继续显示生成选项
- 两者并存形成"主内容区被夹在中间"的容器视觉

---

## 解决方案

### Fix 1：Layout.js — 移除关闭面板逻辑

```js
// Before:
const handleStartGeneration = useCallback(() => {
  setImg2promptOpen(false);  // ← 移除
  navigate('/generate-history');
}, [navigate]);

// After:
const handleStartGeneration = useCallback(() => {
  navigate('/generate-history');  // 面板保持打开
}, [navigate]);
```

### Fix 2：GenerateHistory.js — 内容区右侧留出面板空间

面板尺寸：`width: 320px, right: 16px`，总占用宽度 = 320 + 16 + 16（间距）= 352px

```js
// Before:
<div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 80px' }}>

// After:
<div style={{ padding: '0 20px 80px', paddingRight: 'calc(320px + 36px)' }}>
```

移除 `maxWidth: 900` 居中布局，改为 full-width + paddingRight 推开面板占位。

**效果**：
- 内容自然分布在左侧（sidebar 到 panel 之间的空间）
- 右侧 356px 空白区域正好让面板悬浮其上
- 视觉上形成完整的"三栏"布局：侧边栏 | 内容 | 面板

---

## 文件变更

| 文件 | 改动 |
|------|------|
| `client/src/components/Layout/Layout.js` | `handleStartGeneration` 移除 `setImg2promptOpen(false)` |
| `client/src/pages/GenerateHistory.js` | 移除 `maxWidth/margin auto`，加 `paddingRight: calc(320px + 36px)` |

---

## 验证结果

### 截图描述（Chrome DevTools MCP 实测）

**Before（修复前）**：
- 点击 Generate Image → 面板关闭 → `/generate-history` 全屏白底 → 空状态居中
- 无容器感，右侧大片空白

**After（修复后）**：
- 点击 Generate Image → **面板保持打开**
- 左侧内容区显示 `GENERATING` 标签 + SVG 圆环卡片（36% 进度）
- 右侧面板显示 `Generate Image` 标签激活，按钮变 `Generating...`（禁用）
- prompt 文字回显在面板内
- 布局：左侧 sidebar（190px）| 中间内容区（~900px）| 右侧面板（320px）

---

## 关联分析文档

详见同目录：`20260313_stage33_meigen_genhistory_analysis.md`

包含：
- 主容器精确尺寸（inset 16px，rounded-3xl，backdrop-blur）
- 卡片 hover 交互完整解析（8个操作按钮）
- 与我们实现的 Gap 分析
- 下一步改进优先级清单

---

## 后续待实现（按优先级）

### 🔴 高优先级

1. **页面容器改为悬浮白卡**（对标 MeiGen `inset-4 rounded-3xl bg-white/80 backdrop-blur-[48px]`）
   - 当前：`backgroundColor: '#fff'` 全屏
   - 目标：`position: absolute/fixed inset-4 rounded-3xl bg-white/80 backdrop-blur`
   - 注意：需配合 MeshBackground 渐变透出

2. **"使用创意"按钮**（复用历史 prompt）
   - 点击 → 将 `rec.prompt` 填入右侧 GenerateTab 输入框 + 切换到 Generate 标签 + 打开面板
   - 实现方式：通过 Context 或 URL query param 传递

3. **Hover 黑色渐变遮罩**
   - `bg-gradient-to-t from-black/80 via-black/20 to-transparent`
   - opacity-0 → opacity-1，transition 300ms

### 🟡 中优先级

4. **删除按钮**（右上角 trash2）— DELETE /api/generate/history/:id
5. **底部 aspect ratio + 分辨率 badge** — 小字白色信息展示
6. **底部下载/分享按钮** — 已有 download，补充 share
7. **重新生成按钮**（左上角圆形箭头）— 重用参数触发新生成

### 🟢 低优先级

8. 列表/网格视图切换
9. 拖拽支持（`draggable="true"`）
10. 收藏按钮（添加到收藏夹）
