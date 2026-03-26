# 阶段 65 开发日志 — i18n 默认英文 + 翻译按钮修复

**日期**: 2026-03-25
**Commits**: `94e4851` → `e3014d9` → `c777e45`
**分支**: main

---

## 背景与问题来源

III.PICS 的主要受众是欧美用户（EU/US），但发现以下三个问题同时存在：

1. **翻译方向错误**：Gallery 详情页的"翻译"按钮实际调用的是 `translateToZh`（EN→ZH），但数据源（YouMind NanaBanana）返回的是中文 prompt，EU/US 用户需要的是 ZH→EN。
2. **首次访问显示中文**：新用户打开网站（浏览器语言为中文），i18n 检测器会读取浏览器语言并显示中文界面，而非默认英文。
3. **LoginModal / Register 硬编码中文**：认证相关界面完全没有接入 i18n，全部是硬编码中文字符串，无论用户选择什么语言都显示中文。

---

## Commit 1 — 翻译按钮方向修复 + SEOHead 崩溃 + 数据源语言

**Commit**: `94e4851`
**文件**: `translateApi.js`, `TranslateButton.js`, `SEOHead.js`, `githubSync.js`

### translateApi.js — 新增 `translateToEn`

原始代码只有 `translateToZh`（EN→ZH），调用 MyMemory 免费 API：

```js
// 修复前：只有 EN→ZH
export const translateToZh = async (text) => {
  const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`);
  return res.data.responseData.translatedText;
};
```

**问题**：MyMemory 免费接口有 500 字符限制，超出返回 `"QUERY LENGTH LIMIT EXCEEDED"` 而不报错，直接把错误字符串当翻译结果显示。

**修复**：新增 `translateToEn`（ZH→EN），带 480 字符分块逻辑：

```js
const CHUNK_SIZE = 480;

