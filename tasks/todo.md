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
