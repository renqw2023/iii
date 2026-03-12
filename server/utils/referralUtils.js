const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const config = require('../config');

const INVITER_BONUS = 200;
const INVITEE_BONUS = 50;

async function createPaidEarnTransaction(user, amount, reason, note) {
  await CreditTransaction.create({
    userId: user._id,
    type: 'earn',
    amount,
    reason,
    note,
    walletType: 'paid',
    balanceAfter: user.credits,
    freeBalanceAfter: user.freeCredits ?? null,
    paidBalanceAfter: user.credits,
    totalBalanceAfter: (user.freeCredits ?? 0) + user.credits,
  });
}

async function notifyInviterReward(inviter, invitee) {
  if (!inviter || !invitee) {
    return;
  }

  Notification.createNotification({
    recipient: inviter._id,
    sender: invitee._id,
    type: 'system',
    additionalData: {
      message: `${invitee.username} completed their first generation with your invite code. ${INVITER_BONUS} permanent credits have been added to your wallet.`,
      kind: 'invite_bonus',
      credits: INVITER_BONUS,
      invitedUserId: invitee._id,
      invitedUsername: invitee.username,
    },
  }).catch(err => console.error('创建邀请奖励通知失败:', err));

  if (!config.email.enabled || inviter.settings?.emailNotifications === false || !inviter.email) {
    return;
  }

  try {
    await emailService.sendInviteRewardEmail(inviter.email, inviter.username, invitee.username, INVITER_BONUS);
  } catch (error) {
    console.error('发送邀请奖励邮件失败:', error);
  }
}

async function markFirstGeneration(userId, timestamp = new Date()) {
  return User.findOneAndUpdate(
    { _id: userId, firstGenerationAt: null },
    { $set: { firstGenerationAt: timestamp } },
    { new: true }
  );
}

async function grantReferralRewardsAfterFirstGeneration(userId, timestamp = new Date()) {
  const inviteeSnapshot = await User.findById(userId).select(
    '_id username email invitedBy credits freeCredits referralRewardGrantedAt'
  );
  if (!inviteeSnapshot?.invitedBy || inviteeSnapshot.referralRewardGrantedAt) {
    return null;
  }

  const inviter = await User.findById(inviteeSnapshot.invitedBy);
  if (!inviter || !inviter.isActive || String(inviter._id) === String(inviteeSnapshot._id)) {
    return null;
  }

  const invitee = await User.findOneAndUpdate(
    {
      _id: userId,
      invitedBy: inviter._id,
      referralRewardGrantedAt: null,
    },
    {
      $set: { referralRewardGrantedAt: timestamp },
      $inc: { credits: INVITEE_BONUS },
    },
    { new: true }
  );

  if (!invitee) {
    return null;
  }

  const updatedInviter = await User.findByIdAndUpdate(
    inviter._id,
    {
      $inc: {
        credits: INVITER_BONUS,
        inviteUsedCount: 1,
      },
    },
    { new: true }
  );

  await createPaidEarnTransaction(
    invitee,
    INVITEE_BONUS,
    'invite_reward',
    'Referral reward unlocked after first generation'
  );

  await createPaidEarnTransaction(
    updatedInviter,
    INVITER_BONUS,
    'invite_bonus',
    `Referral reward: ${invitee.username} completed first generation`
  );

  await notifyInviterReward(updatedInviter, invitee);

  return {
    inviteeBonus: INVITEE_BONUS,
    inviterBonus: INVITER_BONUS,
    invitee,
    inviter: updatedInviter,
  };
}

module.exports = {
  INVITER_BONUS,
  INVITEE_BONUS,
  grantReferralRewardsAfterFirstGeneration,
  markFirstGeneration,
};
