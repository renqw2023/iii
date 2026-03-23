const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const GiftCode = require('../models/GiftCode');
const { auth } = require('../middleware/auth');
const adminCache = require('../services/adminCache');
const { deductCredits, recordDeductTransactions } = require('../utils/creditsUtils');

const router = express.Router();

const DAILY_CHECKIN_AMOUNT = 10;
const DAILY_FREE_AMOUNT = 40;

function isSameDay(date1, date2) {
  if (!date1) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const offset = 8 * 60 * 60 * 1000;
  const day1 = new Date(d1.getTime() + offset);
  const day2 = new Date(d2.getTime() + offset);

  return (
    day1.getUTCFullYear() === day2.getUTCFullYear() &&
    day1.getUTCMonth() === day2.getUTCMonth() &&
    day1.getUTCDate() === day2.getUTCDate()
  );
}

async function refreshFreeCreditsIfNeeded(user) {
  const now = new Date();
  // Compute UTC+8 start-of-today as UTC timestamp for comparison
  const offset = 8 * 60 * 60 * 1000;
  const nowUTC8 = new Date(now.getTime() + offset);
  const todayStartUTC8 = new Date(
    Date.UTC(nowUTC8.getUTCFullYear(), nowUTC8.getUTCMonth(), nowUTC8.getUTCDate()) - offset
  );

  // Atomic update: only refresh if not already refreshed today (prevents concurrent double-refresh)
  const updated = await User.findOneAndUpdate(
    {
      _id: user._id,
      $or: [
        { lastFreeCreditsRefreshAt: null },
        { lastFreeCreditsRefreshAt: { $lt: todayStartUTC8 } },
      ],
    },
    { $set: { freeCredits: DAILY_FREE_AMOUNT, lastFreeCreditsRefreshAt: now } },
    { new: true }
  );

  if (updated) {
    user.freeCredits = updated.freeCredits;
    user.lastFreeCreditsRefreshAt = updated.lastFreeCreditsRefreshAt;
  }
}

router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'credits freeCredits lastFreeCreditsRefreshAt lastCheckinAt inviteUsedCount'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await refreshFreeCreditsIfNeeded(user);

    const credits = user.credits || 0;
    const freeCredits = user.freeCredits ?? DAILY_FREE_AMOUNT;

    res.json({
      data: {
        credits,
        freeCredits,
        totalCredits: credits + freeCredits,
        dailyFreeAmount: DAILY_FREE_AMOUNT,
        checkedInToday: isSameDay(user.lastCheckinAt, new Date()),
        dailyAmount: DAILY_CHECKIN_AMOUNT,
        inviteUsedCount: user.inviteUsedCount || 0,
      }
    });
  } catch (error) {
    console.error('Failed to get credits balance:', error);
    res.status(500).json({ message: 'Failed to get credits balance' });
  }
});

router.post('/checkin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isSameDay(user.lastCheckinAt, new Date())) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    user.credits = (user.credits || 0) + DAILY_CHECKIN_AMOUNT;
    user.lastCheckinAt = new Date();
    await user.save();

    await CreditTransaction.create({
      userId: user._id,
      type: 'earn',
      amount: DAILY_CHECKIN_AMOUNT,
      reason: 'daily_checkin',
      note: 'Daily check-in reward',
      walletType: 'paid',
      balanceAfter: user.credits,
      freeBalanceAfter: user.freeCredits ?? DAILY_FREE_AMOUNT,
      paidBalanceAfter: user.credits,
      totalBalanceAfter: (user.freeCredits ?? DAILY_FREE_AMOUNT) + user.credits,
    });

    res.json({
      message: `Check-in successful! +${DAILY_CHECKIN_AMOUNT} credits`,
      data: {
        earned: DAILY_CHECKIN_AMOUNT,
        credits: user.credits,
      }
    });
  } catch (error) {
    console.error('Daily check-in failed:', error);
    res.status(500).json({ message: 'Daily check-in failed' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await CreditTransaction.countDocuments({ userId: req.userId });
    const transactions = await CreditTransaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('Failed to get credits history:', error);
    res.status(500).json({ message: 'Failed to get credits history' });
  }
});

router.post('/admin/grant', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('role');
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { userId, amount, note } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    const target = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: amount } },
      { new: true }
    );

    if (!target) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const transaction = await CreditTransaction.create({
      userId,
      type: 'earn',
      amount,
      reason: 'admin_grant',
      note: note || 'Admin grant',
      walletType: 'paid',
      balanceAfter: target.credits,
      freeBalanceAfter: target.freeCredits ?? null,
      paidBalanceAfter: target.credits,
      totalBalanceAfter: (target.freeCredits ?? 0) + target.credits,
    });

    adminCache.clearCache('stats');
    res.json({ credits: target.credits, freeCredits: target.freeCredits, transaction });
  } catch (error) {
    console.error('admin/grant error:', error);
    res.status(500).json({ message: 'Operation failed' });
  }
});

