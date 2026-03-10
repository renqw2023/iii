const express = require('express');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { auth } = require('../middleware/auth');
const { deductCredits } = require('../utils/creditsUtils');

const router = express.Router();

const DAILY_CHECKIN_AMOUNT = 10;   // 每日签到获得永久积分
const DAILY_FREE_AMOUNT = 40;      // 每日免费额度

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

/**
 * 检查并刷新 freeCredits（接口内惰性刷新，无需 cron）
 * 若今天未刷新，则将 freeCredits 重置为 DAILY_FREE_AMOUNT 并更新时间戳
 * @param {Document} user - Mongoose User document（会被 save）
 */
async function refreshFreeCreditsIfNeeded(user) {
  const now = new Date();
  if (!isSameDay(user.lastFreeCreditsRefreshAt, now)) {
    user.freeCredits = DAILY_FREE_AMOUNT;
    user.lastFreeCreditsRefreshAt = now;
    await user.save();
  }
}

// GET /api/credits/balance — 获取积分余额（含 freeCredits 自动刷新）
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'credits freeCredits lastFreeCreditsRefreshAt lastCheckinAt inviteUsedCount'
    );
    if (!user) return res.status(404).json({ message: '用户不存在' });

    // 惰性刷新免费额度
    await refreshFreeCreditsIfNeeded(user);

    const checkedInToday = isSameDay(user.lastCheckinAt, new Date());

    res.json({
      data: {
        credits: user.credits || 0,
        freeCredits: user.freeCredits ?? DAILY_FREE_AMOUNT,
        dailyFreeAmount: DAILY_FREE_AMOUNT,
        checkedInToday,
        dailyAmount: DAILY_CHECKIN_AMOUNT,
        inviteUsedCount: user.inviteUsedCount || 0,
      }
    });
  } catch (error) {
    console.error('获取积分余额失败:', error);
    res.status(500).json({ message: '获取积分余额失败' });
  }
});

// POST /api/credits/checkin — 每日签到（+10 永久积分）
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

// POST /api/credits/admin/grant — 管理员赠积分
router.post('/admin/grant', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('role');
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: '无权限' });
    }

    const { userId, amount, note } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: '参数错误' });
    }

    const target = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: amount } },
      { new: true }
    );
    if (!target) return res.status(404).json({ message: '目标用户不存在' });

    const transaction = await CreditTransaction.create({
      userId,
      type: 'earn',
      amount,
      reason: 'admin_grant',
      note: note || '管理员赠送',
      balanceAfter: target.credits,
    });

    res.json({ credits: target.credits, transaction });
  } catch (error) {
    console.error('admin/grant 错误:', error);
    res.status(500).json({ message: '操作失败' });
  }
});

// POST /api/credits/admin/deduct — 管理员扣积分
router.post('/admin/deduct', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('role');
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: '无权限' });
    }

    const { userId, amount, note } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: '参数错误' });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: '目标用户不存在' });

    const { ok, freeDeducted, paidDeducted } = await deductCredits(target, amount);
    if (!ok) {
      return res.status(400).json({ message: '目标用户积分不足' });
    }

    const transaction = await CreditTransaction.create({
      userId,
      type: 'spend',
      amount,
      reason: 'admin_deduct',
      note: note || '管理员扣除',
      balanceAfter: target.credits,
    });

    res.json({ credits: target.credits, freeCredits: target.freeCredits, transaction });
  } catch (error) {
    console.error('admin/deduct 错误:', error);
    res.status(500).json({ message: '操作失败' });
  }
});

module.exports = router;
module.exports.refreshFreeCreditsIfNeeded = refreshFreeCreditsIfNeeded;
module.exports.DAILY_FREE_AMOUNT = DAILY_FREE_AMOUNT;
