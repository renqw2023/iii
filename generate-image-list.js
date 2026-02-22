const fs = require('fs');
const path = require('path');

// 读取ImageFlow目录中的所有文件
const imageFlowDir = path.join(__dirname, 'client', 'public', 'ImageFlow');
const files = fs.readdirSync(imageFlowDir);

// 过滤出webp文件并排序
const webpFiles = files
  .filter(file => file.endsWith('.webp'))
  .sort((a, b) => {
    // 提取数字进行排序
    const getNumber = (filename) => {
      const match = filename.match(/^(\d+)/);
      return match ? parseInt(match[1]) : 999;
    };
    return getNumber(a) - getNumber(b);
  });

console.log(`找到 ${webpFiles.length} 张图片`);

// 生成图片数组代码
let imageArrayCode = '  const backgroundImages = [\n';

webpFiles.forEach((file, index) => {
  const id = index + 1;
  imageArrayCode += `    { id: ${id}, src: '/ImageFlow/${file}', alt: '艺术图片 ${id}' },\n`;
});

// 移除最后一个逗号
imageArrayCode = imageArrayCode.slice(0, -2) + '\n';
imageArrayCode += '  ];\n';

console.log('生成的图片数组代码：');
console.log(imageArrayCode);

// 保存到文件
fs.writeFileSync('image-array-code.txt', imageArrayCode);
console.log('\n代码已保存到 image-array-code.txt 文件中');