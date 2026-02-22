const fs = require('fs');
const path = require('path');

const createUploadsDir = () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ uploads目录创建成功');
  } else {
    console.log('✅ uploads目录已存在');
  }

  // 创建子目录
  const subDirs = ['images', 'videos', 'thumbnails'];
  subDirs.forEach(dir => {
    const subDir = path.join(uploadsDir, dir);
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
      console.log(`✅ ${dir}目录创建成功`);
    }
  });

  // 创建.gitkeep文件
  const gitkeepPath = path.join(uploadsDir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
    console.log('✅ .gitkeep文件创建成功');
  }
};

createUploadsDir();