const config = require('./server/config');
const path = require('path');

console.log('=== 上传配置测试 ===');
console.log('环境变量 UPLOAD_PATH:', process.env.UPLOAD_PATH);
console.log('config.upload.path:', config.upload.path);
console.log('当前工作目录:', process.cwd());
console.log('相对路径 ./uploads 解析为:', path.resolve('./uploads'));
console.log('相对路径 ./server/uploads 解析为:', path.resolve('./server/uploads'));
console.log('===================');