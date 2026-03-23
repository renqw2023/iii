# Stage 50 开发日志 — UI 国际化 + API 并发保护

**日期**: 2026-03-23
**分支**: main
**涉及文件**:
- `client/src/i18n/modules/sidebar.js`（新建）
- `client/src/i18n/modules/index.js`
- `client/src/components/Layout/Sidebar.js`
- `client/src/components/UI/CreditsDisplay.js`
- `server/routes/generate.js`

---

## 一、背景

### 1.1 国际化缺口（Stage 50A）

项目已有 zh-CN / en-US / ja-JP 语言切换功能（`react-i18next`），但 `Sidebar.js` 和 `CreditsDisplay.js` 中约 40+ 个字符串硬编码为英文，导致切换语言后这两个核心组件不响应。

### 1.2 API 并发保护（Stage 50B）

项目已有 per-user 限流（60次/小时），但缺少全局并发保护。多个用户同时请求同一 AI 模型时，所有请求并发打到同一个 API Key，存在：
- 触发供应商 RPM 限制 → 用户收到 `429` 报错
- 用户已扣积分但生成失败的边界情况风险

---

## 二、Stage 50A — Sidebar/CreditsDisplay 国际化

### 2.1 新建翻译模块

**文件**: `client/src/i18n/modules/sidebar.js`

包含 24 个翻译 key，三语言各一套：

| key | zh-CN | en-US | ja-JP |
|-----|-------|-------|-------|
| `addCredits` | 充值积分 | Add Credits | クレジット追加 |
| `free` | 免费 | Free | 無料 |
| `upgrade` | 升级 | Upgrade | アップグレード |
| `credits` | 积分 | Credits | クレジット |
| `freeDailyCredits` | 每日免费积分 | Free Daily Credits | 毎日無料クレジット |
| `dailyCreditsUsedFirst` | 每日免费积分优先消耗 | Daily credits used first | 毎日クレジットを先に使用 |
| `expandSidebar` | 展开侧边栏 | Expand sidebar | サイドバーを展開 |
| `collapseSidebar` | 收起侧边栏 | Collapse sidebar | サイドバーを折りたたむ |
| `browseHistory` | 浏览记录 | Browse History | 閲覧履歴 |
| `generationHistory` | 生成记录 | Generation History | 生成履歴 |
| `shareTitle` | 分享 III.PICS | Share III.PICS | III.PICS をシェア |
| `shareDesc` | 邀请好友，各获 200 积分 | Invite friends, get 200 credits | 友達を招待して 200 クレジット獲得 |
| `account` | 账户 | Account | アカウント |
| `overview` | 总览 | Overview | 概要 |
| `docs` | 文档 | Docs | ドキュメント |
| `contactUs` | 联系我们 | Contact Us | お問い合わせ |
| `language` | 语言 | Language | 言語 |
| `currentLang` | 当前 | Current | 現在 |
| `signIn` | 登录 | Sign In | サインイン |
| `checkin` | 签到 | Check-in | チェックイン |
| `checkedInToday` | 今日已签到 | Checked in today | 本日チェックイン済み |
| `viewCredits` | 查看积分 | View credits | クレジットを見る |
| `permanentCredits` | 永久积分 | Permanent Credits | 永久クレジット |
| `resetsDaily` | 每日重置为 {{count}} 积分，优先消耗 | Resets to {{count}} daily and is used first | 毎日 {{count}} にリセット、先に消費 |

### 2.2 注册模块

**文件**: `client/src/i18n/modules/index.js`

```js
import { sidebar } from './sidebar';
// mergeTranslations 中添加：
sidebar: sidebar[lang] || {},
```

### 2.3 Sidebar.js 改动

- `CreditsHoverArea` 子组件接受 `t` prop（该组件无法直接调用 hook）
- 替换约 32 处硬编码字符串，使用 `t('sidebar.XXX')` 格式
- 内联数组（Dashboard子菜单、设置菜单）也改为 `t()` 调用

**关键技术细节**：`CreditsHoverArea` 是定义在 Sidebar 模块顶层的纯函数组件，不在 React 组件树的 Context 内部，无法直接 `useTranslation()`。通过 prop 传递 `t` 函数：

```jsx
// 调用处
<CreditsHoverArea credits={creditsData} onAddCredits={onCreditsClick} t={t} />

// 组件定义
const CreditsHoverArea = ({ credits: data, onAddCredits, t }) => { ... }
```

### 2.4 CreditsDisplay.js 改动

添加 `useTranslation` import 及 hook，替换 9 处硬编码字符串，包含插值表达式：