router.post('/admin/deduct', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('role');
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { userId, amount, note } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const { ok, freeDeducted, paidDeducted } = await deductCredits(target, amount);
    if (!ok) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    await recordDeductTransactions(
      target._id,
      'admin_deduct',
      note || 'Admin deduction',
      freeDeducted,
      paidDeducted,
      target.freeCredits,
      target.credits
    );

    adminCache.clearCache('stats');
    res.json({ credits: target.credits, freeCredits: target.freeCredits });
  } catch (error) {
    console.error('admin/deduct error:', error);
    res.status(500).json({ message: 'Operation failed' });
  }
});

// ── Gift code helpers ──────────────────────────────────────────────────────
function generateGiftCode() {
  const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `GIFT-${seg()}-${seg()}`;
}

// POST /api/credits/redeem  (auth)
router.post('/redeem', auth, async (req, res) => {
  try {
    const code = (req.body.code || '').toUpperCase().trim();
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const gift = await GiftCode.findOne({ code });
    if (!gift) return res.status(404).json({ message: 'Invalid gift code' });
    if (!gift.isActive) return res.status(400).json({ message: 'This code has been deactivated' });
    if (gift.expiresAt && gift.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This code has expired' });
    }
    if (gift.usedCount >= gift.maxUses) {
      return res.status(400).json({ message: 'This code has reached its maximum uses' });
    }
    const alreadyUsed = gift.usedBy.some(u => String(u.userId) === String(req.userId));
    if (alreadyUsed) return res.status(400).json({ message: 'You have already used this code' });

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { credits: gift.credits } },
      { new: true }
    );

    gift.usedCount += 1;
    gift.usedBy.push({ userId: req.userId, usedAt: new Date() });
    await gift.save();

    await CreditTransaction.create({
      userId: req.userId,
      type: 'earn',
      amount: gift.credits,
      reason: 'admin_grant',
      note: `Gift code: ${gift.code}`,
      walletType: 'paid',
      balanceAfter: updatedUser.credits,
      freeBalanceAfter: updatedUser.freeCredits ?? null,
      paidBalanceAfter: updatedUser.credits,
      totalBalanceAfter: (updatedUser.freeCredits ?? 0) + updatedUser.credits,
    });

    res.json({ credits: gift.credits, message: `${gift.credits} credits added!` });
  } catch (err) {
    console.error('redeem error:', err);
    res.status(500).json({ message: 'Redemption failed' });
  }
});

// POST /api/credits/admin/generate-codes  (admin)
router.post('/admin/generate-codes', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('role');
    if (!admin || admin.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { credits, count = 1, maxUses = 1, expiresAt, note } = req.body;
    if (!credits || credits < 1) return res.status(400).json({ message: 'credits must be >= 1' });
    if (count < 1 || count > 100) return res.status(400).json({ message: 'count must be 1–100' });

    const docs = [];
    for (let i = 0; i < count; i++) {
      docs.push({
        code: generateGiftCode(),
        credits,
        maxUses,
        createdBy: req.userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        note: note || '',
      });
    }

    const inserted = await GiftCode.insertMany(docs, { ordered: false });
    res.json({ codes: inserted.map(g => g.code) });
  } catch (err) {
    console.error('generate-codes error:', err);
    res.status(500).json({ message: 'Generation failed' });
  }
});

// GET /api/credits/admin/gift-codes  (admin, pagination)
router.get('/admin/gift-codes', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('role');
    if (!admin || admin.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const total = await GiftCode.countDocuments();
    const codes = await GiftCode.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('code credits usedCount maxUses isActive expiresAt note createdAt');

    res.json({ codes, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('gift-codes list error:', err);
    res.status(500).json({ message: 'Failed to fetch codes' });
  }
});

// PATCH /api/credits/admin/gift-codes/:code/deactivate  (admin)
router.patch('/admin/gift-codes/:code/deactivate', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('role');
    if (!admin || admin.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const gift = await GiftCode.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!gift) return res.status(404).json({ message: 'Code not found' });
    res.json({ code: gift.code, isActive: gift.isActive });
  } catch (err) {
    console.error('deactivate error:', err);
    res.status(500).json({ message: 'Operation failed' });
  }
});

module.exports = router;
module.exports.refreshFreeCreditsIfNeeded = refreshFreeCreditsIfNeeded;
module.exports.DAILY_FREE_AMOUNT = DAILY_FREE_AMOUNT;
