#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 启动 MJ Gallery 开发环境 (无虚拟数据)...\n');

// 检查环境
const checkEnvironment = () => {
  console.log('📋 检查环境...');
  
  // 检查Node.js版本
  const nodeVersion = process.version;
  console.log(`✅ Node.js版本: ${nodeVersion}`);
  
  // 检查是否安装了依赖
  const serverNodeModules = path.join(__dirname, 'server', 'node_modules');
  const clientNodeModules = path.join(__dirname, 'client', 'node_modules');
  
  if (!fs.existsSync(serverNodeModules) || !fs.existsSync(clientNodeModules)) {
    console.log('⚠️  检测到缺少依赖，正在安装...');
    return false;
  }
  
  console.log('✅ 依赖检查通过\n');
  return true;
};

// 安装依赖
const installDependencies = () => {
  return new Promise((resolve, reject) => {
    console.log('📦 安装依赖...');
    const install = spawn('npm', ['run', 'install-all'], {
      stdio: 'inherit',
      shell: true
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 依赖安装完成\n');
        resolve();
      } else {
        console.error('❌ 依赖安装失败');
        reject(new Error('依赖安装失败'));
      }
    });
  });
};

// 初始化服务器（不创建虚拟数据）
const initializeServer = () => {
  return new Promise((resolve, reject) => {
    console.log('🔧 初始化服务器（跳过虚拟数据创建）...');
    const setup = spawn('npm', ['run', 'setup'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, 'server')
    });
    
    setup.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 服务器初始化完成\n');
        resolve();
      } else {
        console.log('⚠️  服务器初始化可能失败，但继续启动...\n');
        resolve(); // 即使失败也继续
      }
    });
  });
};

// 启动开发服务器
const startDevelopment = () => {
  console.log('🌟 启动开发服务器...');
  console.log('前端地址: http://localhost:3100');
  console.log('后端地址: http://localhost:5500');
  console.log('管理面板: http://localhost:3100/admin');
  console.log('\n💡 提示: 如需虚拟数据，请运行 npm run setup-with-data');
  console.log('\n按 Ctrl+C 停止服务器\n');
  
  const dev = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  dev.on('close', (code) => {
    console.log(`\n开发服务器已停止 (退出码: ${code})`);
  });
  
  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n正在停止服务器...');
    dev.kill('SIGINT');
  });
};

// 主函数
const main = async () => {
  try {
    const hasDependendies = checkEnvironment();
    
    if (!hasDependendies) {
      await installDependencies();
    }
    
    await initializeServer();
    startDevelopment();
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
};

main();