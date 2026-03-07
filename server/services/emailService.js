const nodemailer = require('nodemailer');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    if (!config.email.enabled) {
      console.log('邮件服务已禁用');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass,
      },
    });

    console.log('邮件服务已初始化');
  }

  // 发送邮箱验证码
  async sendVerificationCode(email, code) {
    if (!this.transporter) {
      throw new Error('邮件服务未启用');
    }

    const mailOptions = {
      from: {
        name: config.email.from.name,
        address: config.email.from.address,
      },
      to: email,
      subject: 'III.PICS - 邮箱验证码',
      html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>III.PICS - 邮箱验证码</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">III.PICS</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">Midjourney 风格参数展示平台</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 50px 40px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-size: 36px;">✉️</span>
                </div>
                <h2 style="color: #2d3748; margin: 0 0 16px 0; font-size: 28px; font-weight: 600;">邮箱验证码</h2>
                <p style="color: #718096; margin: 0; font-size: 16px; line-height: 1.6;">请使用以下验证码完成您的邮箱验证</p>
              </div>
              
              <!-- Verification Code -->
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px dashed #cbd5e0; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
                <div style="background: #ffffff; padding: 20px 30px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                  <span style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</span>
                </div>
              </div>
              
              <!-- Notice -->
              <div style="background: #fef5e7; border-left: 4px solid #f6ad55; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #744210; margin: 0; font-size: 14px; font-weight: 500;">
                  <span style="font-weight: 600;">⏰ 重要提醒：</span>验证码有效期为 10 分钟，请及时使用。
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 40px;">
                <p style="color: #a0aec0; font-size: 14px; margin: 0;">如果您没有请求此验证码，请忽略此邮件。</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; font-size: 12px; margin: 0; line-height: 1.5;">
                © 2025 III.PICS. All rights reserved.<br>
                <span style="color: #cbd5e0;">本邮件由系统自动发送，请勿回复。</span>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('验证码邮件发送成功:', result.messageId);
      return result;
    } catch (error) {
      console.error('验证码邮件发送失败:', error);
      throw error;
    }
  }

  // 发送欢迎邮件
  async sendWelcomeEmail(email, username) {
    if (!this.transporter) {
      throw new Error('邮件服务未启用');
    }

    const mailOptions = {
      from: {
        name: config.email.from.name,
        address: config.email.from.address,
      },
      to: email,
      subject: '🎉 欢迎加入 III.PICS！',
      html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>欢迎加入 III.PICS</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">III.PICS</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">Midjourney 风格参数展示平台</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 50px 40px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-size: 36px;">🎉</span>
                </div>
                <h2 style="color: #2d3748; margin: 0 0 16px 0; font-size: 28px; font-weight: 600;">欢迎加入 III.PICS！</h2>
                <p style="color: #718096; margin: 0; font-size: 16px; line-height: 1.6;">感谢您的注册，开启您的创意之旅</p>
              </div>
              
              <!-- Welcome Message -->
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 30px; border-radius: 12px; margin: 30px 0;">
                <p style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 500;">亲爱的 <span style="color: #667eea; font-weight: 600;">${username}</span>，</p>
                <p style="color: #4a5568; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">感谢您注册 III.PICS！现在您可以享受以下功能：</p>
                
                <!-- Features List -->
                <div style="margin: 24px 0;">
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <div style="width: 32px; height: 32px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                      <span style="color: #ffffff; font-size: 16px;">🖼️</span>
                    </div>
                    <p style="color: #4a5568; margin: 0; font-size: 15px;">浏览和收藏精美的 Midjourney 作品</p>
                  </div>
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <div style="width: 32px; height: 32px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                      <span style="color: #ffffff; font-size: 16px;">📤</span>
                    </div>
                    <p style="color: #4a5568; margin: 0; font-size: 15px;">分享您的创作和参数设置</p>
                  </div>
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <div style="width: 32px; height: 32px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                      <span style="color: #ffffff; font-size: 16px;">💬</span>
                    </div>
                    <p style="color: #4a5568; margin: 0; font-size: 15px;">与其他创作者交流互动</p>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <div style="width: 32px; height: 32px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                      <span style="color: #ffffff; font-size: 16px;">💡</span>
                    </div>
                    <p style="color: #4a5568; margin: 0; font-size: 15px;">发现更多创作灵感</p>
                  </div>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${config.server.clientUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">🚀 开始探索</a>
              </div>
              
              <div style="text-align: center; margin-top: 40px;">
                <p style="color: #a0aec0; font-size: 14px; margin: 0;">如有任何问题，随时联系我们的客服团队。</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; font-size: 12px; margin: 0; line-height: 1.5;">
                © 2025 III.PICS. All rights reserved.<br>
                <span style="color: #cbd5e0;">本邮件由系统自动发送，请勿回复。</span>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('欢迎邮件发送成功:', result.messageId);
      return result;
    } catch (error) {
      console.error('欢迎邮件发送失败:', error);
      throw error;
    }
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(email, username, resetToken) {
    if (!this.transporter) {
      throw new Error('邮件服务未启用');
    }

    const resetUrl = `${config.server.clientUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: {
        name: config.email.from.name,
        address: config.email.from.address,
      },
      to: email,
      subject: '🔐 III.PICS - 密码重置请求',
      html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>III.PICS - 密码重置</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">III.PICS</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">Midjourney 风格参数展示平台</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 50px 40px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-size: 36px;">🔐</span>
                </div>
                <h2 style="color: #2d3748; margin: 0 0 16px 0; font-size: 28px; font-weight: 600;">密码重置请求</h2>
                <p style="color: #718096; margin: 0; font-size: 16px; line-height: 1.6;">我们收到了您的密码重置请求</p>
              </div>
              
              <!-- Reset Message -->
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 30px; border-radius: 12px; margin: 30px 0;">
                <p style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 500;">您好，</p>
                <p style="color: #4a5568; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">我们收到了您的密码重置请求。请点击下面的按钮来重置您的密码：</p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 101, 101, 0.4); transition: all 0.3s ease;">🔑 重置密码</a>
              </div>
              
              <!-- Alternative Link -->
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #4a5568; margin: 0 0 12px 0; font-size: 14px; font-weight: 500;">如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
                <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <p style="color: #667eea; margin: 0; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">${resetUrl}</p>
                </div>
              </div>
              
              <!-- Warning Notice -->
              <div style="background: #fef5e7; border-left: 4px solid #f6ad55; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #744210; margin: 0; font-size: 14px; font-weight: 500;">
                  <span style="font-weight: 600;">⏰ 重要提醒：</span>此链接将在 1 小时后失效，请及时使用。
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="background: #e6fffa; border-left: 4px solid #38b2ac; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #234e52; margin: 0; font-size: 14px; font-weight: 500;">
                  <span style="font-weight: 600;">🛡️ 安全提示：</span>如果您没有请求密码重置，请忽略此邮件，您的密码不会被更改。
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 40px;">
                <p style="color: #a0aec0; font-size: 14px; margin: 0;">如有任何疑问，请联系我们的客服团队。</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; font-size: 12px; margin: 0; line-height: 1.5;">
                © 2025 III.PICS. All rights reserved.<br>
                <span style="color: #cbd5e0;">本邮件由系统自动发送，请勿回复。</span>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('密码重置邮件发送成功:', result.messageId);
      return result;
    } catch (error) {
      console.error('密码重置邮件发送失败:', error);
      throw error;
    }
  }

  // 发送 Magic Link 邮件
  async sendMagicLinkEmail(email, magicUrl) {
    if (!this.transporter) {
      throw new Error('邮件服务未启用');
    }

    const mailOptions = {
      from: {
        name: config.email.from.name,
        address: config.email.from.address,
      },
      to: email,
      subject: 'III.PICS - 登录链接',
      html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>III.PICS - Magic Link 登录</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">III.PICS</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">一键登录，无需密码</p>
            </div>
            <div style="padding: 50px 40px;">
              <h2 style="color: #2d3748; text-align: center; margin: 0 0 16px;">点击下方按钮登录</h2>
              <p style="color: #718096; text-align: center; font-size: 16px; margin: 0 0 40px;">此链接 15 分钟内有效，仅可使用一次。</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${magicUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102,126,234,0.4);">登录 III.PICS</a>
              </div>
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #4a5568; margin: 0 0 12px; font-size: 14px;">如果按钮无法点击，请复制以下链接：</p>
                <p style="color: #667eea; margin: 0; font-size: 13px; word-break: break-all; font-family: monospace;">${magicUrl}</p>
              </div>
              <p style="color: #a0aec0; text-align: center; font-size: 14px; margin: 0;">如果您没有请求此链接，请忽略此邮件。</p>
            </div>
            <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; font-size: 12px; margin: 0;">© 2025 III.PICS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await this.transporter.sendMail(mailOptions);
    console.log('Magic Link 邮件发送成功:', result.messageId);
    return result;
  }

  // 测试邮件连接
  async testConnection() {
    if (!this.transporter) {
      return {
        success: false,
        error: '邮件服务未启用'
      };
    }

    try {
      await this.transporter.verify();
      console.log('邮件服务连接测试成功');
      return {
        success: true,
        message: '邮件服务连接成功'
      };
    } catch (error) {
      console.error('邮件服务连接测试失败:', error);
      return {
        success: false,
        error: error.message || '连接失败'
      };
    }
  }
}

module.exports = new EmailService();