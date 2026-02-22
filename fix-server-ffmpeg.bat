@echo off
chcp 65001 >nul
echo 🔧 开始修复服务器 ffmpeg 依赖问题...
echo.
echo 请在服务器上执行以下命令：
echo.
echo cd /var/www/mj-gallery/server
echo pm2 stop all
echo rm -rf node_modules
echo rm -f package-lock.json
echo npm install
echo pm2 start ecosystem.config.js
echo pm2 logs
echo.
echo 或者直接执行修复脚本：
echo bash fix-server-ffmpeg.sh
echo.
echo ✅ 修复步骤已准备完成！
pause