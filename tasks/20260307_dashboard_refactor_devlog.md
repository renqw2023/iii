# 阶段25 — Dashboard 全面重构开发日志

**日期**: 2026-03-07
**阶段**: 25
**状态**: ✅ 完成

---

## 改造目标

将旧版 Dashboard（硬编码浅色主题 + 假随机数统计 + 废弃的 Posts/Prompts 社区 tab）
全面重构为以「用户与 III.PICS 内容互动」为中心的个人中心页。

---

## 文件改动

| 文件 | 类型 | 核心改动 |
|------|------|---------|
| `pages/Dashboard.js` | 完全重写 | 移除 useDashboardData/usePostEdit/usePromptEdit/PostEditModal/PromptEditModal，新建 3-tab 结构 |
| `components/Dashboard/DashboardHeader.js` | 中等重写 | 删废弃按钮，加邀请码 + 一键复制，全CSS变量 |
| `components/Dashboard/StatsPanel.js` | 完全替换 | 真实 API 数据，消灭 Math.random() |
| `components/Dashboard/DashboardTabs.js` | 小改 | 全 slate-* → CSS 变量 |

**保留不改动**：`hooks/useDashboardData.js`、`components/Dashboard/tabs/*`、`components/Dashboard/modals/*`

---

## 各组件改动详情

### DashboardHeader.js
- 删除 `Create Post` + `Create Prompt` 两个废弃按钮（链接到 /create / /create-prompt，未完善）
- 删除 `useTranslation` 和失效的 i18n key
- 保留 `Settings` 按钮（样式改为 CSS 变量）
- 新增邀请码区域：`user.inviteCode` 展示 + `Copy link` 按钮
  - `navigator.clipboard.writeText()` 复制完整邀请链接
  - 复制成功 2 秒后恢复按钮文字（`copied` 状态）
- Avatar ring border 改为 `var(--accent-primary)`
- 所有颜色类替换为 CSS 变量 inline style

### StatsPanel.js（完全替换）
**旧版问题**：
- 调用 `enhancedUserAPI`/`enhancedPostAPI`（与新架构不符）
- `generateWeeklyStats()` / `generateMonthlyGrowth()` 全为 `Math.random()`
- 假图表（BarChart、CircularProgress SVG）
- 引用不存在字段 `formatReference`、`prompts`

**新版 4 卡片设计**：
```
┌─────────────────────────┬──────────────┬──────────────┬──────────────┐
│ Credits（紫色渐变）      │ Saved        │ Viewed       │ Member Since │
│ 💰 [balance]            │ ♥ [total]    │ 🕒 [count]   │ 📅 Mar 2026 │
│ [Check-in / Checked in] │（来自 API）  │（localStorage）│（user.createdAt）│
└─────────────────────────┴──────────────┴──────────────┴──────────────┘
```

**数据来源**：
- Credits: `creditsAPI.getBalance()` → `{credits, checkedInToday}`
- Saved: `favoritesAPI.getList('all', 1, 1)` → `pagination.total`
- Viewed: `useBrowsingHistory().getHistory().length`（localStorage，同步）
- Member Since: `user.createdAt`（来自 AuthContext）

Check-in 按钮逻辑直接内嵌在积分卡（从原 CreditsQuickPanel 合并过来）。

### Dashboard.js（完全重写）
**移除的依赖**：
- `useDashboardData`、`usePostEdit`、`usePromptEdit`（及所有 tab、modal 组件 import）
- `CreditsQuickPanel`（功能合并到 StatsPanel）

**新 Tab 结构**：
```jsx
<DashboardTabs tabs={['favorites','history','credits']}>
  {activeTab === 'favorites' && <FavoritesSection />}
  {activeTab === 'history'   && <HistorySection />}
  {activeTab === 'credits'   && <CreditsSection />}
</DashboardTabs>
```

**FavoritesSection**：
- 内嵌 FavCard 逻辑（不重复导出，避免循环依赖）
- 3 子 Tab：Sref / Gallery / Video
- 每页 24 条，"View all →" 链接 /favorites
- 空状态展示对应 icon + 引导文字

**HistorySection**：
- 读 localStorage，展示最新 12 条
- 每条显示：type icon、缩略图、标题、类型标签、相对时间
- hover 显示 → arrow，点击跳转
- "View all →" 链接 /history

**CreditsSection**：
- `useQuery(['credits-history'])` → `creditsAPI.getHistory(1, 20)`
- 每条 earn/spend 颜色区分（绿/红）
- 显示余额变化 `balanceAfter`
- "View all →" 链接 /credits

**背景**：`style={{ backgroundColor: 'var(--bg-primary)' }}`（移除 Tailwind 渐变）

