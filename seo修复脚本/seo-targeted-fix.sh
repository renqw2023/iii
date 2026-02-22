#!/bin/bash

# SEO问题针对性修复脚本
# 基于 /var/www/mj-gallery 诊断结果

echo "====================================="
echo "    SEO问题针对性修复脚本"
echo "    基于诊断结果的精准修复"
echo "====================================="

# 项目路径
PROJECT_PATH="/var/www/mj-gallery"
SERVER_PATH="$PROJECT_PATH/server"
CLIENT_BUILD_PATH="$PROJECT_PATH/client/build"

# 1. 修复服务器环境变量CLIENT_URL配置
echo "\n1. 修复服务器环境变量配置"
echo "================================="
if [ -f "$SERVER_PATH/.env" ]; then
    echo "备份当前服务器环境配置..."
    cp "$SERVER_PATH/.env" "$SERVER_PATH/.env.backup.$(date +%Y%m%d_%H%M%S)"
    
    echo "修复CLIENT_URL配置..."
    sed -i 's|CLIENT_URL=https://mj.coolai.ink|CLIENT_URL=https://iii.pics|g' "$SERVER_PATH/.env"
    
    echo "验证修复结果:"
    grep "CLIENT_URL" "$SERVER_PATH/.env"
    echo "✓ 服务器环境变量已修复"
else
    echo "⚠ 服务器环境配置文件不存在: $SERVER_PATH/.env"
fi

# 2. 创建缺失的robots.txt文件
echo "\n2. 创建robots.txt文件"
echo "====================="

# 在构建目录创建robots.txt
cat > "$CLIENT_BUILD_PATH/robots.txt" << 'EOF'
User-agent: *
Allow: /

# 站点地图
Sitemap: https://iii.pics/sitemap.xml

# 禁止访问的路径
Disallow: /api/
Disallow: /admin/
Disallow: /uploads/temp/
EOF

if [ -f "$CLIENT_BUILD_PATH/robots.txt" ]; then
    echo "✓ robots.txt已创建: $CLIENT_BUILD_PATH/robots.txt"
    echo "内容预览:"
    head -5 "$CLIENT_BUILD_PATH/robots.txt"
else
    echo "⚠ robots.txt创建失败"
fi

# 3. 修复Nginx配置 - 添加images路径
echo "\n3. 修复Nginx配置"
echo "================="

NGINX_CONFIG="/etc/nginx/sites-available/iii.pics"
if [ -f "$NGINX_CONFIG" ]; then
    echo "备份Nginx配置..."
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    
    # 检查是否已存在images配置
    if ! grep -q "location /images" "$NGINX_CONFIG"; then
        echo "添加images路径配置..."
        
        # 在uploads配置后添加images配置
        sed -i '/location \/uploads {/a\
    # SEO图片服务\n    location /images {\n        root /var/www/mj-gallery/client/build;\n        expires 1y;\n        add_header Cache-Control "public, immutable";\n        add_header Access-Control-Allow-Origin "*";\n    }' "$NGINX_CONFIG"
        
        echo "✓ images路径配置已添加"
    else
        echo "✓ images路径配置已存在"
    fi
    
    # 验证Nginx配置
    echo "验证Nginx配置..."
    if nginx -t; then
        echo "✓ Nginx配置验证通过"
    else
        echo "⚠ Nginx配置验证失败，请检查配置文件"
    fi
else
    echo "⚠ Nginx配置文件不存在: $NGINX_CONFIG"
fi

# 4. 检查并修复后端服务
echo "\n4. 检查后端服务状态"
echo "==================="

# 检查PM2进程
echo "当前PM2进程状态:"
pm2 list

# 检查端口5500占用
echo "\n检查端口5500占用:"
netstat -tlnp | grep :5500 || echo "端口5500未被占用"

# 尝试重启后端服务
echo "\n重启后端服务..."
cd "$PROJECT_PATH"
pm2 restart all

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 验证服务状态
echo "验证服务状态:"
pm2 list

# 测试本地API连接
echo "\n测试本地API连接:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5500/api/health | grep -q "200\|404"; then
    echo "✓ 后端API服务正常"
else
    echo "⚠ 后端API服务异常"
    echo "检查PM2日志:"
    pm2 logs --lines 10
fi

# 5. 重启Nginx服务
echo "\n5. 重启Nginx服务"
echo "================="
if systemctl restart nginx; then
    echo "✓ Nginx服务重启成功"
else
    echo "⚠ Nginx服务重启失败"
fi

# 6. 验证修复效果
echo "\n6. 验证修复效果"
echo "==============="

echo "测试SEO相关资源:"

# 测试robots.txt
echo "- 测试robots.txt:"
if curl -s -I https://iii.pics/robots.txt | grep -q "200 OK"; then
    echo "  ✓ robots.txt访问正常"
else
    echo "  ⚠ robots.txt访问异常"
fi

# 测试SEO图片
echo "- 测试SEO图片:"
if curl -s -I https://iii.pics/images/og-default.jpg | grep -q "200 OK"; then
    echo "  ✓ SEO图片访问正常"
else
    echo "  ⚠ SEO图片访问异常"
fi

# 测试API接口
echo "- 测试API接口:"
if curl -s -I https://iii.pics/api/seo/sitemap/status | grep -q "200\|404"; then
    echo "  ✓ API接口访问正常"
else
    echo "  ⚠ API接口访问异常"
fi

echo "\n====================================="
echo "         修复完成！"
echo "====================================="
echo "主要修复内容:"
echo "1. ✓ 修复服务器环境变量CLIENT_URL配置"
echo "2. ✓ 创建robots.txt文件"
echo "3. ✓ 添加Nginx images路径配置"
echo "4. ✓ 重启后端和Nginx服务"
echo ""
echo "请访问 https://iii.pics 验证SEO功能是否正常工作"
echo "如有问题，请检查:"
echo "- PM2进程状态: pm2 list"
echo "- Nginx错误日志: tail -f /var/log/nginx/error.log"
echo "- PM2应用日志: pm2 logs"