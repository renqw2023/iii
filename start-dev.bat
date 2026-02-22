@echo off
chcp 65001 >nul
echo ========================================
echo      MJ Gallery 开发环境启动脚本
echo ========================================
echo.

REM 检查环境配置
if not exist "server\.env" (
    echo ❌ 服务器环境配置不存在
    echo 请先运行 setup-local-dev.bat 进行初始化
    pause
    exit /b 1
)

if not exist "client\.env" (
    echo ❌ 客户端环境配置不存在
    echo 请先运行 setup-local-dev.bat 进行初始化
    pause
    exit /b 1
)

echo [1/3] 检查 MongoDB 服务...
echo.

REM 启动 MongoDB 服务
net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB 服务已启动
) else (
    echo ⚠️  MongoDB 服务启动失败，可能已在运行
    echo 尝试手动启动 mongod...
    start "MongoDB" cmd /c "mongod --dbpath C:\data\db"
    timeout /t 3 >nul
)

echo.
echo [2/3] 选择启动模式...
echo.
echo 请选择启动模式:
echo 1. 完整开发环境 (前端 + 后端)
echo 2. 仅启动后端服务
echo 3. 仅启动前端服务
echo 4. 分别启动 (两个终端窗口)
echo 5. 退出
echo.
set /p choice=请输入选择 (1-5): 

if "%choice%"=="1" goto full_dev
if "%choice%"=="2" goto server_only
if "%choice%"=="3" goto client_only
if "%choice%"=="4" goto separate
if "%choice%"=="5" goto exit

echo 无效选择，默认启动完整开发环境
goto full_dev

:full_dev
echo.
echo [3/3] 启动完整开发环境...
echo.
echo 🚀 正在启动前端和后端服务...
echo 📱 前端地址: http://localhost:3100
echo 🔧 后端地址: http://localhost:5500
echo 📡 API地址:  http://localhost:5500/api
echo.
echo 按 Ctrl+C 停止服务
echo.
npm run dev
goto end

:server_only
echo.
echo [3/3] 启动后端服务...
echo.
echo 🔧 正在启动后端服务...
echo 🔧 后端地址: http://localhost:5500
echo 📡 API地址:  http://localhost:5500/api
echo.
echo 按 Ctrl+C 停止服务
echo.
npm run server
goto end

:client_only
echo.
echo [3/3] 启动前端服务...
echo.
echo 📱 正在启动前端服务...
echo 📱 前端地址: http://localhost:3100
echo.
echo 按 Ctrl+C 停止服务
echo.
npm run client
goto end

:separate
echo.
echo [3/3] 分别启动服务...
echo.
echo 🔧 启动后端服务 (新窗口)...
start "MJ Gallery - 后端服务" cmd /c "echo 🔧 MJ Gallery 后端服务 && echo 地址: http://localhost:5500 && echo API: http://localhost:5500/api && echo. && npm run server && pause"

echo 等待后端服务启动...
timeout /t 5 >nul

echo 📱 启动前端服务 (新窗口)...
start "MJ Gallery - 前端服务" cmd /c "echo 📱 MJ Gallery 前端服务 && echo 地址: http://localhost:3100 && echo. && npm run client && pause"

echo.
echo ✅ 服务已在新窗口中启动
echo 📱 前端: http://localhost:3100
echo 🔧 后端: http://localhost:5500
echo.
echo 关闭对应窗口即可停止服务
goto end

:exit
echo 退出启动脚本
goto end

:end
echo.
echo ========================================
echo           开发环境信息
echo ========================================
echo.
echo 🌐 访问地址:
echo    前端: http://localhost:3100
echo    后端: http://localhost:5500
echo    API:  http://localhost:5500/api
echo    健康检查: http://localhost:5500/api/health
echo.
echo 👤 管理员登录:
echo    用户名: admin
echo    密码:   admin123456
echo.
echo 📁 重要目录:
echo    上传目录: server/uploads
echo    日志目录: logs
echo    配置文件: server/.env, client/.env
echo.
echo 🛠️  常用命令:
echo    npm run dev          # 完整开发环境
echo    npm run server       # 仅后端
echo    npm run client       # 仅前端
echo    npm run build        # 构建前端
echo    npm run create-admin # 创建管理员
echo.
echo ========================================
echo.
if "%choice%"=="4" (
    echo 服务正在后台运行，可以关闭此窗口
) else (
    pause
)