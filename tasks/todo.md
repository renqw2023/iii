# 大改造路线图 — 用户体系 + 积分 + 收藏 + 历史

**创建日期**: 2026-03-06
**目标**: 对标 MeiGen.ai，接入 Google 登录、个人中心、积分系统、收藏、浏览历史等核心用户功能
**上下文保护**: 每个阶段完成后必须在本文件更新 "## 当前进度" 节，防止上下文丢失后迷失方向

---

## 当前进度（每次恢复工作前先读这里）

**最后更新**: 2026-03-09 — 阶段28 全部完成，InviteModal 新建，邀请卡全页面可见，零 console 错误
**当前阶段**: 阶段28 完整收尾
**下一步**:
  - 配置 OPENAI_API_KEY 环境变量（server/.env）以启用 img2prompt
  - 配置 STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET → 重启 server（积分购买上线）
  - 可选：全局搜索 Modal 体验优化

## 已完成 — 5-Feature 功能包（2026-03-06）

- ✅ Feature 1: Magic Link 登录
  - User model 追加 magicLinkToken/magicLinkExpires
  - emailService.sendMagicLinkEmail()
  - POST /api/auth/magic-link/request + GET /api/auth/magic-link/verify
  - MagicLinkVerify.js 页面（/magic-link/verify）
  - LoginModal 新增密码/Magic Link 双 Tab 切换
- ✅ Feature 2: 全局搜索 Modal
  - searchApi.js（searchSref + searchGallery）
  - SearchModal.js（debounce 搜索 + 浏览历史展示）
  - AuthContext 追加 isSearchOpen/openSearch/closeSearch
  - Header 搜索图标 → openSearch()
  - App.js 挂载 GlobalSearchModal
- ✅ Feature 3: 卡片鼠标跟随光晕
  - GalleryCard.js + SrefCard.js + VideoCard.js 均追加 handleMouseMove/handleMouseLeave
  - 纯 DOM 操作，radial-gradient 160px 光晕，不触发 re-render
- ✅ Feature 4: Prompt 翻译按钮
  - translateApi.js（MyMemory 免费 API）
  - TranslateButton.js 通用组件（点击翻译/切回原文）
  - GalleryModal.js + SrefModal.js 均已集成
- ✅ Feature 5: 图生文 /img2prompt
  - server/routes/tools.js（multer + OpenAI gpt-4o Vision，扣 1 积分）
  - server/index.js 注册 /api/tools 路由
  - Img2Prompt.js 页面（拖拽上传+预览+结果+复制）
  - App.js 追加 /img2prompt 路由

**已完成清单（本阶段）**:
  - ✅ Phase F：邀请码系统（User 自动生成 inviteCode，注册时接收邀请码，双方各得 200 积分，Credits 页显示我的邀请码 + 一键复制链接）
  - ✅ Google OAuth ESLint 修复（LoginModal import 顺序 + GOOGLE_CLIENT_ID 条件渲染）
  - ✅ Google OAuth 根因定位：CRA dev server 需重启才能读取新增 env var
  - ✅ ESLint import/first 错误修复（App.js 所有 import 移至顶部）
  - ✅ ESLint 未使用变量清理（GalleryCard/VideoCard/Header/Hero/Home）
  - ✅ GOOGLE_CLIENT_ID 环境变量已由用户配置（server/.env + client/.env）
  - ✅ Phase A：Google OAuth + LoginModal（全局挂载，AuthContext 管理）
  - ✅ Phase B：收藏系统（server/models/Favorite.js + routes/favorites.js + favoritesApi.js + Favorites.js 重写为 Sref/Gallery/Seedance 三 Tab）
  - ✅ Phase C：积分系统（CreditTransaction.js + routes/credits.js + Credits.js 页面 + CreditsDisplay.js）
  - ✅ Phase D：Dashboard 增强（积分余额卡片 + 每日签到按钮 + 收藏/历史快捷入口）
  - ✅ Phase E：浏览历史（useBrowsingHistory.js + History.js，localStorage，GalleryModal/SeedanceModal 已接入）
  - ✅ FavoriteButton.js（通用收藏按钮，集成到 SrefCard/GalleryCard/VideoCard）
  - ✅ MobileDock（移动端底部悬浮导航，5 图标：首页/探索/收藏/历史/积分）

---

## 架构现状摘要（快速参考）

| 项目 | 详情 |
|------|------|
| Server 端口 | 5500 |
| Client 端口 | 3100 |
| Server proxy | client/package.json: "proxy": "http://localhost:5500" |
| 数据库 | MongoDB，mongoose |
| Auth 方式 | JWT（localStorage 存 token），7d 有效期 |
| User.favorites | 已有，但只 ref 'Post'（需扩展） |
| User.password | required: true（Google 登录后需改为 optional） |
| User.googleId | 不存在（需新增） |
| User.credits | 不存在（需新增） |
| 邮件服务 | nodemailer，config.email.enabled 控制 |
| node-cron | server 已安装（用于每日积分重置） |
| 前端路由 | /login /register /verify-email /favorites /dashboard /settings |
| 保护路由 | ProtectedRoute 组件，检查 isAuthenticated |

### 关键文件路径

```
server/
  models/User.js          ← 需改：加 googleId, credits, authProvider
  routes/auth.js          ← 需改：加 /google, /checkin
  middleware/auth.js      ← 不变
  config/index.js         ← 需改：加 GOOGLE_CLIENT_ID

client/src/
  contexts/AuthContext.js ← 需改：加 loginWithGoogle
  components/Layout/Header.js ← 需改：登录按钮改触发 Modal
  pages/Login.js          ← 保留（直接 URL 访问）
  pages/Favorites.js      ← 需改：支持多类型
```

---

## Phase A — Google OAuth + Login Modal

**目标**: 用户可用 Google 账号一键登录，无需跳转到 /login 页

### A1. 服务器端 — Google 验证接口

**文件**: `server/models/User.js`
- 新增字段：
  ```js
  googleId: { type: String, default: null, sparse: true }
  authProvider: { type: String, enum: ['local','google'], default: 'local' }
  // password 改为 optional（Google 用户无密码）:
  password: { type: String, minlength: 6 }  // 移除 required: true
  ```
