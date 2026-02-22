#!/bin/bash

# SEO API修复验证脚本
# 测试添加app.baseUrl配置后的API接口状态

echo "====== SEO API修复验证 ======"
echo "时间: $(date)"
echo "测试目标: 验证baseUrl配置修复后的API接口"
echo

# 测试函数
test_api() {
    local url=$1
    local description=$2
    
    echo "测试: $description"
    echo "URL: $url"
    
    # 获取HTTP状态码
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "200" ]; then
        echo "✅ 状态: HTTP $status_code - 成功"
        # 获取响应内容（仅前200字符）
        response=$(curl -s "$url" | head -c 200)
        echo "响应预览: $response..."
    else
        echo "❌ 状态: HTTP $status_code - 失败"
        # 获取错误响应
        error_response=$(curl -s "$url")
        echo "错误信息: $error_response"
    fi
    echo "----------------------------------------"
}

# 测试SEO API接口
echo "1. 测试Sitemap生成API"
test_api "https://iii.pics/api/seo/sitemap/generate" "Sitemap生成接口"

echo "2. 测试Sitemap状态API"
test_api "https://iii.pics/api/seo/sitemap/status" "Sitemap状态接口"

echo "3. 测试SEO Meta API"
test_api "https://iii.pics/api/seo/meta/home" "SEO Meta数据接口"

echo "4. 测试其他页面的Meta API"
test_api "https://iii.pics/api/seo/meta/explore" "探索页面Meta数据"
test_api "https://iii.pics/api/seo/meta/about" "关于页面Meta数据"

# 测试静态资源（应该仍然正常）
echo "5. 验证静态资源访问"
test_api "https://iii.pics/sitemap.xml" "静态Sitemap文件"
test_api "https://iii.pics/robots.txt" "Robots.txt文件"

echo
echo "====== 修复验证完成 ======"
echo "如果所有API都返回HTTP 200，说明baseUrl配置修复成功"
echo "如果仍有500错误，可能需要重启服务器应用配置更改"
echo
echo "重启命令提示:"
echo "ssh root@your-server"
echo "cd /var/www/mj-gallery"
echo "pm2 restart mj-gallery-server"
echo "pm2 logs mj-gallery-server --lines 20"