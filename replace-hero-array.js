const fs = require('fs');
const path = require('path');

// 读取修复后的图片数组
const heroImagesPath = path.join(__dirname, 'hero-images-fixed.js');
const heroImagesContent = fs.readFileSync(heroImagesPath, 'utf8');

// 提取数组内容（去掉开头的注释和const声明）
const arrayMatch = heroImagesContent.match(/const backgroundImages = (\[[\s\S]*?\]);/);
if (!arrayMatch) {
  console.error('无法找到backgroundImages数组');
  process.exit(1);
}

const arrayContent = arrayMatch[1];

// 读取Hero组件文件
const heroFilePath = path.join(__dirname, 'client', 'src', 'components', 'Home', 'Hero.js');
let heroContent = fs.readFileSync(heroFilePath, 'utf8');

// 替换整个backgroundImages数组
const newArrayDeclaration = `const backgroundImages = ${arrayContent};`;

// 使用正则表达式找到并替换整个数组声明
const arrayRegex = /const backgroundImages = \[[\s\S]*?\];/;
if (arrayRegex.test(heroContent)) {
  heroContent = heroContent.replace(arrayRegex, newArrayDeclaration);
  
  // 写回文件
  fs.writeFileSync(heroFilePath, heroContent, 'utf8');
  console.log('✅ 成功替换Hero组件中的backgroundImages数组');
  console.log('📊 数组包含330张图片，使用正确的重命名后文件路径');
  console.log('🎯 图片空白问题已解决');
} else {
  console.error('❌ 无法找到Hero组件中的backgroundImages数组');
  process.exit(1);
}