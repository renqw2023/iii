# 配置管理系统

本项目采用统一的配置管理系统，支持环境变量配置和动态配置加载。

## 📋 概述

配置管理系统分为服务器端和客户端两部分：

- **服务器端**: 使用 `server/config/index.js` 统一管理所有配置
- **客户端**: 使用 `client/src/config/index.js` 统一管理前端配置
- **配置生成**: 提供交互式脚本快速生成配置文件
- **配置验证**: 自动验证配置的完整性和有效性

## 🚀 快速开始

### 1. 生成配置文件

#### 服务器端配置
```bash
cd server
npm run generate-config
```

#### 客户端配置
```bash
cd client
npm run generate-config
```

### 2. 验证配置

```bash
cd server
npm run validate-config
```

### 3. 一键配置设置

```bash
cd server
npm run setup-config
```

## 📁 配置文件结构

```
├── server/
│   ├── .env                    # 服务器环境变量
│   ├── .env.example           # 服务器环境变量模板
│   ├── config/
│   │   └── index.js           # 服务器配置管理
│   └── scripts/
│       ├── generateConfig.js  # 配置生成脚本
│       └── validateConfig.js  # 配置验证脚本
├── client/
│   ├── .env                   # 客户端环境变量
│   ├── .env.example          # 客户端环境变量模板
│   ├── src/config/
│   │   └── index.js          # 客户端配置管理
│   └── scripts/
│       └── generateConfig.js # 前端配置生成脚本
└── CONFIG.md                 # 本文档
```

## ⚙️ 服务器端配置

### 配置类别

| 类别 | 说明 | 主要配置项 |
|------|------|------------|
| 服务器 | 基本服务器设置 | PORT, HOST, NODE_ENV |
| 数据库 | MongoDB连接配置 | MONGODB_URI, 连接池设置 |
| JWT | 身份验证配置 | JWT_SECRET, 过期时间 |
| CORS | 跨域配置 | CLIENT_URL, 允许的源 |
| 限流 | API限流设置 | 窗口时间, 最大请求数 |
| 文件上传 | 文件处理配置 | 大小限制, 允许类型 |
| 邮件 | SMTP邮件配置 | 服务器, 认证信息 |
| 管理员 | 默认管理员账户 | 用户名, 邮箱, 密码 |
| 缓存 | 缓存策略配置 | TTL, Redis设置 |
| 日志 | 日志记录配置 | 级别, 格式, 文件 |
| 安全 | 安全相关配置 | 加密轮数, 会话设置 |
| 分页 | 分页参数配置 | 默认大小, 最大限制 |
| 第三方服务 | 外部服务集成 | Analytics, Sentry, Cloudinary |

### 使用示例

```javascript
const config = require('./config');

// 获取服务器端口
const port = config.server.port;

// 获取数据库URI
const dbUri = config.database.uri;

// 获取JWT配置
const jwtSecret = config.jwt.secret;
const jwtExpiresIn = config.jwt.expiresIn;
```

## 🎨 客户端配置

### 配置类别

| 类别 | 说明 | 主要配置项 |
|------|------|------------|
| API | 后端API配置 | URL, 超时, 重试 |
| 应用信息 | 应用基本信息 | 名称, 版本, 描述 |
| 功能开关 | 功能启用控制 | 分析, PWA, 暗模式 |
| 文件上传 | 前端上传配置 | 大小限制, 分块上传 |
| 分页 | 分页显示配置 | 默认大小, 选项 |
| 缓存 | 前端缓存配置 | TTL, 最大大小 |
| UI | 用户界面配置 | 动画, 防抖, 节流 |
| 主题 | 主题样式配置 | 默认主题, 颜色 |
| Midjourney | MJ参数配置 | 混沌值, 风格化范围 |
| 分类 | 默认分类数据 | 预设分类列表 |
| 第三方服务 | 前端服务集成 | GA, Sentry, Hotjar |
| 路由 | 路由配置 | 页面路径定义 |
| 消息 | 提示消息配置 | 错误, 成功消息 |

