# MeiGen.ai 竞品深度分析报告

**分析日期**: 2026-03-06
**分析对象**: https://www.meigen.ai/
**分析方法**: Chrome DevTools 实时 DOM/CSS 提取 + 截图观察
**目的**: 对标我们的 pm01 项目，识别功能缺口，规划下一阶段路线图

---

## 一、整体布局架构

### 三栏布局（桌面端）

```
┌─────────────────────────────────────────────────────────────┐
│  左侧边栏 273px（固定）│   中央 masonry 画廊（自适应）   │ 右侧生成面板 │
│  position: fixed       │   主内容区，无限滚动            │ ~380px 固定  │
│  backdrop-blur(48px)   │                                 │              │
└─────────────────────────────────────────────────────────────┘
```

- 侧边栏宽度：`--sidebar-width: 273px`，固定定位，不随内容滚动
- 侧边栏背景：`bg-card/80 backdrop-blur-[48px]`，毛玻璃效果
- 顶部有模型筛选 tab（横向滚动）+ 排序控制
- 背景有两个大型 mesh 光球持续轨道动画（蓝紫橙渐变）

### 移动端 Dock（底部悬浮导航）

```
固定在屏幕底部中央，5 个图标按钮：
[🏠首页] [🕐浏览历史] [📚收藏] [🗂生成记录] [✨生成]
```
CSS: `fixed bottom-6 left-1/2 -translate-x-1/2`
样式: `h-16 rounded-2xl border bg-background/80 backdrop-blur-md shadow-2xl`

---

## 二、侧边栏功能全览

### 主导航（顶部）

| 菜单项 | 图标 | 需登录 | 说明 |
|--------|------|--------|------|
| 首页   | 🏠   | 否     | 返回首页 masonry 画廊 |
| 搜索   | 🔍   | 否     | 全局搜索 modal（帖子 + 生成记录两个 tab） |
| 生成记录 | 🕐  | 是     | 查看历史生成图片，空状态："画布是空的，但不会持续太久" |
| 收藏   | 📚   | 是     | 收藏的 prompt 卡片，空状态："暂无收藏，点击收藏按钮将喜欢的图片添加到这里" |

### 分类筛选（折叠式）

```
分类
├── # 标签  ↓（可折叠）
│   ├── All
│   ├── Product & Brand
│   ├── Photography
│   ├── Illustration & 3D
│   ├── Food & Drink
│   └── Girl
└── 最近更新
```

### 更多产品（底部）

- MCP Server → GitHub 链接
- Figma 插件 → Figma Community 链接

### 侧边栏底部区域

```
Terms · Privacy · DMCA · Refund

┌─────────────────────────────┐
│  🎁 分享 MeiGen             │
│     邀请好友得 200 积分      │
└─────────────────────────────┘

[ Get Started ]    每日免费积分
```

积分角标：左下角显示当前用户积分数（实测截图中显示 255 积分）

---

## 三、登录/注册系统

### 登录方式

弹出 Modal，标题"欢迎来到 MeiGen / 登录以访问您的账户"

```
[G] 使用 Google 继续
[🟢] 使用微信登录
── 或 ──
邮箱: [____________]
有邀请码？
[ 使用邮箱继续 ]
我们将发送魔法链接帮助您登录
```

**关键细节：**
- **无密码登录**：邮箱 Magic Link（发送登录链接到邮箱）
- Google OAuth
- 微信 OAuth（国内向）
- 支持邀请码输入（与积分系统联动）

---

## 四、积分系统（Credits System）

### 积分来源

| 来源 | 积分 |
|------|------|
| 每日签到/每日免费 | 每日发放（具体数额未知） |
| 邀请好友注册 | +200 积分/人 |
| 初始注册奖励 | 未知 |

### 积分消耗

| 操作 | 消耗 |
|------|------|
| Nanobanana Pro 生成一张图 | 10 积分 |
| 其他模型 | 待测 |

### 积分显示位置

- 侧边栏左下角：金色硬币图标 + 数字（如 `255`）
- 生成按钮旁：`生成图片 10`（展示本次消耗）

