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
