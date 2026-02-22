const fs = require('fs');
const path = require('path');

// 图片文件夹路径
const imageFlowDir = path.join(__dirname, 'client', 'public', 'ImageFlow');

// 支持的图片格式
const supportedExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg'];

// 检查是否为图片文件
function isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return supportedExtensions.includes(ext);
}

// 自然排序函数（处理数字排序）
function naturalSort(a, b) {
    const regex = /(\d+)/g;
    const aTokens = a.split(regex);
    const bTokens = b.split(regex);
    
    for (let i = 0; i < Math.max(aTokens.length, bTokens.length); i++) {
        const aToken = aTokens[i] || '';
        const bToken = bTokens[i] || '';
        
        // 如果都是数字，按数字比较
        if (/^\d+$/.test(aToken) && /^\d+$/.test(bToken)) {
            const diff = parseInt(aToken, 10) - parseInt(bToken, 10);
            if (diff !== 0) return diff;
        } else {
            // 否则按字符串比较
            if (aToken !== bToken) {
                return aToken.localeCompare(bToken);
            }
        }
    }
    
    return 0;
}

// 生成backgroundImages数组
function generateBackgroundImages() {
    try {
        // 检查目录是否存在
        if (!fs.existsSync(imageFlowDir)) {
            console.error('ImageFlow目录不存在:', imageFlowDir);
            return null;
        }
        
        // 读取目录中的所有文件
        const files = fs.readdirSync(imageFlowDir);
        const imageFiles = files.filter(isImageFile);
        
        // 按自然顺序排序
        imageFiles.sort(naturalSort);
        
        console.log(`找到 ${imageFiles.length} 个图片文件`);
        
        // 生成backgroundImages数组
        const backgroundImages = imageFiles.map(filename => {
            return `/ImageFlow/${filename}`;
        });
        
        return backgroundImages;
        
    } catch (error) {
        console.error('生成backgroundImages数组时发生错误:', error.message);
        return null;
    }
}

// 生成JavaScript代码
function generateJavaScriptCode() {
    const backgroundImages = generateBackgroundImages();
    
    if (!backgroundImages) {
        return null;
    }
    
    const jsCode = `// 自动生成的backgroundImages数组
// 生成时间: ${new Date().toLocaleString()}
// 图片数量: ${backgroundImages.length}

const backgroundImages = [
${backgroundImages.map(img => `  '${img}'`).join(',\n')}
];

export default backgroundImages;

// 或者使用 CommonJS 格式:
// module.exports = backgroundImages;`;
    
    return jsCode;
}

// 保存到文件
function saveToFile(outputPath = null) {
    const jsCode = generateJavaScriptCode();
    
    if (!jsCode) {
        console.error('生成代码失败');
        return false;
    }
    
    // 默认输出路径
    if (!outputPath) {
        outputPath = path.join(__dirname, 'backgroundImages.js');
    }
    
    try {
        fs.writeFileSync(outputPath, jsCode, 'utf8');
        console.log(`\nbackgroundImages数组已保存到: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('保存文件失败:', error.message);
        return false;
    }
}

// 显示预览
function showPreview() {
    const backgroundImages = generateBackgroundImages();
    
    if (!backgroundImages) {
        return;
    }
    
    console.log('\n=== backgroundImages数组预览 ===');
    console.log('const backgroundImages = [');
    backgroundImages.forEach((img, index) => {
        console.log(`  '${img}'${index < backgroundImages.length - 1 ? ',' : ''}`);
    });
    console.log('];');
    console.log(`\n总计: ${backgroundImages.length} 个图片文件`);
}

// 主函数
function main() {
    console.log('开始扫描ImageFlow文件夹...');
    console.log('目标目录:', imageFlowDir);
    
    // 显示预览
    showPreview();
    
    // 保存到文件
    const saved = saveToFile();
    
    if (saved) {
        console.log('\n✅ 任务完成!');
        console.log('\n使用方法:');
        console.log('1. 将生成的 backgroundImages.js 文件复制到你的项目中');
        console.log('2. 在需要使用的地方导入: import backgroundImages from "./backgroundImages.js"');
        console.log('3. 或者直接复制数组内容到你的代码中');
    }
}

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = {
    generateBackgroundImages,
    generateJavaScriptCode,
    saveToFile,
    showPreview
};