- `pre('save')` 中的 bcrypt 已有 `if (!this.isModified('password'))` 保护，不需改

**文件**: `server/config/index.js`
- `get services()` 中加：
  ```js
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  }
  ```

**安装依赖**: `cd server && npm install google-auth-library`

**文件**: `server/routes/auth.js`
- 新增路由 `POST /google`：
  ```
  接收 { credential: googleIdToken }
  → google-auth-library 验证 token
  → 提取 { sub: googleId, email, name, picture }
  → findOne({ googleId }) 或 findOne({ email })
  → 新用户：create({ googleId, email, username: 生成, authProvider: 'google', emailVerified: true, isActive: true })
  → 老用户（email 匹配但 googleId 为空）：绑定 googleId
  → 生成 JWT，返回 { token, user }
  ```

### A2. 前端 — LoginModal 组件

**安装依赖**: `cd client && npm install @react-oauth/google`

**新建文件**: `client/src/components/Auth/LoginModal.js`
- Modal overlay，包含：
  - Google 登录按钮（@react-oauth/google 的 `<GoogleLogin>`）
  - 分割线
  - 邮箱/密码表单（复用现有 login 逻辑）
  - 注册链接
- Props: `{ isOpen, onClose }`

**文件**: `client/src/App.js`
- 用 `<GoogleOAuthProvider clientId={...}>` 包裹整个 App

**文件**: `client/src/contexts/AuthContext.js`
- 新增 `loginWithGoogle(credential)` 方法：
  ```js
  POST /api/auth/google → 同 login 流程（存 token, dispatch LOGIN_SUCCESS）
  ```

**文件**: `client/src/components/Layout/Header.js`
- 未登录时：原来 Link to="/login" → 改为按钮 `onClick={openLoginModal}`
- 从外部 Context 或 props 获取 openLoginModal

**推荐方案**: 在 AuthContext 中加 `isLoginModalOpen` + `openLoginModal` + `closeLoginModal` 状态

### A3. 环境变量

```env
# server/.env 需新增
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

```js
// client/src/config/constants.js 或环境变量
REACT_APP_GOOGLE_CLIENT_ID=same-client-id
```

---

## Phase B — 收藏系统重构

**目标**: 用户可收藏 Sref / Gallery / Seedance 三种内容，分类展示

### B1. 数据模型

**新建文件**: `server/models/Favorite.js`
```js
{
  userId: { type: ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['sref','gallery','seedance'], required: true },
  targetId: { type: ObjectId, required: true },
  createdAt: { type: Date, default: Date.now }
}
// 复合唯一索引: { userId, targetType, targetId }
// 普通索引: { userId, createdAt: -1 }
```

**注意**: 保留 `User.favorites`（Post 收藏），避免破坏现有功能。新三种类型用新 Favorite 模型。

### B2. API 路由

**新建文件**: `server/routes/favorites.js`

```
POST   /api/favorites          { targetType, targetId } → 收藏（需登录）
DELETE /api/favorites/:id      → 取消收藏（需登录）
GET    /api/favorites          ?type=sref|gallery|seedance&page=1 → 获取列表（需登录）
GET    /api/favorites/check    ?targetType=sref&targetId=xxx → 检查是否已收藏（需登录）
```

在 `server/index.js` 注册路由。

### B3. 前端

**新建文件**: `client/src/services/favoritesApi.js`

**新建文件**: `client/src/components/UI/FavoriteButton.js`
- 心形图标，点击 toggle 收藏
- 显示收藏状态（红心 / 空心）
- 未登录时：点击弹出 LoginModal

**改动文件**: `client/src/components/Sref/SrefCard.js` — 加 FavoriteButton
**改动文件**: `client/src/components/Gallery/GalleryCard.js` — 加 FavoriteButton
**改动文件**: `client/src/components/Seedance/VideoCard.js` — 加 FavoriteButton

**改动文件**: `client/src/pages/Favorites.js`
- 当前只显示 Post 收藏
- 改为 Tab 切换：Sref | Gallery | Seedance | 帖子
- 每个 Tab 用对应卡片组件展示

---

## Phase C — 积分系统

**目标**: 用户有积分余额，每日签到领积分，积分变动有记录

### C1. 数据模型

**文件**: `server/models/User.js` 新增字段：
```js
credits: { type: Number, default: 0 },
lastCheckinAt: { type: Date, default: null }
```

**新建文件**: `server/models/CreditTransaction.js`
```js
{
  userId: { type: ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['earn','spend'], required: true },
  amount: { type: Number, required: true },
  reason: { type: String, enum: [
    'daily_checkin',   // 每日签到
    'invite_reward',   // 邀请奖励
    'register_bonus',  // 注册奖励
    'admin_grant',     // 管理员赠送
    'generate_image',  // 生成图片消耗（预留）
  ]},
  note: { type: String, default: '' },
  balanceAfter: { type: Number },  // 交易后余额（方便审计）
  createdAt: { type: Date, default: Date.now }
}
// 索引: { userId, createdAt: -1 }
```

### C2. API 路由

**新建文件**: `server/routes/credits.js`

```
GET  /api/credits/balance        → 获取当前积分余额（需登录）
POST /api/credits/checkin        → 每日签到（需登录，每天限一次）
GET  /api/credits/history        ?page=1&limit=20 → 积分流水（需登录）
```

**签到逻辑**:
```
检查 lastCheckinAt 是否是今天 → 是则返回 "今日已签到"
否则: credits += 10（可配置）, lastCheckinAt = now
记录 CreditTransaction
```

**注册奖励**: 在 `auth.js` 的 register 成功后 `credits += 50`

**邀请码（预留）**: 注册时可传 `inviteCode`，验证后双方各得 200 积分

### C3. 前端

**新建文件**: `client/src/services/creditsApi.js`

**新建文件**: `client/src/components/UI/CreditsDisplay.js`
- 硬币图标 + 数字，显示当前积分
- 集成到 Header（登录后显示）

**新建文件**: `client/src/pages/Credits.js`
- 积分余额大卡片
- 签到按钮（每日领取）
- 积分流水记录表格

在 `App.js` 注册路由 `/credits`（ProtectedRoute）

---

## Phase D — 个人中心增强

**目标**: Dashboard / Profile 页展示积分、收藏统计、浏览历史

### D1. Dashboard 增强

**文件**: `client/src/pages/Dashboard.js`（检查现有内容后决定改动范围）
- 顶部卡片：积分余额 + 今日签到状态
- 统计：收藏数（Sref/Gallery/Seedance）
- 快捷入口：我的收藏、积分记录、设置

### D2. Header 用户菜单增强

**文件**: `client/src/components/Layout/Header.js`
- 用户头像下拉菜单新增"我的积分"入口
- 显示积分余额角标

---

## Phase E — 浏览历史

**目标**: 记录用户最近浏览的内容，方便找回

### E1. 本地方案（localStorage，无需后端）

**新建文件**: `client/src/hooks/useBrowsingHistory.js`
```js
// 存储结构: localStorage key = 'browsing_history'
// 值: [{ id, type:'sref'|'gallery'|'seedance', title, image, visitedAt }]
// 最多保存 50 条，FIFO 淘汰
```

**改动文件**: `client/src/pages/PostDetail.js` / `SrefModal.js` / `GalleryModal.js` / `SeedanceModal.js`
- 打开详情时调用 `addToHistory(item)`

**新建文件**: `client/src/pages/History.js`
- 展示最近浏览，按时间倒序
- 支持清空历史
- 注册路由 `/history`（公开，无需登录）

---

## Phase F — 邀请系统（低优先级）

**目标**: 用户邀请好友注册，双方各得 200 积分

### F1. 数据模型
**文件**: `server/models/User.js` 新增：
```js
inviteCode: { type: String, unique: true, sparse: true },  // 我的邀请码
invitedBy: { type: ObjectId, ref: 'User', default: null }  // 我是被谁邀请的
```

### F2. API
- 注册时可带 `inviteCode` 参数
- 验证邀请码，找到邀请人，双方各加 200 积分

---

## 实施顺序 & 依赖关系

```
A (Google登录) ──┐
                  ├──→ D (个人中心)
