# Stage 80 — GeneratePage 组件拆分重构开发日志

**日期**: 2026-04-08  
**分支**: main  
**commit**: (见文末)

---

## 背景与动机

`GeneratePage.js`（`/generate` 页面）在 Stage 79 完成时已达 **1186 行**，包含：

- 全局常量和样式工具函数
- SVG 图标组件（SparklesIcon）
- 图片上传区块组件（FrameZone / VideoZone）
- ImageTab 图片生成表单（~474 行）
- VideoTab 视频生成表单（~286 行）
- ResultsPanel 结果面板（~185 行）
- GeneratePage 主页面布局 shell（~97 行）

同时，`Img2PromptPanel.js`（右侧滑出面板）与 GeneratePage 存在以下重复定义：

| 重复项 | GeneratePage | Img2PromptPanel |
|--------|-------------|-----------------|
| `MUTED` / `MUTED_H` | ✓ | ✓ |
| `REVERSE_COST` | ✓ | ✓ |
| `RATIOS_IMG` / `RATIOS` | ✓ | ✓ |
| `RESOLUTIONS` | ✓ | ✓ |
| `REVERSE_MODELS` | ✓ | ✓ |
| `SparklesIcon` SVG | ✓ | ✓ |

---

## 目标

1. 将 GeneratePage.js 从 1186 行缩减至 ~90 行（纯布局 shell）
2. 按职责拆分到 `components/Generation/` 目录
3. 消除 Img2PromptPanel.js 中的重复常量定义
4. 零功能改动 — 纯重构，行为不变

---

## 新目录结构

```
client/src/components/Generation/
  constants.js      77 行   ← 所有常量 + 样式工具 + SparklesIcon
  ImageGenTab.js   495 行   ← 图片生成 Tab（原 ImageTab）
  VideoGenTab.js   353 行   ← 视频生成 Tab（原 VideoTab + FrameZone + VideoZone）
  ResultsPanel.js  191 行   ← 结果面板（原 ResultsPanel + recordToJob）
```

---

## 各文件说明

### `constants.js`

导出所有共享内容：

```js
// 颜色
export const MUTED   = 'rgba(0,0,0,0.04)';
export const MUTED_H = 'rgba(0,0,0,0.07)';

// 积分定价
export const REVERSE_COST = 2;

// 图片生成
export const RATIOS_IMG  = ['1:1', '4:3', '3:4', '16:9'];
export const RESOLUTIONS = ['2K', '4K'];
export const REVERSE_MODELS = [ ... ];  // 反推 Prompt 模型列表

// 视频生成
export const VIDEO_RATIOS_T2V / VIDEO_RATIOS_I2V
export const SEEDANCE_PER_SEC / WAN_VIDEO_RATES / VEO_PER_SEC  // 积分费率
export const WAN_SUB_MODES / VIDEO_MODELS

// 样式工具
export const LABEL_STYLE = { ... }   // 字段标签统一样式
export const SEL_BTN = (active, disabled) => ({ ... })  // 选择按钮样式函数

// SVG 图标
export const SparklesIcon = ({ size }) => <svg .../>
```

### `ImageGenTab.js`

原 `ImageTab` 组件，功能完全不变：
- Card 1：上传图片反推 Prompt（drag & drop + file picker）
- Card 2：多参考图管理（最多 4 张，drag & drop）
- Card 3：Prompt 文本框（支持 drag 从 Gallery Card 填入）
- 比例选择器（← 1:1 / 4:3 / 3:4 / 16:9 →）
- 分辨率选择（2K / 4K，4K 需付费）
- 反推模型下拉（Gemini 3 Flash / 2.5 Flash）
- 生图模型 pill 选择（从 `/api/generate/models` 动态拉取）
- Generate Image 按钮（接入 `generateAPI.generateImage`）

### `VideoGenTab.js`

