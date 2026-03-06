const express = require('express');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { auth } = require('../middleware/auth');

const router = express.Router();

const DAILY_CHECKIN_AMOUNT = 10;  // 每日签到获得积分

// 判断是否是同一天（UTC+8）
function isSameDay(date1, date2) {
  if (!date1) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  // 转换为 UTC+8
  const offset = 8 * 60 * 60 * 1000;
  const day1 = new Date(d1.getTime() + offset);
  const day2 = new Date(d2.getTime() + offset);
  return (
    day1.getUTCFullYear() === day2.getUTCFullYear() &&
    day1.getUTCMonth() === day2.getUTCMonth() &&
    day1.getUTCDate() === day2.getUTCDate()
  );
}

// GET /api/credits/balance — 获取积分余额
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('credits lastCheckinAt').lean();
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const checkedInToday = isSameDay(user.lastCheckinAt, new Date());

    res.json({
      data: {
        credits: user.credits || 0,
        checkedInToday,
        dailyAmount: DAILY_CHECKIN_AMOUNT,
      }
    });
  } catch (error) {
    console.error('获取积分余额失败:', error);
    res.status(500).json({ message: '获取积分余额失败' });
  }
});

// POST /api/credits/checkin — 每日签到
router.post('/checkin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    if (isSameDay(user.lastCheckinAt, new Date())) {
      return res.status(400).json({ message: '今日已签到，明天再来吧！' });
    }

    user.credits = (user.credits || 0) + DAILY_CHECKIN_AMOUNT;
    user.lastCheckinAt = new Date();
    await user.save();

    // 记录交易
    await CreditTransaction.create({
      userId: user._id,
      type: 'earn',
      amount: DAILY_CHECKIN_AMOUNT,
      reason: 'daily_checkin',
      note: '每日签到奖励',
      balanceAfter: user.credits,
    });

    res.json({
      message: `签到成功！获得 ${DAILY_CHECKIN_AMOUNT} 积分`,
      data: {
        earned: DAILY_CHECKIN_AMOUNT,
        credits: user.credits,
      }
    });
  } catch (error) {
    console.error('每日签到失败:', error);
    res.status(500).json({ message: '签到失败，请稍后重试' });
  }
});

// GET /api/credits/history — 积分流水
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await CreditTransaction.countDocuments({ userId: req.userId });
    const transactions = await CreditTransaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('获取积分流水失败:', error);
    res.status(500).json({ message: '获取积分流水失败' });
  }
});

module.exports = router;
