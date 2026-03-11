# 2026-03-11 Surprise Me 详情联动开发日志

## 背景

用户希望首页 Hero 区域的 `Surprise Me` 功能在弹出随机图像预览后，点击右下角 `Browse Works` 可以直接进入“当前这张图”的详情页，而不是只跳到作品列表页。

在继续联调后，需求又补充为：

1. `Surprise Me` 的内容源不要只来自单一页面，最好同时覆盖 `/gallery` 和 `/explore`
2. 用户从首页 `Surprise Me` 进入详情页后，点击详情页右上角 `X` 关闭时，应当返回首页，而不是落到列表页

## 初始现状

### 首页 Hero 的 Surprise Me 行为

初始实现位于 `client/src/components/Home/Hero.js`：

- `Surprise Me` 点击后只是从 Hero 组件内置的 `backgroundImages` 静态数组中随机挑一张图
- 这组图来自 `ImageFlow` 本地装饰素材，并不绑定真实详情数据
- 弹窗中的 `Browse Works` 链接是硬编码 `to="/explore"`

这意味着：

- 弹窗里的“当前图像”并没有详情页标识
- `Browse Works` 无法表达“打开这张图对应的详情”
- 用户只会被送到列表页，而不是当前作品详情

### 详情页关闭逻辑

`GalleryModal` 和 `SrefModal` 的关闭逻辑原本是：

- 如果 `location.state?.fromList` 存在，则 `navigate(-1)`
- 否则回到默认列表页 `/gallery` 或 `/explore`

这套逻辑能支持“从列表打开详情再返回列表”，但并不支持“从首页打开详情再返回首页”。

## 问题分析

### 问题 1：静态 Hero 图片没有详情身份

Hero 弹窗里使用的 `ImageFlow` 图像是早期视觉素材，不是 `gallery` 或 `sref` 的真实记录，因此不存在稳定的 `_id -> 详情页` 映射关系。

如果继续使用这批静态图，就只能：

- 维护一套额外映射表，人工把每张装饰图映射到某个详情页
- 或者继续跳列表页

这两种方案都不理想。更稳的做法是让 `Surprise Me` 直接抽取真实内容数据，这样弹窗预览和详情页天然属于同一条记录。

### 问题 2：Express 动态路由误吞 `/random`

在新增 `GET /api/gallery/random` 后，用户反馈后端报错：

`CastError: Cast to ObjectId failed for value "random"`

根因是：

- `/random` 和 `/:id` 同处一个路由文件
- 旧进程或动态匹配下，`random` 被当成 `id`
- Mongoose 尝试把 `"random"` 转成 `ObjectId`

因此除了新增静态路由外，还必须对 `/:id` 详情路由增加显式 `ObjectId` 校验，防止未来再次出现类似问题。

### 问题 3：仅靠 router state 返回首页不够稳

第一版“从首页进入详情再返回首页”的方案只依赖 `navigate(..., { state: { returnTo: '/' } })`。

用户实际联调后反馈：

- 详情页右上角 `X` 关闭时，仍然无法回到首页

这说明在某些实际路径下，`location.state` 没有被稳定保留。为了让返回链路更稳，需要把 `returnTo` 直接写入 URL 查询参数，这样即使 state 丢失，关闭逻辑依然能正确判断回跳目标。

## 本次实现方案

### 一、把 Surprise Me 改为真实内容随机

不再使用静态 `ImageFlow` 图直接驱动详情跳转，而是：

1. 新增 `gallery` 随机接口：`GET /api/gallery/random`
2. 新增 `sref` 随机接口：`GET /api/sref/random`
3. 首页 Hero 点击 `Surprise Me` 时并行请求两边数据
4. 从 `gallery` 候选和 `explore` 候选中随机选择一个实际作品展示在弹窗里

这样弹窗中的对象就统一具备：

- `type`
- `id`
- `previewImage`
- `title`

从而可以准确跳到：

- `gallery` 类型 -> `/gallery/:id`
- `explore` 类型 -> `/explore/:id`

### 二、给详情页增加“来源页面返回”

从首页 `Surprise Me` 点击 `Browse Works` 时，除了正常跳详情，还附带：

- `state.returnTo`
- URL 查询参数 `?returnTo=...`

随后：

- `GalleryModal` 关闭时优先读取 `searchParams.get('returnTo')`
- `SrefModal` 关闭时优先读取 `searchParams.get('returnTo')`
- 如果不存在 `returnTo`，再回退到原来的列表页关闭逻辑

这样可以同时兼容：

- 首页进入详情 -> 关闭返回首页
- 列表进入详情 -> 关闭返回列表
- 直接访问详情 -> 关闭返回默认列表页

### 三、补上 ObjectId 路由保护

在 `gallery` 和 `sref` 的 `/:id` 详情路由中，都增加了：

