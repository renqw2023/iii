# Task Workspace

Last updated: 2026-03-12

## Purpose

This file is now the lightweight current-work board for `pm01`.

Use it for:

- current project context
- active follow-up items
- recent important results
- pointers to detailed logs and archives

Do not keep appending long historical development logs here.

## Archive Policy

- Historical task history before this reset was archived to:
  - `tasks/archive/2026-03-todo-archive.md`
- Detailed implementation logs should continue to live in:
  - `docs/2026/*.md`

Recommended maintenance rule:

- keep this file under roughly 150-200 lines
- when the Recent Results section grows too large, move older entries into `tasks/archive/YYYY-MM-todo-archive.md`
- keep only the latest high-signal context here

## Current Product Rules

### Credits

- Daily free credits reset to `40`
- Free credits do not accumulate
- Permanent sign-up bonus is `40`

### Referral system

- Invite code is captured at sign-up
- Invite rewards are not granted immediately at registration
- Invitee receives `50` permanent credits after the first successful image generation
- Inviter receives `200` permanent credits after the invitee completes the first successful image generation
- Inviter also receives:
  - a station notification
  - a reward email if email notifications are enabled

### Google sign-up

- First-time Google registration sends the welcome email
- Google first sign-up can inherit the active invite code

## Current Surfaces To Watch

- `client/src/components/UI/InviteModal.js`
- `client/src/components/Layout/Sidebar.js`
- `client/src/components/UI/NotificationDropdown.js`
- `client/src/pages/Register.js`
- `client/src/pages/Credits.js`
- `server/routes/auth.js`
- `server/routes/generate.js`
- `server/utils/referralUtils.js`

## Active Follow-up

- Verify the referral flow end-to-end with a fresh invited Google account:
  - sign-up gets only the normal `40`
  - first successful generation unlocks `50` for invitee
  - inviter gets `200`
  - inviter sees notification and email
- Optional UX follow-up:
  - add a front-end toast when referral rewards unlock after first generation
- Optional cleanup:
  - remove or organize untracked assets in `client/public/ImageFlow/gptimage/`

## Recent Results

### 2026-03-22 上线前全面安全审计 (25项)

**批次A — P0 已修复 (6项)**
- A1 `server/routes/payments.js` — Stripe webhook 幂等性：先查 Order 再处理
- A2 `server/middleware/auth.js` — adminAuth 内联 JWT 验证，不再依赖空 next()
- A3 `server/routes/auth.js` — /login /register /forgot-password 加 authLimiter (20次/15min)；/check-email 加 emailCheckLimiter (10次/min)
- A4 `client/public/_redirects` — Vercel SPA 路由 `/* /index.html 200`
- A5 `client/src/App.js` — /browse-history /generate-history /img2prompt 移入 ProtectedRoute
- A6 `client/src/App.js` — 删除 /health /error-demo 测试路由及其 import

**批次B — P1 已修复 (7项)**
- B1 `server/utils/creditsUtils.js` — deductCredits 改用 findOneAndUpdate + $expr 原子化
- B2 `server/routes/credits.js` — refreshFreeCreditsIfNeeded 改用 findOneAndUpdate 原子化
- B3 `server/routes/generate.js` — 4K upscale 失败时 totalCreditCost -= 5，按 2K 扣费
- B4 `server/routes/generate.js` — per-user generateLimiter (60次/小时)
- B5 `client/src/services/promptApi.js` — 硬编码 localhost:5000 → 改用 /api (相对路径)
- B6 `server/config/index.js` — 移除 admin 默认密码 admin123456，生产环境强制验证
- B7 `server/config/index.js` — 生产环境 JWT_SECRET < 32字符直接拒绝启动

**批次C — P2 已修复 (6项)**
- C1 `server/routes/auth.js` — 移除验证码 console.log 泄露
- C2 同 A3（/check-email 已在批次A加限流）
- C3 `server/routes/upload.js` — 文件名格式验证，防路径穿越
- C4 `server/routes/seedance.js` — CORS Access-Control-Allow-Origin 从 * 改为 CLIENT_URL
- C5 admin.js 用户查询已有显式 select 白名单，敏感字段未暴露 ✅
- C6 `client/public/og-default.jpg` — 创建默认 OG 图片占位符