---

## 五、生成面板（右侧 Panel）

### 面板结构

```
┌─────────────────────────┐
│  生成  │  反推提示词     │  ← 两个 Tab
├─────────────────────────┤
│  拖拽或上传参考图（可选）│
├─────────────────────────┤
│  画面描述               │
│  [拖拽卡片或输入]       │
│                         │
├─────────────────────────┤
│  [1/4▼] [3:4▼] [2K▼]  │  ← 数量/比例/分辨率
├─────────────────────────┤
│  常见问题 ▸             │
├─────────────────────────┤
│  模型: [Nanobanana Pro▼]│
├─────────────────────────┤
│  [ 生成图片    10 ]     │  ← 大按钮 + 积分消耗
└─────────────────────────┘
```

### 反推提示词（图生文）功能

- 拖拽图片到输入框 → 自动反推画面描述（img2text）
- 反推结果填入 Prompt 输入框

### Prompt 输入框交互

- 支持**拖拽 Prompt 卡片**直接应用（画廊卡片可拖入）
- 支持手动输入

### 可选参数

| 参数 | 选项 |
|------|------|
| 图片数量 | 1/4（1张 or 4张？） |
| 比例 | 3:4（竖版，还有其他选项） |
| 分辨率 | 2K |
| 模型 | Nanobanana Pro（下拉，含多模型） |

---

## 六、Prompt 卡片设计

### 卡片结构（DOM 层次）

```html
<div draggable="true" class="group relative rounded-xl bg-card cursor-pointer overflow-hidden">
  <!-- 1. 鼠标跟随光晕（hover 时出现） -->
  <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
       style="background: radial-gradient(200px circle at [mouseX] [mouseY], hsl(foreground/0.3), transparent)">
  </div>

  <!-- 2. 内层圆角遮罩 -->
  <div class="absolute inset-px rounded-xl bg-card"></div>

  <!-- 3. 内层 hover 光晕 -->
  <div class="absolute inset-px rounded-xl opacity-0 group-hover:opacity-100"
       style="background: radial-gradient(200px circle at [mouseX] [mouseY], hsl(foreground/0.1), transparent)">
  </div>

  <!-- 4. 图片区域（fixed height: 346px） -->
  <div class="relative w-full overflow-hidden" style="height: 346px">
    <img class="absolute inset-0 h-full w-full object-cover" loading="lazy">
  </div>

  <!-- 5. 卡片底部：作者信息 + 数据 + "使用创意"按钮 -->
</div>
```

**亮点**：鼠标跟随的 radial-gradient 光晕效果，从鼠标位置向外发散，非常细腻。

### 卡片数据展示

- 作者头像（圆形）+ 名称 + @handle
- 点赞数（❤️）+ 浏览数（📊）+ 发布时间（xd ago）
- "使用创意"按钮（hover 时显示，点击将 prompt 填入生成面板）
- 卡片支持 `draggable="true"` 拖入生成面板

### 顶部筛选 Tab

```
模型: [ All ] [ Nanobanana Pro ] [ Image 1.5 ] [ Midjourney ]
排序: [ 精选 ] [ 最新 ] [ 最热 ]
```

---

## 七、搜索功能

触发：点击侧边栏"搜索"按钮 → 弹出 Modal

```
┌──────────────────────────────┐
│ 🔍 搜索提示词或生成记录...   │
│                          [×] │
├──────────────────────────────┤
│  [ 帖子 ]  [ 生成记录 ]      │
├──────────────────────────────┤
│  最近帖子:                   │
│  [缩略图×6] ...              │
└──────────────────────────────┘
```

- 两个搜索范围：**公共帖子** / **我的生成记录**
- 未登录也可搜索帖子
- 生成记录搜索需登录

---

## 八、详情页（/prompt/:id）

极简布局，无侧边栏：

```
← Back to Gallery                    [Nanobanana Pro 标签]

        [大图，居中，最大宽度约 470px]

  [头像] 两斤  @0x00_Krypt     [View on X ↗]
  ❤️ 861   📊 31.1K   Mar 2, 2026

  Prompt
  ┌──────────────────────────────────┐
  │ A colossal hand gripping an...   │
  └──────────────────────────────────┘

  [🌐 Translate]

  [ Explore More Prompts ]
```

