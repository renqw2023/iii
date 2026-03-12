# 积分系统分析文档

更新时间：2026-03-12

## 1. 目的

本文记录两部分内容：

1. 我从公开站点 `meigen.ai / meigen.art` 看到的积分系统信息。
2. 当前项目 `pm01` 已实现的积分系统规则、前后端展示方式，以及我对其合理性的判断。

目标不是写营销文案，而是把“系统现在到底怎么运作”讲清楚，便于后续统一产品规则、修正前端说明和排查后端问题。

## 2. 公开站点观察到的规则

基于公开页面和可抓取源码，我看到的 `meigen.ai` 积分体系大致是：

- 免费用户有 `40 daily / refresh credits`。
- 付费包为：
  - Starter: `$9.90 / 1000 credits`
  - Pro: `$19.90 / 2200 credits`
  - Ultimate: `$49.90 / 6000 credits`
- 付费积分文案强调 `Credits never expire`。
- 免费和付费档都写了 `40 refresh credits every day`。
- 公开定价页把 Gallery 和 Plugin 两套产品都叫 `credits`，但是否共享钱包并不清晰。
- 公开页不同位置对模型成本的表达并不稳定：
  - 有的地方是 `AI Generation = 5 credits`
  - 有的 changelog 又显示某些模型是 `2 credits`
  - 视频能力又可能是 `10` 或 `30 credits`

### 公开站点层面的核心问题

我认为公开站点最容易造成误解的点有：

- `credits` 同时被用来表示每日刷新额度、一次性赠送额度、付费永久额度。
- `refresh credits` 语义不精确，用户无法判断是“重置到 40”、“补足到 40”还是“每天新增 40”。
- 不同模型的实际扣费不是固定常量，但定价文案又常把它写成统一价。

这部分结论也会影响当前项目，因为 `pm01` 明显在参考这套产品模型。

## 3. pm01 当前已实现的积分系统

## 3.1 数据模型

当前项目的用户积分并不是单一余额，而是双余额：

- `credits`
  - 永久积分
  - 用于承载注册奖励、签到奖励、邀请奖励、购买充值、管理员赠送等
- `freeCredits`
  - 每日免费额度
  - 会按天刷新

对应代码：

- [User.js](/E:/pm01/server/models/User.js)
- [CreditTransaction.js](/E:/pm01/server/models/CreditTransaction.js)

`User` 上与积分相关的字段有：

- `credits`
- `freeCredits`
- `lastFreeCreditsRefreshAt`
- `lastCheckinAt`
- `inviteCode`
- `invitedBy`
- `inviteUsedCount`

`CreditTransaction` 记录积分流水，包含：

- `type`: `earn` / `spend`
- `amount`
- `reason`
- `note`
- `balanceAfter`

支持的 `reason` 包括：

- `daily_checkin`
- `register_bonus`
- `invite_reward`
- `invite_bonus`
- `admin_grant`
- `admin_deduct`
- `generate_image`
- `img2prompt`
- `purchase`

## 3.2 获取与刷新规则

当前后端在 [credits.js](/E:/pm01/server/routes/credits.js) 中定义：

- 每日签到奖励：`10` 永久积分
- 每日免费额度：`40`
- 免费额度刷新时区：`UTC+8`
- 刷新方式：惰性刷新，不依赖 cron

也就是说：

- 用户不是在零点被后台主动刷新。
- 而是在访问以下接口时，如果发现“今天还没刷新”，才把 `freeCredits` 重置为 `40`：
  - `/api/credits/balance`
  - 生图接口前
  - `img2prompt` 接口前

这套规则本身可以工作，但必须把“刷新到 40，而不是累加 40”说清楚。

## 3.3 获得积分的来源

### 注册

邮箱注册完成验证后：

- 永久积分 `credits += 80`
- 每日免费额度初始化为 `40`

对应代码：

- [auth.js](/E:/pm01/server/routes/auth.js)

### Google 登录新用户

Google 首次登录创建用户时：

- 永久积分 `credits = 80`
- 每日免费额度 `freeCredits = 40`

但这里有一个明显差异：

- 邮箱注册会写 `register_bonus` 流水
- Google 新用户注册目前没有看到对应的积分流水创建

这意味着同样是“新用户欢迎奖励”，两种注册路径的审计完整性并不一致。

### 邀请奖励

邮箱注册路径里，如果带邀请码并且邀请人有效：

- 邀请人获得 `200 credits`
- 被邀请人也获得 `200 credits`
- 邀请人 `inviteUsedCount + 1`

但当前逻辑只在邮箱注册验证成功流里处理。

Google 新用户登录流没有看到：

- 接收邀请码
- 处理邀请关系
- 发放邀请奖励

