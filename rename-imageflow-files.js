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

// 清理文件名，移除中文字符和特殊字符
function cleanFileName(filename) {
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);
    
    // 移除中文字符、特殊字符，只保留字母、数字、连字符、下划线和括号
    let cleanName = nameWithoutExt
        .replace(/[^\w\s\-\(\)]/g, '') // 移除特殊字符，保留字母数字下划线空格连字符和括号
        .replace(/[\u4e00-\u9fff]/g, '') // 移除中文字符
        .replace(/\s+/g, '-') // 将空格替换为连字符
        .replace(/-+/g, '-') // 合并多个连字符
        .replace(/^-|-$/g, ''); // 移除开头和结尾的连字符
    
    // 如果清理后的名称为空，使用默认名称
    if (!cleanName) {
        cleanName = 'image';
    }
    
    return cleanName + ext;
}

// 生成唯一文件名
function generateUniqueFileName(dir, filename) {
    let counter = 1;
    let newFileName = filename;
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);
    
    while (fs.existsSync(path.join(dir, newFileName))) {
        newFileName = `${nameWithoutExt}-${counter}${ext}`;
        counter++;
    }
    
    return newFileName;
}

// 重命名文件
function renameFiles() {
    try {
        // 检查目录是否存在
        if (!fs.existsSync(imageFlowDir)) {
            console.error('ImageFlow目录不存在:', imageFlowDir);
            return;
        }
        
        // 读取目录中的所有文件
        const files = fs.readdirSync(imageFlowDir);
        const imageFiles = files.filter(isImageFile);
        
        console.log(`找到 ${imageFiles.length} 个图片文件`);
        
        let renamedCount = 0;
        
        imageFiles.forEach(filename => {
            const oldPath = path.join(imageFlowDir, filename);
            const cleanedName = cleanFileName(filename);
            
            // 如果文件名需要清理
            if (cleanedName !== filename) {
                const uniqueName = generateUniqueFileName(imageFlowDir, cleanedName);
                const newPath = path.join(imageFlowDir, uniqueName);
                
                try {
                    fs.renameSync(oldPath, newPath);
                    console.log(`重命名: ${filename} -> ${uniqueName}`);
                    renamedCount++;
                } catch (error) {
                    console.error(`重命名失败 ${filename}:`, error.message);
                }
            }
        });
        
        console.log(`\n重命名完成! 共处理 ${renamedCount} 个文件`);
        
    } catch (error) {
        console.error('重命名过程中发生错误:', error.message);
    }
}

// 执行重命名
if (require.main === module) {
    console.log('开始重命名ImageFlow文件夹中的文件...');
    console.log('目标目录:', imageFlowDir);
    renameFiles();
}

module.exports = { renameFiles, cleanFileName };