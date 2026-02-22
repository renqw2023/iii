@echo off
chcp 65001 >nul
echo ========================================
echo     清理错误上传文件脚本
echo ========================================
echo.
echo 发现的错误上传文件：
echo 后端文件：
echo   /var/www/mj-gallery/server/admin.js (应该在 routes/ 目录)
echo   /var/www/mj-gallery/server/PromptPost.js (应该在 models/ 目录)
echo   /var/www/mj-gallery/server/prompts.js (应该在 routes/ 目录)
echo 前端文件：
echo   /var/www/mj-gallery/client/src/CreatePrompt.js (应该在 pages/ 目录)
echo   /var/www/mj-gallery/client/src/PromptCard.js (应该在 components/ 目录)
echo   /var/www/mj-gallery/client/src/PromptDetail.js (应该在 pages/ 目录)
echo   /var/www/mj-gallery/client/src/PromptList.js (应该在 pages/ 目录)
echo   /var/www/mj-gallery/client/src/promptApi.js (应该在 services/ 目录)
echo.
echo 此脚本将：
echo 1. 备份当前服务器状态
echo 2. 删除错误位置的文件
echo 3. 验证正确位置的文件存在
echo 4. 重启服务
echo.
pause

REM 服务器配置
set SERVER_USER=root
set SERVER_HOST=167.253.157.83
set SERVER_PATH=/var/www/mj-gallery

echo ========================================
echo 步骤 1: 创建备份
echo ========================================
echo 创建服务器备份...
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_PATH% && tar -czf cleanup-backup-$(date +%%Y%%m%%d-%%H%%M%%S).tar.gz server/ && echo '备份创建成功'"
if %errorlevel% neq 0 (
    echo 备份失败！为安全起见停止操作。
    pause
    exit /b 1
)
echo 备份完成！
echo.

echo ========================================
echo 步骤 2: 检查正确位置的文件
echo ========================================
echo 验证正确位置的文件是否存在...
ssh %SERVER_USER%@%SERVER_HOST% "
echo '检查正确位置的文件：'
echo '1. models/PromptPost.js:'
ls -la %SERVER_PATH%/server/models/PromptPost.js 2>/dev/null && echo '✅ 存在' || echo '❌ 不存在'
echo '2. routes/admin.js:'
ls -la %SERVER_PATH%/server/routes/admin.js 2>/dev/null && echo '✅ 存在' || echo '❌ 不存在'
echo '3. routes/prompts.js:'
ls -la %SERVER_PATH%/server/routes/prompts.js 2>/dev/null && echo '✅ 存在' || echo '❌ 不存在'
echo.
echo '错误位置的后端文件：'
echo '1. server/PromptPost.js:'
ls -la %SERVER_PATH%/server/PromptPost.js 2>/dev/null && echo '❌ 错误存在' || echo '✅ 不存在'
echo '2. server/admin.js:'
ls -la %SERVER_PATH%/server/admin.js 2>/dev/null && echo '❌ 错误存在' || echo '✅ 不存在'
echo '3. server/prompts.js:'
ls -la %SERVER_PATH%/server/prompts.js 2>/dev/null && echo '❌ 错误存在' || echo '✅ 不存在'
echo '错误位置的前端文件：'
echo '4. client/src/CreatePrompt.js:'
ls -la %SERVER_PATH%/client/src/CreatePrompt.js 2>/dev/null && echo '❌ 错误存在' || echo '✅ 不存在'
echo '5. client/src/PromptCard.js:'
ls -la %SERVER_PATH%/client/src/PromptCard.js 2>/dev/null && echo '❌ 错误存在' || echo '✅ 不存在'
echo '6. client/src/PromptDetail.js:'
ls -la %SERVER_PATH%/client/src/PromptDetail.js 2>/dev/null && echo '❌ 错误存在' || echo '✅ 不存在'
echo '7. client/src/PromptList.js:'
ls -la %SERVER_PATH%/client/src/PromptList.js 2>/dev/null && echo '❌ 错误存在' || echo '✅ 不存在'
echo '8. client/src/promptApi.js:'
ls -la %SERVER_PATH%/client/src/promptApi.js 2>/dev/null && echo '❌ 错误存在' || echo '✅ 不存在'
"
echo.

echo ========================================
echo 步骤 3: 删除错误位置的文件
echo ========================================
echo 删除错误位置的文件...
ssh %SERVER_USER%@%SERVER_HOST% "
echo '删除错误位置的后端文件：'
cd %SERVER_PATH%/server && 
if [ -f 'PromptPost.js' ]; then
    echo '删除 server/PromptPost.js'
    rm -f PromptPost.js
fi
if [ -f 'admin.js' ]; then
    echo '删除 server/admin.js'
    rm -f admin.js
fi
if [ -f 'prompts.js' ]; then
    echo '删除 server/prompts.js'
    rm -f prompts.js
fi
echo '删除错误位置的前端文件：'
cd %SERVER_PATH%/client/src && 
if [ -f 'CreatePrompt.js' ]; then
    echo '删除 client/src/CreatePrompt.js'
    rm -f CreatePrompt.js
fi
if [ -f 'PromptCard.js' ]; then
    echo '删除 client/src/PromptCard.js'
    rm -f PromptCard.js
