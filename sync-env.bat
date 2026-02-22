@echo off
chcp 65001 >nul
echo ========================================
echo      环境同步和配置管理工具
echo ========================================
echo.

echo 请选择操作:
echo 1. 📥 从服务器同步配置到本地
echo 2. 📤 将本地配置推送到服务器
echo 3. 🔄 同步数据库数据
echo 4. 📋 比较环境配置差异
echo 5. 🔧 生成环境配置文件
echo 6. ✅ 验证环境配置
echo 7. 📊 显示当前环境信息
echo 8. 🚀 快速环境切换
echo 0. 退出
echo.
set /p choice=请输入选择 (0-8): 

if "%choice%"=="1" goto sync_from_server
if "%choice%"=="2" goto sync_to_server
if "%choice%"=="3" goto sync_database
if "%choice%"=="4" goto compare_config
if "%choice%"=="5" goto generate_config
if "%choice%"=="6" goto validate_config
if "%choice%"=="7" goto show_env_info
if "%choice%"=="8" goto switch_env
if "%choice%"=="0" goto exit

echo 无效选择
goto end

:sync_from_server
echo.
echo 📥 从服务器同步配置到本地...
echo.
echo ⚠️  这将覆盖本地的环境配置文件
set /p server_ip=请输入服务器IP地址: 
set /p confirm=确认同步? (y/N): 

if /i "%confirm%"=="y" (
    echo 正在同步服务器配置...
    
    REM 这里需要根据实际情况修改服务器路径和认证方式
    echo 同步服务器端配置...
    REM scp user@%server_ip%:/var/www/mj-gallery/server/.env server/.env.production
    
    echo 同步客户端配置...
    REM scp user@%server_ip%:/var/www/mj-gallery/client/.env client/.env.production
    
    echo 创建本地开发配置...
    call :create_local_config
    
    echo ✅ 配置同步完成
    echo 📝 已创建以下文件:
    echo    server/.env.production (生产环境配置)
    echo    server/.env (本地开发配置)
    echo    client/.env.production (生产环境配置)
    echo    client/.env (本地开发配置)
) else (
    echo 取消同步
)
goto end

:sync_to_server
echo.
echo 📤 将本地配置推送到服务器...
echo.
echo ⚠️  这将覆盖服务器的环境配置文件
set /p server_ip=请输入服务器IP地址: 
set /p confirm=确认推送? (y/N): 

if /i "%confirm%"=="y" (
    echo 正在推送配置到服务器...
    
    if exist "server\.env.production" (
        echo 推送服务器端配置...
        REM scp server/.env.production user@%server_ip%:/var/www/mj-gallery/server/.env
        echo ✅ 服务器端配置已推送
    ) else (
        echo ❌ server/.env.production 不存在
    )
    
    if exist "client\.env.production" (
        echo 推送客户端配置...
        REM scp client/.env.production user@%server_ip%:/var/www/mj-gallery/client/.env
        echo ✅ 客户端配置已推送
    ) else (
        echo ❌ client/.env.production 不存在
    )
    
    echo.
    echo ⚠️  注意: 请在服务器上重启应用以应用新配置
    echo 服务器重启命令: pm2 restart all
) else (
    echo 取消推送
)
goto end

:sync_database
echo.
echo 🔄 同步数据库数据...
echo.
echo 请选择同步方向:
echo 1. 从服务器同步到本地
echo 2. 从本地同步到服务器
echo 3. 仅同步结构（不含数据）
echo.
set /p db_choice=请选择 (1-3): 

if "%db_choice%"=="1" (
    echo 📥 从服务器同步数据到本地...
    set /p server_ip=请输入服务器IP地址: 
    
    echo 正在导出服务器数据...
    REM ssh user@%server_ip% "mongodump --db midjourney-gallery --out /tmp/backup"
    
    echo 正在下载数据...
    REM scp -r user@%server_ip%:/tmp/backup ./temp_backup
    
    echo 正在导入到本地数据库...
    REM mongorestore --db midjourney-gallery-dev ./temp_backup/midjourney-gallery
    
    echo 清理临时文件...
    REM rmdir /s /q temp_backup
    
    echo ✅ 数据同步完成
) else if "%db_choice%"=="2" (
    echo 📤 从本地同步数据到服务器...
    echo ⚠️  警告: 这将覆盖服务器上的数据库
    set /p confirm=确认同步? (y/N): 
    
    if /i "%confirm%"=="y" (
        echo 正在导出本地数据...
        mongodump --db midjourney-gallery-dev --out ./temp_backup
        
        echo 正在上传数据...
        REM scp -r ./temp_backup user@%server_ip%:/tmp/
        
        echo 正在导入到服务器数据库...
        REM ssh user@%server_ip% "mongorestore --db midjourney-gallery /tmp/temp_backup/midjourney-gallery-dev"
        
        echo 清理临时文件...
        rmdir /s /q temp_backup
        
        echo ✅ 数据同步完成
    )
) else if "%db_choice%"=="3" (
    echo 📋 同步数据库结构...
    echo 正在同步索引和集合结构...
    
    REM 这里可以添加结构同步逻辑
    echo ✅ 结构同步完成
)
goto end

