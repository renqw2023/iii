#!/bin/bash

# SEO功能问题检测脚本 - Debian系统
# 用于诊断生产环境中SEO组件不工作的问题
# 适配iii.pics域名和/var/www/mj-gallery项目路径

echo "====================================="
echo "    SEO功能问题检测脚本 v1.1"
echo "    适配域名: iii.pics"
echo "    项目路径: /var/www/mj-gallery"
echo "====================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检测函数
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
    fi
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 项目路径配置（根据实际nginx配置）
PROJECT_ROOT="/var/www/mj-gallery"
CLIENT_BUILD_PATH="$PROJECT_ROOT/client/build"
SERVER_PATH="$PROJECT_ROOT/server"
UPLOADS_PATH="$PROJECT_ROOT/uploads"
DOMAIN="iii.pics"

# 1. 系统环境检测
echo "1. 系统环境检测"
echo "================="
echo "操作系统: $(lsb_release -d | cut -f2)"
echo "内核版本: $(uname -r)"
echo "Node.js版本: $(node --version 2>/dev/null || echo '未安装')"
echo "npm版本: $(npm --version 2>/dev/null || echo '未安装')"
echo "PM2版本: $(pm2 --version 2>/dev/null || echo '未安装')"
echo "MongoDB状态: $(systemctl is-active mongod 2>/dev/null || echo '未运行')"
echo "Nginx状态: $(systemctl is-active nginx 2>/dev/null || echo '未运行')"
echo ""

# 2. 项目文件结构检测
echo "2. 项目文件结构检测"
echo "=================="

# 检测项目根目录
if [ -d "$PROJECT_ROOT" ]; then
    echo "项目根目录: $PROJECT_ROOT ✓"
else
    echo -e "${RED}✗ 项目根目录不存在: $PROJECT_ROOT${NC}"
    echo "请检查项目是否正确部署到指定路径"
    exit 1
fi

# 检测关键文件
echo "检测关键文件:"
[ -f "$SERVER_PATH/index.js" ] && check_status "服务器入口文件存在" || warning "服务器入口文件缺失: $SERVER_PATH/index.js"
[ -f "$CLIENT_BUILD_PATH/index.html" ] && check_status "客户端构建文件存在" || warning "客户端构建文件缺失: $CLIENT_BUILD_PATH/index.html"
[ -f "$SERVER_PATH/.env" ] && check_status "服务器环境配置存在" || warning "服务器环境配置缺失: $SERVER_PATH/.env"
[ -f "$PROJECT_ROOT/client/.env.production" ] && check_status "客户端生产环境配置存在" || warning "客户端生产环境配置缺失"
echo ""

# 3. SEO相关文件检测
echo "3. SEO相关文件检测"
echo "=================="

# 检测SEO组件文件
echo "检测SEO组件文件:"
[ -f "$PROJECT_ROOT/client/src/components/SEO/SEOHead.js" ] && check_status "SEOHead组件存在" || warning "SEOHead组件缺失"
[ -f "$PROJECT_ROOT/client/src/utils/seo.js" ] && check_status "SEO工具函数存在" || warning "SEO工具函数缺失"
[ -f "$PROJECT_ROOT/client/src/hooks/useSEO.js" ] && check_status "SEO Hook存在" || warning "SEO Hook缺失"
[ -f "$SERVER_PATH/routes/seo.js" ] && check_status "服务器SEO路由存在" || warning "服务器SEO路由缺失"

# 检测SEO静态资源
echo "检测SEO静态资源:"
[ -f "$PROJECT_ROOT/client/public/images/og-default.jpg" ] && check_status "默认SEO图片存在" || warning "默认SEO图片缺失"
[ -f "$CLIENT_BUILD_PATH/images/og-default.jpg" ] && check_status "构建目录SEO图片存在" || warning "构建目录SEO图片缺失"
[ -f "$PROJECT_ROOT/client/public/favicon.ico" ] && check_status "网站图标存在" || warning "网站图标缺失"
[ -f "$PROJECT_ROOT/client/public/manifest.json" ] && check_status "PWA配置文件存在" || warning "PWA配置文件缺失"
[ -f "$PROJECT_ROOT/client/public/robots.txt" ] && check_status "robots.txt存在" || warning "robots.txt缺失"
[ -f "$CLIENT_BUILD_PATH/robots.txt" ] && check_status "构建目录robots.txt存在" || warning "构建目录robots.txt缺失"
echo ""

# 4. 环境变量检测
echo "4. 环境变量检测"
echo "==============="

if [ -f "$SERVER_PATH/.env" ]; then
    echo "服务器环境变量:"
    grep -E "^(CLIENT_URL|BASE_URL|REACT_APP_BASE_URL)=" "$SERVER_PATH/.env" 2>/dev/null || warning "未找到关键URL配置"
    echo "检查域名配置:"
    grep -i "iii.pics" "$SERVER_PATH/.env" && check_status "域名配置正确" || warning "域名配置可能不正确"
else
    warning "服务器环境配置文件不存在: $SERVER_PATH/.env"
