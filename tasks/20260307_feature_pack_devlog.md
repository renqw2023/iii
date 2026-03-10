# 开发日志 — 阶段24 功能包 + 邮件系统重构

**日期**: 2026-03-07
**提交**: `7e09dd1` (Feature Pack) · `06da6b3` (Email Templates)
**分支**: main

---

## 一、背景

本次开发完成两项主要工作：
1. **5-Feature 功能包**（Magic Link / 全局搜索 / 卡片光晕 / Prompt 翻译 / img2prompt）
2. **邮件模板全面重构**（英文高级感设计 + SMTP 修复 + 补充缺失方法）

---

## 二、Feature 1 — Magic Link 无密码登录

### 功能描述
用户可通过邮箱接收一次性登录链接，无需记忆密码即可登录。

### 技术实现

**后端** (`server/routes/auth.js`)
```
POST /api/auth/magic-link/request
  - 接收 { email }
  - 查找 isActive: true 的用户（安全：不存在也返回成功消息）
  - 生成 crypto.randomBytes(32) token，有效期 15 分钟
  - 存入 user.magicLinkToken + user.magicLinkExpires
  - 调用 emailService.sendMagicLinkEmail() 发送链接

GET /api/auth/magic-link/verify?token=xxx
  - 查找 { magicLinkToken, magicLinkExpires > now, isActive: true }
  - 清除 token（一次性使用）
  - 若 emailVerified=false 则自动验证
  - 返回 JWT + user
```

**后端** (`server/models/User.js`)
```js
magicLinkToken: { type: String, default: null }
magicLinkExpires: { type: Date, default: null }
```

**前端** (`client/src/components/Auth/LoginModal.js`)
- 登录弹窗新增 Tab 切换：「密码登录」| 「Magic Link」
- Magic Link Tab：输入邮箱 → 发送 → 显示"邮件已发送"状态
- 点击邮件链接 → 跳转 `/magic-link/verify?token=xxx`

**前端** (`client/src/pages/MagicLinkVerify.js`)
- 路由 `/magic-link/verify`，读取 `?token` 参数
- 自动调用 `GET /api/auth/magic-link/verify`
- 成功：调用 `setAuthData(jwt, user)` 自动登录 → 跳转首页
- 失败：显示"链接已失效"+ 返回首页按钮

### 排错记录
- **问题**: 服务器启动后，auth.js 新增路由返回 404
- **原因**: 服务器进程运行在路由添加之前的旧版本，需重启
- **解决**: 重启 server 进程

---

## 三、Feature 2 — 全局搜索 Modal

### 功能描述
Header 搜索图标触发全局搜索弹窗，支持 Sref 风格 + Gallery 提示词搜索，展示浏览历史。

### 技术实现

**`client/src/services/searchApi.js`**
```js
searchSref(q)    → GET /api/sref?search=q&limit=8
searchGallery(q) → GET /api/gallery?search=q&limit=8
```

**`client/src/components/Search/SearchModal.js`**
- `debounce 300ms` 输入防抖
- 同时搜索 Sref + Gallery，分区展示结果
- 无输入时显示最近浏览历史（来自 localStorage）
- Esc 键 / 背景点击关闭

**`client/src/contexts/AuthContext.js`** — 新增全局状态：
```js
isSearchOpen, openSearch, closeSearch
```

**`client/src/App.js`** — 挂载 `<GlobalSearchModal />`（与 LoginModal 并列）

**`client/src/components/Layout/Header.js`** — 搜索图标 onClick → `openSearch()`

---

## 四、Feature 3 — 卡片鼠标跟随光晕

### 功能描述
鼠标悬停卡片时，以鼠标位置为中心出现紫色径向渐变光晕效果，增强视觉质感。

### 技术实现
纯 DOM 操作，不触发 React re-render：

```js
const handleMouseMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.background =
    `radial-gradient(160px at ${x}px ${y}px, rgba(99,102,241,0.12), transparent 80%)`;
};
const handleMouseLeave = (e) => {
  e.currentTarget.style.background = '';
};
```

**接入文件**: `GalleryCard.js`, `SrefCard.js`, `VideoCard.js`

---

## 五、Feature 4 — Prompt 翻译按钮

### 功能描述
Gallery 详情 Modal 和 Sref Modal 的 Prompt 区域新增翻译按钮，点击将英文 Prompt 翻译为中文（或切换回原文）。

### 技术实现

**`client/src/services/translateApi.js`**
```js
// 使用 MyMemory 免费翻译 API（无需 API Key）
translate(text, from='en', to='zh')
  → GET https://api.mymemory.translated.net/get?q=...&langpair=en|zh
```

**`client/src/components/UI/TranslateButton.js`**
- Props: `{ text, className }`
- 状态: `original | loading | translated`
- 显示: 「译 / EN」按钮，点击切换
- 翻译结果缓存在组件内（`translatedText` state）

**接入文件**: `GalleryModal.js`, `SrefModal.js`

---

## 六、Feature 5 — 图生文 /img2prompt

### 功能描述
上传图片 → 调用 GPT-4o Vision → 生成 Midjourney 风格 Prompt，扣除 1 积分。

### 技术实现