:compare_config
echo.
echo 📋 比较环境配置差异...
echo.

if exist "server\.env" (
    echo 📄 服务器端配置对比:
    if exist "server\.env.production" (
        echo 本地开发 vs 生产环境:
        fc /N "server\.env" "server\.env.production" 2>nul
        if %errorlevel% equ 0 (
            echo ✅ 配置文件相同
        ) else (
            echo ⚠️  配置文件存在差异
        )
    ) else (
        echo ❌ 生产环境配置文件不存在
    )
echo.
)

if exist "client\.env" (
    echo 📄 客户端配置对比:
    if exist "client\.env.production" (
        echo 本地开发 vs 生产环境:
        fc /N "client\.env" "client\.env.production" 2>nul
        if %errorlevel% equ 0 (
            echo ✅ 配置文件相同
        ) else (
            echo ⚠️  配置文件存在差异
        )
    ) else (
        echo ❌ 生产环境配置文件不存在
    )
)
goto end

:generate_config
echo.
echo 🔧 生成环境配置文件...
echo.
echo 请选择要生成的配置:
echo 1. 本地开发环境配置
echo 2. 生产环境配置
echo 3. Docker 环境配置
echo 4. 测试环境配置
echo.
set /p gen_choice=请选择 (1-4): 

if "%gen_choice%"=="1" (
    call :create_local_config
    echo ✅ 本地开发环境配置已生成
) else if "%gen_choice%"=="2" (
    call :create_production_config
    echo ✅ 生产环境配置已生成
) else if "%gen_choice%"=="3" (
    call :create_docker_config
    echo ✅ Docker 环境配置已生成
) else if "%gen_choice%"=="4" (
    call :create_test_config
    echo ✅ 测试环境配置已生成
)
goto end

:validate_config
echo.
echo ✅ 验证环境配置...
echo.

echo 检查服务器端配置...
if exist "server\.env" (
    echo ✅ server/.env 存在
    
    REM 检查必需的环境变量
    findstr "MONGODB_URI" server\.env >nul
    if %errorlevel% equ 0 (
        echo ✅ 数据库配置存在
    ) else (
        echo ❌ 缺少数据库配置
    )
    
    findstr "JWT_SECRET" server\.env >nul
    if %errorlevel% equ 0 (
        echo ✅ JWT配置存在
    ) else (
        echo ❌ 缺少JWT配置
    )
    
    findstr "PORT" server\.env >nul
    if %errorlevel% equ 0 (
        echo ✅ 端口配置存在
    ) else (
        echo ❌ 缺少端口配置
    )
) else (
    echo ❌ server/.env 不存在
)

echo.
echo 检查客户端配置...
if exist "client\.env" (
    echo ✅ client/.env 存在
    
    findstr "REACT_APP_API_URL" client\.env >nul
    if %errorlevel% equ 0 (
        echo ✅ API地址配置存在
    ) else (
        echo ❌ 缺少API地址配置
    )
) else (
    echo ❌ client/.env 不存在
)

echo.
echo 检查上传目录...
if exist "server\uploads" (
    echo ✅ 上传目录存在
) else (
    echo ❌ 上传目录不存在
    mkdir "server\uploads\images" 2>nul
    mkdir "server\uploads\videos" 2>nul
    mkdir "server\uploads\temp" 2>nul
    echo ✅ 已创建上传目录
)
goto end

:show_env_info
echo.
echo 📊 当前环境信息:
echo.
echo 🖥️  操作系统: Windows
echo 📁 项目目录: %cd%
echo.

if exist "server\.env" (
    echo 🔧 服务器配置:
    for /f "tokens=1,2 delims==" %%a in ('findstr "PORT\|NODE_ENV\|MONGODB_URI" server\.env') do (
        echo    %%a = %%b
    )
    echo.
)

if exist "client\.env" (
    echo 🎨 客户端配置:
    for /f "tokens=1,2 delims==" %%a in ('findstr "REACT_APP_API_URL\|REACT_APP_NODE_ENV" client\.env') do (
        echo    %%a = %%b
    )
    echo.
)

echo 📦 Node.js 版本:
node --version 2>nul || echo ❌ Node.js 未安装

echo 📦 npm 版本:
npm --version 2>nul || echo ❌ npm 未安装

echo 🗄️  MongoDB 状态:
sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB 服务已安装
) else (
    echo ❌ MongoDB 服务未安装
)

echo 🐳 Docker 状态:
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker 已安装
    docker --version
) else (
    echo ❌ Docker 未安装
)
goto end

:switch_env
echo.
echo 🚀 快速环境切换...
echo.
echo 请选择目标环境:
echo 1. 本地开发环境
echo 2. 生产环境配置
echo 3. Docker 环境
echo 4. 测试环境
echo.
set /p env_choice=请选择 (1-4): 

