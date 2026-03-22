const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

/**
 * Dual-wallet deduction: spend daily free credits first, then permanent credits.
 * Uses atomic findOneAndUpdate to prevent race conditions / double-spend.
 */
async function deductCredits(user, cost) {
  const userId = user._id || user;

  // Fetch fresh balance to compute the wallet split
  const freshUser = await User.findById(userId).select('credits freeCredits');
  if (!freshUser) return { ok: false, freeDeducted: 0, paidDeducted: 0 };

  const freeAvail = freshUser.freeCredits ?? 0;
  const paidAvail = freshUser.credits ?? 0;

  if (freeAvail + paidAvail < cost) {
    return { ok: false, freeDeducted: 0, paidDeducted: 0 };
  }

  const freeDeducted = Math.min(freeAvail, cost);
  const paidDeducted = cost - freeDeducted;

  // Atomic update: only proceed if total balance is still sufficient
  const result = await User.findOneAndUpdate(
    { _id: userId, $expr: { $gte: [{ $add: ['$credits', '$freeCredits'] }, cost] } },
    { $inc: { freeCredits: -freeDeducted, credits: -paidDeducted } },
    { new: true }
  );

  if (!result) return { ok: false, freeDeducted: 0, paidDeducted: 0 };

  // Keep in-memory user object in sync
  if (user._id) {
    user.freeCredits = result.freeCredits;
    user.credits = result.credits;
  }

  return { ok: true, freeDeducted, paidDeducted };
}

/**
 * Record wallet-aware spend transactions so the UI can explain which balance moved.
 */
async function recordDeductTransactions(userId, reason, note, freeDeducted, paidDeducted, freeBalance, paidBalance) {
  const totalBalance = (freeBalance ?? 0) + (paidBalance ?? 0);

  if (freeDeducted > 0) {
    await CreditTransaction.create({
      userId,
      type: 'spend',
      amount: freeDeducted,
      reason,
      note: `[Free] ${note}`,
      walletType: 'free',
      balanceAfter: freeBalance,
      freeBalanceAfter: freeBalance,
      paidBalanceAfter: paidBalance,
      totalBalanceAfter: totalBalance,
    });
  }

  if (paidDeducted > 0) {
    await CreditTransaction.create({
      userId,
      type: 'spend',
      amount: paidDeducted,
      reason,
      note: `[Paid] ${note}`,
      walletType: 'paid',
      balanceAfter: paidBalance,
      freeBalanceAfter: freeBalance,
      paidBalanceAfter: paidBalance,
      totalBalanceAfter: totalBalance,
    });
  }
}

module.exports = { deductCredits, recordDeductTransactions };
