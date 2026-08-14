# Eight Hours for All Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every apartment a standard weekly quota of 480 minutes (8 hours), while leaving existing manual adjustments unchanged for later review.

**Architecture:** Change the shared quota calculation and the Supabase reservation-balance bootstrap expression from the resident-count formula to 480 minutes. Update the focused domain and SQL contract tests; do not modify existing manual-adjustment data or migrate historical balances in this change.

**Tech Stack:** TypeScript, Vitest, Supabase PostgreSQL migrations.

## Global Constraints

- The standard quota is exactly 480 minutes per week.
- Existing manual adjustments remain untouched.
- Transfers, reservations, refunds, penalties, and balance arithmetic remain unchanged.
- Historical `weekly_balances` rows are not rewritten in this change.

---

### Task 1: Update quota behavior

**Files:**
- Modify: `src/lib/domain/credits.ts`
- Test: `tests/domain/credits.test.ts`

- [x] **Step 1: Change the existing quota tests to expect 480 minutes for one and two residents.**
- [x] **Step 2: Run the focused tests and confirm they fail against the old 360/390-minute formula.**
- [x] **Step 3: Change `calculateWeeklyQuotaMinutes` to return 480 plus the supplied manual adjustment, preserving existing adjustment semantics.**
- [x] **Step 4: Run the focused tests and confirm they pass.**

### Task 2: Update the database bootstrap rule

**Files:**
- Modify: `supabase/migrations/0003_auto_create_weekly_balance.sql`
- Test: `tests/actions/reservations.test.ts`

- [x] **Step 1: Change the SQL contract assertion from the resident-count expression to the 480-minute expression.**
- [x] **Step 2: Run the focused test and confirm it fails against the old SQL.**
- [x] **Step 3: Replace the SQL quota expression with `480`.**
- [x] **Step 4: Run the focused test and confirm it passes.**

### Task 3: Verify the complete change

- [x] **Step 1: Run `npm test`.**
- [x] **Step 2: Run `npm run lint`.**
- [x] **Step 3: Run `npm run build`.**
- [x] **Step 4: Review the diff and confirm no manual-adjustment values were changed; current/future balances are migrated to 480.**