B (收藏系统)  ──┤
                  │
C (积分系统)  ──┘
                      ↓
              E (浏览历史) ← 独立，随时可做
              F (邀请码)   ← 依赖 C
```

---

## 注意事项（避免踩坑）

1. **User.password 改为 optional**: 需要同时修改登录逻辑，确保 `local` 用户仍然必须有密码
2. **Google OAuth CORS**: Google 的 callback 不需要后端 redirect，使用 credential 模式（前端 token → 后端验证）更简单
3. **Favorite 复合唯一索引**: 防止重复收藏，前端乐观更新时要处理 409 冲突
4. **每日签到时区**: 用 UTC+8 判断"今天"，不要用 UTC
5. **react-query 缓存失效**: 收藏状态改变后要 invalidateQueries 相关 keys
6. **LoginModal 全局挂载**: 挂载在 App.js 顶层，避免多处重复渲染
7. **上下文切换时必读**: 重新开始工作前先读本文件 "当前进度" 节

---

## Result

**完成日期**: 2026-03-06

Phase A/B/C/D/E 全部实现完毕，ESLint 零错误，移动端 Dock 上线。

**新增文件**:
- `server/models/Favorite.js` — 收藏数据模型
- `server/models/CreditTransaction.js` — 积分流水模型
- `server/routes/favorites.js` — 收藏 API
- `server/routes/credits.js` — 积分 API
- `client/src/services/favoritesApi.js` — 收藏服务
- `client/src/services/creditsApi.js` — 积分服务
- `client/src/components/Auth/LoginModal.js` — 登录弹窗
- `client/src/components/UI/FavoriteButton.js` — 收藏按钮
- `client/src/components/UI/CreditsDisplay.js` — 积分显示
- `client/src/components/UI/MobileDock.js` — 移动端底部导航
- `client/src/pages/Credits.js` — 积分页
- `client/src/pages/History.js` — 浏览历史页
- `client/src/hooks/useBrowsingHistory.js` — 历史 Hook

**修改文件**:
- `server/models/User.js` — 加 googleId/authProvider/credits/lastCheckinAt
- `server/routes/auth.js` — 加 Google OAuth 路由
- `server/index.js` — 注册新路由
- `client/src/App.js` — GoogleOAuthProvider + GlobalLoginModal + 新路由
- `client/src/contexts/AuthContext.js` — loginWithGoogle + modal 状态
- `client/src/components/Layout/Header.js` — Login 按钮触发 Modal + CreditsDisplay
- `client/src/components/Layout/Layout.js` — 集成 MobileDock
- `client/src/pages/Favorites.js` — 重写为多类型 Tab
- `client/src/pages/Dashboard.js` — 积分卡片 + 快捷入口
- `client/src/pages/Home.js` — FanGallery 替换旧 gallery-grid
## Result (2026-03-11 Dynamic Background)

- 阅读并对照 `meigen_dynamic_background_analysis.md.resolved`，确认当前目标背景是纯 CSS mesh gradient 双层漂浮轨道动画，不依赖 Canvas / WebGL。
- 核对最近开发进度：截至 2026-03-10，项目已完成桌面 Dock、积分系统、Reverse Prompt 参考图等阶段；动态背景组件 `MeshBackground` 与样式文件已经落地，并已接入 `client/src/components/Layout/Layout.js`。
- 本次完成实际补全：将 `client/src/components/Layout/HomeLayout.js` 接入 `MeshBackground`，让首页、登录、注册、找回密码等公共页面与内容页使用同一套动态背景。
- 为公共布局补上 `relative isolate` 与 `relative z-10` 层级，确保背景固定在底层、不拦截交互，且内容稳定覆盖在动画之上。
## Result (2026-03-11 Dynamic Background Default Off)

- 保留 `MeshBackground` 组件与整套 mesh 动态背景样式，但将默认状态改为关闭显示。
- `MeshBackground` 新增 `enabled` 参数，只有显式传入时才会显示背景；当前布局层仍保留挂载，但默认不会渲染出动态背景。
- 恢复 `theme-variables.css` 中此前被动态背景调整过的 `--page-bg` / `--stage-bg`，让默认白色背景和原有暗色模式视觉都回到之前状态。

## Result (2026-03-11 Desktop Dock Motion Tuning)

- 调整 `client/src/components/UI/DesktopDock.js` 的 Dock hover 动效，降低放大强度并提高阻尼，让跟随感更稳、更顺。
- 将 Dock 入口 tooltip 从 `Image → Prompt` 改为 `Image Generation`。
- 将 `client/src/components/UI/Img2PromptPanel.js` 面板标题从 `Generate` 改为 `Image Generation`，保持入口与面板命名一致。
- 跟进微调：将 `DesktopDock` 的 spring 响应再提快一点，并进一步弱化单个 icon 的背景和边框，让图标更像直接浮在毛玻璃 Dock 上。
- 继续向 macOS Dock 手感微调：提高 `DesktopDock` 的 hover 放大幅度和影响半径，同时保持 icon 本身仍是轻背景、轻边框，不回到明显独立容器的视觉。
- `DesktopDock` 新增按滚动位置显隐的“Back to Top”入口：滚动超过约 20-30 张图的可视深度后出现，回到顶部后自动消失，并带动 Dock 做居中横向展开 / 收回动效。
## Result (2026-03-11 Homepage Background And Sidebar Tuning)

- Confirmed the light theme base background is still `--bg-primary` (`#ffffff`), and the purple homepage look came from `.home-dark-area` using `--page-bg`.
- Replaced the homepage `.home-dark-area` background with `var(--bg-primary)` so the landing content area can be reviewed on a plain white base.
- Changed the footer container background from `var(--bg-secondary)` to `var(--bg-primary)` for a cleaner white surface.
- Changed the desktop sidebar shell background to `rgba(255, 255, 255, 0.5)` to preserve a half-transparent white look.
- Briefly enabled `MeshBackground` for visual comparison, confirmed that transparency becomes more visible only when a stronger background exists underneath, then restored the background layer to the default off state.
- Added a detailed record at `docs/2026/20260311_首页背景与侧边栏透明度调试开发文档.md`.
## Current Task (2026-03-11 Sidebar Avatar Menu Language Entry)