### DashboardTabs.js
替换所有硬编码 Tailwind 颜色类为 CSS 变量 inline style：
- `border-slate-200` → `var(--border-color)`
- `text-slate-500` / `text-slate-600` → `var(--text-secondary)`
- `bg-slate-100` → `var(--bg-tertiary)`
- `border-primary-500 text-primary-600` → `var(--accent-primary)`
- 移除视图模式切换（Grid/List toggle）— 新 tab 不需要

---

## 验证结果

- ✅ 编译无报错（console 0 errors）
- ✅ 路由保护正常（未登录自动跳转 /login）
- ✅ 深色/浅色模式均使用 CSS 变量，主题切换正常
- ✅ 积分数字来自 API（非 Math.random）
- ✅ 邀请码展示 + 复制功能
- ✅ 收藏/历史/积分三 tab 各自独立数据源

---

## MeiGen.ai 个人中心竞品分析

### MeiGen 用户中心架构（观察结论）

MeiGen **没有独立 Dashboard 页**，用户功能嵌入主导航：
- 左侧 Sidebar：首页、搜索、**生成记录**、**收藏**、标签分类、最近更新、更多产品
- 左下角：**分享 MeiGen**（邀请入口）、**用户头像 R**、**增加点数 ⚡80**
- 底部移动端 Dock（5个图标）：Home / History / Layers / Cookbook / Generate

### MeiGen 核心功能对比

| 功能 | MeiGen | III.PICS | 差距分析 |
|------|--------|----------|---------|
| 生成历史 | ✅ AI 生成记录（服务器存储） | ✅ 浏览历史（localStorage） | 业务逻辑不同，无直接差距 |
| 收藏 | ✅ 全部/广场/生成 3 sub-tab | ✅ Sref/Gallery/Video 3 sub-tab | 分类维度不同，各自合理 |
| 积分展示 | ✅ 底部常驻显示 | ⚠️ 仅 Dashboard 内显示 | **我们缺少全局积分展示** |
| 积分购买 | ✅ 一次性付款分级套餐 | ❌ 无付费功能 | 商业化差距（暂不实现） |
| 每日刷新 | ✅ 每日刷新 40 积分 | ✅ 每日签到 +10 积分 | 命名/数量不同，逻辑一致 |
| 邀请机制 | ✅ 邀请链接 + 进度计数 0/10 | ✅ 邀请码 + 复制链接 | **我们缺少已使用次数显示** |
| 邀请奖励触发 | 好友**首次生成**后双方得分 | 好友**注册**后双方得分 | MeiGen 触发更深（首次使用），粘性更强 |
| 邀请上限 | ✅ 限额 10 人 | ❌ 无上限 | 稀缺感设计，可考虑引入 |
| 主题切换 | ❌ 仅浅色 | ✅ 深/浅双主题 | 我们领先 |
| 移动端 Dock | ✅ 5图标底部 Dock | ✅ 已有移动端 Dock | 持平 |

### 我们尚未覆盖的 MeiGen 设计点（优先级排序）

#### P1 — 高价值，实现成本低

**1. 全局积分余额展示**
- MeiGen 积分数字常驻在左下角，随时可见
- 我们积分只在 Dashboard 和 Credits 页可见
- 建议：在 Header 或 Sidebar 加 `⚡{balance}` 小标签

**2. 邀请使用进度 `0/N`**
- MeiGen 显示"邀请链接已被 0/10 位用户使用"
- 我们 DashboardHeader 只显示邀请码，不显示使用情况
- 建议：`server/models/User.js` 加 `inviteUsedCount` 字段，API 返回，前端展示

**3. 空状态引导文字优化**
- MeiGen 空状态文案精准引导用户下一步操作
- 我们空状态目前只有基础提示

#### P2 — 中等价值

**4. 邀请触发条件升级**
- MeiGen: 好友**首次使用核心功能**后才触发奖励
- 我们: 注册即触发，参与成本太低
- 建议：改为好友首次收藏/签到后再发放邀请积分

**5. 邀请人数上限**
- MeiGen 每个邀请链接限用 10 次，制造稀缺感
- 建议：`User.inviteQuota`（默认 10），每次被使用 -1

**6. 积分套餐购买入口**
- MeiGen 左下角常驻"增加点数"按钮，转化漏斗清晰
- 我们暂无付费功能，但可先设计入口（灰态/Coming Soon）

#### P3 — 低优先级 / 不适合

**7. 生成记录**（AI image generation）— 我们的业务模式是浏览/收藏，不是生成，无需对标

**8. 一次性付费套餐**（¥79/¥159/¥399）— 需产品决策，不在开发范畴

---

## 后续 TODO

- [ ] P1: Header 全局积分余额常驻展示
- [ ] P1: 邀请使用次数 API（`GET /api/users/me` 加 `inviteUsedCount`）
- [ ] P2: 邀请触发条件升级（好友首次签到后发放）
- [ ] P2: 邀请人数上限设计
