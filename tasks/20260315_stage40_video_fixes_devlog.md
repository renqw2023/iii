# Stage 40 开发日志 — 视频功能修复全记录

**日期**: 2026-03-15
**分支**: main
**Commits**: c22b461 · 01a9648 · f6fb2a0 · (本次修复)

---

## 一、背景

Stage 39d 完成了 VideoTab 全功能升级（多分辨率、多比例、首尾帧 i2v、音频生成等）。
本阶段发现并修复了以下四个问题：

1. `/generate-history` 视频卡片太小，体验差
2. `/seedance` 详情页缺少「Generate Video」一键填充入口
3. Generate Audio 开关对文生视频无效（生成的视频没有声音）
4. 生成新视频后，之前的视频从历史页面消失

---

## 二、问题详析与修复

### 2.1 视频卡片尺寸优化

**文件**: `client/src/pages/GenerateHistory.js`
**问题**: `CardGrid` 固定 `minCardWidth=220px`，视频卡片（宽高比通常 16:9）在该尺寸下过小，无法看清内容。
**修复**:
- `CardGrid` 新增 `minCardWidth` prop（default 220）
- 视频专属分组使用 340px：`minCardWidth={items.every(r => r.mediaType === 'video') ? 340 : 220}`
- "Generating" 活跃区同理处理

同时修复了 `GenerationCard` 中 `ASPECT_RATIO_MAP` 缺少 `9:16` / `21:9` 导致竖屏/超宽视频高度计算错误（fallback 到 `[16,9]`）。

---

### 2.2 Seedance 详情页「Generate Video」一键填充

**文件**: `client/src/pages/Seedance/SeedanceModal.js`

**用户诉求**: 在 Seedance 视频详情弹窗中，看到喜欢的视频可以一键用其 prompt 生成同款。
**方案选择**: 方案1（Text-to-Video 填充），因其只需传递 prompt，实现简洁、无副作用。
（方案2 需自动提取首尾帧并上传为图片，复杂度高，留作后续优化）

**实现**:
```jsx
// SeedanceModal.js footer
import { useGeneration } from '../../contexts/GenerationContext';
import { Wand2 } from 'lucide-react';

const { setPrefill } = useGeneration();

<button
  className="dmodal-btn-primary"
  onClick={() => {
    setPrefill({ prompt: prompt.prompt, tab: 'video' });
    handleClose();
    toast.success('Prompt filled — check Generate Video');
  }}
  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
>
  <Wand2 size={16} /> Generate Video
</button>
```

**prefillJob 传递链路**:
```
SeedanceModal.setPrefill({ prompt, tab:'video' })
  → GenerationContext.prefillJob 更新
  → Layout.js 检测到 prefillJob 存在，打开生成面板
  → Img2PromptPanel useEffect 检测 tab==='video' → setTab('generate')
  → VideoTab useEffect 读取 prefillJob.prompt → 填充 prompt 输入框
  → clearPrefill() 消费完毕，防止重复触发
```

**同时修复的 bug**: `Img2PromptPanel` 渲染 `<VideoTab>` 时忘记传 `prefillJob` / `onPrefillConsumed` props，导致填充链路断开。

---

### 2.3 Generate Audio 无效问题

**文件**: `server/services/videoService.js`, `client/src/components/UI/Img2PromptPanel.js`

**现象**: 用户开启 Generate Audio 开关，生成的视频下载到本地仍无声音。

**排查过程**:
1. 首先排查前端是否静音播放 → `GenerationCard` 修复为 `generateAudio=true` 时 `muted` 初始值为 `false` → 视频能播出声音，但下载到本地仍无声
2. 查阅 Volcengine 官方文档（`https://www.volcengine.com/docs/82379/1366799`）
3. 通过 Chrome DevTools 抓取 JS 渲染后的能力对照表，确认：

> **`generate_audio` 参数仅支持图生视频（i2v）模式**，文生视频（t2v）该参数被静默忽略。

**根本原因**: 服务端对文生视频也传了 `generate_audio: true`，但 API 忽略该参数。

**修复方案**:

*服务端* — 仅在 i2v 模式下发送 `generate_audio`：
```js
// videoService.js
const isI2V = !!firstFrameUrl;
const body = {
  model, content, ratio, resolution, duration, watermark: false,
  ...(isI2V ? { generate_audio: Boolean(generateAudio) } : {}),
};
```

*前端* — 文生视频模式下隐藏 Generate Audio 开关，避免用户误解：
```jsx
// Img2PromptPanel.js — VideoTab Generate Audio 区域
style={{ display: mode === 'text' ? 'none' : 'flex' }}

// 切换到 text 模式时重置
if (key === 'text') { setRatio('16:9'); setGenerateAudio(false); }
```

*UI 反馈* — 有声视频的 badge 显示 🔊：
```jsx
▶ VIDEO{job.generateAudio ? ' 🔊' : ''}
```

**结论**: 该 API 限制是 Volcengine 平台约束，非代码 bug。已在 `videoService.js` 顶部注释中说明。

---

### 2.4 历史页面视频消失问题（本次修复重点）

**文件**: `client/src/pages/GenerateHistory.js`

#### 根本原因分析

**原因一：数据源二元性 + 重复展示**