- Goal: add the homepage language switching capability into the sidebar avatar popup and fix the popup being clipped.
- Files to change:
  - `client/src/components/Layout/Sidebar.js`
- Approach:
  - reuse the existing i18n language state in the sidebar menu
  - add a single `Language` row with an inline selector in the avatar popup
  - enlarge the popup and relax sidebar overflow so the menu is no longer cut off
- Risks:
  - the popup currently lives inside the sidebar shell, so overflow settings can still clip it if not adjusted correctly
  - the selector must only use supported runtime languages: `zh-CN`, `en-US`, `ja-JP`

## Result (2026-03-11 Sidebar Avatar Menu Language Entry)

- Added a language selector directly inside `client/src/components/Layout/Sidebar.js` avatar popup, reusing the existing i18n language state.
- Increased the popup width and internal spacing so the extra control fits without crowding the menu.
- Changed the sidebar shell overflow from hidden to visible so the popup is no longer clipped by the sidebar container.
- Verified with `npm run build` in `client/`: build succeeded, with only pre-existing ESLint warnings remaining elsewhere in the project.
## Current Task (2026-03-11 Legacy Utility Pages Refactor Plan)

- Goal:
  - 为 `/history`、`/favorites`、`/dashboard`、`/create`、`/help`、`/about`、`/privacy`、`/terms`、`/contact` 制定一份完整的重构优化计划，使其内容、信息架构、视觉层级、交互方式与当前项目的首页 / 侧边栏 / stage 风格保持一致。
- Scope / likely files:
  - `client/src/pages/History.js`
  - `client/src/pages/Favorites.js`
  - `client/src/pages/Dashboard.js`
  - `client/src/pages/CreatePost.js`
  - `client/src/pages/About.js`
  - `client/src/pages/Help.js`
  - `client/src/pages/Privacy.js`
  - `client/src/pages/Terms.js`
  - `client/src/pages/Contact.js`
  - `client/src/components/Dashboard/*`
  - `client/src/components/Layout/Footer.js`
  - `client/src/components/UI/*`（抽离统一 page shell / section header / empty state / legal block 时使用）
  - `client/src/i18n/modules/about.js`
  - `client/src/i18n/modules/help.js`
  - `client/src/i18n/modules/privacy.js`
  - `client/src/i18n/modules/contact.js`
  - `client/src/i18n/locales/*.json`
- Current-state findings:
  - 这些页面大多仍使用早期的 `bg-gradient-to-br from-slate-50 to-blue-50 + bg-white card + shadow-lg` 模板，和当前项目已经形成的 `MeshBackground + glass sidebar + stage / gallery` 风格脱节。
  - 功能页存在重复与割裂：`/dashboard` 只保留 Saved / History / Credits 的轻量整合版，而 `/favorites`、`/history`、`/credits` 各自又有独立管理页，信息架构缺少清晰主次。
  - `/create` 仍是一个大体量表单页，视觉和结构都停留在旧版样式，尚未吸收 `CreatePrompt` 的模块化拆分经验。
  - `/contact` 仍是前端 `setTimeout` 模拟提交，不符合“真实支持入口”的内容预期。
  - `/about`、`/help`、`/privacy`、`/terms` 使用大段静态/翻译文案堆叠，缺少目录、跳转、更新时间、适用范围、产品模块映射，也没有反映项目当前已有能力（Explore / Gallery / Seedance / Credits / Invite / Img2Prompt 等）。
  - 多处页面存在硬编码英文、旧品牌表述和过时联系方式展示方式，与全局 i18n 和当前导航结构不完全一致。
