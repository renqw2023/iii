const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

/**
 * 双积分扣除：先扣 freeCredits，再扣 credits
 * 调用方需先 refreshFreeCreditsIfNeeded(user)
 * @returns {{ ok, freeDeducted, paidDeducted }}
 */
async function deductCredits(user, cost) {
  const freeAvail = user.freeCredits ?? 0;
  const paidAvail = user.credits ?? 0;
  if (freeAvail + paidAvail < cost) return { ok: false, freeDeducted: 0, paidDeducted: 0 };
  const freeDeducted = Math.min(freeAvail, cost);
  const paidDeducted = cost - freeDeducted;
  user.freeCredits = freeAvail - freeDeducted;
  user.credits = paidAvail - paidDeducted;
  await user.save();
  return { ok: true, freeDeducted, paidDeducted };
}

/**
 * 记录双积分流水（免费 + 付费各一条）
 */
async function recordDeductTransactions(userId, reason, note, freeDeducted, paidDeducted, freeBalance, paidBalance) {
  if (freeDeducted > 0) {
    await CreditTransaction.create({
      userId, type: 'spend', amount: freeDeducted,
      reason, note: `[免费] ${note}`, balanceAfter: freeBalance,
    });
  }
  if (paidDeducted > 0) {
    await CreditTransaction.create({
      userId, type: 'spend', amount: paidDeducted,
      reason, note: `[付费] ${note}`, balanceAfter: paidBalance,
    });
  }
}

module.exports = { deductCredits, recordDeductTransactions };