async function translateChunk(text, langpair) {
  const res = await axios.get(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`
  );
  const result = res.data.responseData.translatedText;
  if (!result || result.includes('QUERY LENGTH LIMIT')) throw new Error('Translation failed');
  return result;
}

export const translateToEn = async (text) => {
  if (!text) throw new Error('Translation failed');
  if (text.length <= CHUNK_SIZE) return translateChunk(text, 'zh|en');

  // 按词边界分块，避免切断单词
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }
    chunks.push(text.slice(start, end).trim());
    start = end + 1;
  }

  const results = [];
  for (const chunk of chunks) results.push(await translateChunk(chunk, 'zh|en'));
  return results.join(' ');
};
```

**关键设计决策**：
- 使用 480（而非 500）作为 chunk size，留 20 字符余量防止 URL 编码后超限
- 串行翻译各 chunk（非并行），避免触发 MyMemory 频率限制
- 词边界检测：`text.lastIndexOf(' ', end)` 找最近空格，避免切断中文时的问题（中文无空格则按字符数切）

### TranslateButton.js — 接入 i18n

```jsx
// 修复前
import { translateToZh } from '../../services/translateApi';
// 硬编码中文
<span>翻译为中文</span>
<span>原文</span>

// 修复后
import { useTranslation } from 'react-i18next';
import { translateToEn } from '../../services/translateApi';
const { t } = useTranslation();
<span>{t('common.translateToEn')}</span>   // "Translate to English"
<span>{t('common.showOriginal')}</span>    // "Show original"
```

### SEOHead.js — 修复 runtime 崩溃

前一 session 清理 hreflang 时删除了 `const supportedLanguages = [...]` 声明，但 JSX 里仍有：

```jsx
{supportedLanguages.filter(lang => lang !== currentLang).map(lang => (
  <meta property="og:locale:alternate" content={lang} />
))}
```

**错误**：`ReferenceError: supportedLanguages is not defined`（每次渲染都崩溃）

**修复**：直接删除整个 `og:locale:alternate` 块。

### githubSync.js — 数据源语言修复

YouMind NanaBanana API 调用时传了中文 locale，导致返回的 11,795 条 prompt 全部是中文翻译版本：

```js
// 修复前
locale: 'zh-CN',
headers: {
  Referer: 'https://www.youmind.ai/zh-CN/nano-banana-pro-prompts',
  'Accept-Language': 'zh-CN,zh;q=0.9',
}
// sourceUrl 也是 zh-CN 路径

// 修复后
locale: 'en-US',
headers: {
  Referer: 'https://www.youmind.ai/en-US/nano-banana-pro-prompts',
  'Accept-Language': 'en-US,en;q=0.9',
}
```

注意：**已入库的中文 prompt 不受影响**，依然需要翻译按钮（ZH→EN）。新增数据同步后将直接是英文。

---

## Commit 2 — 首次访问默认英文

**Commit**: `e3014d9`
**文件**: `i18n/index.js`, `LoginModal.js`（初版，后被 Commit 3 完善）, `Register.js`（初版）

### i18n/index.js — 语言检测策略修改

**问题根因**：`i18next-browser-languagedetector` 默认检测顺序包含 `navigator`（浏览器语言），导致中文浏览器用户首次访问直接得到中文界面。

```js
// 修复前
detection: {
  order: ['localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage'],
}

// 修复后
detection: {
  order: ['localStorage'],   // 只读 localStorage
  caches: ['localStorage'],
}
```

**行为变化**：
- **新用户**（无 localStorage 记录）：检测不到语言 → 使用 `fallbackLng: 'en-US'` → 显示英文
- **选过中文的用户**：localStorage 有 `i18nextLng=zh-CN` → 继续显示中文，偏好保留
- **选过英文的用户**：localStorage 有 `i18nextLng=en-US` → 继续显示英文

---

## Commit 3 — LoginModal/Register 完整 i18n + 修复 JSON 重复键 Bug

**Commit**: `c777e45`
**文件**: `LoginModal.js`, `Register.js`, `en-US.json`, `zh-CN.json`

### 问题发现过程

Commit 2 将 LoginModal 中硬编码中文字符串替换为 `t('auth.welcomeBack')` 等 i18n 调用后，浏览器显示的却是原始键名字符串（如 `auth.welcomeBack`），而非翻译文本。

**排查过程**：

```bash
# 在 Node.js 验证 JSON 解析结果
node -e "console.log(require('./client/src/i18n/locales/en-US.json').auth)"
# 输出: { toast: { loginSuccess: 'Welcome back!', ... } }
# 预期: { welcomeBack: 'Welcome Back', login: { ... }, toast: { ... } }
```

JSON 文件看起来有完整的 `auth` 对象（1000+ 行），但解析后只剩 `toast`。

**根本原因**：JSON 规范允许重复键，但 JS 解析器保留**最后一个**同名键的值。

两个 locale 文件都在 JSON 根层级有**两个 `auth` 对象**：
- 第一个（完整版）：~line 135，包含 `welcomeBack`、`login`、`register`、`toast` 等所有子键
- 第二个（最小版）：~line 799（en-US）/ ~line 844（zh-CN），只包含 `auth: { toast: {...} }`

这个 bug 是**历史遗留**，推测是某次重构时只迁移了部分内容，留下了孤立的 `auth.toast` 块。之前没暴露是因为没有代码引用 `auth.welcomeBack` 等键——直到本次给 LoginModal 接入 i18n 才触发。

**修复**：将 `toast` 子对象移入第一个完整 `auth` 块，删除第二个孤立 `auth` 块。

**验证**：

```bash
node -e "
  const en = require('./client/src/i18n/locales/en-US.json');
  const zh = require('./client/src/i18n/locales/zh-CN.json');
  console.log('en auth.welcomeBack:', en.auth.welcomeBack);
  console.log('en auth.login.tabPassword:', en.auth.login.tabPassword);
  console.log('en auth.toast.loginSuccess:', en.auth.toast.loginSuccess);
  console.log('zh auth.welcomeBack:', zh.auth.welcomeBack);
  console.log('zh auth.login.tabPassword:', zh.auth.login.tabPassword);
  console.log('en register.inviteCode:', en.register.inviteCode);
  console.log('zh register.inviteCode:', zh.register.inviteCode);
"
# 输出:
# en auth.welcomeBack: Welcome Back         ✅
# en auth.login.tabPassword: Password       ✅
# en auth.toast.loginSuccess: Welcome back! ✅
# zh auth.welcomeBack: 欢迎回来             ✅
# zh auth.login.tabPassword: 密码登录       ✅
# en register.inviteCode: Invite Code       ✅
# zh register.inviteCode: 邀请码            ✅
```

### 新增翻译键清单

**`auth.login.*`**（LoginModal 专用）：

| Key | EN | ZH |
|-----|----|----|
| `or` | "or" | "或" |
| `tabPassword` | "Password" | "密码登录" |
| `tabMagic` | "Magic Link" | "魔法链接" |
| `emailAndPasswordRequired` | "Email and password are required" | "请输入邮箱和密码" |
| `googleFailed` | "Google login failed. Please try again." | "Google 登录失败，请重试" |
| `googleCancelled` | "Google login was cancelled." | "Google 登录已取消" |
| `magicEmailRequired` | "Please enter your email address" | "请输入邮箱地址" |
| `sendFailed` | "Failed to send. Please try again." | "发送失败，请重试" |
| `signInWithEmail` | "Sign in with Email" | "邮箱登录" |
| `signingIn` | "Signing in..." | "登录中..." |
| `magicSent` | "Check your inbox!" | "请查收邮件！" |
| `magicSentDesc` | "We sent a login link to {{email}}" | "我们已向 {{email}} 发送登录链接" |
| `resend` | "Send again" | "重新发送" |
| `magicDesc` | "We'll send a one-click login link to your email" | "我们将向您的邮箱发送一键登录链接" |
| `sending` | "Sending..." | "发送中..." |
| `sendLoginLink` | "Send Login Link" | "发送登录链接" |

**`register.*`**（Register 页补充）：

| Key | EN | ZH |
|-----|----|----|
| `googleNote` | "Google account users don't need a password" | "Google 账号用户无需设置密码" |
| `orEmail` | "or register with email" | "或使用邮箱注册" |
| `inviteCode` | "Invite Code" | "邀请码" |
| `inviteCodeDesc` | "Have an invite code? Both of you get +200 credits!" | "有邀请码？双方各获得 200 积分奖励！" |
| `inviteCodePlaceholder` | "Enter invite code (optional)" | "输入邀请码（选填）" |

### LoginModal.js i18n 改造

完整替换：
- `const { t, i18n } = useTranslation();`
- GoogleLogin: `locale={i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US'}`
- 所有 UI 文字通过 `t()` 调用

### Register.js i18n 补充

- 补上 `i18n` 解构：`const { t, i18n } = useTranslation()`
- GoogleLogin locale 动态化
- 5 个硬编码中文字符串替换为 `t()` 调用

---

## 浏览器验证

截图确认（localhost:3100）：
- 首页：导航栏显示英文（Home / Prompt Gallery / Video Gallery / Sref Gallery）✅
- LoginModal：
  - 标题 "Welcome Back" ✅
  - 副标题 "Sign in to your account" ✅
  - Tabs "Password" / "Magic Link" ✅
  - 输入框 placeholder 英文 ✅
  - 按钮 "Sign in with Email" ✅
  - 底部 "Forgot password?" / "Don't have an account? Sign up" ✅
- Console：无 JS 错误（Google OAuth origin 警告为预存问题，与本次无关）✅

---

## 经验总结

### 陷阱：JSON 重复键静默 Bug

JSON 规范不禁止重复键，浏览器/Node.js 均取最后一个值。这类 bug 极难发现：
- 编辑器和 JSON linter 通常不报错（或仅警告）
- 文件视觉上看起来完整，实际解析结果截然不同
- 只在引用被覆盖的键时才暴露

**防范建议**：
1. 在 CI 中加 `jsonlint --quiet` 或 `jq . < file.json > /dev/null` 检查
2. 重构 i18n 文件时，修改后立即用 Node.js `require()` 验证关键键是否存在

### MyMemory 免费 API 限制

- 500 字符/请求（URL 编码后的实际字符数，中文编码膨胀 3x）
- 超限不报 HTTP 错误，直接返回 `"QUERY LENGTH LIMIT EXCEEDED"` 作为翻译结果
- **正确处理**：检测返回值中的错误字符串，分块重试

### i18n 语言检测策略

`i18next-browser-languagedetector` 的 `navigator` 检测源会读取浏览器 `navigator.language`，对中文用户直接触发中文模式。如果产品默认语言是英文（无论用户系统语言），必须将检测顺序限制为 `['localStorage']`，依赖 `fallbackLng` 兜底。

---

## 文件变更索引

| 文件 | 改动 |
|------|------|
| `client/src/services/translateApi.js` | 新增 `translateToEn`（ZH→EN，480字符分块） |
| `client/src/components/UI/TranslateButton.js` | 改用 `translateToEn`，接入 i18n |
| `client/src/components/SEO/SEOHead.js` | 删除死引用 `supportedLanguages`（修复 crash） |
| `server/services/githubSync.js` | YouMind API locale `zh-CN` → `en-US` |
| `client/src/i18n/index.js` | 检测顺序 `['localStorage']`，移除 navigator/htmlTag |
| `client/src/components/Auth/LoginModal.js` | 完整 i18n 接入（全部 UI 文字） |
| `client/src/pages/Register.js` | i18n 补充（Google locale + 5个新键） |
| `client/src/i18n/locales/en-US.json` | 新增 `auth.login.*` + `register.*`；修复重复 `auth` 键 |
| `client/src/i18n/locales/zh-CN.json` | 同上（中文版） |