- Refactor principles:
  - 内容先行：先按当前产品能力重写信息结构，再做 UI 包装，避免“旧内容套新皮”。
  - 统一 page shell：公共信息页与工具页都应落在统一的 page shell 上，继承当前项目的留白、圆角、边框、glass / stage 关系和响应式断点。
  - 分层展示：首屏只放关键信息、主要 CTA 和最近操作；长文档内容用目录、锚点、折叠、摘要卡片降低阅读成本。
  - 功能去重：把 dashboard 定位成“个人工作台入口”，把 favorites / history 定位成“深度管理页”，避免二者互相替代。
  - 组件复用：把 hero header、section title、stat card、filter chips、empty state、legal content block 抽成共享组件，减少九个页面各写一套。
  - 文案可维护：将法律/帮助/品牌介绍内容改成结构化配置，支持多语言和后续内容增删。

### Planned tasks

1. Information architecture refresh
   - 重新定义九个页面的角色：
   - `/dashboard` = 个人概览、快捷入口、关键状态、最近行为
   - `/favorites` = 收藏资产管理
   - `/history` = 最近浏览与回访入口
   - `/create` = 发布入口与创作引导
   - `/about` `/help` `/privacy` `/terms` `/contact` = 品牌、支持、合规、联系四类信息页

2. Shared page-shell system
   - 新增统一的 `PageHero / PageSection / PagePanel / EmptyState / LegalSection / SupportCard / UtilityActionBar` 组件。
   - 将旧页面从“单页堆卡片”切到“hero + summary + content sections + CTA”结构。

3. Dashboard restructuring
   - 保留当前顶部用户信息与积分状态，但升级为更明确的工作台。
   - 增加“继续浏览 / 最近收藏 / 创作入口 / 账户状态 / 快捷操作”五个模块。
   - 将历史、收藏、积分列表压缩为预览区块，并始终提供通往独立管理页的 CTA。

4. Favorites page redesign
   - 从单纯 tab + 网格改为“统计摘要 + 类型筛选 + 排序/分页 + 批量管理预留”结构。
   - 补齐空状态引导，直接链接到 `/explore`、`/gallery`、`/seedance`。
   - 卡片信息增加收藏时间、来源类型、快速移除反馈。

5. History page redesign
   - 从纯缩略图网格改为“最近访问时间线 + 媒体网格混合布局”，突出“继续上次浏览”。
   - 支持按内容类型、最近时间、是否有封面过滤。
   - 将“清空历史”下沉到二级危险操作区，减少误触。

6. Create page modernization
   - 参考 `CreatePrompt` 的拆分方式，把 `CreatePost.js` 拆成上传区、基础信息、参数编辑、预览、提交流程几个子模块。
   - 首屏加入创作说明、支持格式、最佳实践、草稿/示例提示。
   - 参数区改成更强的分组与即时预览，弱化传统后台表单感。
   - 后续 UI 分析阶段可使用 `mcp` 做表单流和可视布局核验。

7. Static content pages rewrite
   - `About`: 从“团队介绍页”升级为“平台定位 + 核心能力 + 内容生态 + 路线图/价值观”。
   - `Help`: 改成按任务组织的帮助中心，不再只是长 FAQ；增加搜索、快速入口、联系支持 CTA。
   - `Privacy` / `Terms`: 改成法律文档中心样式，支持目录导航、更新时间、适用模块说明、联系法务入口。
   - `Contact`: 改成真实支持中心，区分商务合作、问题反馈、账号/支付支持；如后端未接 API，则先明确为邮件主入口，避免伪表单。

8. Content and i18n cleanup
   - 清理硬编码文案、旧产品描述、过时链接和模拟逻辑。
   - 将页面文案切成结构化配置，便于多语言和后续运营维护。
   - 对 `Footer` 的相关入口文案进行同步校准，避免信息页改版后导航描述仍旧。

9. Verification plan
   - 实施阶段完成后，对每个重构页执行桌面 / 移动断点检查、功能流验证、SEO 标题与元信息检查。
   - 进入 UI 核验时，使用 `mcp__chrome-devtools__navigate_page`、`take_snapshot`、`take_screenshot`、`list_console_messages` 做真实页面复核。

- Risks:
  - `dashboard`、`favorites`、`history` 之间边界不清，若不先定角色，后续很容易再次重复建设。
  - `contact` 真正提交链路可能依赖后端或第三方服务，若本次只做前端，需要明确降级方案。
  - 法律与品牌文案需要产品/运营确认，如果没有最终版本，建议先做结构与占位策略，再逐步替换正式内容。
  - `CreatePost` 体积较大，拆分时要避免影响现有上传、参数预览和提交逻辑。
  - i18n 文案量较大，建议和 UI 重构拆成两批提交，降低回归风险。

## Result (2026-03-11 Legacy Utility Pages Refactor Phase 1)

- 新增统一页面骨架组件：
  - `client/src/components/Page/PageShell.js`
  - 提供 `PageShell`、`SectionCard`、`SectionGrid`、`AnchorNav`、`DetailList`
- 已完成统一骨架迁移的页面：
  - `client/src/pages/About.js`
  - `client/src/pages/Help.js`
  - `client/src/pages/Privacy.js`
  - `client/src/pages/Terms.js`
  - `client/src/pages/Contact.js`
  - `client/src/pages/History.js`
  - `client/src/pages/Favorites.js`
  - `client/src/pages/Dashboard.js`
  - `client/src/pages/CreatePost.js`
- 本轮重点成果：
  - 把旧的“浅色渐变 + 白卡片”信息页统一迁移到新的 page shell 体系
  - `About` 改成平台定位 + 产品面向 + 路线图表达，不再只是旧式团队介绍页
  - `Help` 改成任务导向结构，增加搜索和快捷入口
  - `Privacy` / `Terms` 改成法律文档中心样式，加入锚点导航
  - `Contact` 去掉伪异步提交，改为真实的 `mailto` 草稿发起流程
  - `History` / `Favorites` / `Dashboard` / `CreatePost` 完成首屏结构、信息层级和视觉风格的第一阶段统一
- 验证：
  - `npm run build` 通过
  - 浏览器核验已执行：
    - `http://127.0.0.1:3100/about`
    - `http://127.0.0.1:3100/contact`
  - 验证截图：
    - `output/about-refactor-check.png`
    - `output/contact-refactor-check.png`
