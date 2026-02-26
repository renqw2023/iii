root@SG20241128:/var/www/mj-gallery# chmod +x test-seo-api-fix.sh
root@SG20241128:/var/www/mj-gallery# bash test-seo-api-fix.sh
====== SEO API修复验证 ======
时间: Sat Aug 16 02:13:34 AM -11 2025
测试目标: 验证baseUrl配置修复后的API接口

1. 测试Sitemap生成API
测试: Sitemap生成接口
URL: https://iii.pics/api/seo/sitemap/generate
✅ 状态: HTTP 200 - 成功
响应预览: {"success":true,"message":"All sitemaps generated successfully","timestamp":"2025-08-16T13:13:35.041Z"}...
----------------------------------------
2. 测试Sitemap状态API
测试: Sitemap状态接口
URL: https://iii.pics/api/seo/sitemap/status
✅ 状态: HTTP 200 - 成功
响应预览: {"success":true,"sitemaps":{"sitemap.xml":{"exists":false,"error":"File not found"},"sitemap-zh-CN.xml":{"exists":false,"error":"File not found"},"sitemap-en-US.xml":{"exists":false,"error":"File not ...
----------------------------------------
3. 测试SEO Meta API
测试: SEO Meta数据接口
URL: https://iii.pics/api/seo/meta/home
✅ 状态: HTTP 200 - 成功
响应预览: {"success":true,"meta":{"title":"MJ Gallery - 专业AI艺术创作平台","description":"发现AI艺术的无限可能，探索精美的Midjourney风格参数，与全球创作者分享灵感","keywor...
----------------------------------------
4. 测试其他页面的Meta API
测试: 探索页面Meta数据
URL: https://iii.pics/api/seo/meta/explore
✅ 状态: HTTP 200 - 成功
响应预览: {"success":true,"meta":{"title":"探索精美AI艺术作品 - 发现创作灵感","description":"浏览来自全球创作者的精美AI艺术作品，发现独特的创作风格和技巧","keywords":"...
----------------------------------------
测试: 关于页面Meta数据
URL: https://iii.pics/api/seo/meta/about
✅ 状态: HTTP 200 - 成功
响应预览: {"success":true,"meta":{"title":"MJ Gallery - AI艺术创作平台","description":"专业的AI艺术创作平台，展示Midjourney风格参数","type":"website","url":"https://iii.pics/zh-CN/","image...
----------------------------------------
5. 验证静态资源访问
测试: 静态Sitemap文件
URL: https://iii.pics/sitemap.xml
✅ 状态: HTTP 200 - 成功
响应预览: <?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://iii.pics/sitemap-zh-CN.xml</loc>
    <lastmod>2025-08-16T13:13:35...
----------------------------------------
测试: Robots.txt文件
URL: https://iii.pics/robots.txt
✅ 状态: HTTP 200 - 成功
响应预览: User-agent: *
Allow: /

# Sitemap
Sitemap: https://iii.pics/sitemap.xml

# 禁止访问的路径
Disallow: /api/
Disallow: /admin/
Disallow: /uploads/temp/
Disallow: /*?*
Disallow: /*/settings
Disallo...
----------------------------------------

====== 修复验证完成 ======
如果所有API都返回HTTP 200，说明baseUrl配置修复成功
如果仍有500错误，可能需要重启服务器应用配置更改

重启命令提示:
ssh root@your-server
cd /var/www/mj-gallery
pm2 restart mj-gallery-server
pm2 logs mj-gallery-server --lines 20
root@SG20241128:/var/www/mj-gallery# 
