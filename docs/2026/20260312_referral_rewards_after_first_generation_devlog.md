# 2026-03-12 Referral Rewards After First Generation

## Goal

Change the referral system from "reward on registration" to "reward after the invitee completes their first successful image generation".

Updated reward rules:

- inviter: `200` permanent credits
- invitee: `50` permanent credits
- trigger timing: after the invitee completes the first successful `/api/generate/image`

## Why This Change

The previous design paid referral rewards too early:

- invite code only had to survive the sign-up flow
- both sides were rewarded before any real product usage happened
- this made script-based account farming much cheaper

The new design ties rewards to an actual generation event, which raises abuse cost and better matches valid activation.

## Files Changed

- `E:\\pm01\\server\\utils\\referralUtils.js`
- `E:\\pm01\\server\\routes\\generate.js`
- `E:\\pm01\\server\\routes\\auth.js`
- `E:\\pm01\\server\\models\\User.js`
- `E:\\pm01\\server\\services\\emailService.js`
- `E:\\pm01\\client\\src\\pages\\Register.js`
- `E:\\pm01\\client\\src\\pages\\Credits.js`
- `E:\\pm01\\tasks\\todo.md`
- `E:\\pm01\\tasks\\lessons.md`

## Implementation Summary

### 1. Registration no longer pays referral rewards

Removed referral bonus execution from:

- email verification completion in `server/routes/auth.js`
- first-time Google sign-up creation in `server/routes/auth.js`

Registration still does:

- account activation
- sign-up bonus
- welcome email
- invite code association via `invitedBy`

It no longer does:

- inviter `200` reward
- invitee referral reward
- referral reward notification/email

### 2. Added referral reward orchestration utility

Created `server/utils/referralUtils.js` to centralize:

- inviter bonus amount constant
- invitee bonus amount constant
- first-generation marker
- reward grant flow
- inviter notification creation
- inviter reward email sending

This keeps generation and auth behavior separated cleanly:

- auth decides who invited whom
- generation decides when the referral qualifies

### 3. Added anti-duplicate state on user records

Added two fields in `server/models/User.js`:

- `firstGenerationAt`
- `referralRewardGrantedAt`

Purpose:

- record the first successful generation timestamp
- ensure the referral reward is only granted once

### 4. Referral rewards now trigger after successful generation

In `server/routes/generate.js`, after:

- remote model generation succeeds
- image file is saved
- credits are deducted
- generate transaction history is written

the route now:

- marks `firstGenerationAt` if this is the first success
- attempts referral reward distribution once
- returns reward metadata in the response if the referral was unlocked on this request

Returned fields now include:

- `referralRewardUnlocked`
- `inviteeBonusGranted`
- `inviterBonusGranted`
- `referralRewardMessage`

### 5. Reward values updated to the new rule

Final referral values are now:

- invitee: `50`
- inviter: `200`

### 6. Copy updated to match the new product rule

Updated user-facing copy in:

- `client/src/pages/Register.js`
- `client/src/pages/Credits.js`

The UI now explains that:

- the invite code is inherited at sign-up
- referral rewards unlock only after the first successful generation

### 7. Inviter communication updated

The inviter email template in `server/services/emailService.js` now references:

- first generation completion
- not just sign-up completion

The in-app system notification also now reflects the first-generation trigger.

## Safety Notes

The reward utility now validates inviter state before paying bonuses, so a stale or invalid `invitedBy` relationship will not result in a half-applied reward.

## Verification

Completed:

- `node --check E:\\pm01\\server\\routes\\auth.js`
- `node --check E:\\pm01\\server\\routes\\generate.js`
- `node --check E:\\pm01\\server\\utils\\referralUtils.js`
- `node --check E:\\pm01\\server\\models\\User.js`
- `node --check E:\\pm01\\server\\services\\emailService.js`
- `node --check E:\\pm01\\client\\src\\pages\\Register.js`
- `node --check E:\\pm01\\client\\src\\pages\\Credits.js`
- `npm run build` in `E:\\pm01\\client`

Build result:

- succeeded
- existing unrelated ESLint warnings remain in other files and were not introduced by this referral change

Not completed:

- browser MCP verification

Reason:

- the current session still does not expose the browser MCP server required by the project instructions

## Resulting Product Behavior

### Invitee flow

- signs up with invite code
- receives normal sign-up bonus
- completes first successful image generation
- receives `50` permanent credits once

### Inviter flow

- invited user completes first successful image generation
- inviter receives `200` permanent credits once
- inviter gets a credit ledger record
- inviter gets a station notification
- inviter gets a reward email if email notifications are enabled