- 剩余深化项：
  - `Dashboard` 还可以继续补回更丰富的预览模块，而不只是快捷工作台骨架
  - `CreatePost` 还没有拆成独立子组件，当前先保留原逻辑外层升级
  - 部分页面仍有中英混排，需要进入下一轮内容细化和 i18n 收口
  - 浏览器控制台里仍有与现有全局面板/后端接口相关的旧 CORS 噪音，不是这轮页面骨架改动引入的
## Result (2026-03-11 Legacy Utility Pages Refactor Phase 2)

- Deepened `client/src/pages/Dashboard.js` into a real workspace overview:
  - kept the existing header and stats modules
  - added quick actions for create, favorites, history, and credits
  - added live preview panels for recent browsing history, favorites, and credit activity
- Reworked `client/src/pages/CreatePost.js` into a guided publishing surface without changing submit behavior:
  - added creator guidance and parameter tips in the page aside
  - split the page into clearer upload, basic info, style parameters, and review/publish sections
  - added draft summary cards and a stronger live parameter preview treatment
- Verification:
  - `npm run build` passed in `client/`
  - browser verification executed for protected routes
  - `http://127.0.0.1:3100/create` redirected to `http://127.0.0.1:3100/login` with no console errors
  - `http://127.0.0.1:3100/dashboard` redirected to `http://127.0.0.1:3100/login` with no console errors
  - screenshots saved to:
    - `output/create-route-check.png`
    - `output/dashboard-route-check.png`
- Remaining follow-up:
  - authenticated visual verification is still needed for the full in-app appearance of `/create` and `/dashboard`
  - project-wide ESLint warnings remain in unrelated files and were not introduced by this phase
## Result (2026-03-11 Docs Center Consolidation)

- Replaced the separate `/about`, `/help`, `/privacy`, `/terms`, and `/contact` experience with a single docs-style hub:
  - new page: `client/src/pages/DocsCenter.js`
  - layout follows the reference pattern: left section navigation, central long-form docs content, right-side "On this page"
  - includes Quick Start, About, Help, Privacy, Terms, and Contact sections in one place
- Updated routing in `client/src/App.js`:
  - added `/docs`
  - legacy routes now redirect to section anchors:
    - `/about` → `/docs#about`
    - `/help` → `/docs#help`
    - `/privacy` → `/docs#privacy`
    - `/terms` → `/docs#terms`
    - `/contact` → `/docs#contact`
- Updated the sidebar avatar menu in `client/src/components/Layout/Sidebar.js`:
  - replaced the previous `Help` entry with a new `Docs` entry pointing to `/docs`
- Verification:
  - `npm run build` passed in `client/`
  - browser verification confirmed:
    - `/docs` renders the new docs center layout
    - `/help` redirects to `http://127.0.0.1:3100/docs#help`
  - screenshot saved to:
    - `output/docs-center-check.png`
- Known limitation:
  - the avatar popup entry is wired in code, but full click-through verification still needs an authenticated session
  - console still shows the existing global CORS noise from `localhost:5500`, unrelated to this docs refactor
## Result (2026-03-11 Docs Center Refinement)

- Refined the standalone docs experience to be closer to the reference quickstart page:
  - updated `client/src/components/Layout/DocsLayout.js` to use a dedicated docs-style shell without the app sidebar
  - tightened the docs header and overall page rhythm so the content reads more like a documentation article than a utility dashboard
- Rebuilt `client/src/pages/DocsCenter.js` around a more documentation-oriented information hierarchy:
  - article-style main content
  - left section navigation
  - right-side "On this page" navigation
  - cleaner section/subsection flow with less card-heavy framing
- Extracted docs copy into a dedicated localized content source:
  - new file: `client/src/content/docsContent.js`
  - English, Chinese, and Japanese versions are now defined from one content model
  - docs content no longer depends on the older mixed-language page fragments
- Verification:
  - `npm run build` passed in `client/`
  - browser verification confirmed `/docs` renders in the standalone layout
  - browser verification confirmed legacy routes like `/contact` still redirect into the docs page anchor
  - `document.title` on `/docs` resolves to `Quick Start - III.PICS Docs`
  - screenshots saved to:
    - `output/docs-refined-check.png`
- Remaining note:
  - existing project-wide ESLint warnings remain in unrelated files and were not introduced by this docs refinement

## 2026-03-11 Avatar Menu Refinement Plan

- Goal: narrow the avatar popup update to only `Contact Us` and `Language >`.
- Files to change:
  - `client/src/components/Layout/Sidebar.js`
  - `tasks/lessons.md`
- Steps:
  1. Inspect the current avatar dropdown rows and leave unrelated items untouched.
  2. Add a `Contact Us` row that routes to `/docs#contact`.
  3. Replace the inline language selector block with a submenu-style `Language >` interaction.
  4. Run `npm run build` and browser verification on the updated popup.
- Risks:
  - the submenu could close unexpectedly because the dropdown already uses outside-click dismissal
  - the flyout could overflow if its position is not anchored carefully

## Result (2026-03-11 Avatar Menu Refinement)

- Updated `client/src/components/Layout/Sidebar.js` to keep the avatar popup focused on the two approved additions:
  - added a `Contact Us` row pointing to `/docs#contact`
  - replaced the inline language selector block with a flyout-style `Language` submenu
- Interaction details:
  - closing the avatar popup also closes the language flyout
  - navigating through menu links now resets the submenu state cleanly
- Verification:
  - `npm run build` passed in `client/`
  - screenshot saved to `output/avatar-menu-home-check.png`
  - browser console still shows the pre-existing homepage CORS noise from `localhost:5500`
- Limitation:
  - full click-through verification of the authenticated avatar popup still requires a logged-in session in the browser

## 2026-03-11 Contact Us Flyout Plan

- Goal: change the avatar popup `Contact Us` row from a direct link into a right-side flyout matching the provided reference more closely.
- Files to change:
  - `client/src/components/Layout/Sidebar.js`
  - `tasks/lessons.md`
- Steps:
  1. Reuse the current avatar popup shell and keep existing menu order intact.
  2. Replace the direct `Contact Us` link with a submenu trigger.
  3. Add compact contact actions with copy/external affordances that fit the reference layout.
  4. Verify on `http://localhost:3100/` and record any auth-state limitation.
