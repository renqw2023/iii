const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '访问被拒绝，请提供有效的token' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: '用户不存在或已被禁用' });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'token已过期' });
    }
    
    console.error('认证中间件错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 管理员权限检查
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' });
    }
    
    next();
  } catch (error) {
    console.error('管理员认证错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 可选认证中间件（用于获取用户信息但不强制登录）
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.userId = user._id;
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next();
  }
};

module.exports = { auth, adminAuth, optionalAuth };