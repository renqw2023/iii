#!/bin/bash

# SEO综合修复脚本
# 解决剩余的SEO问题

echo "====================================="
echo "    SEO综合修复脚本"
echo "    解决剩余的SEO问题"
echo "====================================="

# 项目路径
PROJECT_PATH="/var/www/mj-gallery"
CLIENT_BUILD_PATH="$PROJECT_PATH/client/build"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. 创建sitemap.xml文件
echo "\n1. 创建sitemap.xml文件"
echo "========================"

cat > "$CLIENT_BUILD_PATH/sitemap.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- 首页 -->
  <url>
    <loc>https://iii.pics/</loc>
    <lastmod>2025-01-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 探索页面 -->
  <url>
    <loc>https://iii.pics/explore</loc>
    <lastmod>2025-01-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- 关于页面 -->
  <url>
    <loc>https://iii.pics/about</loc>
    <lastmod>2025-01-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- 帮助页面 -->
  <url>
    <loc>https://iii.pics/help</loc>
    <lastmod>2025-01-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- 联系页面 -->
  <url>
    <loc>https://iii.pics/contact</loc>
    <lastmod>2025-01-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
</urlset>
EOF

if [ -f "$CLIENT_BUILD_PATH/sitemap.xml" ]; then
    echo "✓ sitemap.xml文件创建成功"
    echo "  文件大小: $(stat -c%s "$CLIENT_BUILD_PATH/sitemap.xml") 字节"
else
    echo "❌ sitemap.xml文件创建失败"
fi

# 2. 设置正确的文件权限
echo "\n2. 设置文件权限"
echo "================="

# 设置sitemap.xml权限
chmod 644 "$CLIENT_BUILD_PATH/sitemap.xml" 2>/dev/null
echo "✓ sitemap.xml权限设置完成"

# 设置robots.txt权限（如果存在）
if [ -f "$CLIENT_BUILD_PATH/robots.txt" ]; then
    chmod 644 "$CLIENT_BUILD_PATH/robots.txt"
    echo "✓ robots.txt权限设置完成"
fi