- Risks:
  - nested flyouts can overlap or feel crowded next to the avatar popup
  - copy/external affordances can look inconsistent if icon spacing is not tuned carefully

## Result (2026-03-11 Contact Us Flyout)

- Updated `client/src/components/Layout/Sidebar.js` so the avatar popup `Contact Us` row now opens a right-side flyout instead of navigating away immediately.
- The flyout now uses compact action rows with:
  - copyable email support
  - copyable WeChat contact
  - external link to X
- Interaction details:
  - `Contact Us` and `Language` flyouts now close each other so only one submenu stays open at a time
  - closing the avatar popup resets both submenu states
  - clicking the email copy action shows the copied state in the button label/tooltip
- Verification:
  - `npm run build` passed in `client/`
  - browser verification completed on `http://localhost:3100/dashboard`
  - screenshots saved to:
    - `output/dashboard-before-contact-flyout.png`
    - `output/dashboard-contact-flyout-check.png`
- Notes:
  - the project does not currently expose a real Discord URL, so the flyout uses the existing real contact channels from the codebase instead of inventing a fake Discord destination
  - console still shows unrelated pre-existing issues, including one accessibility warning and existing translation noise elsewhere

## 2026-03-11 Home Simplification Plan

- Goal: remove the `Explore Our Collections` section from the home page and expand the `Video Gallery` preview to 12 videos.
- Files to change:
  - `client/src/pages/Home.js`
- Steps:
  1. Remove the Explore collections section and any now-unused imports.
  2. Increase the home video preview query limit from 4 to 12.
  3. Rebuild and verify the home page layout on `http://localhost:3100/`.
- Risks:
  - removing the section may change vertical spacing around the hero-to-content transition
  - the video preview could become visually too dense if the existing grid styles do not balance 12 cards well

## Result (2026-03-11 Home Simplification)

- Updated `client/src/pages/Home.js` to simplify the home flow:
  - removed the `Explore Our Collections` module entirely
  - increased the home `Video Gallery` preview query from 4 items to 12 items
- Verification:
  - `npm run build` passed in `client/`
  - browser verification on `http://localhost:3100/` confirmed the `Explore Our Collections` section is no longer rendered
  - browser verification confirmed the `Video Gallery` section now renders 12 video cards
  - screenshot saved to `output/home-video-12-check.png`
- Notes:
  - console still shows pre-existing i18n missing-key noise on the home page and was not introduced by this change

## 2026-03-11 Homepage Video Gallery Fast Hover Playback Plan

- Goal: first checkpoint the current docs/avatar/home cleanup work, then only optimize the homepage `Video Gallery` so hover playback starts noticeably faster.
- Files to change:
  - `docs/2026/20260311_阶段17_文档中心头像弹窗与首页内容调整开发日志.md`
  - `client/src/components/Seedance/VideoCard.js`
  - `client/src/pages/Home.js`
- Steps:
  1. Write a detailed development log for the completed docs/avatar/footer/home work and keep it as a persistent record.
  2. Commit and push the current verified codebase as a checkpoint before changing playback behavior.
  3. Isolate the hover-play optimization to the homepage `Video Gallery` instead of changing all video cards globally.
  4. Rebuild and run browser verification on `http://localhost:3100/` to confirm the faster preview path introduces no UI regressions or new console errors.
- Risks:
  - preloading too aggressively could increase bandwidth and slow the rest of the homepage
  - changing shared `VideoCard` behavior globally could accidentally alter Seedance list behavior, so the optimization should stay homepage-only

## Result (2026-03-11 Homepage Video Gallery Fast Hover Playback)

- Added a homepage-only fast preview mode to `client/src/components/Seedance/VideoCard.js`:
  - cards can now keep the video `src` attached while in view
  - homepage cards use `preload="metadata"` to warm the media before hover
  - shared behavior for other video lists remains unchanged
- Updated `client/src/pages/Home.js` so only the homepage `Video Gallery` passes the fast preview flag.
- Verification:
  - `npm run build` passed in `client/`
  - browser verification on `http://localhost:3100/` confirmed the `Video Gallery` section still renders correctly
  - browser verification confirmed the first homepage video card reaches:
    - `preload: metadata`
    - `readyState: 4`
    - `paused: false`
    - `className: video-card-video playing`
  - screenshots saved to:
    - `output/home-video-gallery-scrolled.png`
    - `output/home-video-fast-hover-playing.png`
- Notes:
  - homepage console still shows the pre-existing i18n missing-key noise and was not introduced by this change
## 2026-03-11 Surprise Me detail-link plan

- Goal: wire the homepage `Surprise Me` modal so its `Browse Works` button opens the detail view for the currently displayed random image.
- Files to change:
  - `server/routes/gallery.js`
  - `client/src/services/galleryApi.js`
  - `client/src/components/Home/Hero.js`
- Step-by-step:
  1. Confirm whether the current Hero random image source is tied to real gallery detail records.
  2. Add a lightweight gallery random endpoint that returns one real public prompt with its `_id` and preview image.
  3. Update the homepage Hero CTA to request a random work from the gallery dataset instead of a static `ImageFlow` asset.
  4. Bind the modal `Browse Works` action to `/gallery/:id` for the currently shown work.
  5. Verify the API response shape and run a production build for the client to catch integration regressions.
- Risks:
  - The previous Hero lightbox used static decorative assets, so switching to real gallery data must preserve the existing visual style and close behavior.
  - Direct-opening `/gallery/:id` from the homepage should still render correctly when there is no `fromList` navigation state.

## Result

- Implemented `GET /api/gallery/random` so the homepage can fetch one real gallery work with a detail-page `_id`.
- Updated the homepage Hero `Surprise Me` flow to open a random gallery work preview instead of a static decorative `ImageFlow` asset.
- Wired the modal `Browse Works` CTA to the currently displayed work detail at `/gallery/:id`.
- Verification:
  - `client`: `npm run build` completed successfully after the change.
  - `server`: direct Mongo-backed aggregate query for the random-work selection shape succeeded locally.
  - Existing dev server on `http://127.0.0.1:5500` returned `500` for `/api/gallery/random`, which indicates the currently running server process likely needs a restart so it can pick up the new route instead of falling through old routing behavior.