`/generate-history` 同时渲染两个数据源：
- `activeGenerations` —— React Context 内存状态，页面刷新即清空
- `records` —— 从 MongoDB 拉取，持久化

当某个视频生成完成时：
1. `addGeneration({status:'success', ...})` → 出现在 Active 区
2. `fetchHistory()` 触发 → DB 中也有该记录
3. 视频**同时出现在两个区**（重复展示）
4. 旧的 Active 状态被标记 `_fetched: true`，但**从未被自动移除**
5. 用户因为困惑手动 dismiss Active 区卡片，或者刷新页面后 Active 消失
6. 若 DB 保存失败（静默 try/catch），刷新后视频彻底消失

**原因二：服务端静默 try/catch**

```js
// server/routes/generate.js（video 路由末尾）
try {
  await Generation.create({ ... });
} catch (e) {
  console.error('Generation (video) save error:', e);
}
res.json({ videoUrl, taskId, ... }); // 即便 save 失败也返回成功
```

客户端不知道视频是否真正入库。若 DB 保存失败，视频仅存在于 `activeGenerations` 中，刷新后永久消失。

#### 修复方案

核心思路：**fetchHistory 拿到新记录后，主动将已入库的活跃任务从 Active 区移除**，让视频仅出现在持久化的日期分组区。

```js
// GenerateHistory.js
const fetchHistory = useCallback(async (completedJobs) => {
  if (!isAuthenticated) return;
  setIsLoading(true);
  try {
    const data = await generationHistoryAPI.getHistory({ limit: 50 });
    const newRecords = data.records || [];
    setRecords(newRecords);

    if (completedJobs?.length) {
      // 构建 DB 中所有 URL 的集合
      const dbUrls = new Set(
        newRecords.flatMap(r => [r.videoUrl, r.imageUrl].filter(Boolean))
      );
      // 确认入库的活跃任务 → 自动移出 Active 区
      completedJobs.forEach(g => {
        const url = g.result?.videoUrl || g.result?.imageUrl || g.videoUrl || g.imageUrl;
        if (url && dbUrls.has(url)) removeGeneration(g.id);
      });
    }
  } catch {
    // silent — still show active generations
  } finally {
    setIsLoading(false);
  }
}, [isAuthenticated, removeGeneration]);

// 检测到新完成的任务时，传入 completedJobs 触发清理
useEffect(() => {
  const justFinished = activeGenerations.filter(g => g.status === 'success' && g._fetched !== true);
  if (justFinished.length > 0) {
    justFinished.forEach(g => updateGeneration(g.id, { _fetched: true }));
    fetchHistory(justFinished); // ← 传入待清理列表
  }
}, [activeGenerations, fetchHistory, updateGeneration]);
```

#### 修复后行为

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 视频生成完成 | 出现在 Active + DB 历史，重复展示 | 自动从 Active 移除，仅出现在 DB 历史 |
| 生成新视频 | 旧视频可能从 Active 区消失（用户误以为丢失） | 旧视频早已移入 DB 历史，不受影响 |
| DB 保存失败 | 视频消失（刷新后） | 保留在 Active 区（无 URL 匹配），用户仍可看到 |
| 页面刷新 | Active 区清空，DB 历史正常 | Active 区清空，DB 历史正常（无变化） |

#### 已知局限

服务端 `Generation.create` 的静默 `try/catch` 问题仍存在 —— 如果 DB 保存真的失败，视频会保留在 Active 区（不丢失），但刷新后仍会消失。这属于基础设施层面的问题（MongoDB 连接故障等），不在本次范围内修复。

---

## 三、相关文件变更汇总

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `client/src/pages/GenerateHistory.js` | 修复 | 视频卡片大小 + Active/DB 去重清理 |
| `client/src/components/UI/GenerationCard.js` | 修复 | ASPECT_RATIO_MAP 补全 9:16/21:9；有声视频不默认静音；🔊 badge |
| `client/src/pages/Seedance/SeedanceModal.js` | 功能 | 「Generate Video」按钮 + prefillJob 链路 |
| `client/src/components/UI/Img2PromptPanel.js` | 修复+功能 | VideoTab 传 prefillJob props；text 模式隐藏 Audio；VideoTab 含 generateAudio 字段 |
| `server/services/videoService.js` | 修复 | generate_audio 仅 i2v 模式发送；poll timeout 60s |
| `server/models/Generation.js` | 功能 | 新增 generateAudio 字段 |
| `server/routes/generate.js` | 功能 | Generation.create 存入 generateAudio |

---

## 四、验证

- 浏览器截图确认 `/generate-history` 正常加载，无 JS 报错
- Seedance 详情页「Generate Video」按钮可见，点击后 VideoTab prompt 自动填充
- 文生视频模式下 Generate Audio 开关不可见
- 图生视频生成有声视频后，video badge 显示 🔊，播放时有声

---

## 五、后续 TODO

- [ ] 服务端 `Generation.create` 失败时通知客户端（可在 response 中增加 `savedToDb: false` 字段）
- [ ] Seedance 方案2：自动提取首尾帧填充 First+Last 模式（需实现帧提取 API）
- [ ] 4K CDN URL 转存（replicate.delivery 约 1 小时失效）
