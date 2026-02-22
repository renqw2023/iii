#!/bin/bash

# Nginx配置修复脚本
# 修复location冲突问题

echo "====================================="
echo "    Nginx配置修复脚本"
echo "    修复location冲突问题"
echo "====================================="

NGINX_CONFIG="/etc/nginx/sites-available/iii.pics"
BACKUP_DIR="/etc/nginx/backups"

# 创建备份目录
echo "1. 创建备份目录和备份配置文件"
echo "================================="
mkdir -p "$BACKUP_DIR"
cp "$NGINX_CONFIG" "$BACKUP_DIR/iii.pics.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ 配置文件已备份到: $BACKUP_DIR"

# 恢复到原始配置（移除错误的images配置）
echo "\n2. 恢复原始配置"
echo "================="

# 创建临时文件来重建配置
cat > "$NGINX_CONFIG" << 'EOF'
# 强制HTTP跳转HTTPS
server {
    listen 80;
    server_name iii.pics;
    return 301 https://$host$request_uri;  # 自动重定向到 HTTPS
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name iii.pics;

    # SSL 配置（证书路径稍后更新）
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

    # SEO图片服务（独立的location块）
    location /images {
        root /var/www/mj-gallery/client/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    # SEO相关文件
    location = /robots.txt {
        root /var/www/mj-gallery/client/build;
        expires 1d;
        add_header Cache-Control "public";
    }

    location = /sitemap.xml {
        root /var/www/mj-gallery/client/build;
        expires 1d;
        add_header Cache-Control "public";
    }

    location = /favicon.ico {
        root /var/www/mj-gallery/client/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
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
        alias /var/www/mj-gallery/uploads;
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
EOF

echo "✓ Nginx配置已重建"

# 验证配置
echo "\n3. 验证Nginx配置"
echo "================="
if nginx -t; then
    echo "✓ Nginx配置验证通过"
    
    # 重启Nginx服务
    echo "\n4. 重启Nginx服务"
    echo "================="
    if systemctl restart nginx; then
        echo "✓ Nginx服务重启成功"
        
        # 验证服务状态
        echo "\n5. 验证服务状态"
        echo "==============="
        if systemctl is-active --quiet nginx; then
            echo "✓ Nginx服务运行正常"
        else
            echo "⚠ Nginx服务状态异常"
            systemctl status nginx
        fi
    else
        echo "⚠ Nginx服务重启失败"
        echo "查看错误日志:"
        journalctl -xeu nginx.service --lines=10
    fi
else
    echo "⚠ Nginx配置验证失败"
    echo "恢复备份配置..."
    cp "$BACKUP_DIR/iii.pics.backup.$(date +%Y%m%d)"* "$NGINX_CONFIG" 2>/dev/null || echo "无法自动恢复，请手动检查配置"
fi

# 测试SEO资源访问
echo "\n6. 测试SEO资源访问"
echo "=================="

echo "等待服务稳定..."
sleep 3

echo "测试robots.txt:"
if curl -s -I https://iii.pics/robots.txt | grep -q "200 OK"; then
    echo "  ✓ robots.txt访问正常"
else
    echo "  ⚠ robots.txt访问异常"
    echo "  响应头信息:"
    curl -s -I https://iii.pics/robots.txt | head -5
fi

echo "\n测试SEO图片:"
if curl -s -I https://iii.pics/images/og-default.jpg | grep -q "200 OK"; then
    echo "  ✓ SEO图片访问正常"
else
    echo "  ⚠ SEO图片访问异常"
    echo "  检查文件是否存在:"
    ls -la /var/www/mj-gallery/client/build/images/og-default.* 2>/dev/null || echo "  文件不存在"
fi

echo "\n测试API接口:"
if curl -s -I https://iii.pics/api/health | grep -q "200\|404"; then
    echo "  ✓ API接口访问正常"
else
    echo "  ⚠ API接口访问异常"
    echo "  检查后端服务状态:"
    pm2 list | grep mj-gallery-server
fi

echo "\n====================================="
echo "         修复完成！"
echo "====================================="
echo "主要修复内容:"
echo "1. ✓ 修复了Nginx location冲突问题"
echo "2. ✓ 添加了独立的SEO图片服务配置"
echo "3. ✓ 添加了SEO相关文件的专用配置"
echo "4. ✓ 重启了Nginx服务"
echo ""
echo "如果仍有问题，请检查:"
echo "- 确保SEO图片文件存在: ls -la /var/www/mj-gallery/client/build/images/"
echo "- 检查文件权限: chmod 644 /var/www/mj-gallery/client/build/images/*"
echo "- 查看Nginx错误日志: tail -f /var/log/nginx/error.log"
echo "- 检查PM2服务状态: pm2 list"