这会导致“同样的新用户，只因注册方式不同，积分结果不同”。

### 每日签到

签到规则：

- 每天一次
- 每次 `+10 credits`
- 属于永久积分，不是免费额度

### 支付充值

当前已接入 Stripe，一次性充值计划为：

- Starter: `$9.99 / 1000 credits`
- Pro: `$19.99 / 2200 credits`
- Ultimate: `$49.99 / 6000 credits`

充值成功后：

- 通过 webhook 给 `credits` 增加对应数量
- 写入 `purchase` 流水

对应代码：

- [creditPlans.js](/E:/pm01/server/config/creditPlans.js)
- [payments.js](/E:/pm01/server/routes/payments.js)

## 3.4 消耗积分的规则

当前消耗逻辑在 [creditsUtils.js](/E:/pm01/server/utils/creditsUtils.js)：

- 扣减顺序：先扣 `freeCredits`，再扣 `credits`

这是当前系统最清晰、也最合理的一条规则。

### 生图模型费用

当前 [generate.js](/E:/pm01/server/routes/generate.js) 里各模型价格如下：

- `gemini3-pro` / Nanobanana Pro: `10`
- `gemini3-flash` / Nanobanana 2: `6`
- `gemini25-flash` / Nanobanana: `4`
- `imagen4-pro`: `8`
- `imagen4-fast`: `4`
- `gpt-image-1` / GPT Image 1.5: `10`
- `dall-e-3`: `8`
- `cogview-flash` / Z Image Turbo: `4`
- `midjourney-niji` / coming soon: `15`

### 工具费用

当前 [tools.js](/E:/pm01/server/routes/tools.js) 里：

- `img2prompt` 每次消耗 `2`

## 3.5 前端如何展示积分

前端已经把双余额概念展示出来，但并不完全一致。

主要入口：

- [CreditsDisplay.js](/E:/pm01/client/src/components/UI/CreditsDisplay.js)
- [Sidebar.js](/E:/pm01/client/src/components/Layout/Sidebar.js)
- [Credits.js](/E:/pm01/client/src/pages/Credits.js)
- [CreditsModal.js](/E:/pm01/client/src/components/UI/CreditsModal.js)
- [StatsPanel.js](/E:/pm01/client/src/components/Dashboard/StatsPanel.js)

当前前端表达为：

- Header / Sidebar / Credits 页：
  - 会把 `freeCredits + credits` 显示成总余额
  - 同时展示 `Free Daily Credits`
  - 文案写了 `Daily credits used first`
- Dashboard `StatsPanel`：
  - 只显示 `balanceData.credits`
  - 也就是只显示永久积分，不显示总可用积分

这意味着用户会在不同页面看到两个不同的“余额定义”：

- 某些地方是总可用额度
- 某些地方是永久余额

这会直接造成“为什么这里是 120，那边是 80”的认知冲突。

## 4. 当前项目里已经存在的不合理点

下面这部分是我认为最重要的结论。

## 4.1 积分模型本身基本合理，但文案和展示不一致

后端的核心模型其实是合理的：

- 有每日免费额度
- 有永久付费/奖励积分
- 扣费先用免费额度
- 充值只增加永久积分

这套经济模型是可落地的，也比公开站点那种“所有都叫 credits”清楚一些。

问题主要不在“有没有逻辑”，而在“逻辑没有被稳定地表达给用户”。

## 4.2 最大问题：前端套餐文案与真实成本严重不一致

这是目前最明显、最危险的问题。

在 [CreditsModal.js](/E:/pm01/client/src/components/UI/CreditsModal.js) 中：

- Starter 写的是 `1,000 Credits`
- 同时写了 `Up to 500 images (image 1.5)`

但在 [generate.js](/E:/pm01/server/routes/generate.js) 中：

- `gpt-image-1` 的真实价格是 `10 credits`

按当前实现计算：

- `1000 / 10 = 100` 张

不是 500 张。

同理：

- Pro `2200 credits` 按 `10 credits / image` 只能约 `220` 张，不是 `1100`
- Ultimate `6000 credits` 按 `10 credits / image` 只能约 `600` 张，不是 `3000`
- Free `40 daily credits` 按 `10 credits / image` 只能 `4` 张，不是文案里的 `20`

结论：

- 如果你们想保持 “500 / 1100 / 3000 / 20 images” 这些文案，就必须把 `gpt-image-1` 调整到 `2 credits`
- 如果你们想保持当前后端成本，就必须立刻改前端所有套餐说明

目前这不是小偏差，而是核心商业文案与真实结算规则冲突。

## 4.3 Dashboard 与 Header 的余额定义不一致

当前：

