# 2026-03-12 Credits System Alignment Dev Log

## Goal

Align the current `pm01` credits system with the intended MeiGen-style product rule:

- users receive a fixed daily free credits allowance
- free credits reset to a fixed amount each day
- free credits do not accumulate across days
- permanent credits remain separate from the daily free allowance
- the UI and ledger should explain this clearly enough that users do not mistake the system for daily accrual

This round did not attempt to redesign model pricing or unify every historical auth path. The focus was on clarifying the wallet model, removing user-facing ambiguity, and improving balance visibility.

## Product Decision Locked In

The effective rule after this update is:

- `freeCredits` is a daily wallet
- `freeCredits` resets to `40` each day
- unused free credits do not roll over
- `credits` is the permanent wallet
- spending order is:
  - `freeCredits` first
  - `credits` second

This means the project does **not** use a cumulative "add 40 every day" model.

## Files Changed

### Frontend

- `client/src/components/UI/CreditsModal.js`
- `client/src/components/UI/CreditsDisplay.js`
- `client/src/components/Dashboard/StatsPanel.js`
- `client/src/components/Dashboard/DashboardHeader.js`
- `client/src/pages/Credits.js`
- `client/src/pages/Register.js`

### Backend

- `server/models/CreditTransaction.js`
- `server/routes/credits.js`
- `server/routes/payments.js`
- `server/utils/creditsUtils.js`

### Project docs

- `docs/credits-system-analysis-20260312.md`
- `docs/2026/20260312_credits_system_alignment_devlog.md`
- `tasks/todo.md`

## Detailed Changes

### 1. Clarified the daily free credits rule in the UI

Updated credits-related copy so the product no longer reads like credits are added cumulatively every day.

Key copy changes:

- changed vague wording like `refresh credits every day`
- replaced it with wording that explains:
  - free credits reset to `40`
  - free credits are not cumulative
  - free credits are used first

This was applied to:

- credits purchase modal
- header credits hover
- credits page summary
- dashboard credits card

### 2. Unified the balance display model

Before this update:

- some screens displayed only permanent credits
- other screens displayed total available credits

That caused a direct user trust problem because the same account could appear to have different balances depending on the page.

After this update:

- main balance surfaces now prefer `totalCredits`
- UI still separates:
  - free daily credits
  - permanent credits

This reduces the "why is my balance different here?" problem.

### 3. Standardized referral link behavior

The project previously had mixed referral URL formats:

- `?ref=CODE`
- `?invite=CODE`

This round standardized outbound sharing on:

- `?ref=CODE`

And kept registration backward-compatible by allowing the register page to read:

- `ref`
- `invite`

That reduces broken invite flows without breaking old links already shared.

### 4. Improved transaction auditability

The previous transaction model only had a generic `balanceAfter`, which was not enough to explain dual-wallet movements.

Added these ledger fields:

- `walletType`
- `freeBalanceAfter`
- `paidBalanceAfter`
- `totalBalanceAfter`

This gives the project a better basis for:

- support investigations
- user-facing history clarity
- future admin and analytics tooling

### 5. Improved spend transaction recording

Updated shared credits utilities so spend transactions now explicitly indicate whether the spend came from:

- free daily credits
- permanent credits

This is especially important because the system spends from two wallets in order.

### 6. Extended credits balance API shape

Updated the credits balance response to include:

- `totalCredits`

This allows frontend surfaces to display a consistent total without each page re-implementing its own interpretation.

### 7. Improved payment ledger metadata

Updated purchase transaction recording so payment-related credit gains also include wallet-aware balance fields.

This keeps purchase events aligned with the improved audit model instead of leaving them as partial legacy ledger rows.

## Verification

### Frontend

Ran:

```bash
npm run build
```

Result:

- build completed successfully
- only pre-existing unrelated ESLint warnings remain

Warnings observed were in unrelated files such as:

- `GalleryCard.js`
- `Sidebar.js`
- `Img2PromptPanel.js`
- `SeedanceList.js`

No build-breaking issue was introduced by this credits update.

### Backend

Ran a module-load validation script to require:

- `server/models/CreditTransaction`
- `server/utils/creditsUtils`
- `server/routes/credits`
- `server/routes/payments`

Result:

- modules loaded successfully
- no syntax/runtime import failure in the updated credits backend path

## What Was Intentionally Not Changed

To keep scope controlled, this round did **not** fully rewrite:

- Google sign-up invitation reward flow
- all sign-up reward transaction history paths
- model pricing / package math copy strategy
- browser-driven visual verification via MCP

### Notes on limits

- Browser MCP verification was not available in this session because the required browser MCP server was not exposed.
- The Google auth flow still deserves a follow-up pass if the product wants invitation parity between email registration and Google first-login registration.

## Main Outcome

The credits system now communicates the intended business rule more clearly:

- fixed free daily allowance
- no daily accumulation
- permanent wallet stays separate
- user-facing balances are more consistent
- transaction history is more explainable

## Recommended Next Step

The next highest-value follow-up is:

1. unify sign-up bonus and invitation behavior across email registration and Google first-login
2. migrate any old transaction rendering that still assumes `balanceAfter` alone is sufficient
3. if needed, add admin UI support for wallet-aware adjustments
