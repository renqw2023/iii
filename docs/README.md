# MJ Gallery - Midjourney风格参数展示网站

一个专门用来展示Midjourney风格参数的精美网站，让每个风格参数都成为创作的灵感源泉。

## ✨ 功能特性

### 🎨 核心功能
- **风格参数展示**: 专门展示 `--sref 3311400918` 等Midjourney风格参数
- **媒体上传**: 支持图片和视频上传展示
- **参数复制**: 一键复制风格参数到剪贴板
- **精美UI**: 现代化设计和流畅的交互动效

### 👥 社交功能
- **用户系统**: 完整的注册/登录/个人中心
- **社交互动**: 点赞、收藏、评论、分享
- **关注系统**: 关注其他用户，查看粉丝列表
- **个人统计**: 详细的数据展示和分析

### 🛠️ 管理功能
- **管理员后台**: 用户管理、内容管理、数据统计
- **内容审核**: 帖子状态管理、精选推荐
- **系统监控**: 实时数据统计和用户活动监控

## 🚀 技术栈

### 前端技术
- **React 18** - 现代化前端框架
- **Tailwind CSS** - 原子化CSS框架
- **Framer Motion** - 流畅的动画效果
- **React Query** - 数据状态管理
- **React Router** - 路由管理
- **React Hook Form** - 表单处理
- **React Dropzone** - 文件上传

### 后端技术
- **Node.js** - 服务器运行环境
- **Express** - Web应用框架
- **MongoDB** - NoSQL数据库
- **Mongoose** - MongoDB对象建模
- **JWT** - 身份验证
- **Multer** - 文件上传处理
- **Bcrypt** - 密码加密

## 📦 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4.0
- npm >= 8.0.0

### ⚙️ 配置管理

本项目采用统一的配置管理系统，支持交互式配置生成和自动验证。

#### 快速配置
```bash
# 1. 生成服务器配置
cd server
npm run generate-config

# 2. 生成客户端配置
cd ../client
npm run generate-config

# 3. 验证配置
cd ../server
npm run validate-config
```

#### 一键配置设置
```bash
cd server
npm run setup-config
```

> 📖 详细配置说明请参考 [CONFIG.md](./CONFIG.md)

### 1. 克隆项目
```bash
git clone <repository-url>
cd midjourney-gallery
```

### 2. 安装依赖
```bash
# 安装所有依赖（前端+后端）
npm run install-all
```

#### 🚨 依赖安装故障排除

如果遇到TypeScript版本冲突错误（特别是在服务器部署时），请使用以下解决方案：

**Windows环境：**
```cmd
fix-server-dependencies.bat
```

**Linux/Mac环境：**
```bash
chmod +x fix-server-dependencies.sh
./fix-server-dependencies.sh
```

**手动修复：**
```bash
# 清理依赖
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json
rm -rf client/node_modules client/package-lock.json

# 重新安装
npm cache clean --force
npm install
cd server && npm install && cd ..
cd client && npm install --legacy-peer-deps && cd ..
```

#### 🚨 AJV 构建错误修复

如果在构建时遇到 `Cannot find module 'ajv/dist/compile/codegen'` 错误：

**Windows环境：**
```cmd
fix-ajv-build-error.bat
```

**Linux/Mac环境：**
```bash
chmod +x fix-ajv-build-error.sh
./fix-ajv-build-error.sh
```

**手动修复：**
```bash
cd client
rm -rf node_modules package-lock.json
npm cache clean --force
npm install ajv@^6.12.6 --save-dev
npm install ajv-keywords@^3.5.2 --save-dev
npm install --legacy-peer-deps
npm run build
```

### 3. 环境配置
```bash
# 复制环境变量文件
cp server/.env.example server/.env
cp client/.env.example client/.env

# 编辑环境变量（根据需要修改）
# server/.env - 配置数据库连接、JWT密钥等
# client/.env - 配置API地址等
```

### 4. 数据库初始化
```bash
# 创建uploads目录和管理员账户
cd server
npm run setup
```

### 5. 启动开发服务器

#### 🚀 启动选项

**完整启动（推荐新用户）**
```bash
# 回到根目录
cd ..

# 同时启动前端和后端（包含虚拟数据）
npm run start

# 或者启动但不创建虚拟数据
npm run start-clean
```

**分离启动（便于调试）**
```bash
# 仅启动后端服务器
npm run server-only
# 或双击 start-server-only.bat

# 仅启动前端应用（需在另一个终端）
npm run client-only
# 或双击 start-client-only.bat

# 同时启动前端和后端（开发模式）
npm run dev
```

