# 2026-03-12 Google Welcome Email And Referral Notifications Dev Log

## Goal

Complete the missing post-sign-up communication flow so that:

- a brand-new Google user receives the same welcome email as an email-verified user
- an inviter receives both an email and an in-app notification when a referral reward is granted
- email-registration and Google-registration referral rewards follow the same notification path

## Problem Summary

Before this change, the project already granted credits to new Google users and referral participants, but the communication layer was incomplete:

- `POST /api/auth/google` created new users and added bonus credits, but did not call `sendWelcomeEmail`
- inviter rewards were credited silently, with no reward email and no station notification
- email verification sign-up and Google sign-up used separate reward logic, which made side effects easy to miss

This led to the exact production symptom you reported: logs showed a new Google user registration, but the mailbox never received a welcome message.

## Files Changed

- `E:\\pm01\\server\\routes\\auth.js`
- `E:\\pm01\\server\\services\\emailService.js`
- `E:\\pm01\\tasks\\todo.md`
- `E:\\pm01\\tasks\\lessons.md`

## Implementation Details

### 1. Shared auth-side helpers

Added small shared helpers near the top of `server/routes/auth.js`:

- `createPaidEarnTransaction`
  - centralizes paid-credit earn ledger writes
  - keeps `walletType`, `freeBalanceAfter`, `paidBalanceAfter`, and `totalBalanceAfter` consistent
- `sendWelcomeEmailSafe`
  - wraps welcome email sending in a safe non-blocking helper
  - avoids duplicating `config.email.enabled` checks and `try/catch` blocks
- `notifyInviterReward`
  - creates a `system` notification for the inviter
  - sends the inviter reward email if email notifications are enabled
- `applyReferralRewards`
  - centralizes inviter reward crediting, invitee reward crediting, ledger creation, and inviter notifications

### 2. Google first sign-up now sends welcome email

In `POST /api/auth/google`, the first-time-user branch now:

- creates the Google user
- writes the register bonus transaction
- applies referral rewards if an invite code is present
- calls `sendWelcomeEmailSafe(user)`

This means a true Google first registration now gets the same welcome-email behavior as the email-verification path.

Existing accounts that simply bind Google to an older email account still do not receive a repeated welcome email.

### 3. Inviter reward now has two outward signals

When referral rewards are granted, the inviter now gets:

- a `system` notification stored in the existing notifications collection
- a referral reward email styled with the same template system already used by verification, welcome, reset, and magic-link emails

The notification payload includes:

- reward amount
- invited user id
- invited username
- a human-readable message for the notifications UI

### 4. Referral side effects unified across sign-up methods

Both of these paths now use the same reward helper:

- email registration after verification
- first-time Google registration

This reduces future drift. If referral reward behavior changes later, it can be adjusted in one place instead of patching each auth path separately.

## Email Template Notes

The new inviter reward email intentionally reuses the existing email system design language:

- same `wrap(...)` layout shell
- same `badge`, `heading`, `subtext`, `ctaButton`, and `divider` blocks
- same III.PICS branding and footer style

The CTA points to the credits page so the inviter can immediately verify the credited reward.

## Verification

Completed:

- `node --check E:\\pm01\\server\\routes\\auth.js`
- `node --check E:\\pm01\\server\\services\\emailService.js`
- local diff review confirmed:
  - Google first sign-up now calls welcome email logic
  - inviter reward path now sends email and creates a `system` notification
  - email sign-up and Google sign-up share the same referral helper

Not completed:

- browser MCP verification

Reason:

- the current session does not expose the browser MCP server required by the project AGENTS instructions, so I could not run the mandatory browser-based verification flow from this environment

## Behavior After Update

### Google first registration

- new user receives register bonus
- new user receives daily free credits reset allowance
- new user receives welcome email
- if referred, new user also receives invite reward credits

### Inviter on successful referral

- inviter receives `200` permanent credits
- inviter gets a credit ledger record
- inviter gets a station notification
- inviter gets a referral reward email if email notifications are enabled

## Known Limitations

- this change does not add a real-time websocket/push channel; the station notification appears through the existing notifications polling/load flow
- this change respects the inviter's `emailNotifications` flag, but does not add a dedicated per-notification-type toggle for referral rewards yet
- I did not send a live SMTP test email from the route in this task, so final end-to-end delivery still depends on your running environment and SMTP provider status
