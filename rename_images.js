const fs = require('fs');
const path = require('path');

// 图片文件夹路径
const imageDir = 'D:\\fenge\\client\\public\\ImageFlow';

function getActualFiles() {
  console.log('正在扫描ImageFlow文件夹中的实际文件...');
  
  try {
    const files = fs.readdirSync(imageDir);
    const webpFiles = files.filter(file => file.endsWith('.webp')).sort();
    const jpgFiles = files.filter(file => file.endsWith('.jpg')).sort();
    
    console.log(`发现 ${webpFiles.length} 个WEBP文件`);
    console.log(`发现 ${jpgFiles.length} 个JPG文件`);
    console.log(`总计 ${files.length} 个文件`);
    
    return { webpFiles, jpgFiles, allFiles: files };
  } catch (error) {
    console.error('读取目录失败:', error.message);
    return { webpFiles: [], jpgFiles: [], allFiles: [] };
  }
}

function generateBackgroundImagesArray() {
  const { webpFiles, jpgFiles } = getActualFiles();
  
  console.log('\n生成基于实际文件的backgroundImages数组...');
  
  let jsCode = 'const backgroundImages = [\n';
  let id = 1;
  
  // 添加WEBP文件
  console.log('\n添加WEBP文件:');
  webpFiles.forEach((file, index) => {
    jsCode += `  { id: ${id}, src: '/ImageFlow/${file}', alt: '艺术图片 ${id}' },\n`;
    console.log(`  ${id}: ${file}`);
    id++;
  });
  
  // 添加JPG文件
  console.log('\n添加JPG文件:');
  jpgFiles.forEach((file, index) => {
    jsCode += `  { id: ${id}, src: '/ImageFlow/${file}', alt: 'JPG图片 ${id - webpFiles.length}' },\n`;
    console.log(`  ${id}: ${file}`);
    id++;
  });
  
  jsCode += '];\n';
  
  // 写入到文件
  const outputFile = path.join(__dirname, 'backgroundImages_actual.js');
  fs.writeFileSync(outputFile, jsCode, 'utf8');
  
  console.log(`\n✓ 已生成包含 ${id - 1} 张图片的backgroundImages数组`);
  console.log(`✓ 文件保存到: ${outputFile}`);
  
  return { totalImages: id - 1, webpCount: webpFiles.length, jpgCount: jpgFiles.length };
}

function analyzeCodeVsActual() {
  console.log('\n=== 代码与实际文件对比分析 ===');
  
  const { webpFiles, jpgFiles } = getActualFiles();
  
  // Hero.js中引用的WEBP文件（从搜索结果中提取的部分）
  const codeWebpFiles = [
    '01 (1).webp', '01 (2).webp', '01 (3).webp', '01 (4).webp',
    '02 (1).webp', '02 (2).webp', '02 (3).webp', '02 (4).webp',
    '03.webp', '04.webp', '05.webp', '06.webp',
    '07 (1).webp', '07 (2).webp', '07 (3).webp',
    '08.webp', '09.webp', '10.webp',
    '11 (1).webp', '11 (2).webp', '12.webp', '13.webp', '15.webp',
    '16 (1).webp', '16 (2).webp',
    '17 (1).webp', '17 (2).webp', '17 (3).webp', '17 (4).webp',
    '18.webp', '19 (1).webp', '19 (2).webp',
    '20 (1).webp', '20 (2).webp', '20 (3).webp',
    '21 (1).webp', '21 (2).webp',
    '22 (1).webp', '22 (2).webp',
    '23.webp', '24.webp', '25.webp',
    '26 (1).webp', '26 (2).webp',
    '27.webp', '28.webp', '29.webp', '30.webp',
    '31 (1).webp', '31 (2).webp', '31 (3).webp', '31 (4).webp',
    '32.webp', '33.webp', '34.webp', '35.webp',
    '36 (1).webp', '36 (2).webp',
    '37 (1).webp', '37 (2).webp',
    '38 (1).webp', '38 (2).webp',
    '39.webp',
    '40 (1).webp', '40 (2).webp', '40 (3).webp',
    '41 (1).webp', '41 (2).webp',
    '42 (1).webp', '42 (2).webp', '42 (3).webp', '42 (4).webp',
    '43 (1).webp', '43 (2).webp', '43 (3).webp', '43 (4).webp',
    '44 (1).webp', '44 (2).webp', '44 (3).webp', '44 (4).webp',
    '45 (1).webp', '45 (2).webp', '45 (3).webp', '45 (4).webp',
    '46 (1).webp', '46 (2).webp', '46 (3).webp', '46 (4).webp',
    '47 (1).webp', '47 (2).webp', '47 (3).webp', '47 (4).webp',
    '48 (1).webp', '48 (2).webp', '48 (3).webp', '48 (4).webp',
    '49 (1).webp', '49 (2).webp', '49 (3).webp', '49 (4).webp',
    '50 (1).webp', '50 (2).webp', '50 (3).webp', '50 (4).webp',
    '51 (1).webp', '51 (2).webp', '51 (3).webp', '51 (4).webp',
    '52 (1).webp', '52 (2).webp', '52 (3).webp', '52 (4).webp',
    '53 (1).webp', '53 (2).webp', '53 (3).webp', '53 (4).webp',
    '54 (1).webp', '54 (2).webp', '54 (3).webp', '54 (4).webp',
    '55 (1).webp', '55 (2).webp', '55 (3).webp', '55 (4).webp',
    '56.webp', '57.webp'
  ];
  
  console.log('\n代码中引用但实际不存在的WEBP文件:');
  const missingWebp = codeWebpFiles.filter(file => !webpFiles.includes(file));
  missingWebp.forEach(file => console.log(`  ✗ ${file}`));
  
  console.log('\n实际存在但代码中未引用的WEBP文件:');
  const unusedWebp = webpFiles.filter(file => !codeWebpFiles.includes(file));
  unusedWebp.forEach(file => console.log(`  + ${file}`));
  
  console.log(`\n总结:`);
  console.log(`- 代码中引用的WEBP文件: ${codeWebpFiles.length}`);
  console.log(`- 实际存在的WEBP文件: ${webpFiles.length}`);
  console.log(`- 缺失的WEBP文件: ${missingWebp.length}`);
  console.log(`- 未使用的WEBP文件: ${unusedWebp.length}`);
  console.log(`- 实际存在的JPG文件: ${jpgFiles.length}`);
}

function showRecommendations() {
  console.log('\n=== 建议方案 ===');
  console.log('1. 使用实际存在的文件更新Hero.js中的backgroundImages数组');
  console.log('2. 删除代码中引用但不存在的文件路径');
  console.log('3. 添加实际存在但未使用的文件到数组中');
  console.log('4. 考虑是否需要JPG文件（当前文件夹中没有JPG文件）');
  console.log('\n运行 generateBackgroundImagesArray() 可生成正确的数组代码');
}

// 主函数
function main() {
  console.log('=== ImageFlow文件夹分析工具 ===\n');
  
  getActualFiles();
  analyzeCodeVsActual();
  const result = generateBackgroundImagesArray();
  showRecommendations();
  
  console.log('\n=== 分析完成 ===');
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  getActualFiles,
  generateBackgroundImagesArray,
  analyzeCodeVsActual
};