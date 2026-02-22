const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const config = require('../config');
const emailService = require('../services/emailService');
const { updateLoginAnalytics, updateUserAnalytics } = require('../middleware/analytics');

const router = express.Router();

// 生成JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { 
      expiresIn: config.jwt.expiresIn,
      algorithm: config.jwt.algorithm
    }
  );
};

// 注册 - 第一步：发送验证码
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用'
      });
    }

    // 创建新用户（未验证状态）
    const user = new User({ 
      username, 
      email, 
      password,
      emailVerified: false,
      isActive: false // 邮箱验证前不激活账户
    });
    
    // 生成验证码
    const verificationCode = user.generateEmailVerificationCode();
    await user.save();

    // 发送验证码邮件
    if (config.email.enabled) {
      try {
        await emailService.sendVerificationCode(email, verificationCode);
        console.log('验证码邮件发送成功');
      } catch (emailError) {
        console.error('发送验证码邮件失败:', emailError);
        // 不删除用户，允许重新发送验证码
        return res.status(200).json({
          message: '注册成功，但验证码发送失败，请点击重新发送',
          data: {
            needVerification: true,
            userId: user._id,
            email: user.email,
            emailSendFailed: true
          }
        });
      }
    }

    res.status(201).json({
      message: '注册信息已提交，请查收邮箱验证码',
      data: {
        needVerification: true,
        userId: user._id,
        email: user.email,
        emailSendFailed: false
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '注册失败，请稍后重试' });
  }
});

// 验证邮箱
router.post('/verify-email', [
  body('userId').notEmpty().withMessage('用户ID不能为空'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('验证码必须是6位数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { userId, code } = req.body;
    
    // 确保验证码是字符串类型
    const codeStr = String(code).trim();
    
    console.log('验证邮箱请求:', { userId, inputCode: codeStr });

    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      console.log('用户不存在:', userId);
      return res.status(404).json({ message: '用户不存在' });
    }
    
    console.log('用户验证码信息:', {
      storedCode: user.emailVerificationCode,
      expiresAt: user.emailVerificationExpires,
      currentTime: new Date(),
      emailVerified: user.emailVerified
    });

    if (user.emailVerified) {
      return res.status(400).json({ message: '邮箱已经验证过了' });
    }

    // 验证验证码
    const isValid = user.verifyEmailCode(codeStr);
    console.log('验证码验证结果:', isValid);
    
    if (!isValid) {
      return res.status(400).json({ message: '验证码错误或已过期' });
    }

    // 激活用户账户
    user.emailVerified = true;
    user.isActive = true;
    user.clearEmailVerificationCode();
    await user.save();
    
    console.log('用户邮箱验证成功:', user.email);

    // 发送欢迎邮件
    if (config.email.enabled) {
      try {
        await emailService.sendWelcomeEmail(user.email, user.username);
      } catch (emailError) {
        console.error('发送欢迎邮件失败:', emailError);
        // 不影响验证流程
      }
    }

    // 生成token
    const token = generateToken(user._id);

    res.json({
      message: '邮箱验证成功，欢迎加入 III.PICS！',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('邮箱验证错误:', error);
    res.status(500).json({ message: '邮箱验证失败，请稍后重试' });
  }
});

// 重新发送验证码
router.post('/resend-verification', [
  body('userId').notEmpty().withMessage('用户ID不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { userId } = req.body;

    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: '邮箱已经验证过了' });
    }

    // 生成新的验证码
    const verificationCode = user.generateEmailVerificationCode();
    await user.save();

    // 发送验证码邮件
    if (config.email.enabled) {
      try {
        await emailService.sendVerificationCode(user.email, verificationCode);
      } catch (emailError) {
        console.error('重新发送验证码邮件失败:', emailError);
        return res.status(500).json({ message: '发送验证码失败，请稍后重试' });
      }
    }

    res.json({
      message: '验证码已重新发送，请查收邮箱'
    });
  } catch (error) {
    console.error('重新发送验证码错误:', error);
    res.status(500).json({ message: '重新发送验证码失败，请稍后重试' });
  }
});