fi

if [ -f "$PROJECT_ROOT/client/.env.production" ]; then
    echo "客户端环境变量:"
    grep -E "^REACT_APP_(BASE_URL|HOMEPAGE|APP_NAME)=" "$PROJECT_ROOT/client/.env.production" 2>/dev/null || warning "未找到关键客户端配置"
    echo "检查客户端域名配置:"
    grep -i "iii.pics" "$PROJECT_ROOT/client/.env.production" && check_status "客户端域名配置正确" || warning "客户端域名配置可能不正确"
else
    warning "客户端生产环境配置文件不存在"
fi
echo ""

# 5. 服务状态检测
echo "5. 服务状态检测"
echo "==============="

# 检测PM2进程
echo "PM2进程状态:"
pm2 list 2>/dev/null | grep -E "(online|stopped|errored)" || warning "PM2进程信息获取失败"

# 检测端口占用
echo "端口占用检测:"
netstat -tlnp 2>/dev/null | grep -E ":(3000|3100|5500|8080|80|443)" || warning "未检测到常用端口占用"
echo ""

# 6. Nginx配置检测
echo "6. Nginx配置检测"
echo "==============="

if [ -f "/etc/nginx/sites-available/iii.pics" ]; then
    echo "✓ Nginx配置文件存在: /etc/nginx/sites-available/iii.pics"
    echo "当前Nginx配置检查:"
    
    # 检查API代理配置
    grep -A 10 -B 2 "location.*api" /etc/nginx/sites-available/iii.pics && check_status "API代理配置存在" || warning "API代理配置缺失"
    
    # 检查uploads配置
    grep -A 5 -B 2 "location.*uploads" /etc/nginx/sites-available/iii.pics && check_status "uploads配置存在" || warning "uploads配置缺失"
    
    # 检查静态文件配置
    grep -A 5 -B 2 "location.*images" /etc/nginx/sites-available/iii.pics && check_status "images配置存在" || warning "images配置缺失"
    
    # 检查SSL配置
    grep -i "ssl_certificate" /etc/nginx/sites-available/iii.pics && check_status "SSL证书配置存在" || warning "SSL证书配置缺失"
    
    # 检查根目录配置
    grep "root.*mj-gallery" /etc/nginx/sites-available/iii.pics && check_status "项目根目录配置正确" || warning "项目根目录配置可能不正确"
    
else
    echo "✗ Nginx配置文件不存在: /etc/nginx/sites-available/iii.pics"
    echo "检查其他可能的配置文件:"
    ls -la /etc/nginx/sites-available/ | grep -E "(default|iii|pics)" || echo "未找到相关配置文件"
fi

# 检查配置文件是否启用
if [ -L "/etc/nginx/sites-enabled/iii.pics" ]; then
    check_status "Nginx配置已启用"
else
    warning "Nginx配置未启用，请运行: sudo ln -s /etc/nginx/sites-available/iii.pics /etc/nginx/sites-enabled/"
fi
echo ""

# 7. 网络连接测试
echo "7. 网络连接测试"
echo "==============="

# 测试本地服务连接
echo "测试本地服务连接:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5500/api/health 2>/dev/null | grep -q "200" && check_status "后端API服务正常" || warning "后端API服务异常"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 2>/dev/null | grep -q "200" && check_status "前端服务正常" || warning "前端服务异常"

# 测试SEO相关接口
echo "测试SEO相关接口:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5500/api/seo/sitemap/status 2>/dev/null | grep -q "200" && check_status "SEO接口正常" || warning "SEO接口异常"

# 测试外部访问
echo "测试外部访问:"
curl -s -o /dev/null -w "%{http_code}" https://iii.pics/api/seo/sitemap/status 2>/dev/null | grep -q "200" && check_status "SEO API外部访问正常" || warning "SEO API外部访问异常"
curl -s -o /dev/null -w "%{http_code}" https://iii.pics/uploads/ 2>/dev/null | grep -q "200" && check_status "uploads目录外部访问正常" || warning "uploads目录外部访问异常"
echo ""

# 8. 日志文件检测
echo "8. 日志文件检测"
echo "==============="

# 检测PM2日志
if [ -d "$HOME/.pm2/logs" ]; then
    echo "PM2日志文件:"
    ls -la "$HOME/.pm2/logs/" | head -5
    
    echo "最近的错误日志:"
    tail -10 "$HOME/.pm2/logs/"*error*.log 2>/dev/null | head -20 || warning "无法读取PM2错误日志"
else
    warning "PM2日志目录不存在"
fi

# 检测Nginx日志
if [ -f "/var/log/nginx/error.log" ]; then
    echo "Nginx错误日志(最近10行):"
    tail -10 /var/log/nginx/error.log 2>/dev/null || warning "无法读取Nginx错误日志"
else
    warning "Nginx错误日志不存在"
fi
echo ""

# 9. 生成修复建议
echo "9. 修复建议"
echo "==========="

echo "基于检测结果，以下是可能的修复方案:"
echo ""