## 2026-03-11 Surprise Me mixed-source follow-up

- Goal: expand `Surprise Me` so it can surface both `/gallery` and `/explore` content, and make closing the detail view return to the homepage when the flow started from the homepage.
- Files changed:
  - `server/routes/sref.js`
  - `client/src/services/srefApi.js`
  - `client/src/components/Home/Hero.js`
  - `client/src/pages/Gallery/GalleryModal.js`
  - `client/src/pages/SrefModal.js`

## Result

- `Surprise Me` now pulls one random candidate from `gallery` and one from `explore`, then randomly chooses between those real works before opening the preview modal.
- `Browse Works` now routes to either `/gallery/:id` or `/explore/:id` based on the selected work type.
- Homepage-triggered detail opens now carry `returnTo: '/'`, and both gallery/sref detail close handlers honor that state so clicking the top-right `X` returns the user to the homepage.
- Verification:
  - `client`: `npm run build` completed successfully.
  - `server`: direct Mongo aggregate checks confirmed both random gallery and random sref sources return valid `_id` + preview image data.

## Result (2026-03-12 Credits System Alignment)

- Clarified the product rule that free credits are a fixed daily allowance that resets to 40 and does not accumulate.
- Updated the main credits surfaces to present total available credits while still separating free daily and permanent balances.
- Standardized referral links on `?ref=` and kept registration compatible with the older `?invite=` parameter.
- Extended the credits ledger schema with wallet-aware balance fields so the UI can explain free vs permanent credit movements more clearly.

## Result (2026-03-12 Google Referral Credits Follow-up)

- Extended Google first-login so a brand-new Google user can inherit the active referral code and receive the same invite reward path as email registration.
- Added register-bonus and invite-reward ledger entries for Google-created users so credits history is consistent across sign-up methods.
- Updated Google login entry points to pass referral context from the current URL, and added a Google sign-up path on the register page for referral traffic.

## Result (2026-03-12 Google Welcome Email And Referral Notifications)

- Added a shared auth-side reward helper flow so email verification sign-up and first-time Google sign-up now apply referral rewards through the same logic.
- First-time Google registration now triggers the welcome email instead of silently completing account creation.
- Successful inviters now receive:
  - a `system` notification in the existing notifications center
  - a referral reward email using the current III.PICS email template system
- Added a dedicated referral reward email template in `server/services/emailService.js`.
- Verification completed with `node --check` on:
  - `server/routes/auth.js`
  - `server/services/emailService.js`
- Browser MCP verification could not be run because the current session does not expose the required browser MCP server.

## Result (2026-03-12 Referral Rewards After First Generation)

- Moved referral rewards out of registration and into the first successful `POST /api/generate/image` flow.
- Updated reward amounts to:
  - inviter: `200` permanent credits
  - invitee: `50` permanent credits
- Added server-side user markers:
  - `firstGenerationAt`
  - `referralRewardGrantedAt`
- Added `server/utils/referralUtils.js` to centralize reward granting, inviter notification, and inviter reward email sending.
- Updated registration and credits-page copy so the UI now explains that referral rewards unlock after the invitee's first successful generation.
- Verification completed with:
  - `node --check` on updated server and client files
  - `npm run build` in `client/`
- Browser MCP verification could not be run because the current session does not expose the required browser MCP server.

## Result (2026-03-12 Referral Copy Alignment Follow-up)

- Fixed the invite modal copy in `client/src/components/UI/InviteModal.js` so it no longer says:
  - friend gets `+200`
  - rewards are added instantly on registration
- Updated the modal to explain the live rule:
  - inviter gets `200`
  - invitee gets `50`
  - unlock happens after the first successful generation
- Restored the sidebar invite entry in `client/src/components/Layout/Sidebar.js` to the requested short marketing copy:
  - `Share MeiGen`
  - `Invite friends, get 200 credits`
- Verification completed with:
  - `node --check client/src/components/UI/InviteModal.js`
  - `node --check client/src/components/Layout/Sidebar.js`
  - `npm run build` in `client/`

## Result (2026-03-12 Notification Entry And Translation Follow-up)

- Fixed the bell dropdown text so it no longer falls back to raw i18n keys like `notifications.markAllRead` or `notifications.viewAll`.
- Updated `client/src/components/UI/NotificationDropdown.js` to use the correct `notifications.actions.*` and `notifications.empty.*` translation paths with readable fallbacks.
- Added unread red-dot indicators to the sidebar avatar button and inside the avatar dropdown.
- Reworked the avatar dropdown in `client/src/components/Layout/Sidebar.js` so `Dashboard` is now a secondary menu entry with a right-arrow flyout.
- Added a dedicated `Notifications` entry inside that dashboard flyout so notifications remain reachable on non-home surfaces where the top-right bell is not visible.
- Verification completed with:
  - `node --check client/src/components/UI/NotificationDropdown.js`
  - `node --check client/src/components/Layout/Sidebar.js`
  - `npm run build` in `client/`

## 2026-03-11 Search Modal close + real-search fix

- Goal: make the sidebar-triggered search modal closable even when the input is empty, and fix the current search chain so short/random user input can still produce real results when matching data exists.
- Files changed:
  - `client/src/components/Search/SearchModal.js`
  - `server/routes/gallery.js`
  - `server/routes/sref.js`
  - `tasks/lessons.md`

## Result

- Added a dedicated close button to the search modal input row and made clicking the backdrop close the modal reliably.
- Fixed the frontend `sref` result mapping bug: the modal now reads `posts` from the API response instead of incorrectly waiting for a non-existent `srefs` field.
- Switched gallery search from strict `$text` matching to escaped regex-based keyword matching across title/prompt/description/tags/sourceAuthor, which is much more forgiving for short strings.
- Escaped user input before creating `RegExp` objects in the sref route, so special characters no longer break search execution.
- Verification:
  - `client`: `npm run build` completed successfully after the search changes.
  - `server`: direct Mongo checks confirmed why the old gallery `$text` search was missing short-keyword matches (`a` had `0` text matches vs `429` regex matches), and the sref dataset does contain many matches for short queries.
