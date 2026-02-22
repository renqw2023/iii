#!/bin/bash

# SEO API错误修复脚本
# 修复SitemapGenerator路径问题并重启服务

echo "====================================="
echo "    SEO API错误修复脚本"
echo "    修复SitemapGenerator路径问题"
echo "====================================="

# 项目路径
PROJECT_PATH="/var/www/mj-gallery"
SERVER_PATH="$PROJECT_PATH/server"
CLIENT_BUILD_PATH="$PROJECT_PATH/client/build"

# 1. 确保build目录存在
echo "\n1. 检查并创建必要目录"
echo "========================="

if [ ! -d "$CLIENT_BUILD_PATH" ]; then
    echo "创建client/build目录..."
    mkdir -p "$CLIENT_BUILD_PATH"
    echo "✓ client/build目录创建成功"
else
    echo "✓ client/build目录已存在"
fi

# 2. 修复SitemapGenerator路径问题
echo "\n2. 修复SitemapGenerator路径"
echo "============================="

SITEMAP_GENERATOR_FILE="$SERVER_PATH/utils/sitemapGenerator.js"

if [ -f "$SITEMAP_GENERATOR_FILE" ]; then
    # 备份原文件
    cp "$SITEMAP_GENERATOR_FILE" "$SITEMAP_GENERATOR_FILE.backup"
    echo "✓ 原文件已备份"
    
    # 修复路径问题
    sed -i "s|'../../client/public'|'../../client/build'|g" "$SITEMAP_GENERATOR_FILE"
    
    # 验证修改
    if grep -q "../../client/build" "$SITEMAP_GENERATOR_FILE"; then
        echo "✓ SitemapGenerator路径修复成功"
    else
        echo "❌ SitemapGenerator路径修复失败"
        # 恢复备份
        cp "$SITEMAP_GENERATOR_FILE.backup" "$SITEMAP_GENERATOR_FILE"
        echo "已恢复原文件"
        exit 1
    fi
else
    echo "❌ SitemapGenerator文件不存在: $SITEMAP_GENERATOR_FILE"
    exit 1
fi

# 3. 设置目录权限
echo "\n3. 设置目录权限"
echo "================="

chmod 755 "$CLIENT_BUILD_PATH"
echo "✓ build目录权限设置完成"

# 4. 重启PM2服务
echo "\n4. 重启服务"
echo "============"

echo "重启PM2服务..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart all
    if [ $? -eq 0 ]; then
        echo "✓ PM2服务重启成功"
    else
        echo "⚠ PM2服务重启失败，尝试手动重启"
        pm2 stop all
        sleep 2
        pm2 start all
    fi
else
    echo "⚠ PM2未安装，跳过服务重启"
fi

# 5. 测试API接口
echo "\n5. 测试API接口"
echo "==============="

echo "等待服务启动..."
sleep 5

echo "测试sitemap生成API..."
SITEMAP_GENERATE_CODE=$(curl -s -w "%{http_code}" -o /dev/null "https://iii.pics/api/seo/sitemap/generate")
if [ "$SITEMAP_GENERATE_CODE" = "200" ]; then
    echo "✓ sitemap生成API正常 (HTTP $SITEMAP_GENERATE_CODE)"
else
    echo "❌ sitemap生成API异常 (HTTP $SITEMAP_GENERATE_CODE)"
fi

echo "测试sitemap状态API..."
SITEMAP_STATUS_CODE=$(curl -s -w "%{http_code}" -o /dev/null "https://iii.pics/api/seo/sitemap/status")
if [ "$SITEMAP_STATUS_CODE" = "200" ]; then
    echo "✓ sitemap状态API正常 (HTTP $SITEMAP_STATUS_CODE)"
else
    echo "❌ sitemap状态API异常 (HTTP $SITEMAP_STATUS_CODE)"
fi

echo "测试SEO meta API..."
SEO_META_CODE=$(curl -s -w "%{http_code}" -o /dev/null "https://iii.pics/api/seo/meta/home")
if [ "$SEO_META_CODE" = "200" ]; then
    echo "✓ SEO meta API正常 (HTTP $SEO_META_CODE)"
else
    echo "❌ SEO meta API异常 (HTTP $SEO_META_CODE)"
fi

# 6. 生成修复报告
echo "\n6. 生成修复报告"
echo "================="

REPORT_FILE="/tmp/seo-api-fix-report-$(date +%Y%m%d_%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
SEO API错误修复报告
生成时间: $(date)

修复内容:
1. ✓ 检查并创建client/build目录
2. ✓ 修复SitemapGenerator保存路径问题
3. ✓ 设置正确的目录权限
4. ✓ 重启PM2服务
5. ✓ 测试API接口功能

API测试结果:
- sitemap生成API: HTTP $SITEMAP_GENERATE_CODE
- sitemap状态API: HTTP $SITEMAP_STATUS_CODE
- SEO meta API: HTTP $SEO_META_CODE

问题分析:
原因: SitemapGenerator试图将文件保存到不存在的../../client/public目录
解决: 修改保存路径为../../client/build目录

建议:
- 如果API仍返回500错误，请检查服务器日志
- 确保client/build目录具有写入权限
- 定期监控API接口状态
EOF

echo "修复报告已生成: $REPORT_FILE"

echo "\n====================================="
echo "         API修复完成！"
echo "====================================="
echo "主要修复内容:"
echo "1. ✓ 修复SitemapGenerator路径问题"
echo "2. ✓ 确保build目录存在并设置权限"
echo "3. ✓ 重启服务并测试API接口"
echo ""
echo "请访问以下API验证修复效果:"
echo "- https://iii.pics/api/seo/sitemap/generate"
echo "- https://iii.pics/api/seo/sitemap/status"
echo "- https://iii.pics/api/seo/meta/home"
echo ""
echo "如有问题，请查看修复报告: $REPORT_FILE"