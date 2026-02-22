@echo off
echo 应用静态文件路径修复...
echo.

echo 1. 上传修复后的server/index.js到服务器...
scp server/index.js root@47.236.15.171:/var/www/mj-gallery/server/
if %errorlevel% neq 0 (
    echo 上传失败！
    pause
    exit /b 1
)

echo 2. 重启PM2服务以应用更改...
ssh root@47.236.15.171 "pm2 restart mj-gallery-server"
if %errorlevel% neq 0 (
    echo PM2重启失败！
    pause
    exit /b 1
)

echo 3. 等待服务启动...
timeout /t 3 /nobreak >nul

echo.
echo ✅ 修复已应用！
echo.
echo 现在请测试以下URL是否可以正常访问：
echo https://mj.coolai.ink/uploads/images/6881abd9273b0f9323dab098/media-1753441349050-743157012.jpg
echo https://mj.coolai.ink/uploads/images/6881abd9273b0f9323dab098/media-1753442080201-533195402.jpg
echo.
echo 如果仍有问题，请检查服务器日志：
echo ssh root@47.236.15.171 "pm2 logs mj-gallery-server --lines 20"
echo.
pause