**特点：**
- 无侧边栏、无右侧面板，极简沉浸式
- Prompt 文本框（可复制）
- 翻译按钮（prompt 翻译）
- "Explore More Prompts"引流回首页
- 右上角显示所用模型标签

---

## 九、配色系统完整提取

### Light Mode（默认）

```css
:root {
  /* 核心色彩 */
  --background:     #ffffff;     /* 页面背景：纯白 */
  --foreground:     #1b1b1b;     /* 主文字：近黑 */
  --card:           #ffffff;     /* 卡片背景：白 */
  --card-foreground: #1b1b1b;

  /* 主色调 */
  --primary:        #1b1b1b;     /* 按钮主色：黑 */
  --primary-foreground: #ffffff;

  /* 次要色 */
  --secondary:      #f3f4f6;
  --secondary-foreground: #374151;

  /* 静音色（Muted）— 最有特色，暖米色系 */
  --muted:          #f7f4ed;     /* 米色背景，非常暖 */
  --muted-foreground: #6b7280;
  --muted-foreground-subtle: #9ca3af;
  --muted-active:   #ebe8e1;
  --muted-hover:    #d6d3cc;

  /* Accent（与 muted 同色） */
  --accent:         #f7f4ed;
  --accent-foreground: #1b1b1b;

  /* 边框 */
  --border:         #e5e7eb;
  --input:          #e5e7eb;
  --ring:           #1b1b1b;

  /* 侧边栏（与页面同色） */
  --sidebar:        #ffffff;
  --sidebar-accent: #f7f4ed;
  --sidebar-border: #e5e7eb;

  /* 圆角 */
  --radius:         0.625rem;    /* 10px */
}
```

### Dark Mode

```css
.dark {
  --background:     #ffffff;     /* ⚠️ 注意：dark 的 background 仍是白色！ */
                                 /* 实际深色效果来自 card: #262626 */
  --foreground:     #f9fafb;
  --card:           #262626;     /* 卡片：深灰 */
  --secondary:      #333333;
  --muted:          #333333;
  --muted-foreground: #bfbfbf;
  --muted-active:   #404040;
  --muted-hover:    #4d4d4d;
  --border:         #404040;
  --sidebar-accent: #333333;
}
```

### 背景动效渐变色

```
两个大型光球（固定定位，全屏，指针穿透）轨道动画：

光球 1（animate-mesh-orbit, 80s 无限）：
  - 蓝色:   rgba(41, 130, 255, 0.42)  位置 10% 20%
  - 紫色:   rgba(184, 112, 255, 0.38) 位置 90% 30%
  - 橙色:   rgba(255, 179, 102, 0.xx) 位置 30% 60%

光球 2（animate-mesh-orbit-reverse, 100s 无限）：
  - 蓝青色: rgba(76, 166, 255, 0.12)  位置 80% 10%
  - 粉紫色: rgba(216, 148, 249, 0.10) 位置 20% 90%
```

### 字体

```
System font stack:
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif

基础字号: 16px
圆角统一: 0.625rem（10px）
```

---

## 十、我们项目的功能缺口对比

