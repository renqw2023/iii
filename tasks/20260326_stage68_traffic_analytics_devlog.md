# 阶段 68 开发日志 — Admin Traffic Tab（全站访客流量统计）

**日期**: 2026-03-26
**Commit**: `f03ed70`
**分支**: main

---

## 一、背景

用户已开启 Cloudflare 代理（orange cloud），但希望在自己的 Admin 后台看到真实的访客流量，而不只依赖 CF Dashboard。需要捕获**所有访客**（包括未登录用户），且不能影响响应速度。

---

## 二、技术架构

```
所有 HTTP 请求
  → visitTracker 中间件（注册在 rate limiter 之后）
      ├─ 跳过：/output/, /uploads/, *.js/css/png 等静态资源
      ├─ 跳过：/api/payments/webhook, /health
      └─ res.on('finish') 记录（不阻塞响应）
          → 内存 buffer（max 500）
              → 每 30 秒 或 buffer 满时 insertMany 到 MongoDB
              → SIGTERM/SIGINT 时 flush 剩余数据

Admin 后台
  → GET /api/admin/traffic?period=7d|30d
  → 3 并行聚合（chart + topPages + topIPs）
  → summary 从 chartData 派生（不额外查询）
  → Map 缓存 5 分钟
```

---

## 三、文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `server/models/VisitLog.js` | 新建 | 字段：ip、path、method、status、userId、userAgent、duration、createdAt（90天TTL） |
| `server/middleware/visitTracker.js` | 新建 | 非阻塞缓冲中间件 |
| `server/index.js` | 修改 | 注册 visitTracker（limiter 之后） |
| `server/routes/admin.js` | 追加 | GET /admin/traffic 端点 |
| `client/src/services/api.js` | 追加 | `adminAPI.getTraffic()` |
| `client/src/components/Admin/tabs/TrafficTab.js` | 新建 | 流量看板 UI |
| `client/src/pages/AdminPanel.js` | 修改 | 注册 Traffic 标签页 |

---

## 四、关键设计决策

### IP 获取（Cloudflare 兼容）

```js
const ip =
  req.headers['cf-connecting-ip'] ||           // Cloudflare 真实 IP
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.ip || '';
```

最后一个 octet 脱敏：`1.2.3.4` → `1.2.3.x`（隐私保护）

### Buffer 安全设计

```js
// 先 slice（不删），写入成功后再 splice（删除）
const batch = buffer.slice(0, MAX_BUFFER);
await VisitLog.insertMany(batch, { ordered: false });
buffer.splice(0, batch.length);  // 只在成功后移除
```

这样 MongoDB 故障时数据留在 buffer 等下次重试，不会丢失。

### 从 chartData 派生 Summary（减少 4 次 DB 查询）

```js
const todayKey = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).replace('/', '-');
const today = chartData.find(d => d.date === todayKey);
const weekDays = chartData.slice(-7);
const summary = {
  todayPV: today?.pv ?? 0,
  todayUV: today?.uv ?? 0,
  weekPV:  weekDays.reduce((s, d) => s + d.pv, 0),
  weekUV:  weekDays.reduce((s, d) => s + d.uv, 0),
};
```

原版需要 7 个并行查询，优化后只需 3 个聚合。

---

## 五、TrafficTab UI

```
┌─────────────────────────────────────────────────────────┐
│ 访客流量                              [7d] [30d] [↻]    │
├──────────┬──────────┬──────────┬──────────┐             │
│ 今日 PV  │ 今日 UV  │ 本周 PV  │ 本周 UV  │             │
├──────────┴──────────┴──────────┴──────────┘             │
│ PV/UV 趋势折线图（紫色=PV, 绿色=UV, SVG）               │
├──────────────────────┬──────────────────────┐           │
│ Top Pages            │ Top IPs              │           │
│ path + 进度条        │ masked IP + 时间     │           │
└──────────────────────┴──────────────────────┘           │
```

---

## 六、生产部署注意

1. 服务器重启后中间件自动激活，约 30 秒后开始写入 MongoDB
2. 首次运行不会有历史数据（VisitLog collection 是空的）
3. VisitLog TTL 90 天后自动清除（需要 MongoDB TTL index 生效，通常 60 秒内）
4. 缓存目录无需配置，`insertMany` 直接写 MongoDB

---

## 七、后续优化方向

| 项 | 内容 |
|----|------|
| 地理位置 | 用 `geoip-lite` npm 包从 IP 推断国家/城市，在 Top IPs 旁显示 |
| 实时推送 | WebSocket/SSE 推送最新 PV 计数，实现 "Live PV" 效果 |
| Bot 过滤 | UA 包含 bot/crawler/spider 时跳过记录 |
| 来源统计 | 记录 `Referer` 字段，分析流量来源（Google/Twitter/Direct） |
