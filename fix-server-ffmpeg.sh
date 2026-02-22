#!/bin/bash

# 修复服务器 ffmpeg 依赖问题
echo "🔧 开始修复服务器 ffmpeg 依赖问题..."

# 进入服务器目录
cd /var/www/mj-gallery/server

# 停止 PM2 进程
echo "⏹️ 停止 PM2 进程..."
pm2 stop all

# 删除 node_modules 和 package-lock.json
echo "🗑️ 清理旧的依赖文件..."
rm -rf node_modules
rm -f package-lock.json

# 确保 package.json 中有正确的依赖
echo "📦 检查 package.json 依赖配置..."
if ! grep -q "@ffmpeg-installer/ffmpeg" package.json; then
    echo "❌ package.json 中缺少 @ffmpeg-installer/ffmpeg 依赖"
    echo "请确保 package.json 已正确上传"
    exit 1
fi

# 重新安装依赖
echo "📥 重新安装依赖..."
npm install

# 检查 @ffmpeg-installer/ffmpeg 是否安装成功
if [ -d "node_modules/@ffmpeg-installer" ]; then
    echo "✅ @ffmpeg-installer/ffmpeg 安装成功"
else
    echo "❌ @ffmpeg-installer/ffmpeg 安装失败"
    exit 1
fi

# 检查 upload.js 文件是否使用正确的导入
echo "🔍 检查 upload.js 文件..."
if grep -q "ffmpeg-static" routes/upload.js; then
    echo "❌ upload.js 仍在使用 ffmpeg-static，需要更新文件"
    exit 1
fi

if grep -q "@ffmpeg-installer/ffmpeg" routes/upload.js; then
    echo "✅ upload.js 使用正确的 ffmpeg 依赖"
else
    echo "❌ upload.js 缺少 @ffmpeg-installer/ffmpeg 导入"
    exit 1
fi

# 重启 PM2 进程
echo "🚀 重启 PM2 进程..."
pm2 start ecosystem.config.js

# 检查进程状态
echo "📊 检查进程状态..."
pm2 status

echo "✅ 修复完成！"
echo "请检查服务器日志确认是否正常运行：pm2 logs"