### 6. 访问应用
- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5000
- **管理员面板**: http://localhost:3000/admin

### 默认管理员账户
- **用户名**: admin
- **邮箱**: admin@example.com  
- **密码**: admin123456

⚠️ **请在首次登录后立即修改默认密码！**

## 📁 项目结构

```
midjourney-gallery/
├── client/                 # React前端应用
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── contexts/      # React Context
│   │   ├── services/      # API服务
│   │   └── styles/        # 样式文件
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Node.js后端API
│   ├── models/           # 数据模型
│   ├── routes/           # API路由
│   ├── middleware/       # 中间件
│   ├── scripts/          # 工具脚本
│   ├── uploads/          # 文件上传目录
│   ├── package.json
│   └── index.js
├── package.json          # 根目录配置
└── README.md
```

## 🔧 开发指南

### 可用脚本

#### 根目录
```bash
npm run dev              # 启动开发服务器（前端+后端）
npm run start            # 完整启动（含虚拟数据）
npm run start-clean      # 完整启动（无虚拟数据）
npm run server-only      # 仅启动后端服务器
npm run client-only      # 仅启动前端应用
npm run build            # 构建生产版本
npm run install-all      # 安装所有依赖
npm run setup            # 基础初始化（无虚拟数据）
npm run setup-with-data  # 完整初始化（含虚拟数据）
```

#### 服务器端 (server/)
```bash
npm run dev              # 启动开发服务器
npm run start            # 启动生产服务器
npm run create-admin     # 创建管理员账户
npm run init-uploads     # 初始化上传目录
npm run setup            # 基础初始化（无虚拟数据）
npm run setup-with-data  # 完整初始化（含虚拟数据）
npm run seed             # 创建虚拟数据
npm run create-sample    # 创建示例数据
npm run generate-config  # 生成配置文件
npm run validate-config  # 验证配置文件
```

#### 客户端 (client/)
```bash
npm start           # 启动开发服务器
npm run build       # 构建生产版本
npm test            # 运行测试
```

### API文档

#### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

#### 帖子相关
- `GET /api/posts` - 获取帖子列表
- `POST /api/posts` - 创建新帖子
- `GET /api/posts/:id` - 获取帖子详情
- `POST /api/posts/:id/like` - 点赞/取消点赞
- `POST /api/posts/:id/comment` - 添加评论

#### 用户相关
- `GET /api/users/:id` - 获取用户资料
- `PUT /api/users/profile` - 更新用户资料
- `POST /api/users/:id/follow` - 关注/取消关注用户

#### 管理员相关
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/posts` - 获取帖子列表

## 🎯 核心特性详解

### Midjourney风格参数支持
- `--sref` - 风格参考编号
- `--style` - 风格模式 (raw, expressive, cute, scenic)
- `--stylize` - 风格化程度 (0-1000)
- `--chaos` - 随机性 (0-100)
- `--ar` - 宽高比 (1:1, 16:9, 9:16等)
- `--v` - 版本 (5, 5.1, 5.2, 6)
- `--q` - 质量 (0.25, 0.5, 1, 2)
- `--seed` - 种子值
- 自定义参数支持

### 用户体验优化
- 响应式设计，完美适配移动端
- 流畅的页面切换动画
- 图片懒加载和优化
- 实时搜索和筛选
- 无限滚动加载

### 安全特性
- JWT身份验证
- 密码加密存储
- 文件类型和大小限制
- API请求频率限制
- XSS和CSRF防护

## 🚀 部署指南

### 生产环境部署

1. **构建前端应用**
```bash
cd client
npm run build
```

2. **配置生产环境变量**
```bash
# server/.env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
```

3. **启动生产服务器**
```bash
cd server
npm start
```

### Docker部署 (可选)
```bash
# 构建镜像
docker build -t mj-gallery .

# 运行容器
docker run -p 5000:5000 -e MONGODB_URI=your-db-url mj-gallery
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Midjourney](https://midjourney.com) - 提供了令人惊叹的AI艺术生成工具
- [React](https://reactjs.org) - 强大的前端框架
- [Tailwind CSS](https://tailwindcss.com) - 优秀的CSS框架
- [Framer Motion](https://framer.com/motion) - 流畅的动画库

## 📞 支持

如果你在使用过程中遇到问题，可以：

1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue 描述问题
3. 联系项目维护者

---

**让每个Midjourney风格参数都成为创作的灵感源泉！** ✨