fi
if [ -f 'PromptDetail.js' ]; then
    echo '删除 client/src/PromptDetail.js'
    rm -f PromptDetail.js
fi
if [ -f 'PromptList.js' ]; then
    echo '删除 client/src/PromptList.js'
    rm -f PromptList.js
fi
if [ -f 'promptApi.js' ]; then
    echo '删除 client/src/promptApi.js'
    rm -f promptApi.js
fi
echo '清理完成！'
"
echo.

echo ========================================
echo 步骤 4: 验证清理结果
echo ========================================
echo 验证清理结果...
ssh %SERVER_USER%@%SERVER_HOST% "
echo '验证清理结果：'
echo '检查后端错误位置是否还有文件：'
ls -la %SERVER_PATH%/server/ | grep -E '(admin|PromptPost|prompts)\.js$' && echo '❌ 仍有后端错误文件' || echo '✅ 后端错误文件已清理'
echo '检查前端错误位置是否还有文件：'
ls -la %SERVER_PATH%/client/src/ | grep -E '(CreatePrompt|PromptCard|PromptDetail|PromptList|promptApi)\.js$' && echo '❌ 仍有前端错误文件' || echo '✅ 前端错误文件已清理'
echo.
echo '检查正确位置的后端文件：'
echo 'models/PromptPost.js:' && ls -la %SERVER_PATH%/server/models/PromptPost.js 2>/dev/null && echo '✅ 存在' || echo '❌ 缺失'
echo 'routes/admin.js:' && ls -la %SERVER_PATH%/server/routes/admin.js 2>/dev/null && echo '✅ 存在' || echo '❌ 缺失'
echo 'routes/prompts.js:' && ls -la %SERVER_PATH%/server/routes/prompts.js 2>/dev/null && echo '✅ 存在' || echo '❌ 缺失'
echo '检查正确位置的前端文件：'
echo 'pages/CreatePrompt.js:' && ls -la %SERVER_PATH%/client/src/pages/CreatePrompt.js 2>/dev/null && echo '✅ 存在' || echo '❌ 缺失'
echo 'components/PromptCard.js:' && ls -la %SERVER_PATH%/client/src/components/PromptCard.js 2>/dev/null && echo '✅ 存在' || echo '❌ 缺失'
echo 'pages/PromptDetail.js:' && ls -la %SERVER_PATH%/client/src/pages/PromptDetail.js 2>/dev/null && echo '✅ 存在' || echo '❌ 缺失'
echo 'pages/PromptList.js:' && ls -la %SERVER_PATH%/client/src/pages/PromptList.js 2>/dev/null && echo '✅ 存在' || echo '❌ 缺失'
echo 'services/promptApi.js:' && ls -la %SERVER_PATH%/client/src/services/promptApi.js 2>/dev/null && echo '✅ 存在' || echo '❌ 缺失'
"
echo.

echo ========================================
echo 步骤 5: 重启服务
echo ========================================
echo 重启后端服务...
ssh %SERVER_USER%@%SERVER_HOST% "
cd %SERVER_PATH% && 
echo '重启后端服务...' && 
pm2 restart mj-gallery-server && 
sleep 3 && 
echo '检查服务状态：' && 
pm2 status | grep mj-gallery && 
echo '服务重启完成！'
"

if %errorlevel% neq 0 (
    echo 服务重启可能有问题，请手动检查。
    echo 检查命令: ssh %SERVER_USER%@%SERVER_HOST% "pm2 status"
)

echo.
echo ========================================
echo ✅ 清理完成！
echo ========================================
echo.
echo 🧹 已删除错误位置的后端文件：
echo    • /var/www/mj-gallery/server/admin.js
echo    • /var/www/mj-gallery/server/PromptPost.js
echo    • /var/www/mj-gallery/server/prompts.js
echo.
echo 🧹 已删除错误位置的前端文件：
echo    • /var/www/mj-gallery/client/src/CreatePrompt.js
echo    • /var/www/mj-gallery/client/src/PromptCard.js
echo    • /var/www/mj-gallery/client/src/PromptDetail.js
echo    • /var/www/mj-gallery/client/src/PromptList.js
echo    • /var/www/mj-gallery/client/src/promptApi.js
echo.
echo ✅ 正确位置的文件应该保持不变：
echo 后端文件：
echo    • /var/www/mj-gallery/server/models/PromptPost.js
echo    • /var/www/mj-gallery/server/routes/admin.js
echo    • /var/www/mj-gallery/server/routes/prompts.js
echo 前端文件：
echo    • /var/www/mj-gallery/client/src/pages/CreatePrompt.js
echo    • /var/www/mj-gallery/client/src/components/PromptCard.js
echo    • /var/www/mj-gallery/client/src/pages/PromptDetail.js
echo    • /var/www/mj-gallery/client/src/pages/PromptList.js
echo    • /var/www/mj-gallery/client/src/services/promptApi.js
echo.
echo 🔄 后端服务已重启
echo.
echo 🔍 如果需要检查其他错误文件，请运行：
echo    ssh %SERVER_USER%@%SERVER_HOST% "find /var/www/mj-gallery -name '*.js' -path '*/node_modules' -prune -o -type f -print | grep -v node_modules"
echo.
echo 📋 备份文件位置：/var/www/mj-gallery/cleanup-backup-*.tar.gz
echo.
pause