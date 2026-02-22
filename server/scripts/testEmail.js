const emailService = require('../services/emailService');
const config = require('../config');

async function testEmailConnection() {
  console.log('🧪 测试邮件服务连接...');
  console.log('配置信息:');
  console.log(`- SMTP主机: ${config.email.smtp.host}`);
  console.log(`- SMTP端口: ${config.email.smtp.port}`);
  console.log(`- 安全连接: ${config.email.smtp.secure}`);
  console.log(`- 用户名: ${config.email.smtp.auth.user}`);
  console.log(`- 发件人: ${config.email.from.name} <${config.email.from.address}>`);
  
  try {
    const result = await emailService.testConnection();
    if (result.success) {
      console.log('✅ 邮件服务连接成功!');
      
      // 测试发送验证码邮件
      console.log('\n📧 测试发送验证码邮件...');
      const testResult = await emailService.sendVerificationCode(
        'reki021@163.com',
        '123456',
        'TestUser'
      );
      
      if (testResult.success) {
        console.log('✅ 验证码邮件发送成功!');
      } else {
        console.log('❌ 验证码邮件发送失败:', testResult.error);
      }
    } else {
      console.log('❌ 邮件服务连接失败:', result.error);
    }
  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);
  }
}

testEmailConnection();