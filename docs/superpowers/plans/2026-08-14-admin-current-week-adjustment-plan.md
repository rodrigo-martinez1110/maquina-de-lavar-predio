# Admin Current-Week Hour Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins add or remove one-time hour adjustments from an apartment's current-week balance without changing recurring apartment settings.

**Architecture:** Reuse `weekly_balances.manual_adjustment_minutes` for the current week's one-time correction, while leaving `apartments.manual_adjustment_minutes` untouched. Add server-side validation, an admin-only server action, a repository operation that creates the current week's balance when needed, and a compact form on the admin apartments page with audit logging.

**Tech Stack:** Next.js server actions, TypeScript, Supabase, Vitest.

## Global Constraints

- Adjustments apply only to the current week in `America/Sao_Paulo`.
- Values must be non-zero multiples of 30 minutes and may be positive or negative.
- The recurring apartment adjustment is never changed by this flow.
- Every adjustment requires a reason and writes an admin audit log.

---

### Task 1: Validate adjustment input

**Files:**
- Modify: `src/lib/domain/admin-apartments.ts`
- Test: `tests/actions/admin-apartments.test.ts`

- [x] Add failing tests for positive, negative, invalid-step, zero, and missing-reason inputs.
- [x] Run the focused tests and observe the expected failures.
- [x] Implement `validateWeeklyBalanceAdjustmentInput`.
- [x] Run the focused tests and confirm they pass.

### Task 2: Apply the current-week balance adjustment

**Files:**
- Modify: `src/lib/repositories/weekly-balances.ts`
- Modify: `src/lib/actions/admin-apartments.ts`

- [x] Add the failing repository/action contract through the validation and mocked action tests.
- [x] Compute the current São Paulo week start server-side.
- [x] Ensure the weekly balance exists, increment its weekly adjustment, and preserve all other balance fields.
- [x] Require an active admin session and write an audit log with apartment, week, minutes, and reason.
- [x] Revalidate the admin and resident dashboard paths.

### Task 3: Add the admin form

**Files:**
- Modify: `src/app/admin/apartments/page.tsx`

- [x] Add a per-apartment current-week adjustment form with positive/negative 30-minute options and required reason.
- [x] Label the operation as one-time for the current week and keep the recurring adjustment field unchanged.

### Task 4: Verify

- [x] Run the complete test suite.
- [x] Run lint.
- [x] Run the production build.
- [x] Review the diff and confirm no recurring apartment adjustment is updated.
