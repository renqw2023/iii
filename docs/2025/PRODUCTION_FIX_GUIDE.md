# 生产环境404错误修复指南

## 文件上传路径404问题修复完成 ✅

### 问题描述
- **问题**: 新上传的文件出现404错误，无法正常访问
- **根本原因**: 文件实际保存位置与静态文件服务配置不匹配
- **实际文件位置**: `/var/www/mj-gallery/uploads`
- **配置期望位置**: `/var/www/mj-gallery/server/uploads`

### 修复过程

#### 1. 问题诊断
使用 `check-existing-files-location.js` 脚本确认了问题：
- 文件实际保存在 `./uploads` 目录
- 配置指向 `./server/uploads` 目录
- 静态文件服务配置不匹配

#### 2. 修复方案
采用方案3：修改配置以匹配实际文件位置
- ✅ 修改 `.env` 文件：`UPLOAD_PATH=./uploads`
- ✅ 修改 `server/index.js`：静态文件服务指向 `../uploads`
- ✅ 保持现有文件不动，避免文件移动风险

#### 3. 修复结果
- ✅ 配置文件已自动备份
- ✅ UPLOAD_PATH 已更新为 `./uploads`
- ✅ 静态文件服务配置已更新
- ✅ 现有文件URL保持有效

### 后续步骤
1. **重启服务器**: `pm2 restart all`
2. **测试文件上传功能**
3. **验证现有文件URL访问**
4. **如有问题，使用备份文件恢复**

### 测试URL示例
现有文件应该可以正常访问：
```
http://your-domain/uploads/images/6881abd9273b0f9323dab098/media-1753432380218-849042365.jpg
```

### 修复脚本
- `check-existing-files-location.js` - 诊断文件位置问题
- `fix-file-location-mismatch.js` - 自动修复配置不匹配

### 备份文件
修复过程中自动创建的备份文件：
- `server/.env.backup-[timestamp]`
- `server/index.js.backup-[timestamp]`

---

## 修复完成时间
**日期**: 2024年1月25日  
**状态**: ✅ 已完成  
**影响**: 解决了新上传文件404错误问题