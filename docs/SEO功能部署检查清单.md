# SEO功能部署检查清单

## 🔍 问题诊断

如果SEO功能在服务器环境下不工作，请按照以下清单逐项检查：

## 📋 部署前检查

### 1. 环境变量配置

**客户端环境变量** (`client/.env.production`):
```bash
# 必需的SEO相关环境变量
REACT_APP_BASE_URL=https://your-domain.com
REACT_APP_HOMEPAGE=https://your-domain.com
REACT_APP_APP_NAME=MJ Gallery
REACT_APP_APP_DESCRIPTION=专门展示Midjourney风格参数的精美网站
```

**服务器端环境变量** (`server/.env.production`):
```bash
# 确保服务器端也有正确的域名配置
BASE_URL=https://your-domain.com
CLIENT_URL=https://your-domain.com
```

### 2. 静态资源文件

确保以下文件存在：
- ✅ `client/public/images/og-default.jpg` - SEO默认分享图片
- ✅ `client/public/favicon.ico` - 网站图标
- ✅ `client/public/manifest.json` - PWA配置文件

### 3. 依赖包检查

**客户端关键依赖**:
```json
{
  "react-helmet-async": "^1.3.0",
  "react-router-dom": "^6.8.1",
  "react-i18next": "^13.5.0"
}
```

## 🚀 部署步骤

### 1. 构建客户端

```bash
cd client
npm run build
```

### 2. 上传文件到服务器

确保上传以下关键文件：
- `client/build/` 目录（完整构建输出）
- `client/public/images/` 目录
- `server/` 目录（完整服务器代码）
- 环境配置文件

### 3. 服务器端配置

确保服务器端 `index.js` 包含静态文件服务配置：

```javascript
// 静态文件服务配置
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/Circle', express.static(path.join(__dirname, '../client/public/Circle')));
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));
app.use('/favicon.ico', express.static(path.join(__dirname, '../client/public/favicon.ico')));
app.use('/manifest.json', express.static(path.join(__dirname, '../client/public/manifest.json')));
```

## 🧪 部署后测试

### 1. 静态资源可访问性测试

在浏览器中访问以下URL，确保返回正确内容：

```
https://your-domain.com/images/og-default.jpg
https://your-domain.com/favicon.ico
https://your-domain.com/manifest.json
```

### 2. SEO元标签测试

**方法1：浏览器开发者工具**
1. 打开网站首页
2. 按F12打开开发者工具
3. 查看 `<head>` 部分是否包含以下标签：

```html
<!-- 基础SEO标签 -->
<title>MJ Gallery - 专业AI艺术创作平台</title>
<meta name="description" content="专业的AI艺术创作平台...">
<meta name="keywords" content="Midjourney,AI艺术...">

<!-- Open Graph标签 -->
<meta property="og:title" content="MJ Gallery - 专业AI艺术创作平台">
<meta property="og:description" content="专业的AI艺术创作平台...">
<meta property="og:image" content="https://your-domain.com/images/og-default.jpg">
<meta property="og:url" content="https://your-domain.com/">

<!-- Twitter Card标签 -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="MJ Gallery - 专业AI艺术创作平台">
<meta name="twitter:image" content="https://your-domain.com/images/og-default.jpg">
```

**方法2：社交媒体分享测试**
- [Facebook分享调试器](https://developers.facebook.com/tools/debug/)
- [Twitter Card验证器](https://cards-dev.twitter.com/validator)
- [LinkedIn分享检查器](https://www.linkedin.com/post-inspector/)

### 3. 结构化数据测试

使用 [Google结构化数据测试工具](https://search.google.com/test/rich-results) 验证结构化数据是否正确。

## 🐛 常见问题排查

### 问题1：SEO标签不显示

**可能原因：**
- 环境变量未正确设置
- `react-helmet-async` 未正确初始化
- 组件未正确使用SEO hooks

**解决方案：**
1. 检查 `src/index.js` 是否包含 `HelmetProvider`：
```javascript
import { HelmetProvider } from 'react-helmet-async';

root.render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
```

2. 检查页面组件是否使用了SEO相关组件或hooks

### 问题2：分享图片不显示

**可能原因：**
- 图片文件不存在
- 服务器端静态文件服务未配置
- 图片URL不正确

**解决方案：**
1. 确认图片文件存在：`client/public/images/og-default.jpg`
2. 确认服务器端静态文件配置正确
3. 直接访问图片URL测试可访问性

### 问题3：不同页面SEO信息相同

**可能原因：**
- 页面组件未正确使用动态SEO配置
- 路由参数未正确传递给SEO组件

**解决方案：**
1. 检查页面组件是否使用了对应的SEO hooks
2. 确认动态数据（如文章标题、用户名等）正确传递给SEO组件

### 问题4：服务器端渲染问题

**可能原因：**
- 如果使用SSR，可能存在服务器端渲染配置问题

**解决方案：**
1. 本项目使用客户端渲染，确保 `react-helmet-async` 在客户端正确工作
2. 如果需要SSR，需要额外配置服务器端渲染

## 📊 性能优化建议

### 1. 图片优化

- 使用适当大小的分享图片（推荐1200x630像素）
- 考虑使用WebP格式以减少文件大小
- 为不同社交平台提供不同尺寸的图片

### 2. 缓存配置

在服务器端为静态资源设置适当的缓存头：

```javascript
app.use('/images', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=86400'); // 24小时缓存
  next();
});
```

### 3. CDN使用

考虑将静态资源（特别是图片）部署到CDN以提高加载速度。

## 📝 维护建议

### 1. 定期检查

- 每月使用社交媒体分享工具测试SEO功能
- 监控Google Search Console中的结构化数据错误
- 检查网站在搜索结果中的显示效果

### 2. 内容更新

- 根据网站内容更新，及时调整SEO配置
- 为新页面添加适当的SEO配置
- 定期更新分享图片以保持新鲜感

### 3. 监控工具

推荐使用以下工具监控SEO效果：
- Google Analytics
- Google Search Console
- 社交媒体分析工具

---

**最后更新：** 2025-01-08
**适用版本：** MJ Gallery v1.0.0

如果按照此清单操作后SEO功能仍然不工作，请检查浏览器控制台是否有JavaScript错误，或联系技术支持。