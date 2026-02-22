const fs = require('fs');
const path = require('path');

// 读取backgroundImages.js文件
const backgroundImagesPath = path.join(__dirname, 'backgroundImages.js');
const content = fs.readFileSync(backgroundImagesPath, 'utf8');

// 提取数组内容
const arrayMatch = content.match(/const backgroundImages = \[([\s\S]*?)\];/);
if (!arrayMatch) {
  console.error('无法找到backgroundImages数组');
  process.exit(1);
}

// 解析路径
const pathsText = arrayMatch[1];
const paths = pathsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.startsWith("'") && line.includes('.webp') || line.includes('.jpg'))
  .map(line => line.replace(/^'|',$|',$/g, ''));

console.log(`找到 ${paths.length} 个图片路径`);

// 生成Hero组件格式的数组
const heroArray = paths.map((path, index) => {
  const isJpg = path.includes('.jpg');
  const altText = isJpg ? `JPG图片 ${index + 1}` : `艺术图片 ${index + 1}`;
  return `    { id: ${index + 1}, src: '${path}', alt: '${altText}' }`;
}).join(',\n');

const heroArrayContent = `  // 支持多种格式的背景图片集合（包括WEBP、JPG格式）- 总计${paths.length}张图片
  // 使用重命名后的正确文件路径，解决图片空白问题
  const backgroundImages = [
${heroArray}
  ];`;

// 保存到文件
const outputPath = path.join(__dirname, 'hero-images-fixed.js');
fs.writeFileSync(outputPath, heroArrayContent, 'utf8');

console.log(`\n✅ Hero组件图片数组已生成完成！`);
console.log(`📁 输出文件: ${outputPath}`);
console.log(`📊 图片数量: ${paths.length}`);
console.log(`\n使用方法：`);
console.log(`1. 复制 hero-images-fixed.js 文件中的 backgroundImages 数组`);
console.log(`2. 替换 Hero.js 组件中的对应数组`);
console.log(`3. 确保所有图片路径都使用重命名后的正确格式`);