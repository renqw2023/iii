# 🚨 紧急服务器修复 - ffmpeg依赖问题

## 立即执行以下命令修复服务器：

```bash
# 1. 停止服务
pm2 stop all

# 2. 进入服务器目录
cd /var/www/mj-gallery/server

# 3. 清理旧依赖
rm -rf node_modules package-lock.json

# 4. 重新安装依赖
npm install

# 5. 重启服务
pm2 start ecosystem.config.js

# 6. 检查状态
pm2 logs
```

## 问题原因
服务器找不到 `ffmpeg-static` 模块，但代码已经切换到 `@ffmpeg-installer/ffmpeg`。

## 验证修复
执行后应该看到：
- ✅ 服务正常启动
- ✅ 没有 "Cannot find module 'ffmpeg-static'" 错误
- ✅ PM2 进程稳定运行

---
**如果问题仍然存在，请检查 `routes/upload.js` 文件是否正确上传到服务器。**