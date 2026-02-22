#!/bin/bash
# 服务器端问题修复部署脚本
# 解决首页内容无法显示的问题

echo "🔧 开始修复服务器配置问题..."

# 1. 停止当前服务
echo "⏹️ 停止当前服务..."
pm2 stop mj-gallery-server || true

# 2. 备份当前配置
echo "💾 备份当前配置..."
cp server/.env server/.env.backup.$(date +%Y%m%d_%H%M%S) || true
cp ecosystem.config.js ecosystem.config.js.backup.$(date +%Y%m%d_%H%M%S) || true

# 3. 更新环境变量
echo "🔧 更新环境变量..."
# 设置TRUST_PROXY为true以解决X-Forwarded-For错误
export TRUST_PROXY="true"
export NODE_ENV="production"
export MONGODB_URI="mongodb://localhost:27017/midjourney-gallery"

# 4. 更新.env文件
echo "📝 更新.env文件..."
sed -i 's/TRUST_PROXY=false/TRUST_PROXY=true/g' server/.env
echo "TRUST_PROXY=true" >> server/.env

# 5. 安装依赖
echo "📦 安装服务器依赖..."
cd server
npm install --production
cd ..

# 6. 重启服务
echo "🚀 重启服务..."
pm2 start ecosystem.config.js

# 7. 检查服务状态
echo "🔍 检查服务状态..."
sleep 5
pm2 status
pm2 logs mj-gallery-server --lines 20

echo "✅ 服务器配置修复完成！"
echo "📊 请检查以下内容："
echo "   - PM2状态: pm2 status"
echo "   - 服务日志: pm2 logs mj-gallery-server"
echo "   - API测试: curl http://localhost:5500/api/health"
echo "   - 数据测试: curl http://localhost:5500/api/posts"