### 2026-03-22 Seedream 5.0 图像生成接入

- **新模型**：`seedream-5-0` (doubao-seedream-5-0-260128)，积分 8/次，`ARK_API_KEY` 驱动
- **文生图**：全局 `fetch` + 120s 超时，aspectRatio → 精确像素尺寸映射
- **图生图**：参考图以 URL 直接传 `image` 字段，Volcengine 服务端抓取
- **排查记录**：端口 5500 Hyper-V 保留 → `net stop/start winnat`；undici 无法连通 → 改用全局 fetch；base64 data URI 被 API 拒绝 → 改为 URL 传递
- **开发日志**：`docs/2026/20260322_stage47_seedream5_integration_devlog.md`

### 2026-03-13 MeiGen-Style Generate History Page

- **New page**: `/generate-history` — inline grid card layout with SVG stroke-dasharray progress ring
- **New model**: `server/models/Generation.js` — persists successful generations to MongoDB
- **New context**: `client/src/contexts/GenerationContext.js` — global activeGenerations state with pseudo-progress interval
- **New component**: `client/src/components/UI/GenerationCard.js` — tri-state card (loading/error/success)
- **New service**: `client/src/services/generationHistoryApi.js` — GET /generate/history
- **Route changes**:
  - `/history` → redirect to `/browse-history`
  - `/browse-history` → old browsing history (History.js)
  - `/generate-history` → new generation history page
- **Sidebar**: added "生成记录" (Wand2) and renamed "History" → "浏览历史"
- **Img2PromptPanel**: on generate, writes to GenerationContext + navigates to `/generate-history`; removed GenerationProgressModal modal
- **Verified**: page renders, redirect works, no console errors

### 2026-03-12 Generation Status Card

- Added a MeiGen-inspired generation status card to `Image Generation`
- Both active generation entry points now show:
  - loading card with animated progress
  - error card with retry
  - success card with preview and actions
- Primary implementation surface:
  - `client/src/components/UI/Img2PromptPanel.js`

### 2026-03-12 Notification Access

- Fixed notification dropdown translation key leakage
- Added unread red dot on avatar
- Added `Dashboard -> Notifications` secondary path in sidebar avatar menu
- Detailed log:
  - `docs/2026/20260312_notification_access_and_red_dot_devlog.md`

### 2026-03-12 Referral Copy Alignment

- Updated invite modal to explain:
  - inviter gets `200`
  - invitee gets `50`
  - unlock happens after first generation
- Restored sidebar invite entry to short requested copy:
  - `Share MeiGen`
  - `Invite friends, get 200 credits`
- Detailed log:
  - `docs/2026/20260312_referral_system_rollout_devlog.md`

### 2026-03-12 Referral Rewards After First Generation

- Moved referral rewards from registration to first successful `POST /api/generate/image`
- Added:
  - `firstGenerationAt`
  - `referralRewardGrantedAt`
- Added:
  - `server/utils/referralUtils.js`
- Detailed logs:
  - `docs/2026/20260312_referral_rewards_after_first_generation_devlog.md`
  - `docs/2026/20260312_referral_system_rollout_devlog.md`

### 2026-03-12 Google Welcome Email And Referral Notifications

- First-time Google registration now sends the welcome email
- Inviter reward path now sends:
  - station notification
  - reward email
- Detailed log:
  - `docs/2026/20260312_google_welcome_and_referral_notifications_devlog.md`

### 2026-03-12 Credits Alignment

- Clarified fixed daily allowance model
- Unified free-vs-paid credit display and wallet-aware ledger fields
- Detailed log:
  - `docs/2026/20260312_credits_system_alignment_devlog.md`

## Working Agreement

- `tasks/todo.md` = current control panel
- `tasks/archive/*.md` = historical task archives
- `docs/2026/*.md` = detailed implementation records

When this file starts feeling noisy again, archive it before it becomes another long-running log.