**`server/routes/tools.js`**
```
POST /api/tools/img2prompt
  - multer 接收图片（内存存储，max 5MB）
  - 转 base64 → OpenAI API gpt-4o
  - system prompt: 要求输出 Midjourney 风格 prompt
  - 扣 1 积分，记录 CreditTransaction
  - 返回 { prompt }
```

**`server/index.js`**: 注册 `/api/tools`

**`client/src/pages/Img2Prompt.js`** (`/img2prompt`)
- 拖拽上传区 + 点击选择
- 图片预览
- 生成结果 + 一键复制
- 积分消耗提示

> ⚠️ **待配置**: 需在 `server/.env` 添加 `OPENAI_API_KEY` 才能使用

---

## 七、邮件模板系统重构

### 重构目标
- 面向欧美用户，全英文界面
- 高级感品牌设计（暗色渐变 Header + 白色卡片）
- 统一组件系统，减少重复代码
- 修复缺失的 `sendPasswordResetSuccessEmail` 方法

### 设计系统

```
背景色:     #0d0d14（深色）
卡片色:     #ffffff
Header:     linear-gradient(135deg, #09090b → #1e1b4b → #2d1b69)
强调色:     #7c3aed（紫色）/ #4f46e5（靛蓝）
正文字色:   #09090b
次级字色:   #71717a
```

### 组件 API

```js
wrap(title, bodyHtml)        // 外层邮件布局
badge(icon, text)            // 顶部小标签（table 布局，兼容邮件客户端）
heading(text)                // 标题 h1
subtext(text)                // 副文本
ctaButton(href, label)       // CTA 按钮
urlFallback(url)             // 备用链接文本框
expiryNotice(text)           // 黄色过期提示
securityNotice(text)         // 绿色安全提示
divider                      // 分割线
```

### 5 个邮件模板

| 方法 | 邮件主题 | 用途 |
|------|---------|------|
| `sendVerificationCode(email, code)` | Your III.PICS verification code | 注册邮箱验证 |
| `sendWelcomeEmail(email, username)` | Welcome to III.PICS | 注册成功欢迎 |
| `sendPasswordResetEmail(email, username, token)` | Reset your III.PICS password | 忘记密码 |
| `sendPasswordResetSuccessEmail(email, username)` | Your III.PICS password has been changed | 密码重置成功 |
| `sendMagicLinkEmail(email, magicUrl)` | Sign in to III.PICS | Magic Link 登录 |

### SMTP 修复

**问题**: 端口 465（SSL）在当前服务器网络环境被防火墙封锁，导致 `ESOCKET` TLS 握手失败

**解决**: 阿里云 DirectMail 支持端口 80（非加密通道），连接 Aliyun 内部服务器后由阿里云负责 TLS 传输

```env
# 修改 server/.env
SMTP_PORT=80
SMTP_SECURE=false
```

同时在 `nodemailer.createTransport` 添加：
```js
tls: { rejectUnauthorized: false }
```

### 反垃圾邮件调试记录

Welcome 邮件被阿里云内容过滤器拦截（554 spam），排查过程：

| 测试内容 | 结果 |
|---------|------|
| `display:inline-flex` 在 badge 组件 | ⚠️ 触发拦截（合并其他因素）|
| 3 层嵌套 `<table>` 结构 | ✅ 单独不触发 |
| `&amp;` HTML 实体 | ✅ 单独不触发 |
| Feature 列表（4 项嵌套 table） | ✅ 单独不触发 |
| 全部组合（原始模板） | ❌ 触发拦截 |
| 改用 `<div>` + `<p>` 替代嵌套 table 的功能列表 | ✅ 通过 |

**最终方案**: 将 feature list 由多层 `<table>` 改为 `<div>` + `<p>` 列表，所有 `flex` 布局改为 `table` 布局

---

## 八、待办事项

| 优先级 | 事项 | 说明 |
|--------|------|------|
| 高 | 配置 `OPENAI_API_KEY` | img2prompt 功能依赖 |
| 高 | Dashboard 界面重构 | 当前使用旧版组件 + 伪造数据 |
| 中 | 生产环境 SMTP 测试 | 验证端口 80 在生产服务器可用 |
| 低 | Header 加 /img2prompt 入口 | 待 img2prompt 正式上线后 |

---

## 九、关键配置参考

### server/.env 当前关键字段
```env
EMAIL_ENABLED=true
SMTP_HOST=smtpdm.aliyun.com
SMTP_PORT=80           ← 已修改（原465）
SMTP_SECURE=false      ← 已修改（原true）
SMTP_USER=i@mail.iii.pics
EMAIL_FROM_ADDRESS=i@mail.iii.pics
GOOGLE_CLIENT_ID=...   ← Google OAuth
CLIENT_URL=https://iii.pics
```

### 路由表（本次新增）
```
POST /api/auth/magic-link/request  ← Magic Link 请求
GET  /api/auth/magic-link/verify   ← Magic Link 验证
POST /api/tools/img2prompt         ← 图生文（需 OPENAI_API_KEY）
```

### 前端路由（本次新增）
```
/magic-link/verify  → MagicLinkVerify.js
/img2prompt         → Img2Prompt.js
```