原 `VideoTab` 组件，私有 `FrameZone` + `VideoZone` 辅助组件（不导出）：
- 模型选择（Seedance 1.5 / Wan 2.7 / Veo 3.1 系列）
- Wan 2.7 子模式（t2v / i2v / r2v / videoedit）
- 非 Wan 模式：Text-to-Video / 1st Frame / 1st+Last Frame 三模式
- FrameZone：图片上传预览区（16:9 占位框）
- VideoZone：视频上传预览区（16:9 占位框）
- Prompt 文本框（支持 Gallery Card drag-to-fill）
- 时长滑条（Veo 显示固定按钮：4s/6s/8s）
- 分辨率选择（自动根据模型过滤可用选项）
- 比例选择
- Generate Audio 开关（toggle，仅 Veo/Image-to-Video 模式展示）
- Generate Video 按钮（接入 `generateAPI.generateVideo`）

### `ResultsPanel.js`

原 `ResultsPanel` 组件 + 私有 `recordToJob` 工具函数：
- 拉取最近 20 条历史记录（`generationHistoryAPI.getHistory`）
- activeGenerations：实时显示生成中任务（从 `GenerationContext`）
- 成功后自动 refresh（`_fetched` 标记防重复）
- Skeleton 加载骨架（4 张灰色卡位）
- In Progress / Recent 分组展示
- 每张卡支持：下载 / Copy URL / 重试 / 删除
- All History 跳转 `/generate-history`

### `GeneratePage.js`（重写为 shell）

```jsx
import ImageGenTab  from '../components/Generation/ImageGenTab';
import VideoGenTab  from '../components/Generation/VideoGenTab';
import ResultsPanel from '../components/Generation/ResultsPanel';
import { MUTED }    from '../components/Generation/constants';

// 仅保留：
// - 两栏布局（左 360px 表单 + 右弹性结果区）
// - Tab 切换（Generate Image / Generate Video）
// - pulse / spin keyframes
```

### `Img2PromptPanel.js`（去重更新）

删除 lines 25–45 的重复常量定义，改为：

```js
import {
  MUTED, MUTED_H, REVERSE_COST,
  RATIOS_IMG as RATIOS, RESOLUTIONS, REVERSE_MODELS,
  SparklesIcon,
} from '../Generation/constants';
```

`RATIOS_IMG as RATIOS`：panel 内部用 `RATIOS`，通过 import alias 无缝兼容，**无需修改任何逻辑**。

---

## 重构前后对比

| 文件 | 重构前 | 重构后 |
|------|--------|--------|
| `GeneratePage.js` | 1186 行 | **94 行** |
| `Img2PromptPanel.js` | N 行（含重复） | N-26 行（去重） |
| `Generation/constants.js` | — | **77 行**（新建） |
| `Generation/ImageGenTab.js` | — | **495 行**（新建） |
| `Generation/VideoGenTab.js` | — | **353 行**（新建） |
| `Generation/ResultsPanel.js` | — | **191 行**（新建） |

---

## 验证

- `npm start` 编译无报错，无 warning
- 浏览器 `/generate` 页面正常渲染，两栏布局完整
- Generate Image Tab：所有 Card、模型选择、按钮、积分余额显示正常
- Generate Video Tab：模型切换、Wan 子模式、时长/分辨率/比例控件正常
- ResultsPanel：历史记录正常加载（20 条），Running badge 显示
- Console：**零 error / zero warn**
- Img2PromptPanel 滑出面板：Reverse / Generate 两 Tab 功能未受影响

---

## 设计决策记录

1. **FrameZone / VideoZone 不导出** — 仅 VideoGenTab 内部使用，不需要外部复用，私有化避免接口膨胀
2. **recordToJob 不导出** — ResultsPanel 私有工具，外部无需感知
3. **LABEL_STYLE / SEL_BTN 放入 constants.js** — 两个 Tab 都用到，抽到共享层
4. **pulse/spin keyframes 留在 GeneratePage** — 这两个动画是页面级 CSS，ResultsPanel 消费，但其他路由不需要，归页面 shell 管理更合适
5. **不修改任何业务逻辑** — 纯文件边界重组，零风险

---

## 文件变更列表

```
A  client/src/components/Generation/constants.js
A  client/src/components/Generation/ImageGenTab.js
A  client/src/components/Generation/VideoGenTab.js
A  client/src/components/Generation/ResultsPanel.js
M  client/src/pages/GeneratePage.js          (1186 → 94 行)
M  client/src/components/UI/Img2PromptPanel.js  (去重 26 行)
```
