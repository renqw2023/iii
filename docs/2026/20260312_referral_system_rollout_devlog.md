# 2026-03-12 Referral System Rollout Dev Log

## Background

This round focused on aligning the III.PICS referral system with a safer activation-based model inspired by the reference product flow, while also fixing follow-up inconsistencies discovered during live testing.

The main business goal was:

- stop paying referral rewards at registration time
- only unlock referral rewards after the invitee completes a real first generation
- reduce script-based account farming
- keep inviter rewards attractive without overpaying invitees

## Final Referral Rules

After this rollout, the intended rule set is:

- normal sign-up bonus: `40` permanent credits
- invitee referral reward: `50` permanent credits
- inviter referral reward: `200` permanent credits
- referral trigger: only after the invitee completes the first successful image generation

What no longer happens:

- no inviter reward immediately on sign-up
- no invitee referral reward immediately on sign-up

## Main Development Changes

### 1. Registration and Google first sign-up now only record referral ownership

Files:

- `E:\\pm01\\server\\routes\\auth.js`

Behavior:

- sign-up still binds `invitedBy`
- sign-up still grants the normal `40` permanent sign-up credits
- sign-up still sends the welcome email
- sign-up no longer grants referral rewards directly

This applies to both:

- email registration after verification
- first-time Google sign-up

### 2. Referral rewards moved to first successful image generation

Files:

- `E:\\pm01\\server\\routes\\generate.js`
- `E:\\pm01\\server\\utils\\referralUtils.js`
- `E:\\pm01\\server\\models\\User.js`

New server-side flow:

- when `/api/generate/image` succeeds
- and credits are successfully deducted
- the user is marked with `firstGenerationAt`
- the server checks whether referral rewards were already granted
- if not, the invitee gets `50`
- the inviter gets `200`
- ledger entries are written for both sides

New persistence fields:

- `firstGenerationAt`
- `referralRewardGrantedAt`

These fields prevent duplicate reward grants during repeated use.

### 3. Inviter communication flow was preserved and updated

Files:

- `E:\\pm01\\server\\services\\emailService.js`
- `E:\\pm01\\server\\utils\\referralUtils.js`

Behavior:

- inviter still receives a station notification when the referral qualifies
- inviter still receives a reward email when email notifications are enabled
- reward email wording was updated from sign-up completion to first-generation completion

### 4. Referral copy was updated across primary user surfaces

Files:

- `E:\\pm01\\client\\src\\pages\\Register.js`
- `E:\\pm01\\client\\src\\pages\\Credits.js`

Updated copy now explains:

- invite code can still be inherited at sign-up
- rewards unlock only after the invitee completes the first successful generation
- invitee reward is `50`
- inviter reward is `200`

## Follow-up Fixes During Real Testing

Live manual testing exposed a few mismatches between backend rules and frontend wording.

### 1. Invite modal still showed the old rule

File:

- `E:\\pm01\\client\\src\\components\\UI\\InviteModal.js`

Old copy incorrectly said:

- friend gets `+200`
- bonus is added instantly on registration

Updated copy now says:

- inviter gets `+200`
- friend gets `+50`
- reward unlocks after the first successful generation
- the flow requires actual product usage

### 2. Sidebar invite entry needed separate wording

File:

- `E:\\pm01\\client\\src\\components\\Layout\\Sidebar.js`

The sidebar entry was intentionally restored to the short marketing phrasing requested in the final follow-up:

- title: `Share MeiGen`
- subtitle: `Invite friends, get 200 credits`

This keeps the compact entry simple while the modal itself holds the detailed rule explanation.

## Testing Support Work

During repeated manual tests, the local development account `renqw5271@gmail.com` was deleted multiple times from the development database so the referral flow could be replayed from a clean state.

Observed during cleanup:

- user records were successfully removed
- credit transactions were removed
- related notifications were removed when present

This was operational test support only and not part of the product code changes.

## Verification

### Server syntax checks completed

- `node --check E:\\pm01\\server\\routes\\auth.js`
- `node --check E:\\pm01\\server\\routes\\generate.js`
- `node --check E:\\pm01\\server\\utils\\referralUtils.js`
- `node --check E:\\pm01\\server\\models\\User.js`
- `node --check E:\\pm01\\server\\services\\emailService.js`

### Client syntax checks completed

- `node --check E:\\pm01\\client\\src\\pages\\Register.js`
- `node --check E:\\pm01\\client\\src\\pages\\Credits.js`
- `node --check E:\\pm01\\client\\src\\components\\UI\\InviteModal.js`
- `node --check E:\\pm01\\client\\src\\components\\Layout\\Sidebar.js`

### Frontend build verification completed

- `npm run build` in `E:\\pm01\\client`

Result:

- build succeeded
- there are existing unrelated ESLint warnings in other files
- those warnings were not introduced by this referral rollout

### Browser verification

Not completed from this environment.

Reason:

- the current session still does not expose the browser MCP server required by the project instructions

## Current Known State

Backend referral logic and most referral-facing UI copy are now aligned with the new rule.

The intended user journey is:

1. User opens an invite link
2. User signs up
3. User gets the normal `40` sign-up credits
4. User completes the first successful image generation
5. User receives `50` invitee credits
6. Inviter receives `200` credits, a notification, and a reward email

## Commits In This Rollout

- `b7aa04e` `Send welcome and referral reward emails`
- `d18bbbe` `Move referral rewards to first generation`

This document is the detailed record for the rollout plus the later copy-alignment fixes.