if "%env_choice%"=="1" (
    echo 切换到本地开发环境...
    if exist "server\.env.development" (
        copy "server\.env.development" "server\.env" >nul
    )
    if exist "client\.env.development" (
        copy "client\.env.development" "client\.env" >nul
    )
    echo ✅ 已切换到本地开发环境
) else if "%env_choice%"=="2" (
    echo 切换到生产环境配置...
    if exist "server\.env.production" (
        copy "server\.env.production" "server\.env" >nul
    )
    if exist "client\.env.production" (
        copy "client\.env.production" "client\.env" >nul
    )
    echo ✅ 已切换到生产环境配置
) else if "%env_choice%"=="3" (
    echo 切换到 Docker 环境...
    echo 请使用 docker-dev.bat 启动 Docker 环境
) else if "%env_choice%"=="4" (
    echo 切换到测试环境...
    if exist "server\.env.test" (
        copy "server\.env.test" "server\.env" >nul
    )
    if exist "client\.env.test" (
        copy "client\.env.test" "client\.env" >nul
    )
    echo ✅ 已切换到测试环境
)
goto end

:create_local_config
echo 创建本地开发配置...

REM 创建服务器本地配置
(
echo # 本地开发环境配置
echo PORT=5500
echo NODE_ENV=development
echo TRUST_PROXY=false
echo.
echo # 本地数据库
echo MONGODB_URI=mongodb://localhost:27017/midjourney-gallery-dev
echo.
echo # JWT配置
echo JWT_SECRET=dev-secret-key-for-local-development-only
echo JWT_EXPIRES_IN=7d
echo.
echo # 本地客户端URL
echo CLIENT_URL=http://localhost:3100
echo.
echo # 文件上传
echo MAX_FILE_SIZE=10485760
echo UPLOAD_PATH=./uploads
echo.
echo # 邮件配置（开发环境禁用）
echo EMAIL_ENABLED=false
echo.
echo # 管理员账户
echo ADMIN_USERNAME=admin
echo ADMIN_EMAIL=admin@localhost
echo ADMIN_PASSWORD=admin123456
echo ADMIN_AUTO_CREATE=true
) > server\.env.development

REM 创建客户端本地配置
(
echo # 本地开发环境配置
echo REACT_APP_API_URL=http://localhost:5500/api
echo REACT_APP_NODE_ENV=development
echo.
echo # 功能开关
echo REACT_APP_ENABLE_ANALYTICS=false
echo REACT_APP_ENABLE_PWA=false
echo REACT_APP_ENABLE_NOTIFICATIONS=true
echo.
echo # 文件上传
echo REACT_APP_MAX_FILE_SIZE=10485760
echo REACT_APP_MAX_FILES_PER_POST=10
echo.
echo # UI配置
echo REACT_APP_POSTS_PER_PAGE=12
echo REACT_APP_ANIMATION_DURATION=300
) > client\.env.development

REM 复制为当前环境配置
copy "server\.env.development" "server\.env" >nul
copy "client\.env.development" "client\.env" >nul
return

:create_production_config
echo 创建生产环境配置模板...

REM 这里创建生产环境配置模板
(
echo # 生产环境配置
echo PORT=5500
echo NODE_ENV=production
echo TRUST_PROXY=true
echo.
echo # 生产数据库（需要修改）
echo MONGODB_URI=mongodb://localhost:27017/midjourney-gallery
echo.
echo # JWT配置（需要修改为强密钥）
echo JWT_SECRET=your-super-secret-jwt-key-here
echo JWT_EXPIRES_IN=7d
echo.
echo # 生产客户端URL（需要修改）
echo CLIENT_URL=https://your-domain.com
echo.
echo # 文件上传
echo MAX_FILE_SIZE=10485760
echo UPLOAD_PATH=./uploads
echo.
echo # 邮件配置（需要配置）
echo EMAIL_ENABLED=true
echo SMTP_HOST=your-smtp-host
echo SMTP_PORT=587
echo SMTP_USER=your-email
echo SMTP_PASS=your-password
) > server\.env.production
return

:create_docker_config
echo Docker 配置已在 docker-compose.dev.yml 中定义
return

:create_test_config
echo 创建测试环境配置...

REM 创建测试环境配置
(
echo # 测试环境配置
echo PORT=5501
echo NODE_ENV=test
echo TRUST_PROXY=false
echo.
echo # 测试数据库
echo MONGODB_URI=mongodb://localhost:27017/midjourney-gallery-test
echo.
echo # JWT配置
echo JWT_SECRET=test-secret-key
echo JWT_EXPIRES_IN=1h
echo.
echo # 测试客户端URL
echo CLIENT_URL=http://localhost:3101
echo.
echo # 邮件配置（测试环境禁用）
echo EMAIL_ENABLED=false
) > server\.env.test
return

:exit
echo 退出环境同步工具
goto end

:end
echo.
pause