# 2026-03-11 Docs Center 独立文档中心重构开发文档

## 1. 背景

本轮改造的直接触发点有两个：

1. 原有 `/about`、`/help`、`/privacy`、`/terms`、`/contact` 这 5 个页面长期沿用早期的老式卡片页模板，内容结构分散、视觉风格偏工具后台，不符合当前项目整体的产品气质。
2. 用户明确提出参考 [MeiGen Quick Start](https://docs.meigen.ai/en/quickstart) 的文档站结构，希望将这 5 个页面整合为更统一的文档中心，并要求 `Docs` 作为一个独立页面存在，而不是继续挂在应用主侧边栏布局下。

因此，本轮的目标不只是“重做几个静态页面”，而是建立一套可持续扩展的独立文档中心能力。

---

## 2. 目标

本轮目标包括：

- 将 `/about`、`/help`、`/privacy`、`/terms`、`/contact` 整合成一个统一的文档中心页面 `/docs`
- 让 `/docs` 使用独立布局，不再显示应用主侧边栏
- 保持老链接兼容，使旧路由自动跳转到 `/docs` 的对应章节锚点
- 参考 MeiGen Quick Start 的信息架构，形成“独立 header + 左侧文档目录 + 中间正文 + 右侧 on this page”的文档站结构
- 把文案从页面组件中抽离，建立一套可维护的多语言 docs 内容源
- 以英文作为主叙事版本，同时补齐中文和日文版本
- 在头像弹窗中增加 `Docs` 入口，作为文档中心主入口

---

## 3. 最终结果概览

### 3.1 新增独立文档页面

- 新页面：`/docs`
- 页面文件：
  - `client/src/pages/DocsCenter.js`
- 布局文件：
  - `client/src/components/Layout/DocsLayout.js`
- 文档内容源：
  - `client/src/content/docsContent.js`

### 3.2 旧路由兼容

以下旧路径保留，但会自动重定向到 `/docs` 对应锚点：

- `/about` -> `/docs#about`
- `/help` -> `/docs#help`
- `/privacy` -> `/docs#privacy`
- `/terms` -> `/docs#terms`
- `/contact` -> `/docs#contact`

### 3.3 头像弹窗入口

在左侧侧边栏头像弹窗中，将原来的 `Help` 入口替换为 `Docs`：

- 文件：`client/src/components/Layout/Sidebar.js`

这样文档中心的入口更统一，也避免出现 `Help` 和 `Docs` 两个语义高度重叠的菜单项。

---

## 4. 核心设计决策

## 4.1 为什么不继续保留 5 个分散页面

原因如下：

- 5 个页面都属于“信息类/支持类/合规类内容”，分散存在会导致导航成本高
- 很多用户其实不知道应该先点 `Help`、`About` 还是 `Contact`
- 这些页面的阅读模式天然更适合文档站，而不是营销页或工具页
- 继续分散维护，会让多语言内容管理变得更加零散和重复

因此整合成统一 docs 页面，是在产品和维护两方面都更合理的方案。

## 4.2 为什么 `/docs` 必须独立布局

用户明确指出，点击 `Docs` 后应该进入一个独立页面，而不是继续显示应用主侧边栏。

这背后的原因也成立：

- 文档页强调连续阅读，不适合被应用导航壳打断
- 文档站和内容工具页是两种完全不同的阅读语境
- 独立 header 可以更贴近参考页的结构和节奏
- 后续如果继续扩展 docs（如 API、Guides、FAQ、Policy Center），独立壳更容易承载

因此最终方案中新增 `DocsLayout`，并在路由层将 `/docs` 从主 `Layout` 中拆出。

---

## 5. 主要实现内容

## 5.1 路由层重构

文件：

- `client/src/App.js`

改动：

- 引入 `Navigate`
- 引入 `DocsLayout`
- 引入 `DocsCenter`
- 将 `/docs` 放入独立的 `DocsLayout`
- 将 `/about`、`/help`、`/privacy`、`/terms`、`/contact` 改成跳转到 `/docs` 的锚点

结果：

- 文档中心成为一个真正独立的阅读空间
- 旧链接不失效，外部收藏和站内旧入口仍可使用

## 5.2 独立文档布局

文件：

- `client/src/components/Layout/DocsLayout.js`

实现要点：

- 移除应用主侧栏
- 使用独立顶部 header
- header 提供：
  - Logo
  - Docs 标识
  - 基础站内跳转链接（Home / Explore / Gallery / Seedance）
  - Back Home
  - 主题切换
  - 语言切换
- 使用更克制的浅色文档背景，避免继续沿用应用工具页的视觉壳

这个布局的目标不是完全复制参考页，而是建立“项目内可落地的 docs shell”。

## 5.3 Docs 页面结构重建

文件：

- `client/src/pages/DocsCenter.js`

最终结构：

- 左侧：文档章节导航
- 中间：主文档正文
- 右侧：当前页锚点目录

中间正文采用更接近文档站的节奏：

- 顶部总览 header
- 文章式 section
- section 内再细分 subsection
- 重点说明使用 notice block
- 联系方式使用独立 contact method cards

与旧版相比，变化重点是：

- 不再把所有内容都做成功能卡片
- 减少大块说明型 hero
- 增强纵向阅读节奏
- 让页面更像“文档”而不是“运营页”

## 5.4 多语言文档内容源

文件：

- `client/src/content/docsContent.js`

这是本轮最重要的结构化改造之一。

在这一版之前：

- 页面内容散落在多个组件里
- 帮助页、隐私页、条款页大量依赖旧 i18n 字段
- About / Contact 等页面又混入了大量组件内硬编码文案
- 页面层面存在明显的中英混排

本轮之后：

- docs 内容被抽象为统一内容模型
- 当前提供三套语言版本：
  - `en`
  - `zh`
  - `ja`
- 每个语言版本包含：
  - 页面标题与描述
  - 左侧导航文案
  - 顶部概述文案
  - 每个章节的标题、摘要、子段落、列表、联系方法

### 内容模型字段

核心字段包括：

- `pageTitle`
- `pageDescription`
- `leftNavTitle`
- `leftNavLabel`
- `topBadge`
- `topTitle`
- `topDescription`
- `sections[]`

每个 `section` 支持：

- `id`
- `label`
- `eyebrow`
- `title`
- `description`
- `paragraphs`
- `notice`
- `cards`
- `callouts`
- `subSections`
- `contactMethods`

这个模型的好处：

- 页面结构与内容解耦
- 可以继续添加更多 docs 页面而不用重写页面组件
- 更容易持续补充英文主版及其他语言版本

## 5.5 语言策略

### 当前策略

- 英文作为 docs 的主叙事版本
- 中文和日文提供完整对应版本
- 根据 `i18n.language / i18n.resolvedLanguage` 自动选择内容

实现函数：

- `getDocsContent(language)`

语言归一化规则：

- `zh-*` -> `zh`
- `ja-*` -> `ja`
- 其他默认 -> `en`

这意味着：

- `en-US` 会看到英文版
- `zh-CN` 会看到中文版
- `ja-JP` 会看到日文版

## 5.6 右侧 On This Page 逻辑

`DocsCenter.js` 中实现了“根据当前 section 动态切换右侧锚点列表”的逻辑。

规则：

- 如果当前 section 有 `subSections`，右侧目录优先显示该 section 的子锚点
- 如果没有子锚点，则显示顶级章节列表

这样比固定显示整页目录更接近参考文档站的阅读逻辑。

## 5.7 旧路径自动滚动定位

实现方式：

- 页面进入后，根据 `location.hash` 或旧路径映射找到目标 section id
- 找到 DOM 节点后调用 `scrollIntoView`

这样即使用户访问的是：

- `/contact`
- `/privacy`
- `/help`

也会被无缝带到 `/docs` 的对应位置。

---

## 6. 本轮涉及的关键文件

### 新增文件

- `client/src/components/Layout/DocsLayout.js`
- `client/src/content/docsContent.js`
- `client/src/pages/DocsCenter.js`

### 修改文件

- `client/src/App.js`
- `client/src/components/Layout/Sidebar.js`

### 关联的既有重构文件

这次 docs 中心是在此前“老页面重构”和“共享壳 PageShell”基础上继续演进的，因此还关联到之前已经修改过的页面：

- `client/src/pages/About.js`
- `client/src/pages/Help.js`
- `client/src/pages/Privacy.js`
- `client/src/pages/Terms.js`
- `client/src/pages/Contact.js`

这些页面本身现在已经不再作为最终独立页面承载信息，而是由 `/docs` 接管。

---

## 7. 验证记录

## 7.1 构建验证

执行：

```bash
cd client
npm run build
```

结果：

- 构建通过
- 当前仍有一些项目既存 ESLint warning，但不是本轮 docs 重构新引入的

## 7.2 浏览器验证

本轮按要求使用浏览器工具做了页面复核，包括：

- `/docs`
- `/privacy`
- `/contact`
- `/help`

验证结果：

- `/docs` 独立布局正常显示
- 应用主侧栏不再出现在 docs 页面中
- `/privacy` 正常跳转到 `/docs#privacy`
- `/contact` 正常跳转到 `/docs#contact`
- `/help` 正常跳转到 `/docs#help`
- `document.title` 在英文环境下为：

```text
Quick Start - III.PICS Docs
```

截图：

- `output/docs-center-check.png`
- `output/docs-standalone-check.png`
- `output/docs-refined-check.png`
- `output/meigen-quickstart-reference.png`

---

## 8. 当前已知问题

### 8.1 项目已有 ESLint warning

当前构建仍存在以下无关 warning：

- `GalleryCard.js`
- `Sidebar.js`
- `VideoCard.js`
- `Img2PromptPanel.js`
- `SeedanceList.js`

这些 warning 不是 docs 重构导致的，但后续建议集中清理一次。

### 8.2 页标题与快照差异

浏览器无障碍快照里显示的 root title 仍可能是站点默认标题，但实际 `document.title` 已正确更新为 docs 标题。这说明 SEO 标题本身已生效，快照展示只是浏览器工具层面的表现差异。

### 8.3 头像弹窗 Docs 入口

`Docs` 菜单项已经接好，但要完整验证点击流程，仍然需要一个现成登录态会话。

---

## 9. 后续建议

如果继续推进 docs 能力，建议按以下顺序演进：

1. 做左侧导航和右侧 `On this page` 的滚动高亮联动
2. 为 docs 页面补一个更明显的当前 section 状态显示
3. 增加单独的 Guides / Policies / Support 分组，替代当前扁平 6 段结构
4. 将 Footer 中的旧支持链接进一步统一收口到 `/docs`
5. 如果后期内容继续增长，可以把 `/docs` 拆成：
   - `/docs/quickstart`
   - `/docs/guides/...`
   - `/docs/policies/...`
   - `/docs/support/...`

当前这版实现适合作为“独立 docs 中心 Phase 1”，已经完成了结构独立、内容整合、多语言化和旧路由兼容四个基础目标。
