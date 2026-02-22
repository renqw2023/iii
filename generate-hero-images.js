const fs = require('fs');
const path = require('path');

// 读取生成的backgroundImages.js文件
const backgroundImagesPath = path.join(__dirname, 'backgroundImages.js');

// 生成Hero组件所需的图片对象数组
function generateHeroImages() {
    try {
        // 读取backgroundImages.js文件内容
        const content = fs.readFileSync(backgroundImagesPath, 'utf8');
        
        // 提取图片路径数组
        const arrayMatch = content.match(/const backgroundImages = \[(.*?)\];/s);
        if (!arrayMatch) {
            throw new Error('无法找到backgroundImages数组');
        }
        
        // 解析图片路径
        const arrayContent = arrayMatch[1];
        const imagePaths = arrayContent
            .split(',\n')
            .map(line => line.trim())
            .filter(line => line.startsWith("'"))
            .map(line => line.replace(/'/g, '').trim());
        
        console.log(`找到 ${imagePaths.length} 个图片路径`);
        
        // 生成Hero组件格式的对象数组
        const heroImages = imagePaths.map((imagePath, index) => {
            const id = index + 1;
            const fileName = path.basename(imagePath);
            const fileExt = path.extname(fileName).toLowerCase();
            
            let altText;
            if (fileExt === '.webp') {
                altText = `艺术图片 ${id}`;
            } else if (fileExt === '.jpg') {
                altText = `JPG图片 ${id}`;
            } else {
                altText = `图片 ${id}`;
            }
            
            return `    { id: ${id}, src: '${imagePath}', alt: '${altText}' }`;
        });
        
        // 生成完整的数组代码
        const heroArrayCode = `  // 支持多种格式的背景图片集合（包括WEBP、JPG格式）- 总计${imagePaths.length}张图片\n  // 使用重命名后的正确文件路径，解决图片空白问题\n  const backgroundImages = [\n${heroImages.join(',\n')}\n  ];`;
        
        return heroArrayCode;
        
    } catch (error) {
        console.error('生成Hero图片数组时发生错误:', error.message);
        return null;
    }
}

// 保存到文件
function saveHeroImages() {
    const heroArrayCode = generateHeroImages();
    
    if (!heroArrayCode) {
        console.error('生成Hero图片数组失败');
        return false;
    }
    
    const outputPath = path.join(__dirname, 'hero-images-array.js');
    
    try {
        fs.writeFileSync(outputPath, heroArrayCode, 'utf8');
        console.log(`\nHero图片数组已保存到: ${outputPath}`);
        console.log('\n可以直接复制此文件内容替换Hero组件中的backgroundImages数组');
        return true;
    } catch (error) {
        console.error('保存文件失败:', error.message);
        return false;
    }
}

// 显示预览
function showPreview() {
    const heroArrayCode = generateHeroImages();
    
    if (!heroArrayCode) {
        return;
    }
    
    console.log('\n=== Hero组件图片数组预览 ===');
    console.log(heroArrayCode.substring(0, 1000) + '...');
    console.log('\n（显示前1000个字符，完整内容请查看生成的文件）');
}

// 主函数
function main() {
    console.log('开始生成Hero组件图片数组...');
    console.log('源文件:', backgroundImagesPath);
    
    // 显示预览
    showPreview();
    
    // 保存到文件
    const saved = saveHeroImages();
    
    if (saved) {
        console.log('\n✅ 任务完成!');
        console.log('\n使用方法:');
        console.log('1. 打开生成的 hero-images-array.js 文件');
        console.log('2. 复制其中的数组代码');
        console.log('3. 替换Hero组件中的backgroundImages数组');
    }
}

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = {
    generateHeroImages,
    saveHeroImages,
    showPreview
};