```jsx
// 替换前
Resets to {dailyFree} daily and is used first

// 替换后（i18next interpolation）
{t('sidebar.resetsDaily', { count: dailyFree })}
```

### 2.5 验证结果

| 语言 | 导航项 | 底部区域 | Console 报错 |
|------|--------|---------|------------|
| en-US | Home / Search / Browse History / Generation History / Favorites | Share III.PICS / Add Credits | 无 |
| zh-CN | 首页 / 搜索 / 浏览记录 / 生成记录 / 收藏 | 分享 III.PICS / 充值积分 | 无 |
| ja-JP | ホーム / 検索 / 閲覧履歴 / 生成履歴 / お気に入り | III.PICS をシェア / クレジット追加 | 无 |

---

## 三、Stage 50B — API 并发保护

### 3.1 方案决策

上线前仅实施两项轻量保护，不引入 Redis/队列等新依赖：

1. **全局并发限制**（方案1）：per-provider 计数器，超出上限立即 503
2. **429 自动重试**（方案2）：等待 2s 后重试一次

### 3.2 实现细节

**文件**: `server/routes/generate.js`

#### 全局并发限制

```js
// 进程内 in-memory 计数器（单进程部署足够）
const activeConcurrency = { google: 0, openai: 0, zhipu: 0, doubao: 0 };
const MAX_CONCURRENCY   = { google: 5, openai: 3, zhipu: 5, doubao: 5 };
const PROVIDER_MAP = {
  'gemini3-pro':   'google', 'gemini3-flash': 'google', 'gemini25-flash': 'google',
  'imagen4-pro':   'google', 'imagen4-fast':  'google',
  'gpt-image-1':   'openai', 'dall-e-3':      'openai',
  'cogview-flash': 'zhipu',
  'seedream-5-0':  'doubao',
};
```

**检查位置**：积分验证通过后、AI API 调用前。确保被拒绝时不扣积分。

**try/finally 保证计数器归还**：

```js
if (provider) activeConcurrency[provider]++;
try {
  // ... AI 调用 + 积分扣除 + 响应 ...
  res.json({ ... });
} finally {
  if (provider) activeConcurrency[provider]--;  // 成功/失败/超时均执行
}
```

> **重要**：外层已有 `try/catch` 处理超时和意外错误。内层 `try/finally` 的 finally 在任何 `return` 语句（包括 `return res.status(xxx).json(...)` ）执行后都会触发，确保计数器不泄漏。

#### 429 自动重试

```js
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function retryFetch(url, options, retries = 1, delay = 2000) {
  const res = await fetch(url, options);
  if (res.status === 429 && retries > 0) {
    await sleep(delay);
    return retryFetch(url, options, retries - 1, delay);
  }
  return res;
}
```

6 个 AI provider 调用由 `fetch(` 替换为 `retryFetch(`，图片下载 `fetch` 保持不变（下载失败重试无意义）。

### 3.3 并发容量计算

以 Gemini 3 Pro 为例：

```
MAX_CONCURRENCY = 5 slots
每次生成平均耗时 ≈ 15s
理论吞吐量 = 5 slots × (60s/15s) = 20 次/分钟

Gemini 3 Pro RPM 限制 ≈ 10（图片生成）
实际 MAX_CONCURRENCY 已使服务器吞吐量高于 API 上限
→ 真实瓶颈在 API 侧，并发限制是合理的安全阀
```

### 3.4 模型可见性说明

当前 `server/.env` 中已配置的 API Key：

| Key | 状态 | 可用模型 |
|-----|------|---------|
| `GEMINI_API_KEY` | ✅ 已配置 | Nanobanana Pro/2/标准, Imagen 4 Pro/Fast |
| `ARK_API_KEY` | ✅ 已配置 | Seedream 5.0 |
| `OPENAI_API_KEY` | ❌ 未配置 | GPT Image 1.5, DALL·E 3（隐藏） |
| `ZHIPU_API_KEY` | ❌ 未配置 | Z Image Turbo（隐藏） |

模型可见性由 `available: () => !!process.env.XXX_API_KEY` 控制，未配置 Key 的模型自动从前端列表中过滤。

---

## 四、已知限制

1. `activeConcurrency` 是进程内变量，**多进程/多实例部署时失效**（需改为 Redis 计数）
2. `retryFetch` 仅重试一次，高峰期仍可能遇到连续 429
3. 图片生成为同步响应，用户在生成期间需保持页面打开

---

## 五、下一步计划

详见 `tasks/future_scaling_guide.md`

