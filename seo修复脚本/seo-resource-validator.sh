#!/bin/bash

# SEO资源访问验证脚本 (改进版)
# 用于准确检测SEO相关资源的访问情况

echo "====================================="
echo "    SEO资源访问验证脚本"
echo "    改进版 - 详细诊断"
echo "====================================="

DOMAIN="https://iii.pics"
PROJECT_PATH="/var/www/mj-gallery"
BUILD_PATH="$PROJECT_PATH/client/build"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 成功/失败计数
SUCCESS_COUNT=0
FAIL_COUNT=0

# 测试函数
test_resource() {
    local name="$1"
    local url="$2"
    local expected_type="$3"
    local file_path="$4"
    
    echo -e "\n${BLUE}测试 $name:${NC}"
    echo "URL: $url"
    
    # 获取HTTP响应
    local response=$(curl -s -w "HTTPSTATUS:%{http_code};SIZE:%{size_download};TYPE:%{content_type}" "$url")
    local body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]{3};SIZE:[0-9]+;TYPE:.*$//')
    local status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local size=$(echo "$response" | grep -o "SIZE:[0-9]*" | cut -d: -f2)
    local content_type=$(echo "$response" | grep -o "TYPE:.*$" | cut -d: -f2)
    
    echo "HTTP状态码: $status"
    echo "内容大小: ${size}字节"
    echo "内容类型: $content_type"
    
    # 检查文件系统中的文件
    if [ -n "$file_path" ] && [ -f "$file_path" ]; then
        local file_size=$(stat -c%s "$file_path" 2>/dev/null || echo "未知")
        local file_perms=$(stat -c%a "$file_path" 2>/dev/null || echo "未知")
        echo "文件系统: 存在 (${file_size}字节, 权限:$file_perms)"
    elif [ -n "$file_path" ]; then
        echo -e "${RED}文件系统: 不存在 ($file_path)${NC}"
    fi
    
    # 判断结果
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✅ $name 访问正常${NC}"
        
        # 显示内容预览
        if [ "$expected_type" = "text" ] && [ ${#body} -gt 0 ]; then
            echo "内容预览:"
            echo "$body" | head -3 | sed 's/^/  /'
            if [ ${#body} -gt 200 ]; then
                echo "  ...(内容已截断)"
            fi
        fi
        
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ $name 访问失败 (HTTP $status)${NC}"
        ((FAIL_COUNT++))
        
        # 提供诊断建议
        case "$status" in
            "404")
                echo -e "${YELLOW}  建议: 检查文件是否存在，Nginx配置是否正确${NC}"
                ;;
            "403")
                echo -e "${YELLOW}  建议: 检查文件权限和Nginx配置${NC}"
                ;;
            "500"|"502"|"503")
                echo -e "${YELLOW}  建议: 检查Nginx配置和后端服务状态${NC}"
                ;;
            "000")
                echo -e "${YELLOW}  建议: 检查域名解析和网络连接${NC}"
                ;;
        esac
    fi
}

# 检查Nginx配置
check_nginx_config() {
    echo -e "\n${BLUE}=== Nginx配置检查 ===${NC}"
    
    if nginx -t &>/dev/null; then
        echo -e "${GREEN}✅ Nginx配置语法正确${NC}"
    else
        echo -e "${RED}❌ Nginx配置语法错误${NC}"
        nginx -t
        return 1
    fi
    
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx服务运行正常${NC}"
    else
        echo -e "${RED}❌ Nginx服务未运行${NC}"
        systemctl status nginx --no-pager -l
        return 1
    fi
    
    # 检查关键location配置
    echo "\n关键location配置:"
    nginx -T 2>/dev/null | grep -A 3 -B 1 "location.*\(robots\|images\|sitemap\)" | sed 's/^/  /'
}

# 检查文件系统
check_filesystem() {
    echo -e "\n${BLUE}=== 文件系统检查 ===${NC}"
    
    echo "项目目录结构:"
    if [ -d "$BUILD_PATH" ]; then
        echo -e "${GREEN}✅ 构建目录存在: $BUILD_PATH${NC}"
        ls -la "$BUILD_PATH" | head -10 | sed 's/^/  /'
        
        if [ -d "$BUILD_PATH/images" ]; then
            echo "\nSEO图片目录:"
            ls -la "$BUILD_PATH/images" | sed 's/^/  /'
        else
            echo -e "${YELLOW}⚠ SEO图片目录不存在: $BUILD_PATH/images${NC}"
        fi
    else
        echo -e "${RED}❌ 构建目录不存在: $BUILD_PATH${NC}"
    fi
}

# 主要测试流程
echo "开始SEO资源验证..."
echo "域名: $DOMAIN"
echo "项目路径: $PROJECT_PATH"

