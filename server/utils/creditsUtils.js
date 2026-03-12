const CreditTransaction = require('../models/CreditTransaction');

/**
 * Dual-wallet deduction: spend daily free credits first, then permanent credits.
 * Callers should refresh the daily free wallet before using this helper.
 */
async function deductCredits(user, cost) {
  const freeAvail = user.freeCredits ?? 0;
  const paidAvail = user.credits ?? 0;

  if (freeAvail + paidAvail < cost) {
    return { ok: false, freeDeducted: 0, paidDeducted: 0 };
  }

  const freeDeducted = Math.min(freeAvail, cost);
  const paidDeducted = cost - freeDeducted;

  user.freeCredits = freeAvail - freeDeducted;
  user.credits = paidAvail - paidDeducted;
  await user.save();

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
