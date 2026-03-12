# 开发经验教训

## 2026-02-23

### 【数据导入】README 解析时务必先肉眼确认实际格式
- **错误模式**：写导入脚本时假设图片是 Markdown `![](url)` 格式，实际是 HTML `<img src="">` 格式，导致所有图片字段为空
- **规则**：在写任何 parser 之前，先用 `head -200 README.md` 看实际内容格式，再写 regex

### 【数据导入】sourceId 必须全局唯一，不能按 section 内序号
- **错误模式**：用 `No.1`、`No.2` 作为 sourceId，但 README 分多个区块，每个区块都从 `No.1` 开始，导致 upsert 时互相覆盖
- **规则**：导入脚本的去重 ID 必须是全文档唯一的，用全局递增计数器或 hash

### 【调试】前端空白时，先从最底层验证，逐层往上
排查顺序：
1. MongoDB 有没有数据（直接 node 脚本查）
2. 后端 API 能不能返回数据（Node http.request 绕过 proxy）
3. 后端是不是在跑（检查端口）
4. 前端请求有没有发出（浏览器 Network 面板）
5. 前端渲染逻辑（Console 报错）

### 【环境】bash 里不能直接用 curl 测试本地服务（受系统代理影响）
- `curl http://localhost:5500` 会被代理劫持返回 503
- 改用 `node -e "require('http').request(...)"` 绕过代理直接测试

### 【会话管理】重启 Claude Code 前必须写开发日志
- MCP 工具安装后需重启才生效
- 重启前写清楚：已改的文件、已发现的 bug、当前未解决的问题、下一步操作
- 日志路径：`E:\pm01\tasks\`

## 2026-02-25

### 【环境】Windows 上 Node.js host 'localhost' 解析为 IPv6，导致 ERR_CONNECTION_REFUSED
- `host: 'localhost'` → Node 监听 `[::1]:PORT`（IPv6）
- 浏览器 `http://localhost:PORT` → Windows 解析为 `127.0.0.1`（IPv4）
- 两者不匹配 → 浏览器 `ERR_CONNECTION_REFUSED`，但终端显示服务"正常运行"
- **规则**：本地开发后端 host 一律设为 `0.0.0.0`（监听所有接口）
- **验证方法**：`netstat -ano | findstr ":PORT"`，看是 `[::1]` 还是 `0.0.0.0`

### 【调试】Network 面板错误类型决定排查方向
- `ERR_CONNECTION_REFUSED` → 先查 `netstat`，看端口是否监听、IPv4/IPv6 是否匹配
- `404` → 路由未注册
- `CORS error` → 跨域配置问题
- `401/403` → 认证/权限问题
- **规则**：看到空白页，第一步打开 Network 面板，用错误类型决定下一步方向

### 【行为规范】不得自作主张修改 UI，用户要求 100% 复刻参考网站
- 未经用户指示的 UI 改动（如卡片比例、骨架动画）不应自行实现，更不应汇报为"成果"
- **规则**：UI 改动必须先确认参考来源（meigen.ai），对齐后再实现，实现前告知用户
## 2026-03-11

- 当用户反馈“背景特效看起来没动”时，不能只检查组件是否挂载；必须同时检查页面级 `background` / `--page-bg` / stage 容器是否使用了不透明底色把特效盖住。
- 为动态背景做验收时，除了确认 keyframes 存在，还要确认动效振幅、透明度和层级足够明显，避免“技术上有动画，视觉上像静态底色”。
- 当用户要求“保留毛玻璃半透明效果”时，优先收敛子项背景和边框，避免给图标加明显的独立容器感；视觉重点应留在整体玻璃 Dock，而不是单个按钮盒子。
- 当用户明确要求去掉某个边线或描边时，优先精准移除该层边框，不要同时改动背景透明度、阴影或其他玻璃质感参数。
- 为浮动导航添加“按位置出现”的功能时，优先把新入口做成条件插入并配合 layout 动画，这样容器可以自然扩展/收回，而不是预留空位破坏整体节奏。
## 2026-03-11 UI Analysis Note

- 当用户明确说明后续 UI 分析可以使用 `mcp` 工具时，要把这个约束记录下来；进入视觉核对、交互复核、页面验收阶段时，优先使用 `mcp__chrome-devtools__navigate_page`、`take_snapshot`、`take_screenshot`、`list_console_messages` 做真实页面检查，而不是只依据源码做静态判断。
## 2026-03-11 Menu Scope Note

- When the user narrows a menu request to specific entries, keep the implementation equally narrow and avoid turning the account popup into a larger IA refactor.
- For avatar-menu work, match the approved menu shape first and leave extra entries as optional follow-up ideas.

## 2026-03-11 Contact Row Note

- When the user provides a screenshot for a single account-menu row, match the row's interaction pattern directly instead of keeping the old navigation behavior and only changing the label.

## 2026-03-11 Express Dynamic Route Guard Note

- When adding static Express routes like `/random` alongside an existing `/:id` detail route, do not rely on route order alone.
- Add an explicit `ObjectId` validity check in the `/:id` handler so non-id segments fail fast with `404` instead of falling through to Mongoose cast errors.

## 2026-03-11 Cross-Surface Detail Return Note

- When a detail modal/page can be opened from more than one surface, carry an explicit `returnTo` route in navigation state instead of hardcoding close behavior to the default list page.
- Preserve the original list behavior as a fallback, but let homepage-triggered flows return to the homepage on close.

## 2026-03-11 Search UX And Parsing Note

- If a modal search UI only shows an `X` as a clear-input control, empty-state users effectively lose the close affordance; keep a dedicated close action visible or let the backdrop close reliably.
- When wiring search results, verify the frontend is reading the actual response shape (`posts` vs `srefs`, etc.) before debugging the backend search quality.
- For user-entered search strings, always escape regex metacharacters before building `RegExp` objects, otherwise random symbols like `?` or `(` can silently break the search flow.

## 2026-03-12 Auth Side-Effects Consistency Note

- When adding or extending a new authentication entry path such as Google sign-up, do not stop after the core account creation and credits logic.
- Audit all side effects from the original sign-up flow at the same time: welcome email, referral reward email, station notifications, analytics, and ledger records.
- If two sign-up methods are meant to behave the same after account creation, move the shared reward/notification behavior into helpers instead of duplicating it route-by-route.

## 2026-03-12 Referral Anti-Abuse Trigger Note

- When the product goal is referral quality instead of raw sign-up count, do not pay inviter rewards at registration time.
- Bind the referral unlock to a real server-verified activation event such as the first successful generation, and keep a persisted one-time flag to prevent duplicate grants.
- Update front-end copy at the same time as the backend rule, otherwise users will trust outdated reward wording and report false bugs.
