const path = require('path');
const fs = require('fs');
const config = require('./server/config');

console.log('=== 文件上传功能测试 ===');

// 模拟文件上传流程
const simulateUpload = (userId, fileType = 'image') => {
  console.log(`\n--- 模拟${fileType}上传 (用户ID: ${userId}) ---`);
  
  try {
    // 1. 确定上传路径
    let uploadPath;
    if (fileType === 'image') {
      uploadPath = path.join(config.upload.path, 'images', userId);
    } else if (fileType === 'video') {
      uploadPath = path.join(config.upload.path, 'videos', userId);
    } else {
      uploadPath = path.join(config.upload.path, userId);
    }
    
    console.log(`上传目录: ${uploadPath}`);
    
    // 2. 检查目录是否存在
    if (!fs.existsSync(uploadPath)) {
      console.log('目录不存在，正在创建...');
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('✅ 目录创建成功');
    } else {
      console.log('✅ 目录已存在');
    }
    
    // 3. 生成文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = fileType === 'image' ? '.jpg' : '.mp4';
    const filename = 'media-' + uniqueSuffix + ext;
    const filePath = path.join(uploadPath, filename);
    
    console.log(`文件名: ${filename}`);
    console.log(`完整路径: ${filePath}`);
    
    // 4. 模拟文件写入
    const testContent = `Test ${fileType} content - ${new Date().toISOString()}`;
    fs.writeFileSync(filePath, testContent);
    console.log('✅ 文件写入成功');
    
    // 5. 生成URL
    const url = `/uploads/${fileType === 'image' ? 'images' : 'videos'}/${userId}/${filename}`;
    console.log(`访问URL: ${url}`);
    
    // 6. 验证文件存在
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ 文件验证成功 (大小: ${stats.size} bytes)`);
    } else {
      console.log('❌ 文件验证失败');
      return false;
    }
    
    // 7. 清理测试文件
    fs.unlinkSync(filePath);
    console.log('✅ 测试文件已清理');
    
    return { success: true, url, filePath };
    
  } catch (error) {
    console.log(`❌ 上传模拟失败: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// 检查配置
const checkConfiguration = () => {
  console.log('\n=== 配置检查 ===');
  console.log('工作目录:', process.cwd());
  console.log('上传路径配置:', config.upload.path);
  console.log('绝对路径:', path.resolve(config.upload.path));
  console.log('环境变量UPLOAD_PATH:', process.env.UPLOAD_PATH || '未设置');
  
  // 检查主目录
  const mainDir = config.upload.path;
  if (fs.existsSync(mainDir)) {
    console.log('✅ 主上传目录存在');
  } else {
    console.log('❌ 主上传目录不存在');
    return false;
  }
  
  return true;
};

// 检查子目录
const checkSubDirectories = () => {
  console.log('\n=== 子目录检查 ===');
  
  const subdirs = ['images', 'videos', 'thumbnails', 'temp'];
  let allExist = true;
  
  for (const subdir of subdirs) {
    const dirPath = path.join(config.upload.path, subdir);
    const exists = fs.existsSync(dirPath);
    console.log(`${subdir}: ${exists ? '✅ 存在' : '❌ 不存在'} - ${dirPath}`);
    
    if (!exists) {
      allExist = false;
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ 已创建目录: ${dirPath}`);
      } catch (error) {
        console.log(`  ❌ 创建目录失败: ${error.message}`);
      }
    }
  }
  
  return allExist;
};

// 主测试流程
const runTests = () => {
  console.log('开始文件上传功能测试...');
  
  // 1. 检查配置
  if (!checkConfiguration()) {
    console.log('\n❌ 配置检查失败，无法继续测试');
    return;
  }
  
  // 2. 检查子目录
  checkSubDirectories();
  
  // 3. 模拟上传测试
  const testUserId = '6881abd9273b0f9323dab098';
  
  console.log('\n=== 上传功能测试 ===');
  
  // 测试图片上传
  const imageResult = simulateUpload(testUserId, 'image');
  
  // 测试视频上传
  const videoResult = simulateUpload(testUserId, 'video');
  
  // 4. 总结结果
  console.log('\n=== 测试结果 ===');
  console.log(`图片上传: ${imageResult.success ? '✅ 成功' : '❌ 失败'}`);
  if (!imageResult.success) {
    console.log(`  错误: ${imageResult.error}`);
  }
  
  console.log(`视频上传: ${videoResult.success ? '✅ 成功' : '❌ 失败'}`);
  if (!videoResult.success) {
    console.log(`  错误: ${videoResult.error}`);
  }
  
  const overallSuccess = imageResult.success && videoResult.success;
  console.log(`\n总体结果: ${overallSuccess ? '✅ 所有测试通过' : '❌ 存在问题'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 文件上传功能正常！');
    console.log('建议：');
    console.log('1. 重启服务器: pm2 restart mj-gallery-server');
    console.log('2. 测试实际上传功能');
    console.log('3. 检查网站是否能正常显示新上传的文件');
  } else {
    console.log('\n⚠️ 发现问题，建议：');
    console.log('1. 检查目录权限');
    console.log('2. 检查磁盘空间');
    console.log('3. 检查配置文件');
    console.log('4. 运行修复脚本: node fix-upload-paths.js');
  }
};

// 运行测试
runTests();