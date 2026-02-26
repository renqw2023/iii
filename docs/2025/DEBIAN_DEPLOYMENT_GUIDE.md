# MJ Gallery Debian 部署指南

## 📋 部署概览

本指南将帮助您在 Debian 系统上部署 MJ Gallery 应用，包括：
- SSL 证书申请配置
- 端口更换（避免 3000/5000 冲突）
- 数据导出与导入
- Nginx 反向代理配置
- PM2 进程管理

## 🔧 系统要求

- Debian 10+ 或 Ubuntu 18.04+
- Node.js 16+
- MongoDB 4.4+
- Nginx
- PM2
- Certbot (Let's Encrypt)

## 📦 1. 服务器环境准备

### 1.1 更新系统
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 安装必要软件
```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -g pm2

# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 1.3 启动服务
```bash
# 启动 MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 💾 2. 本地数据导出

### 2.1 创建数据导出脚本
在本地项目根目录创建 `export-data.js`：

```javascript
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

// 导入模型
const User = require('./server/models/User');
const Post = require('./server/models/Post');
const Notification = require('./server/models/Notification');

async function exportData() {
  try {
    console.log('🔗 连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/midjourney-gallery');
    
    console.log('📤 导出用户数据...');
    const users = await User.find({}).lean();
    
    console.log('📤 导出帖子数据...');
    const posts = await Post.find({}).lean();
    
    console.log('📤 导出通知数据...');
    const notifications = await Notification.find({}).lean();
    
    // 创建导出目录
    const exportDir = './data-export';
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // 保存数据
    fs.writeFileSync(path.join(exportDir, 'users.json'), JSON.stringify(users, null, 2));
    fs.writeFileSync(path.join(exportDir, 'posts.json'), JSON.stringify(posts, null, 2));
    fs.writeFileSync(path.join(exportDir, 'notifications.json'), JSON.stringify(notifications, null, 2));
    
    console.log('✅ 数据导出完成！');
    console.log(`📁 导出文件位置: ${path.resolve(exportDir)}`);
    console.log(`👥 用户数量: ${users.length}`);
    console.log(`📝 帖子数量: ${posts.length}`);
    console.log(`🔔 通知数量: ${notifications.length}`);
    
  } catch (error) {
    console.error('❌ 导出失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

exportData();
```

### 2.2 执行数据导出

**Windows 用户:**
```cmd
# 使用快速导出脚本
quick-export.bat
```

**Linux/Mac 用户:**
```bash
# 在本地项目根目录执行
node export-data.js

# 打包上传文件
tar -czf uploads-backup.tar.gz server/uploads/
tar -czf data-export.tar.gz data-export/
```

## 🚀 3. 服务器部署

### 3.1 上传项目文件
```bash
# 在服务器上创建项目目录
sudo mkdir -p /var/www/mj-gallery
sudo chown $USER:$USER /var/www/mj-gallery

# 上传项目文件（在本地执行）
scp -r . user@your-server:/var/www/mj-gallery/
scp data-export.tar.gz user@your-server:/var/www/mj-gallery/
scp uploads-backup.tar.gz user@your-server:/var/www/mj-gallery/
```

### 3.2 解压并安装依赖
```bash
cd /var/www/mj-gallery

# 解压数据文件
tar -xzf data-export.tar.gz
tar -xzf uploads-backup.tar.gz

# 安装依赖
npm run install-all
```

### 3.3 配置环境变量

#### 服务器端配置 (`server/.env`)：
```bash
# 服务器配置 - 更换端口避免冲突
PORT=8080
NODE_ENV=production
TRUST_PROXY=true

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/midjourney-gallery

# JWT配置 - 生产环境使用强密钥
JWT_SECRET=your-super-secure-jwt-secret-key-here

# 客户端URL - 使用域名
CLIENT_URL=https://iii.pics

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# 邮件配置
EMAIL_ENABLED=true
EMAIL_SERVICE=your-email-service
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@coolai.ink
```

#### 客户端配置 (`client/.env`)：
```bash
# API配置 - 更换端口
REACT_APP_API_URL=https://iii.pics/api
REACT_APP_API_TIMEOUT=10000
REACT_APP_API_RETRY_ATTEMPTS=3
REACT_APP_API_RETRY_DELAY=1000

# 应用配置
REACT_APP_APP_NAME=MJ Gallery
REACT_APP_APP_VERSION=1.0.0
REACT_APP_APP_DESCRIPTION=专门展示Midjourney风格参数的精美网站
REACT_APP_APP_AUTHOR=MJ Gallery Team
REACT_APP_HOMEPAGE=https://iii.pics

# 功能开关
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_DARK_MODE=true
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_SOCIAL_SHARE=true
REACT_APP_ENABLE_COMMENTS=true
```

## 🔒 4. SSL 证书申请

### 4.1 申请 Let's Encrypt 证书
```bash
# 为域名申请证书
sudo certbot --nginx -d iii.pics

# 设置自动续期
sudo crontab -e
# 添加以下行：
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🌐 5. Nginx 配置

### 5.1 创建 Nginx 配置文件
```bash
sudo nano /etc/nginx/sites-available/mj-gallery
```

配置内容：
```nginx
server {
    listen 80;
    server_name iii.pics;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name iii.pics;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/iii.pics/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/iii.pics/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 客户端文件大小限制
    client_max_body_size 200M;

    # 静态文件服务
    location / {
        root /var/www/mj-gallery/client/build;
        try_files $uri $uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:5500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO 支持
    location /socket.io/ {
        proxy_pass http://localhost:5500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件服务
    location /uploads {
        alias /var/www/mj-gallery/server/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

### 5.2 启用配置
```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/mj-gallery /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 📊 6. 数据导入

### 6.1 创建数据导入脚本
```bash
cd /var/www/mj-gallery
nano import-data.js
```

```javascript
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

// 导入模型
const User = require('./server/models/User');
const Post = require('./server/models/Post');
const Notification = require('./server/models/Notification');

async function importData() {
  try {
    console.log('🔗 连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/midjourney-gallery');
    
    // 读取导出的数据
    const users = JSON.parse(fs.readFileSync('./data-export/users.json', 'utf8'));
    const posts = JSON.parse(fs.readFileSync('./data-export/posts.json', 'utf8'));
    const notifications = JSON.parse(fs.readFileSync('./data-export/notifications.json', 'utf8'));
    
    console.log('📥 导入用户数据...');
    if (users.length > 0) {
      await User.insertMany(users);
      console.log(`✅ 导入 ${users.length} 个用户`);
    }
    
    console.log('📥 导入帖子数据...');
    if (posts.length > 0) {
      await Post.insertMany(posts);
      console.log(`✅ 导入 ${posts.length} 个帖子`);
    }
    
    console.log('📥 导入通知数据...');
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ 导入 ${notifications.length} 个通知`);
    }
    
    console.log('🎉 数据导入完成！');
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
  } finally {
    await mongoose.disconnect();
  }
}

importData();
```

### 6.2 执行数据导入
```bash
# 执行导入
node import-data.js

# 设置上传文件权限
sudo chown -R $USER:$USER server/uploads
chmod -R 755 server/uploads
```

## 🔄 7. PM2 进程管理

### 7.1 创建 PM2 配置文件
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'mj-gallery-server',
    script: './server/index.js',
    cwd: '/var/www/mj-gallery',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5500
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 7.2 启动应用
```bash
# 创建日志目录
mkdir -p logs

# 构建前端
cd client && npm run build && cd ..

# 初始化服务器
cd server && npm run setup && cd ..

# 启动 PM2
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## 🔍 8. 验证部署

### 8.1 检查服务状态
```bash
# 检查 PM2 状态
pm2 status

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查 MongoDB 状态
sudo systemctl status mongod

# 检查端口占用
sudo netstat -tlnp | grep :5500
sudo netstat -tlnp | grep :443
```

### 8.2 测试访问
```bash
# 测试 API
curl -k https://iii.pics/api/health

# 测试前端
curl -k https://iii.pics
```

## 📝 9. 监控和维护

### 9.1 日志查看
```bash
# PM2 日志
pm2 logs

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB 日志
sudo tail -f /var/log/mongodb/mongod.log
```

### 9.2 备份脚本
```bash
# 创建备份脚本
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mj-gallery"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mongodump --db midjourney-gallery --out $BACKUP_DIR/db_$DATE

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/mj-gallery/server/uploads

# 删除7天前的备份
find $BACKUP_DIR -type f -mtime +7 -delete

echo "备份完成: $DATE"
```

```bash
# 设置执行权限
chmod +x backup.sh

# 设置定时备份
crontab -e
# 添加：每天凌晨2点备份
0 2 * * * /var/www/mj-gallery/backup.sh
```

## 🚨 10. 故障排除

### 10.1 常见问题

1. **端口冲突**
   ```bash
   # 查看端口占用
   sudo lsof -i :8080
   # 修改 server/.env 中的 PORT 配置
   ```

2. **SSL 证书问题**
   ```bash
   # 重新申请证书
   sudo certbot --nginx -d iii.pics --force-renewal
   ```

3. **文件权限问题**
   ```bash
   # 修复权限
   sudo chown -R $USER:$USER /var/www/mj-gallery
   chmod -R 755 /var/www/mj-gallery
   ```

4. **数据库连接问题**
   ```bash
   # 检查 MongoDB 状态
   sudo systemctl status mongod
   # 重启 MongoDB
   sudo systemctl restart mongod
   ```

### 10.2 性能优化

1. **启用 Redis 缓存**（可选）
   ```bash
   sudo apt install redis-server
   # 在 server/.env 中添加：
   # REDIS_URL=redis://localhost:6379
   ```

2. **数据库索引优化**
   ```bash
   # 连接 MongoDB
   mongo midjourney-gallery
   # 创建索引
   db.posts.createIndex({ "createdAt": -1 })
   db.posts.createIndex({ "author": 1, "createdAt": -1 })
   db.users.createIndex({ "email": 1 })
   ```

## ✅ 部署完成

部署完成后，您的 MJ Gallery 应用将在以下地址可用：
- 🌐 前端：https://iii.pics
- 🔧 API：https://iii.pics/api
- 👨‍💼 管理后台：https://iii.pics/admin

默认管理员账户：
- 用户名：admin
- 邮箱：admin@example.com
- 密码：admin123456

**⚠️ 重要提醒：**
1. 立即修改默认管理员密码
2. 配置邮件服务以启用邮箱验证
3. 定期备份数据库和上传文件
4. 监控服务器资源使用情况
5. 定期更新系统和依赖包

🎉 恭喜！您的 MJ Gallery 已成功部署到生产环境！