# 2026-03-12 Sign-up Bonus Reduced From 80 to 40

## Background

The project previously granted `80` permanent credits to a newly created user account.

That behavior existed in two places:

- email registration after verification
- Google first-time sign-up

After reviewing the current monetization goals, the desired rule became:

- reduce the permanent sign-up bonus from `80` to `40`
- keep the invite bonus unchanged at `200`
- keep the daily free credits unchanged at `40`

This change is a business-rule adjustment, not a wallet-model redesign.

## Final Rule After This Update

### New user without referral

- permanent credits: `40`
- daily free credits: `40`

### New user with referral

- permanent sign-up bonus: `40`
- invite reward for the new user: `200`
- total permanent credits immediately after sign-up: `240`
- daily free credits: `40`

### Referrer

- permanent referral bonus: `200`

## Why This Change Was Made

The old `80` permanent credits gave new users a larger starting paid balance than desired.

Reducing the sign-up bonus to `40` is intended to:

- tighten the free-to-paid boundary
- reduce the amount of permanent value granted before purchase
- preserve the referral mechanism without making base registration too generous

This keeps the product in a more monetization-friendly position while still giving users enough initial paid balance to experience the product.

## Code Changes

### 1. Email registration bonus

Updated in:

- `server/routes/auth.js`

Changed:

- `REGISTER_BONUS` from `80` to `40`

Impact:

- users who complete email registration now receive `40` permanent credits instead of `80`
- the associated `register_bonus` transaction amount is also reduced accordingly

### 2. Google first-time sign-up bonus

Updated in:

- `server/routes/auth.js`

Changed:

- new Google-created users now start with `credits: 40` instead of `credits: 80`
- the Google `register_bonus` transaction entry amount now records `40` instead of `80`

Impact:

- Google first-time sign-up now matches email registration for base permanent bonus
- bonus consistency is preserved across sign-up methods

### 3. Documentation alignment

Updated in:

- `docs/credits-system-analysis-20260312.md`

Changed:

- references to `80` permanent sign-up credits were updated to `40`
- related explanatory text was updated so the examples match the current rule

## What Was Not Changed

This update did **not** change:

- daily free credits amount (`40`)
- invite reward amount for the new user (`200`)
- invite reward amount for the inviter (`200`)
- spending order:
  - free daily credits first
  - permanent credits second

It also did not change package pricing or model-specific credit costs.

## Verification

### Syntax validation

Ran:

```bash
node --check server/routes/auth.js
```

Result:

- passed

### Documentation consistency

Reviewed:

- `docs/credits-system-analysis-20260312.md`

Result:

- sign-up bonus references now reflect `40`

## Risk Notes

This change is small, but it affects real account economics, so there are two important considerations:

1. Any historical screenshots, product announcements, or support macros that still mention `80` may now be outdated.
2. Existing users created before this change will still retain their old balances; this update only changes future registrations unless a migration is added.

## Summary

The project now grants:

- `40` permanent credits for a new account
- `40` daily free credits
- `200` referral reward where applicable

This brings the default permanent sign-up bonus down to a more conservative level without changing the overall dual-wallet system.