// 登录
router.post('/login', [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 检查邮箱是否已验证
    if (!user.emailVerified) {
      return res.status(401).json({ 
        message: '请先验证邮箱后再登录',
        needVerification: true,
        userId: user._id
      });
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 生成token
    const token = generateToken(user._id);

    // 更新用户登录analytics数据（包含所有必要的分析数据更新）
    updateLoginAnalytics(user._id, req).catch(err => 
      console.error('更新登录分析数据失败:', err)
    );

    res.json({
      message: '登录成功',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '登录失败，请稍后重试' });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      user: {
        ...user.toPublicJSON(),
        email: user.email,
        emailVerified: user.emailVerified,
        followers: user.followers,
        following: user.following,
        followersCount: user.followers.length,
        followingCount: user.following.length
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

// 检查用户名是否可用
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // 验证用户名格式
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({
        available: false,
        message: '用户名长度必须在3-20个字符之间'
      });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        available: false,
        message: '用户名只能包含字母、数字和下划线'
      });
    }
    
    const existingUser = await User.findOne({ username });
    
    res.json({
      available: !existingUser,
      message: existingUser ? '用户名已被使用' : '用户名可用'
    });
  } catch (error) {
    console.error('检查用户名错误:', error);
    res.status(500).json({ 
      available: false,
      message: '检查用户名失败' 
    });
  }
});

// 检查邮箱是否可用
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // 验证邮箱格式
    const emailRegex = /\S+@\S+\.\S+/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        available: false,
        message: '请输入有效的邮箱地址'
      });
    }
    
    const existingUser = await User.findOne({ email });
    
    res.json({
      available: !existingUser,
      message: existingUser ? '邮箱已被注册' : '邮箱可用'
    });
  } catch (error) {
    console.error('检查邮箱错误:', error);
    res.status(500).json({ 
      available: false,
      message: '检查邮箱失败' 
    });
  }
});

// 刷新token
router.post('/refresh', auth, async (req, res) => {
  try {
    const token = generateToken(req.userId);
    res.json({ token });
  } catch (error) {
    console.error('刷新token错误:', error);
    res.status(500).json({ message: '刷新token失败' });
  }
});

// 忘记密码 - 发送重置邮件
router.post('/forgot-password', [
  body('email').isEmail().withMessage('请输入有效的邮箱地址')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // 查找用户
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      // 为了安全，即使用户不存在也返回成功消息
      return res.json({
        message: '如果该邮箱已注册，您将收到重置密码的邮件'
      });
    }

    // 生成重置token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // 发送重置密码邮件
    if (config.email.enabled) {
      try {
        await emailService.sendPasswordResetEmail(email, user.username, resetToken);
      } catch (emailError) {
        console.error('发送重置密码邮件失败:', emailError);
        return res.status(500).json({ message: '发送重置邮件失败，请稍后重试' });
      }
    }

    res.json({
      message: '如果该邮箱已注册，您将收到重置密码的邮件'
    });
  } catch (error) {
    console.error('忘记密码错误:', error);
    res.status(500).json({ message: '处理请求失败，请稍后重试' });
  }
});

// 验证重置token
router.post('/verify-reset-token', [
  body('token').notEmpty().withMessage('重置token不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { token } = req.body;

    // 查找具有有效重置token的用户
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return res.status(400).json({ message: '重置链接无效或已过期' });
    }

    res.json({ message: 'Token有效' });
  } catch (error) {
    console.error('验证重置token错误:', error);
    res.status(500).json({ message: '验证失败，请稍后重试' });
  }
});

// 重置密码
router.post('/reset-password', [
  body('token').notEmpty().withMessage('重置token不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // 查找具有有效重置token的用户
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return res.status(400).json({ message: '重置链接无效或已过期' });
    }

    // 更新密码
    user.password = password;
    user.clearPasswordResetToken();
    await user.save();

    // 发送密码重置成功通知邮件
    if (config.email.enabled) {
      try {
        await emailService.sendPasswordResetSuccessEmail(user.email, user.username);
      } catch (emailError) {
        console.error('发送密码重置成功邮件失败:', emailError);
        // 不影响重置流程
      }
    }

    res.json({ message: '密码重置成功' });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ message: '重置密码失败，请稍后重试' });
  }
});

module.exports = router;