- `mongoose.Types.ObjectId.isValid(req.params.id)` 检查

当 id 非法时，直接返回 `404`，不再进入数据库查询，也不会再产生 `CastError`。

## 实际改动文件

### 1. `client/src/components/Home/Hero.js`

主要改动：

- 引入 `galleryAPI` 和 `srefAPI`
- 引入 `useLocation`
- `Surprise Me` 改为并行请求两个随机接口
- 构建统一的 `randomWork` 对象
- `Browse Works` 根据类型跳转到 `/gallery/:id` 或 `/explore/:id`
- 跳转时写入 `returnTo` 查询参数和 router state

### 2. `client/src/services/galleryApi.js`

新增：

- `getRandom()`

### 3. `client/src/services/srefApi.js`

新增：

- `getRandom()`

### 4. `client/src/pages/Gallery/GalleryModal.js`

关闭逻辑改为：

1. 优先读取 URL 查询参数 `returnTo`
2. 再读取 `location.state?.returnTo`
3. 再走原本的 `fromList`
4. 最后回 `/gallery`

### 5. `client/src/pages/SrefModal.js`

关闭逻辑与 `GalleryModal` 同步，优先支持返回首页。

### 6. `server/routes/gallery.js`

新增：

- `GET /api/gallery/random`

并补充：

- `/:id` 路由的 `ObjectId` 有效性校验

### 7. `server/routes/sref.js`

新增：

- `GET /api/sref/random`

并补充：

- `/:id` 路由的 `ObjectId` 有效性校验

### 8. `tasks/todo.md`

记录了：

- 本次需求实现计划
- 结果摘要
- 混合内容随机与返回首页的后续补充结果

### 9. `tasks/lessons.md`

新增两条经验记录：

- Express 静态路由与 `/:id` 动态路由共存时，要主动做 `ObjectId` 防护
- 可从多个入口进入的详情页，不应只写死回某个列表页，应该显式携带 `returnTo`

## 关键实现细节

### 随机内容来源

当前 `Surprise Me` 的内容来源为：

- `/gallery` 的真实作品数据
- `/explore` 的真实 `sref` 数据

实现方式不是“把两个列表完整拉下来前端随机”，而是后端各自提供一个轻量随机接口，这样可以：

- 减少首页请求数据量
- 减少前端处理成本
- 保持响应速度

### 为什么不是直接把静态 Hero 图映射到详情

因为这批 `ImageFlow` 素材本身没有稳定详情身份，强行映射会带来：

- 维护成本高
- 一旦素材变更容易失配
- 用户看到的弹窗图和详情内容可能不是同一张图

改成真实数据随机后，用户点击 `Browse Works` 打开的详情，与弹窗展示的是同一条内容，语义更准确。

### 返回首页为什么改成 URL 参数

因为用户联调时已经证明单纯依赖 `location.state` 不够稳。URL 参数方案的优点是：

- 路由状态在刷新/跳转中更可追踪
- 关闭逻辑更稳定
- 便于排查

## 验证过程

### 前端构建验证

执行：

```bash
npm run build
```

结果：

- 构建成功
- 没有新增阻断性错误
- 仓库仍有一些预存 ESLint warning，但与本次改动无直接关系

### 数据层验证

使用 Node + Mongo 直接验证：

- `gallery` 随机聚合可以返回有效 `_id` 和 `previewImage`
- `sref` 随机聚合可以返回有效 `_id` 和可用的预览图路径

样本验证通过，说明两条随机数据链路都成立。

### 路由健壮性验证

补上 `ObjectId` 校验后，理论行为为：

- `/api/gallery/random` 不会再被详情路由误吞
- `/api/sref/random` 不会再被详情路由误吞
- 任意非法详情 id 会直接返回 `404`

## 最终效果

现在的用户链路是：

1. 用户在首页点击 `Surprise Me`
2. 系统会从 `/gallery` 和 `/explore` 各取一个随机真实内容候选
3. 再在两类候选中随机选一个展示在弹窗中
4. 用户点击 `Browse Works`
5. 跳转到当前这条内容的真实详情页
6. 用户点击详情页右上角 `X`
7. 返回首页

## 变更影响

### 正向影响

- `Surprise Me` 不再只是视觉展示，而是成为真实内容发现入口
- 首页与 `gallery` / `explore` 两个内容面打通
- 返回逻辑更符合用户直觉
- 详情路由健壮性提升，避免非 ObjectId 导致服务端异常

### 风险与注意项

- 需要重启后端服务，让新增的 `/api/gallery/random` 与 `/api/sref/random` 路由生效
- 如果后续还有其他详情页入口，也建议统一采用 `returnTo` 方案，避免关闭回跳行为不一致

## Git 记录建议

建议本次变更使用单独提交，提交说明聚焦：

- homepage surprise mixed-source detail linking
- modal close return-to-home behavior
- route guard for random endpoints