echo "A. 如果SEO组件文件缺失:"
echo "   1. 重新上传完整的项目文件到 $PROJECT_ROOT"
echo "   2. 确保client/src/components/SEO/目录完整"
echo "   3. 检查client/src/utils/seo.js文件"
echo ""

echo "B. 如果静态资源缺失:"
echo "   1. 创建默认SEO图片: $CLIENT_BUILD_PATH/images/og-default.jpg"
echo "   2. 确保favicon.ico和manifest.json存在于构建目录"
echo "   3. 检查服务器静态文件服务配置"
echo ""

echo "C. 如果环境变量配置问题:"
echo "   1. 检查$SERVER_PATH/.env中的CLIENT_URL=https://iii.pics"
echo "   2. 检查client/.env.production中的REACT_APP_BASE_URL=https://iii.pics"
echo "   3. 确保两个配置文件中的域名都是iii.pics"
echo ""

echo "D. 如果服务器配置问题:"
echo "   1. 检查$SERVER_PATH/index.js中的静态文件服务配置"
echo "   2. 确保包含: app.use('/images', express.static(...))"
echo "   3. 重启PM2服务: pm2 restart all"
echo ""

echo "E. 如果Nginx配置问题:"
echo "   1. 确保/etc/nginx/sites-available/iii.pics配置正确"
echo "   2. 启用配置: sudo ln -s /etc/nginx/sites-available/iii.pics /etc/nginx/sites-enabled/"
echo "   3. 测试配置: sudo nginx -t"
echo "   4. 重启Nginx: sudo systemctl restart nginx"
echo ""

# 10. 快速修复脚本
echo "10. 快速修复脚本"
echo "==============="

cat << 'EOF' > /tmp/seo-quick-fix.sh
#!/bin/bash
# SEO问题快速修复脚本 - 适配iii.pics

echo "开始SEO问题快速修复..."

# 设置项目路径
PROJECT_ROOT="/var/www/mj-gallery"
CLIENT_BUILD_PATH="$PROJECT_ROOT/client/build"

# 1. 创建缺失的目录
echo "创建必要目录..."
mkdir -p "$PROJECT_ROOT/client/public/images"
mkdir -p "$CLIENT_BUILD_PATH/images"

# 2. 创建默认SEO图片（如果不存在）
if [ ! -f "$CLIENT_BUILD_PATH/images/og-default.jpg" ]; then
    echo "创建默认SEO图片..."
    wget -q -O "$CLIENT_BUILD_PATH/images/og-default.jpg" "https://via.placeholder.com/1200x630/4F46E5/FFFFFF?text=MJ+Gallery" 2>/dev/null || echo "请手动创建og-default.jpg"
fi

# 3. 创建robots.txt
if [ ! -f "$CLIENT_BUILD_PATH/robots.txt" ]; then
    echo "创建robots.txt..."
    cat > "$CLIENT_BUILD_PATH/robots.txt" << 'ROBOTS_EOF'
User-agent: *
Allow: /

Sitemap: https://iii.pics/sitemap.xml
ROBOTS_EOF
fi

# 4. 检查并修复服务器静态文件配置
if [ -f "$PROJECT_ROOT/server/index.js" ]; then
    if ! grep -q "app.use('/images'" "$PROJECT_ROOT/server/index.js"; then
        echo "需要手动添加静态文件服务配置..."
        echo "请在$PROJECT_ROOT/server/index.js中添加以下配置:"
        echo "app.use('/images', express.static(path.join(__dirname, '../client/build/images')));"
        echo "app.use('/favicon.ico', express.static(path.join(__dirname, '../client/build/favicon.ico')));"
        echo "app.use('/robots.txt', express.static(path.join(__dirname, '../client/build/robots.txt')));"
    fi
fi

# 5. 检查Nginx配置
echo "检查Nginx配置..."
if [ ! -L "/etc/nginx/sites-enabled/iii.pics" ] && [ -f "/etc/nginx/sites-available/iii.pics" ]; then
    echo "启用Nginx配置..."
    sudo ln -s /etc/nginx/sites-available/iii.pics /etc/nginx/sites-enabled/ 2>/dev/null || echo "请手动启用Nginx配置"
fi

# 6. 重启服务
echo "重启PM2服务..."
pm2 restart all

# 7. 测试Nginx配置并重启
echo "测试并重启Nginx..."
sudo nginx -t && sudo systemctl restart nginx || echo "Nginx配置有误，请检查"

echo "快速修复完成！"
echo "请访问 https://iii.pics 检查SEO功能是否正常工作。"
EOF

chmod +x /tmp/seo-quick-fix.sh
echo "快速修复脚本已生成: /tmp/seo-quick-fix.sh"
echo "运行命令: bash /tmp/seo-quick-fix.sh"
echo ""

echo "====================================="
echo "         检测完成！"
echo "====================================="
echo "项目路径: $PROJECT_ROOT"
echo "域名: https://$DOMAIN"
echo "请根据上述检测结果和修复建议进行相应的修复操作。"
echo "如需更详细的帮助，请查看SEO修复操作指南文档。"
echo ""