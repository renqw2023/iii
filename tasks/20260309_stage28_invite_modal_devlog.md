# 阶段28 补丁 — 邀请卡可见性修复 + InviteModal UI 复刻

**日期**: 2026-03-09
**类型**: Bug Fix + UI 复刻
**耗时**: 约 1 小时（含 MeiGen 截图分析 + 实现 + 浏览器验证）

---

## 背景 & 问题描述

阶段28 主体（DesktopDock 升级 / Img2PromptPanel / CreditsModal / Sidebar 完善）在上一个 session 完成后，用户反馈两个遗留问题：

1. **邀请卡片在 /explore /gallery /seedance 三个页面看不到**
   根因：`Sidebar.js` 中用 `isFilterPage` 变量判断是否隐藏邀请卡，这些页面刚好命中过滤条件，导致卡片整体不渲染。

2. **邀请卡弹窗 UI 未完成**
   点击邀请卡后没有弹窗（之前直接 `<Link to="/dashboard">`），而 MeiGen.ai 有一个专属邀请弹窗需要复刻。

---

## 解决方案

### Fix 1 — 移除 isFilterPage 过滤（Sidebar.js）

```diff
- {/* Invite card — non-filter pages, expanded */}
- {!collapsed && !isFilterPage && (
+ {/* Invite card — expanded only */}
+ {!collapsed && (
```

同时将邀请卡从 `<Link to="/dashboard">` 改为 `<button onClick={onInviteClick}>`，接收父组件传入的回调，实现"点击弹窗"而非"跳转路由"的交互。

### Fix 2 — 新建 InviteModal.js（精确复刻 MeiGen）

**文件**: `client/src/components/UI/InviteModal.js`

复刻的 MeiGen 弹窗测量值（通过 Chrome DevTools DOM 检查获取）：

| 元素 | 值 |
|------|----|
| Dialog border-radius | 18px (rounded-2xl) |
| Dialog max-width | 512px (max-w-md) |
| Dialog padding | 24px |
| 关闭按钮 | absolute right:-48px top:0, 36×36px, rounded-12px, rgba(115,115,115,0.5) backdrop-blur |
| Header card | borderRadius:14px, p-16px, bg rgba(0,0,0,0.03), gradient mesh overlay |
| Gradient mesh | 三层 radial-gradient：粉 #f472b6 / 紫 #6366f1 / 黄 #eab308 |
| 福利列表间距 | gap:16px |
| 福利图标容器 | 36×36px rounded-10px, 各色调半透明背景 |
| URL 行 | p-12px rounded-14px bg rgba(0,0,0,0.03) border rgba(0,0,0,0.08) |
| Copy 按钮 | bg #1B1B1B, color #fff, rounded-10px, h-32px, px-16px, font-medium |

**三个福利项**:
- ⚡ You get +200 credits（每次好友注册）
- 👑 Friend gets +200 credits（注册即刻发放）
- 🎁 No limit on referrals（持续邀请持续得）

**动态数据**:
- 邀请链接：`window.location.origin + /register?ref= + user.inviteCode`
- 使用人数：`user.inviteUsedCount`（来自 User 模型 `inviteUsedCount` 字段）

### Fix 3 — Layout.js 串联

```js
const [inviteOpen, setInviteOpen] = useState(false);

<Sidebar onCreditsClick={...} onInviteClick={() => setInviteOpen(true)} />
<InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
```

---

## 改动文件清单

| 文件 | 类型 | 改动说明 |
|------|------|----------|
| `client/src/components/Layout/Sidebar.js` | 修改 | 1) 移除 `!isFilterPage` 条件；2) 邀请卡改为 `<button onClick={onInviteClick}>`；3) 接收 `onInviteClick` prop |
| `client/src/components/UI/InviteModal.js` | 新建 | 邀请弹窗完整实现（约 190 行） |
| `client/src/components/Layout/Layout.js` | 修改 | 新增 `inviteOpen` state，引入 InviteModal，传 `onInviteClick` 给 Sidebar |

---

## 浏览器验证

- 访问 `http://localhost:3100/explore`：侧边栏底部邀请卡正常显示 ✅
- 点击邀请卡：InviteModal 弹出，渐变头图 + 福利列表 + URL 行 + Copy 按钮完整 ✅
- Console errors: 0 ✅
- ESC 键关闭弹窗：正常 ✅
- 点击遮罩关闭弹窗：正常 ✅

---

## 注意事项

- `inviteUsedCount` 字段已存在于 `server/models/User.js`（line 58），AuthContext 通过 `/api/auth/me` 返回用户对象，前端直接读取 `user.inviteUsedCount`
- 弹窗 zIndex = 400（高于 CreditsModal 的 300，防止层叠问题）
- `isFilterPage` 变量在 Sidebar.js 中仍保留（其他条件可能复用），只是从邀请卡条件中移除

---

## 结果

阶段28 所有功能完整：
- DesktopDock（底部胶囊导航）✅
- Img2PromptPanel（右侧滑出面板）✅
- CreditsModal（积分购买定价弹窗，USD，4 套方案）✅
- Avatar Dropdown（头像下拉菜单）✅
- InviteModal（邀请好友弹窗）✅ ← 本次补全
- 邀请卡全页面可见 ✅ ← 本次修复