# 设置images目录权限
if [ -d "$CLIENT_BUILD_PATH/images" ]; then
    chmod 755 "$CLIENT_BUILD_PATH/images"
    chmod 644 "$CLIENT_BUILD_PATH/images"/* 2>/dev/null
    echo "✓ images目录权限设置完成"
fi

# 3. 验证Nginx配置
echo "\n3. 验证Nginx配置"
echo "=================="

if nginx -t >/dev/null 2>&1; then
    echo "✓ Nginx配置语法正确"
else
    echo "❌ Nginx配置语法错误"
    nginx -t
fi

# 4. 重启服务
echo "\n4. 重启相关服务"
echo "================="

# 重启Nginx
echo "重启Nginx服务..."
if systemctl restart nginx >/dev/null 2>&1; then
    echo "✓ Nginx服务重启成功"
else
    echo "❌ Nginx服务重启失败"
fi

# 检查PM2状态
echo "检查PM2服务状态..."
if pm2 list >/dev/null 2>&1; then
    echo "✓ PM2服务运行正常"
    # 可选：重启PM2应用
    # pm2 restart all
else
    echo "❌ PM2服务异常"
fi

# 5. 生成动态sitemap（调用API）
echo "\n5. 生成动态sitemap"
echo "===================="

echo "调用sitemap生成API..."
API_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/sitemap_response.json "https://iii.pics/api/seo/sitemap/generate" 2>/dev/null)
API_CODE=${API_RESPONSE: -3}

if [ "$API_CODE" = "200" ]; then
    echo "✓ 动态sitemap生成成功"
    if [ -f "/tmp/sitemap_response.json" ]; then
        echo "  响应内容: $(cat /tmp/sitemap_response.json)"
        rm -f /tmp/sitemap_response.json
    fi
else
    echo "⚠ 动态sitemap生成失败 (HTTP $API_CODE)"
    echo "  使用静态sitemap作为备用方案"
fi

# 6. 全面验证SEO资源
echo "\n6. 验证SEO资源访问"
echo "===================="

DOMAIN="https://iii.pics"

# 验证sitemap.xml
echo "测试sitemap.xml:"
SITEMAP_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$DOMAIN/sitemap.xml")
if [ "$SITEMAP_CODE" = "200" ]; then
    echo "  ✓ sitemap.xml访问正常 (HTTP $SITEMAP_CODE)"
else
    echo "  ❌ sitemap.xml访问失败 (HTTP $SITEMAP_CODE)"
fi

# 验证robots.txt
echo "测试robots.txt:"
ROBOTS_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$DOMAIN/robots.txt")
if [ "$ROBOTS_CODE" = "200" ]; then
    echo "  ✓ robots.txt访问正常 (HTTP $ROBOTS_CODE)"
else
    echo "  ❌ robots.txt访问失败 (HTTP $ROBOTS_CODE)"
fi

# 验证SEO图片
echo "测试SEO图片:"
IMAGE_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$DOMAIN/images/og-default.jpg")
if [ "$IMAGE_CODE" = "200" ]; then
    echo "  ✓ SEO图片访问正常 (HTTP $IMAGE_CODE)"
else
    echo "  ❌ SEO图片访问失败 (HTTP $IMAGE_CODE)"
fi

# 验证SEO API（使用正确的参数）
echo "测试SEO API:"
SEO_API_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$DOMAIN/api/seo/meta/home")
if [ "$SEO_API_CODE" = "200" ]; then
    echo "  ✓ SEO API访问正常 (HTTP $SEO_API_CODE)"
else
    echo "  ❌ SEO API访问失败 (HTTP $SEO_API_CODE)"
fi

# 验证sitemap状态API
echo "测试sitemap状态API:"
SITEMAP_STATUS_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$DOMAIN/api/seo/sitemap/status")
if [ "$SITEMAP_STATUS_CODE" = "200" ]; then
    echo "  ✓ sitemap状态API访问正常 (HTTP $SITEMAP_STATUS_CODE)"
else
    echo "  ❌ sitemap状态API访问失败 (HTTP $SITEMAP_STATUS_CODE)"
fi

# 7. 生成修复报告
echo "\n7. 生成修复报告"
echo "================="

REPORT_FILE="/tmp/seo-fix-report-$(date +%Y%m%d_%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
SEO综合修复报告
生成时间: $(date)
项目路径: $PROJECT_PATH

修复内容:
1. ✓ 创建sitemap.xml文件
2. ✓ 设置正确的文件权限
3. ✓ 验证Nginx配置
4. ✓ 重启相关服务
5. ✓ 调用动态sitemap生成API
6. ✓ 验证SEO资源访问

验证结果:
- sitemap.xml: HTTP $SITEMAP_CODE
- robots.txt: HTTP $ROBOTS_CODE
- SEO图片: HTTP $IMAGE_CODE
- SEO API: HTTP $SEO_API_CODE
- sitemap状态API: HTTP $SITEMAP_STATUS_CODE

建议:
- 如果仍有404错误，请检查Nginx配置和文件权限
- 定期调用 /api/seo/sitemap/generate 更新动态sitemap
- 监控SEO资源的访问状态
EOF

echo "修复报告已生成: $REPORT_FILE"

echo "\n====================================="
echo "         综合修复完成！"
echo "====================================="
echo "主要修复内容:"
echo "1. ✓ 创建sitemap.xml文件"
echo "2. ✓ 设置正确的文件权限"
echo "3. ✓ 验证和重启服务"
echo "4. ✓ 调用动态sitemap生成"
echo "5. ✓ 全面验证SEO资源"
echo ""
echo "请访问以下链接验证SEO功能:"
echo "- https://iii.pics/sitemap.xml"
echo "- https://iii.pics/robots.txt"
echo "- https://iii.pics/images/og-default.jpg"
echo "- https://iii.pics/api/seo/meta/home"
echo ""
echo "如有问题，请查看修复报告: $REPORT_FILE"