### 使用示例

```javascript
import { config } from './config';

// 获取API配置
const apiUrl = config.api.baseURL;
const timeout = config.api.timeout;

// 获取功能开关
const enableAnalytics = config.features.analytics;
const enablePWA = config.features.pwa;

// 获取UI配置
const debounceDelay = config.ui.debounceDelay;
const enableAnimations = config.ui.animations;
```

## 🔧 配置生成脚本

### 服务器端配置生成

配置生成脚本提供交互式界面，引导用户完成配置：

1. **基本配置**: 环境类型、端口、主机
2. **数据库配置**: MongoDB连接信息
3. **客户端配置**: 允许的客户端URL
4. **文件上传配置**: 大小限制、上传路径
5. **邮件配置**: SMTP服务器设置
6. **管理员配置**: 默认管理员账户
7. **第三方服务**: GA、Sentry、Cloudinary等

### 客户端配置生成

前端配置生成包括：

1. **API配置**: 后端服务器地址和超时设置
2. **应用配置**: 应用基本信息
3. **功能开关**: 各种功能的启用状态
4. **文件上传**: 前端上传限制和设置
5. **UI配置**: 界面交互参数
6. **主题配置**: 默认主题和颜色
7. **第三方服务**: 前端集成的外部服务

## ✅ 配置验证

配置验证脚本会检查：

- ✅ **环境变量完整性**: 检查必需的环境变量
- ✅ **数据库连接**: 验证MongoDB连接
- ✅ **文件权限**: 检查上传目录权限
- ✅ **端口可用性**: 验证端口是否可用
- ✅ **邮件配置**: 测试SMTP连接
- ✅ **第三方服务**: 验证外部服务配置
- ✅ **安全配置**: 检查密钥强度

## 🔒 安全最佳实践

1. **密钥管理**:
   - 使用强随机密钥
   - 定期轮换密钥
   - 不要在代码中硬编码密钥

2. **环境隔离**:
   - 开发、测试、生产环境使用不同配置
   - 敏感信息只在生产环境配置

3. **权限控制**:
   - 限制配置文件访问权限
   - 使用环境变量存储敏感信息

4. **备份策略**:
   - 定期备份配置文件
   - 版本控制配置模板

## 🚨 故障排除

### 常见问题

1. **配置文件不存在**:
   ```bash
   npm run generate-config
   ```

2. **环境变量未加载**:
   - 检查 `.env` 文件位置
   - 确认环境变量名称正确
   - 重启应用程序

3. **数据库连接失败**:
   - 验证 `MONGODB_URI` 格式
   - 检查网络连接
   - 确认数据库服务运行状态

4. **端口冲突**:
   - 修改 `PORT` 环境变量
   - 检查端口占用情况

5. **文件上传失败**:
   - 检查上传目录权限
   - 验证文件大小限制
   - 确认文件类型允许

### 调试模式

开启调试模式查看详细配置信息：

```bash
# 服务器端
NODE_ENV=development LOG_LEVEL=debug npm start

# 客户端
REACT_APP_DEBUG=true npm start
```

## 📚 相关文档

- [环境变量配置指南](./server/.env.example)
- [前端环境变量配置](./client/.env.example)
- [部署配置说明](./README.md#部署)
- [开发环境设置](./README.md#开发)

## 🤝 贡献指南

如需添加新的配置项：

1. 在相应的配置类中添加新字段
2. 更新 `.env.example` 文件
3. 修改配置生成脚本
4. 添加配置验证逻辑
5. 更新本文档

---

**注意**: 请妥善保管生产环境的配置文件，特别是包含敏感信息的 `.env` 文件。建议将 `.env` 文件添加到 `.gitignore` 中，避免意外提交到版本控制系统。