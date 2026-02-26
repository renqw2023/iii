# Debian服务器npm命令问题修复指南

## 🚨 问题描述

用户在Debian服务器上运行数据导入脚本时遇到错误：
```bash
root@SG20241128:/var/www/mj-gallery# cd server 
root@SG20241128:/var/www/mj-gallery/server# npm run import-data 
-bash: npm run import-data: command not found
```

## 🔍 问题分析

由于项目已经成功构建，说明Node.js和npm环境基本正常。此错误可能由以下原因引起：

1. **环境变量问题**：npm命令路径未正确添加到PATH
2. **用户权限问题**：当前用户无法访问npm命令
3. **Node.js版本管理器冲突**：nvm、n等版本管理器导致的路径问题
4. **命令语法问题**：bash解析npm run命令时出现问题

## 🛠️ 解决方案

### 方案1：检查npm命令可用性

```bash
# 检查npm是否安装
which npm
npm --version

# 检查Node.js版本
node --version

# 检查环境变量
echo $PATH
```

### 方案2：重新加载环境变量

```bash
# 重新加载bash配置
source ~/.bashrc
source ~/.profile

# 或者重新登录
exit
# 重新SSH登录
```

### 方案3：使用完整路径执行

```bash
# 查找npm完整路径
which npm
# 例如：/usr/bin/npm

# 使用完整路径执行
/usr/bin/npm run import-data

# 或者使用npx
npx npm run import-data
```

### 方案4：直接执行Node.js脚本（推荐）

```bash
# 进入server目录
cd /var/www/mj-gallery/server

# 直接使用node执行脚本
node scripts/importData.js
```

### 方案5：修复npm环境（如果npm确实有问题）

```bash
# 重新安装npm
sudo apt update
sudo apt install -y npm

# 或者使用NodeSource安装最新版本
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

## 🎯 推荐执行步骤

### 步骤1：快速诊断
```bash
cd /var/www/mj-gallery/server
which npm
npm --version
```

### 步骤2：如果npm命令存在，尝试重新加载环境
```bash
source ~/.bashrc
npm run import-data
```

### 步骤3：如果仍然失败，直接执行Node.js脚本
```bash
node scripts/importData.js
```

### 步骤4：验证数据导入
```bash
# 检查数据导入是否成功
# 可以通过MongoDB查询或应用日志确认
```

## 📋 验证清单

- [ ] npm命令可以正常执行
- [ ] 在正确的目录（/var/www/mj-gallery/server）
- [ ] package.json文件存在且包含import-data脚本
- [ ] scripts/importData.js文件存在
- [ ] MongoDB服务正在运行
- [ ] 数据文件（data-export目录）存在

## 🚨 常见错误及解决

### 错误1：Permission denied
```bash
# 解决方案：修复文件权限
sudo chown -R $USER:$USER /var/www/mj-gallery
chmod +x /var/www/mj-gallery/server/scripts/importData.js
```

### 错误2：Module not found
```bash
# 解决方案：重新安装依赖
cd /var/www/mj-gallery/server
npm install
```

### 错误3：Database connection failed
```bash
# 解决方案：检查MongoDB服务
sudo systemctl status mongod
sudo systemctl start mongod
```

## 📝 备注

- 如果所有方案都失败，可以考虑重新部署Node.js环境
- 建议使用Node.js 18 LTS版本以确保兼容性
- 数据导入脚本执行前请确保MongoDB服务正在运行
- 导入完成后建议验证数据完整性

## 🔄 后续步骤

数据导入成功后，继续执行部署流程：

1. 配置PM2进程管理
2. 启动应用服务
3. 配置Nginx反向代理
4. 申请SSL证书
5. 验证部署结果

---

**修复日期**：2024年1月
**状态**：待验证
**优先级**：高