- Header / Sidebar / Credits 页展示总可用积分
- Dashboard `StatsPanel` 只展示 `credits`

这会让用户误以为：

- 签到没到账
- 免费额度丢了
- 充值没成功

建议统一一种展示方式：

- 默认所有“余额”都显示总可用积分
- 同时在明细里拆出 `永久积分` 和 `今日免费积分`

## 4.4 流水中的 `balanceAfter` 语义不清

当前扣费流水使用两种写法：

- 生图 / img2prompt：
  - 如果同时扣了免费和付费，会写两条流水
  - `[免费] xxx`
  - `[付费] xxx`
- admin deduct：
  - 写一条总扣减流水

同时 `balanceAfter` 只写一个数字，但这个数字并不是统一含义：

- 免费扣减行的 `balanceAfter` 是 `freeCredits` 剩余值
- 付费扣减行的 `balanceAfter` 是 `credits` 剩余值
- 页面却把它当成通用“余额”显示

这会导致流水列表里的“余额”不可信。

建议至少二选一：

1. 流水中明确区分 `walletType: free | paid`
2. 或者 `balanceAfter` 改为：
   - `freeBalanceAfter`
   - `paidBalanceAfter`
   - `totalBalanceAfter`

否则后续审计、客服解释、用户自查都会很困难。

## 4.5 管理员扣积分与普通消费的记账方式不一致

普通消费：

- 先扣免费，再扣永久
- 可能写两条流水

管理员扣积分：

- 同样复用双余额扣减
- 但只写一条 `admin_deduct`

这会导致相同的账务动作，在流水层不具备一致性。

建议统一账务表达方式，不要让不同入口采用不同记账模型。

## 4.6 邀请系统存在注册入口不一致问题

当前发现三种邀请链接形式：

- `/register?ref=CODE`
- `/register?invite=CODE`
- 后端实际接收 body 里的 `inviteCode`

其中 [Register.js](/E:/pm01/client/src/pages/Register.js) 目前只明确支持从 URL 读取 `?ref=CODE`。

这意味着 [DashboardHeader.js](/E:/pm01/client/src/components/Dashboard/DashboardHeader.js) 里复制出来的：

- `/register?invite=...`

大概率不能被注册页自动识别。

这会直接影响邀请转化和奖励发放。

## 4.7 Google 登录新用户与邮箱注册新用户的奖励审计不一致

当前：

- 邮箱注册路径会写 `register_bonus` 流水
- Google 新用户路径没有看到对应流水

这会造成：

- 同样的奖励来源，后台审计数量对不上
- 用户查流水时体验不一致
- 数据分析无法准确区分欢迎奖励发放量

## 4.8 Google 登录路径没有接上邀请奖励

如果未来你们允许“先点邀请链接，再用 Google 一键登录”，当前实现大概率会丢掉邀请关系。

这是一个产品损失点，不只是技术细节。

## 5. 当前项目哪些地方是合理的

不是所有地方都有问题，下面这些设计我认为是合理的：

- 双余额设计比单一 `credits` 字段更清楚。
- “每日免费额度”和“永久积分”分开存储，这是正确方向。
- 扣费顺序明确为“先免费后付费”，用户体验友好。
- 充值只给永久积分，不污染每日免费额度，账务上清晰。
- 每个模型单独定价，而不是所有能力统一一个价格，这对成本控制更合理。
- `img2prompt` 作为轻量工具单独定价 `2`，也比把所有工具统一按生图价格收费更合理。

## 6. 我对 pm01 当前积分系统的总体判断

结论分两层：

### 系统设计层

基本合理，已经比公开站点更接近“可维护的账本模型”。

### 产品交付层

当前不够合理，原因主要有三类：

- 前端营销文案与后端实际扣费不一致
- 不同页面余额定义不一致
- 不同注册入口和记账入口规则不一致

换句话说：

- 后端积分模型可以继续用
- 但前端说明、邀请入口、流水语义和部分接入路径必须统一

## 7. 优先级建议

如果要按风险排序，我建议优先处理这 5 件事：

1. 立刻统一套餐文案和真实模型单价。
2. 统一所有页面“余额”的定义，避免一处显示总额、一处只显示永久积分。
3. 统一邀请链接参数，只保留一种，例如 `?ref=CODE`。
4. 给 Google 新用户补上欢迎奖励流水，并决定是否支持 Google 邀请注册奖励。
5. 重构积分流水结构，明确区分 free / paid 余额，修复 `balanceAfter` 歧义。

## 8. 一句话结论

`pm01` 当前的积分底层模型是“可用且方向正确”的，但对外表达还不够一致；其中最严重的问题是套餐文案和真实扣费倍率对不上，这会直接影响用户信任和付费转化。