| 功能 | MeiGen | 我们(pm01) | 优先级 |
|------|--------|------------|--------|
| Google 登录 | ✅ | ❌ 未接入 | 🔴 高 |
| 微信登录 | ✅ | ❌ | 🟡 中 |
| 邮箱 Magic Link | ✅ | ❌ | 🔴 高 |
| 个人中心 / 用户页 | ✅ | ❌ | 🔴 高 |
| 积分系统 | ✅ 完整 | ❌ | 🔴 高 |
| 收藏功能（登录后） | ✅ | ❌ | 🔴 高 |
| 生成记录 | ✅ | ❌ | 🔴 高 |
| 全局搜索 Modal | ✅ | ❌ | 🟡 中 |
| 邀请码/推荐系统 | ✅ 200积分 | ❌ | 🟡 中 |
| 图生文（反推 Prompt） | ✅ | ❌ | 🟡 中 |
| 右侧生成面板 | ✅ 内嵌 | 部分 | 🟡 中 |
| Prompt 详情页 | ✅ | ✅ 有 | ✅ |
| 分类/标签筛选 | ✅ | ✅ 有 | ✅ |
| 内容排序（精选/最新/最热） | ✅ | ✅ 有 | ✅ |
| 移动端 Dock 导航 | ✅ | ❌ | 🟡 中 |
| 暗色模式 | ✅ | ✅ 有 | ✅ |
| 卡片鼠标跟随光晕 | ✅ 精致 | ❌ | 🟢 低 |
| 卡片拖拽到生成面板 | ✅ | ❌ | 🟢 低 |

---

## 十一、配色差异分析

| 维度 | MeiGen | 我们 | 建议 |
|------|--------|------|------|
| 背景底色 | 纯白 #fff | 深色系（dark theme） | 保持我们的深色，差异化 |
| 特色色调 | 暖米色 muted #f7f4ed | 偏冷蓝调 | 可参考暖调增加温度感 |
| 卡片圆角 | 10px (0.625rem) | 接近 | 统一 |
| 背景动效 | 蓝紫橙光球 orbit | 有类似 | 可对标精细化 |
| 主按钮 | 纯黑 #1b1b1b | 渐变色 | 保持我们有个性的渐变 |
| 字体 | System stack | System stack | 相同 |

**核心配色特征：** MeiGen 整体走"暖白 + 深黑"极简路线，`#f7f4ed` 米色是其最有辨识度的色彩，营造"纸张/质感"感觉。我们目前走深色方案，方向不同但各有优势。

---

## 十二、建议实施路线图

### Phase A — 用户体系基础（最高优先级）

1. **Google OAuth 接入**（用户最常用，降低注册门槛）
2. **邮箱 Magic Link 登录**（无密码，降低摩擦）
3. **用户 Profile 页**（头像、昵称、注册时间）
4. **Session 持久化**（JWT/Cookie 策略）

### Phase B — 用户数据功能

5. **收藏系统**（登录后可收藏 Sref/Gallery 内容，侧边栏"收藏"页展示）
6. **浏览历史**（本地 sessionStorage 或后端记录，对应"生成记录"位置）
7. **搜索 Modal**（全局搜索，帖子 + 个人收藏双 tab）

### Phase C — 增长与留存

8. **积分系统**（每日签到积分、操作积分消耗、积分余额显示）
9. **邀请码 / 推荐系统**（注册时输入邀请码，双方得积分）
10. **每日免费积分**（登录后自动发放，引导日活）

### Phase D — 体验精细化

11. **移动端 Dock 导航**（底部悬浮 5 图标 bar）
12. **卡片鼠标跟随光晕**（radial-gradient 跟随 mousemove）
13. **Prompt 翻译按钮**（详情页 Translate）
14. **图生文（反推 Prompt）**（生成面板新增 tab）

---

## 十三、技术实现备忘

### Google OAuth 接入

```js
// 推荐方案：@react-oauth/google
// 1. Google Cloud Console 创建 OAuth 2.0 Client
// 2. 前端: <GoogleOAuthProvider clientId="...">
// 3. 后端: 验证 id_token → 创建/查找用户 → 返回 JWT
```

### Magic Link 登录

```
用户输入邮箱 → 后端生成 token（有效期 15min）→ 发邮件（含链接）
→ 用户点击链接 → 验证 token → 登录成功 → 重定向
推荐: nodemailer + SendGrid/Resend
```

### 积分系统数据模型

```
User: { credits: Number, totalEarned: Number }
CreditTransaction: { userId, type: 'earn'|'spend', amount, reason, createdAt }
reason: 'daily_checkin' | 'invite' | 'generate' | 'refund'
```

### 收藏系统数据模型

```
Favorite: { userId, targetType: 'sref'|'gallery'|'video', targetId, createdAt }
索引: { userId, targetType } + { userId, targetId }（去重）
```
