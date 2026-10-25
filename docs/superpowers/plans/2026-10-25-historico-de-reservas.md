# Histórico de reservas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show reservations from past dates in the existing agenda grid with a readable status for each record.

**Architecture:** The repository will include terminal reservation statuses only when the selected date is before today's date in São Paulo. The schedule model and grid will carry and render the status, while the existing active-status filter remains in place for today and future dates.

**Tech Stack:** Next.js, TypeScript, Supabase, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-10-25-historico-de-reservas-design.md`

## Global Constraints

- Historical dates include records with all statuses.
- Today and future dates include only `reserved`, `in_use` and `late` records in schedule occupancy.
- A canceled record remains a visible historical event and is not included in future availability calculations.
- Do not change reservation creation, cancellation, accounting, permissions, or Supabase data.
- Do not add or run tests for this task.

## Review Focus

- A date boundary around midnight must use the `America/Sao_Paulo` calendar date already used by the agenda.
- Terminal statuses must appear in historical slots with readable labels.
- Today and future slots must keep using the existing active reservation statuses.
- Multiple status labels must remain understandable at mobile grid widths.
- The summary counts must not present canceled history as current active occupancy.

---

### Task 1: Render historical reservation statuses in the agenda

**Files:**
- Modify: `src/lib/repositories/reservations.ts` — conditionally include all reservation statuses for past dates.
- Modify: `src/lib/domain/schedule.ts` — carry reservation status into schedule slots and classify historical statuses.
- Modify: `src/components/ReservationDayOverview.tsx` — render a status label for historical reservation slots.
- Create: `src/components/reservation-status.ts` — centralize the Portuguese status labels used by both schedule views.
- Modify: `src/components/ReservationTimeline.tsx` — keep the alternate timeline view compatible with history slots.
- Modify: `src/app/reservations/page.tsx` — determine past dates in São Paulo and keep summary counts accurate for history.
- Modify: `tests/domain/schedule.test.ts` and `tests/components/resident-dashboard.test.tsx` — update existing typed fixtures with reservation statuses; do not add or run tests.

**Interfaces:**
- `listReservationsForDay(date: string, includeHistory?: boolean): Promise<ScheduleReservation[]>` includes terminal statuses only when `includeHistory` is true.
- `ScheduleReservation.status` uses the existing `reservation_status` values from `src/lib/database.types.ts`.
- A schedule slot representing a reservation retains `apartmentNumber`, `reservationId`, `kind`, and `status`.

- [x] **Step 1: Extend the day query**

Pass a historical-date flag from the reservations page. Apply `.in("status", ["reserved", "in_use", "late"])` only when the flag is false; historical dates query all statuses.

- [x] **Step 2: Carry status into the schedule model**

Add the reservation status to `ScheduleReservation` and to occupied/history slots without changing the timezone conversion or 30-minute slot boundaries.

- [x] **Step 3: Display historical status and correct labels**

Render a concise Portuguese label for each status in historical slots. For a past date, present the number of historical reservations rather than describing canceled slots as currently occupied; retain current occupied/free counts for today and future dates.

- [x] **Step 4: Review the changed code against the spec**

Inspect the query conditions, local date comparison, status labels, and count conditions. Do not run tests or other verification commands.
