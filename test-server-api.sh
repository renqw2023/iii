#!/bin/bash
# API功能测试脚本
# 测试服务器端API是否正常工作

echo "🧪 开始API功能测试..."

# 测试健康检查
echo "
1. 测试健康检查API..."
curl -s http://localhost:5500/api/health | jq .

# 测试帖子列表API
echo "
2. 测试帖子列表API..."
curl -s "http://localhost:5500/api/posts?limit=5" | jq '.posts | length'

# 测试热门标签API
echo "
3. 测试热门标签API..."
curl -s http://localhost:5500/api/posts/tags/popular | jq .

# 测试精选内容API
echo "
4. 测试精选内容API..."
curl -s "http://localhost:5500/api/posts/featured?limit=5" | jq '.posts | length'

# 检查数据库连接
echo "
5. 检查MongoDB连接状态..."
mongo --eval "db.adminCommand('ismaster')" midjourney-gallery

echo "
✅ API测试完成！"