# 1. 检查基础环境
check_nginx_config
check_filesystem

# 2. 测试SEO资源
echo -e "\n${BLUE}=== SEO资源访问测试 ===${NC}"

# 测试robots.txt
test_resource "robots.txt" "$DOMAIN/robots.txt" "text" "$BUILD_PATH/robots.txt"

# 测试sitemap.xml
test_resource "sitemap.xml" "$DOMAIN/sitemap.xml" "xml" "$BUILD_PATH/sitemap.xml"

# 测试favicon.ico
test_resource "favicon.ico" "$DOMAIN/favicon.ico" "image" "$BUILD_PATH/favicon.ico"

# 测试SEO图片
test_resource "默认OG图片" "$DOMAIN/images/og-default.jpg" "image" "$BUILD_PATH/images/og-default.jpg"

# 测试其他可能的SEO图片
for img in "og-image.jpg" "og-image.png" "default-share.jpg"; do
    if [ -f "$BUILD_PATH/images/$img" ]; then
        test_resource "SEO图片($img)" "$DOMAIN/images/$img" "image" "$BUILD_PATH/images/$img"
    fi
done

# 3. 测试API接口
echo -e "\n${BLUE}=== API接口测试 ===${NC}"
test_resource "API健康检查" "$DOMAIN/api/health" "json" ""
test_resource "SEO API" "$DOMAIN/api/seo/meta" "json" ""

# 4. 生成诊断报告
echo -e "\n${BLUE}=== 诊断报告 ===${NC}"
echo "测试完成!"
echo -e "成功: ${GREEN}$SUCCESS_COUNT${NC} 项"
echo -e "失败: ${RED}$FAIL_COUNT${NC} 项"

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "\n${YELLOW}=== 修复建议 ===${NC}"
    
    # 检查常见问题
    if ! curl -s -I "$DOMAIN/robots.txt" | grep -q "200 OK"; then
        echo "1. robots.txt问题:"
        echo "   - 检查文件是否存在: ls -la $BUILD_PATH/robots.txt"
        echo "   - 检查Nginx配置: nginx -T | grep -A 3 'location.*robots'"
        echo "   - 创建文件: echo 'User-agent: *\nAllow: /' > $BUILD_PATH/robots.txt"
    fi
    
    if ! curl -s -I "$DOMAIN/images/og-default.jpg" | grep -q "200 OK"; then
        echo "\n2. SEO图片问题:"
        echo "   - 检查images目录: ls -la $BUILD_PATH/images/"
        echo "   - 检查Nginx配置: nginx -T | grep -A 5 'location.*images'"
        echo "   - 检查文件权限: chmod 644 $BUILD_PATH/images/*"
    fi
    
    echo "\n3. 通用修复步骤:"
    echo "   - 重启Nginx: systemctl restart nginx"
    echo "   - 检查错误日志: tail -f /var/log/nginx/error.log"
    echo "   - 验证配置: nginx -t"
else
    echo -e "\n${GREEN}🎉 所有SEO资源访问正常!${NC}"
fi

# 5. 生成快速修复脚本
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "\n${BLUE}=== 生成快速修复脚本 ===${NC}"
    
    cat > "/tmp/seo-quick-fix-$(date +%Y%m%d_%H%M%S).sh" << 'FIXEOF'
#!/bin/bash
# SEO问题快速修复脚本
# 自动生成于验证过程

echo "开始SEO问题快速修复..."

# 创建缺失的SEO文件
BUILD_PATH="/var/www/mj-gallery/client/build"

# 创建robots.txt
if [ ! -f "$BUILD_PATH/robots.txt" ]; then
    echo "创建robots.txt..."
    cat > "$BUILD_PATH/robots.txt" << EOF
User-agent: *
Allow: /

Sitemap: https://iii.pics/sitemap.xml
EOF
    chmod 644 "$BUILD_PATH/robots.txt"
fi

# 创建images目录
mkdir -p "$BUILD_PATH/images"

# 设置正确的文件权限
chmod 755 "$BUILD_PATH"
chmod 755 "$BUILD_PATH/images"
chmod 644 "$BUILD_PATH"/*.txt 2>/dev/null
chmod 644 "$BUILD_PATH"/*.xml 2>/dev/null
chmod 644 "$BUILD_PATH/images"/* 2>/dev/null

# 重启Nginx
echo "重启Nginx服务..."
systemctl restart nginx

echo "修复完成! 请重新运行验证脚本检查结果。"
FIXEOF
    
    chmod +x "/tmp/seo-quick-fix-$(date +%Y%m%d_%H%M%S).sh"
    echo "快速修复脚本已生成: /tmp/seo-quick-fix-$(date +%Y%m%d_%H%M%S).sh"
fi

echo -e "\n${BLUE}验证完成!${NC}"