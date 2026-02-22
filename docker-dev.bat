@echo off
chcp 65001 >nul
echo ========================================
echo    MJ Gallery Docker 开发环境管理
echo ========================================
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未安装或未启动
    echo 请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker 已安装
docker --version
echo.

echo 请选择操作:
echo 1. 🚀 启动开发环境
echo 2. 🛑 停止开发环境
echo 3. 🔄 重启开发环境
echo 4. 📊 查看服务状态
echo 5. 📋 查看日志
echo 6. 🧹 清理环境
echo 7. 🔧 构建镜像
echo 8. 💾 备份数据
echo 9. 📖 显示访问信息
echo 0. 退出
echo.
set /p choice=请输入选择 (0-9): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto clean
if "%choice%"=="7" goto build
if "%choice%"=="8" goto backup
if "%choice%"=="9" goto info
if "%choice%"=="0" goto exit

echo 无效选择
goto end

:start
echo.
echo 🚀 启动 Docker 开发环境...
echo.

REM 检查是否需要构建镜像
docker images | findstr "mj-gallery" >nul
if %errorlevel% neq 0 (
    echo 📦 首次运行，正在构建镜像...
    docker-compose -f docker-compose.dev.yml build
    if %errorlevel% neq 0 (
        echo ❌ 镜像构建失败
        goto end
    )
)

echo 🔄 启动服务容器...
docker-compose -f docker-compose.dev.yml up -d

if %errorlevel% equ 0 (
    echo ✅ 开发环境启动成功！
    echo.
    echo 等待服务初始化...
    timeout /t 10 >nul
    
    echo 🌐 访问地址:
    echo    前端: http://localhost:3100
    echo    后端: http://localhost:5500
    echo    API:  http://localhost:5500/api
    echo.
    echo 👤 管理员账户:
    echo    用户名: admin
    echo    密码:   admin123456
    echo.
    echo 📊 查看日志: docker-compose -f docker-compose.dev.yml logs -f
    echo 🛑 停止服务: docker-compose -f docker-compose.dev.yml down
) else (
    echo ❌ 启动失败
)
goto end

:stop
echo.
echo 🛑 停止 Docker 开发环境...
echo.
docker-compose -f docker-compose.dev.yml down
if %errorlevel% equ 0 (
    echo ✅ 开发环境已停止
) else (
    echo ❌ 停止失败
)
goto end

:restart
echo.
echo 🔄 重启 Docker 开发环境...
echo.
echo 停止服务...
docker-compose -f docker-compose.dev.yml down
echo 启动服务...
docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% equ 0 (
    echo ✅ 开发环境重启成功
    echo 等待服务初始化...
    timeout /t 10 >nul
    call :show_info
) else (
    echo ❌ 重启失败
)
goto end

:status
echo.
echo 📊 Docker 服务状态:
echo.
docker-compose -f docker-compose.dev.yml ps
echo.
echo 📈 容器资源使用情况:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
goto end

:logs
echo.
echo 📋 选择要查看的日志:
echo 1. 应用服务日志
echo 2. MongoDB 日志
echo 3. 所有服务日志
echo 4. 实时日志 (Ctrl+C 退出)
echo.
set /p log_choice=请选择 (1-4): 

if "%log_choice%"=="1" (
    docker-compose -f docker-compose.dev.yml logs app
) else if "%log_choice%"=="2" (
    docker-compose -f docker-compose.dev.yml logs mongodb
) else if "%log_choice%"=="3" (
    docker-compose -f docker-compose.dev.yml logs
) else if "%log_choice%"=="4" (
    echo 按 Ctrl+C 退出日志查看
    docker-compose -f docker-compose.dev.yml logs -f
) else (
    echo 无效选择
)
goto end

:clean
echo.
echo 🧹 清理 Docker 环境...
echo.
echo ⚠️  警告: 这将删除所有容器、镜像和数据卷
set /p confirm=确认清理? (y/N): 
if /i "%confirm%"=="y" (
    echo 停止并删除容器...
    docker-compose -f docker-compose.dev.yml down -v
    
    echo 删除镜像...
    for /f "tokens=3" %%i in ('docker images ^| findstr "mj-gallery"') do docker rmi %%i
    
    echo 清理未使用的资源...
    docker system prune -f
    
    echo ✅ 清理完成
) else (
    echo 取消清理
)
goto end

:build
echo.
echo 🔧 构建 Docker 镜像...
echo.
docker-compose -f docker-compose.dev.yml build --no-cache
if %errorlevel% equ 0 (
    echo ✅ 镜像构建成功
) else (
    echo ❌ 镜像构建失败
)
goto end

:backup
echo.
echo 💾 备份开发数据...
echo.
set backup_dir=backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set backup_dir=%backup_dir: =0%

mkdir "%backup_dir%" 2>nul

echo 备份 MongoDB 数据...
docker exec mj-gallery-mongo-dev mongodump --db midjourney-gallery-dev --out /tmp/backup
docker cp mj-gallery-mongo-dev:/tmp/backup "%backup_dir%\mongodb"

echo 备份上传文件...
docker cp mj-gallery-app-dev:/app/server/uploads "%backup_dir%\uploads"

echo 备份配置文件...
copy "docker-compose.dev.yml" "%backup_dir%\docker-compose.dev.yml"
copy "Dockerfile.dev" "%backup_dir%\Dockerfile.dev"

echo ✅ 备份完成: %backup_dir%
goto end

:info
call :show_info
goto end

:show_info
echo.
echo ========================================
echo           开发环境信息
echo ========================================
echo.
echo 🌐 访问地址:
echo    前端应用: http://localhost:3100
echo    后端API:  http://localhost:5500
echo    健康检查: http://localhost:5500/api/health
echo    MongoDB:  mongodb://localhost:27017
echo.
echo 👤 默认账户:
echo    管理员用户名: admin
    echo    管理员密码:   admin123456
echo    数据库名:     midjourney-gallery-dev
echo.
echo 📁 数据持久化:
echo    MongoDB数据: Docker卷 mj-gallery-mongodb-dev
echo    上传文件:    Docker卷 mj-gallery-uploads-dev
echo    应用日志:    Docker卷 mj-gallery-logs-dev
echo.
echo 🛠️  常用命令:
echo    查看状态: docker-compose -f docker-compose.dev.yml ps
echo    查看日志: docker-compose -f docker-compose.dev.yml logs -f
echo    进入容器: docker exec -it mj-gallery-app-dev sh
echo    重启服务: docker-compose -f docker-compose.dev.yml restart
echo.
echo ========================================
return

:exit
echo 退出 Docker 管理脚本
goto end

:end
echo.
pause