# Lava e Seca Compartilhada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Next.js + Supabase app for fair scheduling, credit sharing, admin logs, and usage metrics for one shared washer-dryer across 14 apartments.

**Architecture:** Use Next.js App Router with server actions for business rules, Supabase Postgres for durable state, Supabase Auth for admins, and a custom apartment session for apartment + PIN login. Keep domain rules in pure TypeScript modules with unit tests, and keep database calls behind focused repository modules.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Supabase JS, Supabase SQL migrations, Vitest, Playwright, Vercel.

---

## Scope Check

The approved spec includes several subsystems, but they all depend on the same domain model and should ship as one MVP:

- apartment login and admin login;
- weekly credits;
- reservations and live status;
- hour offers/requests/transfers;
- internal notifications;
- admin metrics and audit logs.

The plan below keeps each subsystem independently testable and commits after each functional slice.

## Proposed File Structure

- `package.json`: scripts and dependencies.
- `next.config.ts`: Next.js config.
- `tsconfig.json`: TypeScript config.
- `vitest.config.ts`: unit test config.
- `playwright.config.ts`: browser test config.
- `src/app/layout.tsx`: root layout.
- `src/app/page.tsx`: apartment dashboard route.
- `src/app/login/page.tsx`: apartment login route.
- `src/app/admin/page.tsx`: admin dashboard route.
- `src/app/admin/login/page.tsx`: admin login route.
- `src/app/reservations/page.tsx`: calendar/reservation route.
- `src/app/credits/page.tsx`: offers and requests route.
- `src/app/metrics/page.tsx`: resident peak metrics route.
- `src/app/notifications/page.tsx`: resident notification route.
- `src/components/*`: reusable UI components.
- `src/lib/domain/time.ts`: week, block, duration, and operating-hour helpers.
- `src/lib/domain/credits.ts`: quota and balance calculation helpers.
- `src/lib/domain/reservations.ts`: reservation validation and status helpers.
- `src/lib/domain/transfers.ts`: offer/request/transfer helpers.
- `src/lib/supabase/client.ts`: browser Supabase client.
- `src/lib/supabase/server.ts`: server Supabase client.
- `src/lib/auth/apartment-session.ts`: apartment session cookie helpers.
- `src/lib/repositories/*.ts`: database access modules.
- `src/lib/actions/*.ts`: server actions for login, reservations, transfers, admin corrections.
- `supabase/migrations/0001_initial_schema.sql`: database schema, enums, indexes, RLS, seed apartments.
- `tests/domain/*.test.ts`: unit tests for pure domain logic.
- `tests/actions/*.test.ts`: server-action tests with repository fakes.
- `tests/e2e/*.spec.ts`: Playwright smoke tests.

## Task 1: Scaffold Next.js App

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Initialize dependencies**

Run:

```powershell
npm init -y
npm install next react react-dom @supabase/supabase-js zod bcryptjs lucide-react clsx date-fns
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss postcss autoprefixer vitest @vitejs/plugin-react jsdom playwright @playwright/test eslint eslint-config-next
```

Expected: `package.json` exists and dependencies install without errors.

- [ ] **Step 2: Replace `package.json` scripts**

Create this script section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Add minimal app shell**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lava e Seca",
  description: "Agenda compartilhada da lava e seca do predio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Lava e Seca</h1>
      <p className="text-sm text-slate-600">Agenda compartilhada dos apartamentos 1 a 14.</p>
    </main>
  );
}
```

- [ ] **Step 4: Verify scaffold**

Run:

```powershell
npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json next.config.ts tsconfig.json vitest.config.ts playwright.config.ts postcss.config.mjs tailwind.config.ts src
git commit -m "chore: scaffold next app"
```

## Task 2: Add Domain Time and Credit Rules

**Files:**
- Create: `src/lib/domain/time.ts`
- Create: `src/lib/domain/credits.ts`
- Create: `tests/domain/time.test.ts`
- Create: `tests/domain/credits.test.ts`

- [ ] **Step 1: Write failing time tests**

Create `tests/domain/time.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { assertReservableWindow, ceilToThirtyMinuteBlocks, minutesBetween } from "../../src/lib/domain/time";

describe("time domain", () => {
  it("allows reservations between 07:00 and 23:00", () => {
    expect(() => assertReservableWindow("2026-07-20T07:00:00-03:00", "2026-07-20T09:00:00-03:00")).not.toThrow();
  });

  it("blocks reservations that end after 23:00", () => {
    expect(() => assertReservableWindow("2026-07-20T22:30:00-03:00", "2026-07-20T23:30:00-03:00")).toThrow("Reservas devem terminar ate 23:00");
  });

  it("blocks reservations before 07:00", () => {
    expect(() => assertReservableWindow("2026-07-20T06:30:00-03:00", "2026-07-20T07:30:00-03:00")).toThrow("Reservas devem comecar a partir de 07:00");
  });

  it("rounds extra usage up to 30 minute blocks", () => {
    expect(ceilToThirtyMinuteBlocks(1)).toBe(30);
    expect(ceilToThirtyMinuteBlocks(31)).toBe(60);
  });

  it("calculates minutes between timestamps", () => {
    expect(minutesBetween("2026-07-20T10:00:00-03:00", "2026-07-20T11:30:00-03:00")).toBe(90);
  });
});
```

- [ ] **Step 2: Write failing credit tests**

Create `tests/domain/credits.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateWeeklyQuotaMinutes, calculateAvailableMinutes } from "../../src/lib/domain/credits";

describe("credit domain", () => {
  it("gives 6h to one resident", () => {
    expect(calculateWeeklyQuotaMinutes({ residentCount: 1, manualAdjustmentMinutes: 0 })).toBe(360);
  });

  it("adds 30min for each resident above one", () => {
    expect(calculateWeeklyQuotaMinutes({ residentCount: 2, manualAdjustmentMinutes: 0 })).toBe(390);
  });

  it("applies manual admin adjustment", () => {
    expect(calculateWeeklyQuotaMinutes({ residentCount: 2, manualAdjustmentMinutes: 30 })).toBe(420);
  });

  it("calculates weekly available balance", () => {
    expect(
      calculateAvailableMinutes({
        quotaMinutes: 390,
        receivedMinutes: 120,
        sentMinutes: 60,
        reservedMinutes: 180,
        refundedMinutes: 30,
        penaltyMinutes: 30,
      }),
    ).toBe(270);
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```powershell
npm test -- tests/domain/time.test.ts tests/domain/credits.test.ts
```

Expected: FAIL because the imported modules do not exist.

- [ ] **Step 4: Implement domain helpers**

Create `src/lib/domain/time.ts`:

```ts
const THIRTY_MINUTES = 30;

export function minutesBetween(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

export function ceilToThirtyMinuteBlocks(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.ceil(minutes / THIRTY_MINUTES) * THIRTY_MINUTES;
}

export function assertReservableWindow(startIso: string, endIso: string): void {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  if (startHour < 7) throw new Error("Reservas devem comecar a partir de 07:00");
  if (endHour > 23 || end.toDateString() !== start.toDateString()) {
    throw new Error("Reservas devem terminar ate 23:00");
  }
}
```

Create `src/lib/domain/credits.ts`:

```ts
export type WeeklyQuotaInput = {
  residentCount: number;
  manualAdjustmentMinutes: number;
};

export type AvailableMinutesInput = {
  quotaMinutes: number;
  receivedMinutes: number;
  sentMinutes: number;
  reservedMinutes: number;
  refundedMinutes: number;
  penaltyMinutes: number;
};

export function calculateWeeklyQuotaMinutes(input: WeeklyQuotaInput): number {
  const extraResidents = Math.max(0, input.residentCount - 1);
  return 360 + extraResidents * 30 + input.manualAdjustmentMinutes;
}

export function calculateAvailableMinutes(input: AvailableMinutesInput): number {
  return (
    input.quotaMinutes +
    input.receivedMinutes -
    input.sentMinutes -
    input.reservedMinutes +
    input.refundedMinutes -
    input.penaltyMinutes
  );
}
```

- [ ] **Step 5: Verify tests pass**

Run:

```powershell
npm test -- tests/domain/time.test.ts tests/domain/credits.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/domain tests/domain
git commit -m "feat: add time and credit domain rules"
```

## Task 3: Add Reservation Domain Rules

**Files:**
- Create: `src/lib/domain/reservations.ts`
- Create: `tests/domain/reservations.test.ts`

- [ ] **Step 1: Write failing reservation tests**

Create `tests/domain/reservations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  assertReservationAllowed,
  overlapsReservation,
  refundForEarlyRelease,
  penaltyForLateFinish,
} from "../../src/lib/domain/reservations";

describe("reservation domain", () => {
  it("blocks reservations shorter than 30 minutes", () => {
    expect(() =>
      assertReservationAllowed({
        startIso: "2026-07-20T10:00:00-03:00",
        endIso: "2026-07-20T10:15:00-03:00",
        availableMinutes: 120,
      }),
    ).toThrow("Reserva minima de 30 minutos");
  });

  it("blocks reservations longer than 4 hours", () => {
    expect(() =>
      assertReservationAllowed({
        startIso: "2026-07-20T10:00:00-03:00",
        endIso: "2026-07-20T14:30:00-03:00",
        availableMinutes: 300,
      }),
    ).toThrow("Reserva maxima de 4 horas");
  });

  it("blocks reservations without enough balance", () => {
    expect(() =>
      assertReservationAllowed({
        startIso: "2026-07-20T10:00:00-03:00",
        endIso: "2026-07-20T12:00:00-03:00",
        availableMinutes: 60,
      }),
    ).toThrow("Saldo insuficiente");
  });

  it("detects overlapping reservations", () => {
    expect(
      overlapsReservation(
        { startIso: "2026-07-20T10:00:00-03:00", endIso: "2026-07-20T12:00:00-03:00" },
        { startIso: "2026-07-20T11:30:00-03:00", endIso: "2026-07-20T13:00:00-03:00" },
      ),
    ).toBe(true);
  });

  it("refunds unused minutes when machine is released early", () => {
    expect(
      refundForEarlyRelease({
        reservedEndIso: "2026-07-20T12:00:00-03:00",
        releasedAtIso: "2026-07-20T11:10:00-03:00",
      }),
    ).toBe(30);
  });

  it("charges late finish rounded up to 30 minute blocks", () => {
    expect(
      penaltyForLateFinish({
        reservedEndIso: "2026-07-20T12:00:00-03:00",
        finishedAtIso: "2026-07-20T12:01:00-03:00",
      }),
    ).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npm test -- tests/domain/reservations.test.ts
```

Expected: FAIL because `reservations.ts` does not exist.

- [ ] **Step 3: Implement reservation helpers**

Create `src/lib/domain/reservations.ts`:

```ts
import { assertReservableWindow, ceilToThirtyMinuteBlocks, minutesBetween } from "./time";

export type ReservationWindow = {
  startIso: string;
  endIso: string;
};

export type ReservationAllowedInput = ReservationWindow & {
  availableMinutes: number;
};

export function assertReservationAllowed(input: ReservationAllowedInput): void {
  assertReservableWindow(input.startIso, input.endIso);
  const duration = minutesBetween(input.startIso, input.endIso);
  if (duration < 30) throw new Error("Reserva minima de 30 minutos");
  if (duration > 240) throw new Error("Reserva maxima de 4 horas");
  if (duration > input.availableMinutes) throw new Error("Saldo insuficiente");
}

export function overlapsReservation(left: ReservationWindow, right: ReservationWindow): boolean {
  return new Date(left.startIso) < new Date(right.endIso) && new Date(right.startIso) < new Date(left.endIso);
}

export function refundForEarlyRelease(input: { reservedEndIso: string; releasedAtIso: string }): number {
  return ceilToThirtyMinuteBlocks(minutesBetween(input.releasedAtIso, input.reservedEndIso));
}

export function penaltyForLateFinish(input: { reservedEndIso: string; finishedAtIso: string }): number {
  return ceilToThirtyMinuteBlocks(minutesBetween(input.reservedEndIso, input.finishedAtIso));
}
```

- [ ] **Step 4: Verify tests pass**

Run:

```powershell
npm test -- tests/domain/reservations.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/domain/reservations.ts tests/domain/reservations.test.ts
git commit -m "feat: add reservation domain rules"
```

## Task 4: Add Supabase Schema

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `src/lib/database.types.ts`

- [ ] **Step 1: Create migration**

Create `supabase/migrations/0001_initial_schema.sql`:

```sql
create extension if not exists pgcrypto;

create type reservation_status as enum ('reserved', 'in_use', 'finished', 'released', 'cancelled', 'unregistered', 'late');
create type reservation_kind as enum ('wash', 'dry', 'wash_dry', 'custom');
create type transfer_kind as enum ('offer', 'request');
create type transfer_status as enum ('open', 'partially_filled', 'filled', 'cancelled');
create type notification_kind as enum ('late', 'transfer', 'admin_correction', 'impacted_reservation');
create type actor_kind as enum ('apartment', 'admin', 'system');

create table apartments (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique check (number between 1 and 14),
  pin_hash text not null,
  resident_count integer not null default 1 check (resident_count >= 1),
  manual_adjustment_minutes integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references apartments(id),
  kind reservation_kind not null,
  status reservation_status not null default 'reserved',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  estimated_minutes integer not null check (estimated_minutes between 30 and 240),
  actual_minutes integer check (actual_minutes >= 0),
  released_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table credit_transfers (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references apartments(id),
  kind transfer_kind not null,
  status transfer_status not null default 'open',
  week_start date not null,
  total_minutes integer not null check (total_minutes > 0),
  remaining_minutes integer not null check (remaining_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table credit_transfer_acceptances (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references credit_transfers(id),
  from_apartment_id uuid not null references apartments(id),
  to_apartment_id uuid not null references apartments(id),
  minutes integer not null check (minutes > 0),
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid references apartments(id),
  kind notification_kind not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_kind actor_kind not null,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index reservations_window_idx on reservations (starts_at, ends_at);
create index reservations_apartment_idx on reservations (apartment_id, starts_at);
create index credit_transfers_week_idx on credit_transfers (week_start, status);
create index notifications_apartment_idx on notifications (apartment_id, read_at, created_at);
create index audit_logs_created_idx on audit_logs (created_at desc);

insert into apartments (number, pin_hash)
select n, crypt('1234', gen_salt('bf'))
from generate_series(1, 14) as n;
```

- [ ] **Step 2: Add generated type placeholder**

Create `src/lib/database.types.ts`:

```ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      reservation_status: "reserved" | "in_use" | "finished" | "released" | "cancelled" | "unregistered" | "late";
      reservation_kind: "wash" | "dry" | "wash_dry" | "custom";
      transfer_kind: "offer" | "request";
      transfer_status: "open" | "partially_filled" | "filled" | "cancelled";
      notification_kind: "late" | "transfer" | "admin_correction" | "impacted_reservation";
      actor_kind: "apartment" | "admin" | "system";
    };
  };
};
```

- [ ] **Step 3: Verify SQL shape locally**

Run:

```powershell
npx supabase --version
```

Expected: Supabase CLI version prints. If the CLI is not installed, install or run migrations through Supabase dashboard in Task 12.

- [ ] **Step 4: Commit**

```powershell
git add supabase/migrations/0001_initial_schema.sql src/lib/database.types.ts
git commit -m "feat: add supabase schema"
```

## Task 5: Add Supabase Clients and Environment Validation

**Files:**
- Create: `.env.example`
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `tests/domain/env.test.ts`

- [ ] **Step 1: Write environment test**

Create `tests/domain/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseEnv } from "../../src/lib/env";

describe("env", () => {
  it("requires Supabase URL and keys", () => {
    expect(() => parseEnv({})).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("parses required values", () => {
    expect(
      parseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        APARTMENT_SESSION_SECRET: "a-long-random-secret",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      APARTMENT_SESSION_SECRET: "a-long-random-secret",
    });
  });
});
```

- [ ] **Step 2: Implement env and clients**

Create `.env.example`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APARTMENT_SESSION_SECRET=
```

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APARTMENT_SESSION_SECRET: z.string().min(16),
});

export function parseEnv(source: NodeJS.ProcessEnv) {
  return EnvSchema.parse(source);
}

export const env = parseEnv(process.env);
```

Create `src/lib/supabase/client.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

export function createBrowserSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

Create `src/lib/supabase/server.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { env } from "../env";

export function createServiceSupabaseClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
```

- [ ] **Step 3: Verify tests pass**

Run:

```powershell
npm test -- tests/domain/env.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add .env.example src/lib/env.ts src/lib/supabase tests/domain/env.test.ts
git commit -m "feat: configure supabase clients"
```

## Task 6: Add Apartment Session and Login

**Files:**
- Create: `src/lib/auth/apartment-session.ts`
- Create: `src/lib/repositories/apartments.ts`
- Create: `src/lib/actions/apartment-auth.ts`
- Create: `src/app/login/page.tsx`
- Modify: `src/app/page.tsx`
- Create: `tests/actions/apartment-auth.test.ts`

- [ ] **Step 1: Write action test with repository fake**

Create `tests/actions/apartment-auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { verifyApartmentPin } from "../../src/lib/actions/apartment-auth";

describe("apartment auth", () => {
  it("rejects unknown apartment", async () => {
    await expect(
      verifyApartmentPin({
        apartmentNumber: 99,
        pin: "1234",
        findApartmentByNumber: async () => null,
      }),
    ).rejects.toThrow("Apartamento ou PIN invalido");
  });

  it("accepts a matching pin", async () => {
    await expect(
      verifyApartmentPin({
        apartmentNumber: 1,
        pin: "1234",
        findApartmentByNumber: async () => ({
          id: "apt-1",
          number: 1,
          pinHash: "$2a$10$wqZs31TI4rlUYVlXI5luJO3J.zwlY1RVKVs.sZTpOmTQaoxlf.XCa",
        }),
      }),
    ).resolves.toEqual({ apartmentId: "apt-1", apartmentNumber: 1 });
  });
});
```

- [ ] **Step 2: Implement auth helpers and login action**

Create `src/lib/auth/apartment-session.ts`:

```ts
import { cookies } from "next/headers";

const COOKIE_NAME = "apartment_session";

export type ApartmentSession = {
  apartmentId: string;
  apartmentNumber: number;
};

export async function setApartmentSession(session: ApartmentSession) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, Buffer.from(JSON.stringify(session)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getApartmentSession(): Promise<ApartmentSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as ApartmentSession;
  } catch {
    return null;
  }
}
```

Create `src/lib/actions/apartment-auth.ts`:

```ts
"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { setApartmentSession } from "../auth/apartment-session";
import { findApartmentByNumber } from "../repositories/apartments";

export type ApartmentForAuth = {
  id: string;
  number: number;
  pinHash: string;
};

export async function verifyApartmentPin(input: {
  apartmentNumber: number;
  pin: string;
  findApartmentByNumber: (number: number) => Promise<ApartmentForAuth | null>;
}) {
  const apartment = await input.findApartmentByNumber(input.apartmentNumber);
  if (!apartment) throw new Error("Apartamento ou PIN invalido");
  const ok = await bcrypt.compare(input.pin, apartment.pinHash);
  if (!ok) throw new Error("Apartamento ou PIN invalido");
  return { apartmentId: apartment.id, apartmentNumber: apartment.number };
}

export async function loginApartment(formData: FormData) {
  const apartmentNumber = Number(formData.get("apartmentNumber"));
  const pin = String(formData.get("pin") ?? "");
  const session = await verifyApartmentPin({ apartmentNumber, pin, findApartmentByNumber });
  await setApartmentSession(session);
  redirect("/");
}
```

- [ ] **Step 3: Add repository and login page**

Create `src/lib/repositories/apartments.ts`:

```ts
import { createServiceSupabaseClient } from "../supabase/server";
import type { ApartmentForAuth } from "../actions/apartment-auth";

export async function findApartmentByNumber(number: number): Promise<ApartmentForAuth | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("id, number, pin_hash")
    .eq("number", number)
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return { id: data.id, number: data.number, pinHash: data.pin_hash };
}
```

Create `src/app/login/page.tsx`:

```tsx
import { loginApartment } from "../../lib/actions/apartment-auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">Entrar no apartamento</h1>
      <form action={loginApartment} className="flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="apartmentNumber">Apartamento</label>
        <input className="rounded border p-3" id="apartmentNumber" name="apartmentNumber" inputMode="numeric" required />
        <label className="text-sm font-medium" htmlFor="pin">PIN</label>
        <input className="rounded border p-3" id="pin" name="pin" type="password" required />
        <button className="rounded bg-slate-900 p-3 text-white" type="submit">Entrar</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- tests/actions/apartment-auth.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/auth src/lib/repositories/apartments.ts src/lib/actions/apartment-auth.ts src/app/login tests/actions
git commit -m "feat: add apartment login"
```

## Task 7: Add Reservation Repositories and Actions

**Files:**
- Create: `src/lib/repositories/reservations.ts`
- Create: `src/lib/actions/reservations.ts`
- Create: `tests/actions/reservations.test.ts`

- [ ] **Step 1: Write server action tests with fakes**

Create `tests/actions/reservations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createReservationUseCase } from "../../src/lib/actions/reservations";

describe("reservation actions", () => {
  it("creates reservation when balance and window are valid", async () => {
    const result = await createReservationUseCase({
      apartmentId: "apt-1",
      kind: "wash_dry",
      startIso: "2026-07-20T10:00:00-03:00",
      endIso: "2026-07-20T12:00:00-03:00",
      availableMinutes: 180,
      findConflicts: async () => [],
      insertReservation: async () => ({ id: "res-1" }),
      audit: async () => undefined,
    });
    expect(result).toEqual({ id: "res-1" });
  });

  it("blocks conflicting reservation", async () => {
    await expect(
      createReservationUseCase({
        apartmentId: "apt-1",
        kind: "wash",
        startIso: "2026-07-20T10:00:00-03:00",
        endIso: "2026-07-20T11:00:00-03:00",
        availableMinutes: 120,
        findConflicts: async () => [{ id: "res-2" }],
        insertReservation: async () => ({ id: "res-1" }),
        audit: async () => undefined,
      }),
    ).rejects.toThrow("Horario indisponivel");
  });
});
```

- [ ] **Step 2: Implement action use case**

Create `src/lib/actions/reservations.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { assertReservationAllowed, type ReservationWindow } from "../domain/reservations";
import { minutesBetween } from "../domain/time";
import { getApartmentSession } from "../auth/apartment-session";
import { createReservation, findReservationConflicts } from "../repositories/reservations";

type ReservationKind = "wash" | "dry" | "wash_dry" | "custom";

export async function createReservationUseCase(input: {
  apartmentId: string;
  kind: ReservationKind;
  startIso: string;
  endIso: string;
  availableMinutes: number;
  findConflicts: (window: ReservationWindow) => Promise<Array<{ id: string }>>;
  insertReservation: (row: {
    apartmentId: string;
    kind: ReservationKind;
    startIso: string;
    endIso: string;
    estimatedMinutes: number;
  }) => Promise<{ id: string }>;
  audit: (action: string, entityId: string) => Promise<void>;
}) {
  assertReservationAllowed(input);
  const conflicts = await input.findConflicts({ startIso: input.startIso, endIso: input.endIso });
  if (conflicts.length > 0) throw new Error("Horario indisponivel");
  const reservation = await input.insertReservation({
    apartmentId: input.apartmentId,
    kind: input.kind,
    startIso: input.startIso,
    endIso: input.endIso,
    estimatedMinutes: minutesBetween(input.startIso, input.endIso),
  });
  await input.audit("reservation.created", reservation.id);
  return reservation;
}

export async function createReservation(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  const startIso = String(formData.get("startIso"));
  const endIso = String(formData.get("endIso"));
  const kind = String(formData.get("kind")) as ReservationKind;
  const availableMinutes = Number(formData.get("availableMinutes"));
  await createReservationUseCase({
    apartmentId: session.apartmentId,
    kind,
    startIso,
    endIso,
    availableMinutes,
    findConflicts: findReservationConflicts,
    insertReservation: createReservation,
    audit: async () => undefined,
  });
  revalidatePath("/reservations");
}
```

- [ ] **Step 3: Implement repository**

Create `src/lib/repositories/reservations.ts`:

```ts
import { createServiceSupabaseClient } from "../supabase/server";
import type { ReservationWindow } from "../domain/reservations";

export async function findReservationConflicts(window: ReservationWindow): Promise<Array<{ id: string }>> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("id")
    .lt("starts_at", window.endIso)
    .gt("ends_at", window.startIso)
    .in("status", ["reserved", "in_use", "late"]);
  if (error) throw error;
  return data ?? [];
}

export async function createReservation(row: {
  apartmentId: string;
  kind: "wash" | "dry" | "wash_dry" | "custom";
  startIso: string;
  endIso: string;
  estimatedMinutes: number;
}) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      apartment_id: row.apartmentId,
      kind: row.kind,
      starts_at: row.startIso,
      ends_at: row.endIso,
      estimated_minutes: row.estimatedMinutes,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- tests/actions/reservations.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/actions/reservations.ts src/lib/repositories/reservations.ts tests/actions/reservations.test.ts
git commit -m "feat: add reservation actions"
```

## Task 8: Build Resident Dashboard and Calendar UI

**Files:**
- Create: `src/components/AppNav.tsx`
- Create: `src/components/BalanceCard.tsx`
- Create: `src/components/ReservationTimeline.tsx`
- Create: `src/app/reservations/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add reusable UI components**

Create `src/components/BalanceCard.tsx`:

```tsx
export function BalanceCard({ availableMinutes }: { availableMinutes: number }) {
  const hours = Math.floor(availableMinutes / 60);
  const minutes = availableMinutes % 60;
  return (
    <section className="rounded border bg-white p-4">
      <p className="text-sm text-slate-500">Saldo da semana</p>
      <p className="text-3xl font-semibold">{hours}h{minutes ? ` ${minutes}min` : ""}</p>
    </section>
  );
}
```

Create `src/components/AppNav.tsx`:

```tsx
import Link from "next/link";

export function AppNav() {
  return (
    <nav className="grid grid-cols-4 gap-2 text-center text-xs">
      <Link className="rounded border p-2" href="/">Inicio</Link>
      <Link className="rounded border p-2" href="/reservations">Agenda</Link>
      <Link className="rounded border p-2" href="/credits">Horas</Link>
      <Link className="rounded border p-2" href="/metrics">Metricas</Link>
    </nav>
  );
}
```

- [ ] **Step 2: Add pages**

Modify `src/app/page.tsx`:

```tsx
import { AppNav } from "../components/AppNav";
import { BalanceCard } from "../components/BalanceCard";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Lava e Seca</h1>
      <BalanceCard availableMinutes={360} />
      <section className="grid grid-cols-2 gap-3">
        <a className="rounded bg-slate-900 p-4 text-center text-white" href="/reservations?now=1">Usar agora</a>
        <a className="rounded border p-4 text-center" href="/reservations">Reservar horario</a>
      </section>
      <AppNav />
    </main>
  );
}
```

Create `src/app/reservations/page.tsx`:

```tsx
import { AppNav } from "../../components/AppNav";

export default function ReservationsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Agenda</h1>
      <p className="text-sm text-slate-600">Horarios disponiveis entre 07:00 e 23:00.</p>
      <div className="grid gap-2">
        {["07:00", "07:30", "08:00", "08:30", "09:00"].map((slot) => (
          <button key={slot} className="rounded border p-3 text-left">{slot} - disponivel</button>
        ))}
      </div>
      <AppNav />
    </main>
  );
}
```

- [ ] **Step 3: Verify responsive shell**

Run:

```powershell
npm run build
```

Expected: build passes.

- [ ] **Step 4: Commit**

```powershell
git add src/app src/components
git commit -m "feat: add resident dashboard shell"
```

## Task 9: Add Cancel, Release, Finish, and Late Usage Actions

**Files:**
- Modify: `src/lib/actions/reservations.ts`
- Modify: `src/lib/repositories/reservations.ts`
- Create: `tests/actions/reservation-lifecycle.test.ts`

- [ ] **Step 1: Write lifecycle tests**

Create `tests/actions/reservation-lifecycle.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateCancellationRefund, calculateReleaseRefund, calculateLatePenalty } from "../../src/lib/actions/reservations";

describe("reservation lifecycle", () => {
  it("refunds cancellation more than 1h before start", () => {
    expect(
      calculateCancellationRefund({
        startsAtIso: "2026-07-20T12:00:00-03:00",
        cancelledAtIso: "2026-07-20T10:30:00-03:00",
        reservedMinutes: 120,
      }),
    ).toBe(120);
  });

  it("does not refund late cancellation", () => {
    expect(
      calculateCancellationRefund({
        startsAtIso: "2026-07-20T12:00:00-03:00",
        cancelledAtIso: "2026-07-20T11:30:00-03:00",
        reservedMinutes: 120,
      }),
    ).toBe(0);
  });

  it("refunds early release remainder rounded to blocks", () => {
    expect(
      calculateReleaseRefund({
        endsAtIso: "2026-07-20T12:00:00-03:00",
        releasedAtIso: "2026-07-20T11:10:00-03:00",
      }),
    ).toBe(30);
  });

  it("penalizes late finish rounded up", () => {
    expect(
      calculateLatePenalty({
        endsAtIso: "2026-07-20T12:00:00-03:00",
        finishedAtIso: "2026-07-20T12:31:00-03:00",
      }),
    ).toBe(60);
  });
});
```

- [ ] **Step 2: Implement lifecycle functions**

Add to `src/lib/actions/reservations.ts`:

```ts
import { ceilToThirtyMinuteBlocks, minutesBetween } from "../domain/time";

export function calculateCancellationRefund(input: {
  startsAtIso: string;
  cancelledAtIso: string;
  reservedMinutes: number;
}) {
  const minutesBeforeStart = minutesBetween(input.cancelledAtIso, input.startsAtIso);
  return minutesBeforeStart >= 60 ? input.reservedMinutes : 0;
}

export function calculateReleaseRefund(input: { endsAtIso: string; releasedAtIso: string }) {
  return ceilToThirtyMinuteBlocks(minutesBetween(input.releasedAtIso, input.endsAtIso));
}

export function calculateLatePenalty(input: { endsAtIso: string; finishedAtIso: string }) {
  return ceilToThirtyMinuteBlocks(minutesBetween(input.endsAtIso, input.finishedAtIso));
}
```

- [ ] **Step 3: Add repository status updates**

Add functions to `src/lib/repositories/reservations.ts`:

```ts
export async function updateReservationStatus(id: string, status: "cancelled" | "released" | "finished" | "late") {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("reservations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- tests/actions/reservation-lifecycle.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/actions/reservations.ts src/lib/repositories/reservations.ts tests/actions/reservation-lifecycle.test.ts
git commit -m "feat: add reservation lifecycle rules"
```

## Task 10: Add Hour Offers, Requests, and Partial Acceptances

**Files:**
- Create: `src/lib/domain/transfers.ts`
- Create: `src/lib/repositories/transfers.ts`
- Create: `src/lib/actions/transfers.ts`
- Create: `src/app/credits/page.tsx`
- Create: `tests/domain/transfers.test.ts`
- Create: `tests/actions/transfers.test.ts`

- [ ] **Step 1: Write transfer tests**

Create `tests/domain/transfers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyPartialAcceptance } from "../../src/lib/domain/transfers";

describe("transfers", () => {
  it("marks request partially filled when minutes remain", () => {
    expect(applyPartialAcceptance({ remainingMinutes: 180, acceptedMinutes: 60 })).toEqual({
      remainingMinutes: 120,
      status: "partially_filled",
    });
  });

  it("marks request filled when no minutes remain", () => {
    expect(applyPartialAcceptance({ remainingMinutes: 60, acceptedMinutes: 60 })).toEqual({
      remainingMinutes: 0,
      status: "filled",
    });
  });
});
```

- [ ] **Step 2: Implement transfer domain**

Create `src/lib/domain/transfers.ts`:

```ts
export type TransferStatus = "open" | "partially_filled" | "filled" | "cancelled";

export function applyPartialAcceptance(input: { remainingMinutes: number; acceptedMinutes: number }): {
  remainingMinutes: number;
  status: TransferStatus;
} {
  if (input.acceptedMinutes <= 0) throw new Error("Minutos devem ser positivos");
  if (input.acceptedMinutes > input.remainingMinutes) throw new Error("Aceite maior que o restante");
  const remainingMinutes = input.remainingMinutes - input.acceptedMinutes;
  return { remainingMinutes, status: remainingMinutes === 0 ? "filled" : "partially_filled" };
}
```

- [ ] **Step 3: Add transfers page shell**

Create `src/app/credits/page.tsx`:

```tsx
import { AppNav } from "../../components/AppNav";

export default function CreditsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Horas</h1>
      <section className="grid grid-cols-2 gap-3">
        <button className="rounded bg-slate-900 p-3 text-white">Ceder horas</button>
        <button className="rounded border p-3">Pedir horas</button>
      </section>
      <AppNav />
    </main>
  );
}
```

- [ ] **Step 4: Implement repositories/actions**

Create `tests/actions/transfers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { acceptTransferUseCase } from "../../src/lib/actions/transfers";

describe("transfer actions", () => {
  it("accepts part of an open request", async () => {
    const result = await acceptTransferUseCase({
      transfer: {
        id: "transfer-1",
        apartmentId: "apt-requester",
        kind: "request",
        remainingMinutes: 180,
      },
      actorApartmentId: "apt-helper",
      minutes: 60,
      insertAcceptance: async (row) => row,
      updateTransfer: async (row) => row,
      notify: async () => undefined,
      audit: async () => undefined,
    });

    expect(result).toEqual({ remainingMinutes: 120, status: "partially_filled" });
  });
});
```

Create `src/lib/repositories/transfers.ts`:

```ts
import { createServiceSupabaseClient } from "../supabase/server";

export type TransferRow = {
  id: string;
  apartmentId: string;
  kind: "offer" | "request";
  remainingMinutes: number;
};

export async function createTransfer(input: {
  apartmentId: string;
  kind: "offer" | "request";
  weekStart: string;
  totalMinutes: number;
}) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("credit_transfers")
    .insert({
      apartment_id: input.apartmentId,
      kind: input.kind,
      week_start: input.weekStart,
      total_minutes: input.totalMinutes,
      remaining_minutes: input.totalMinutes,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function insertTransferAcceptance(input: {
  transferId: string;
  fromApartmentId: string;
  toApartmentId: string;
  minutes: number;
}) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("credit_transfer_acceptances").insert({
    transfer_id: input.transferId,
    from_apartment_id: input.fromApartmentId,
    to_apartment_id: input.toApartmentId,
    minutes: input.minutes,
  }).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateTransferRemaining(input: {
  transferId: string;
  remainingMinutes: number;
  status: "open" | "partially_filled" | "filled" | "cancelled";
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("credit_transfers").update({
    remaining_minutes: input.remainingMinutes,
    status: input.status,
    updated_at: new Date().toISOString(),
  }).eq("id", input.transferId);
  if (error) throw error;
}
```

Create `src/lib/actions/transfers.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getApartmentSession } from "../auth/apartment-session";
import { applyPartialAcceptance, type TransferStatus } from "../domain/transfers";
import {
  createTransfer,
  insertTransferAcceptance,
  updateTransferRemaining,
  type TransferRow,
} from "../repositories/transfers";

export async function acceptTransferUseCase(input: {
  transfer: TransferRow;
  actorApartmentId: string;
  minutes: number;
  insertAcceptance: (row: {
    transferId: string;
    fromApartmentId: string;
    toApartmentId: string;
    minutes: number;
  }) => Promise<unknown>;
  updateTransfer: (row: { transferId: string; remainingMinutes: number; status: TransferStatus }) => Promise<unknown>;
  notify: (apartmentId: string, minutes: number) => Promise<void>;
  audit: (transferId: string, minutes: number) => Promise<void>;
}) {
  const next = applyPartialAcceptance({
    remainingMinutes: input.transfer.remainingMinutes,
    acceptedMinutes: input.minutes,
  });
  const fromApartmentId = input.transfer.kind === "request" ? input.actorApartmentId : input.transfer.apartmentId;
  const toApartmentId = input.transfer.kind === "request" ? input.transfer.apartmentId : input.actorApartmentId;
  await input.insertAcceptance({
    transferId: input.transfer.id,
    fromApartmentId,
    toApartmentId,
    minutes: input.minutes,
  });
  await input.updateTransfer({
    transferId: input.transfer.id,
    remainingMinutes: next.remainingMinutes,
    status: next.status,
  });
  await input.notify(toApartmentId, input.minutes);
  await input.audit(input.transfer.id, input.minutes);
  return next;
}

export async function createHourOffer(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  await createTransfer({
    apartmentId: session.apartmentId,
    kind: "offer",
    weekStart: String(formData.get("weekStart")),
    totalMinutes: Number(formData.get("minutes")),
  });
  revalidatePath("/credits");
}

export async function createHourRequest(formData: FormData) {
  const session = await getApartmentSession();
  if (!session) throw new Error("Sessao expirada");
  await createTransfer({
    apartmentId: session.apartmentId,
    kind: "request",
    weekStart: String(formData.get("weekStart")),
    totalMinutes: Number(formData.get("minutes")),
  });
  revalidatePath("/credits");
}
```

- [ ] **Step 5: Verify**

Run:

```powershell
npm test -- tests/domain/transfers.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/domain/transfers.ts src/lib/repositories/transfers.ts src/lib/actions/transfers.ts src/app/credits tests/domain/transfers.test.ts tests/actions/transfers.test.ts
git commit -m "feat: add hour transfers"
```

## Task 11: Add Notifications and Audit Logs

**Files:**
- Create: `src/lib/repositories/notifications.ts`
- Create: `src/lib/repositories/audit-logs.ts`
- Create: `src/app/notifications/page.tsx`
- Modify: `src/lib/actions/reservations.ts`
- Modify: `src/lib/actions/transfers.ts`

- [ ] **Step 1: Implement notification repository**

Create `src/lib/repositories/notifications.ts`:

```ts
import { createServiceSupabaseClient } from "../supabase/server";

export async function createNotification(input: {
  apartmentId: string | null;
  kind: "late" | "transfer" | "admin_correction" | "impacted_reservation";
  title: string;
  body: string;
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    apartment_id: input.apartmentId,
    kind: input.kind,
    title: input.title,
    body: input.body,
  });
  if (error) throw error;
}
```

- [ ] **Step 2: Implement audit repository**

Create `src/lib/repositories/audit-logs.ts`:

```ts
import { createServiceSupabaseClient } from "../supabase/server";

export async function writeAuditLog(input: {
  actorKind: "apartment" | "admin" | "system";
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_kind: input.actorKind,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}
```

- [ ] **Step 3: Add notification route**

Create `src/app/notifications/page.tsx`:

```tsx
import { AppNav } from "../../components/AppNav";

export default function NotificationsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Notificacoes</h1>
      <p className="text-sm text-slate-600">Avisos sobre atrasos, transferencias e correcoes.</p>
      <AppNav />
    </main>
  );
}
```

- [ ] **Step 4: Wire actions to logs and notifications**

Update reservation lifecycle and transfer actions so these events call `writeAuditLog` and `createNotification`:

```ts
await writeAuditLog({
  actorKind: "apartment",
  actorId: session.apartmentId,
  action: "reservation.late",
  entityType: "reservation",
  entityId: reservationId,
  metadata: { penaltyMinutes },
});
```

- [ ] **Step 5: Verify**

Run:

```powershell
npm run build
```

Expected: build passes.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/repositories/notifications.ts src/lib/repositories/audit-logs.ts src/app/notifications src/lib/actions
git commit -m "feat: add notifications and audit logs"
```

## Task 12: Add Admin Authentication and Apartment Management

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/apartments/page.tsx`
- Create: `src/lib/actions/admin-apartments.ts`
- Modify: `src/lib/repositories/apartments.ts`

- [ ] **Step 1: Add admin login page**

Create `src/app/admin/login/page.tsx`:

```tsx
export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <form className="flex flex-col gap-3">
        <input className="rounded border p-3" name="email" type="email" placeholder="Email" required />
        <input className="rounded border p-3" name="password" type="password" placeholder="Senha" required />
        <button className="rounded bg-slate-900 p-3 text-white" type="submit">Entrar</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Add apartment admin page**

Create `src/app/admin/apartments/page.tsx`:

```tsx
export default function AdminApartmentsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Apartamentos</h1>
      <p className="text-sm text-slate-600">Gerencie moradores, ajuste de cota e redefinicao de PIN.</p>
    </main>
  );
}
```

- [ ] **Step 3: Add admin apartment actions**

Create `src/lib/actions/admin-apartments.ts`:

```ts
"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { updateApartmentSettings } from "../repositories/apartments";

export async function updateApartment(formData: FormData) {
  const apartmentId = String(formData.get("apartmentId"));
  const residentCount = Number(formData.get("residentCount"));
  const manualAdjustmentMinutes = Number(formData.get("manualAdjustmentMinutes"));
  await updateApartmentSettings({ apartmentId, residentCount, manualAdjustmentMinutes });
  revalidatePath("/admin/apartments");
}

export async function resetApartmentPin(formData: FormData) {
  const apartmentId = String(formData.get("apartmentId"));
  const pin = String(formData.get("pin"));
  const pinHash = await bcrypt.hash(pin, 10);
  await updateApartmentSettings({ apartmentId, pinHash });
  revalidatePath("/admin/apartments");
}
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run build
```

Expected: build passes.

- [ ] **Step 5: Commit**

```powershell
git add src/app/admin src/lib/actions/admin-apartments.ts src/lib/repositories/apartments.ts
git commit -m "feat: add admin apartment management"
```

## Task 13: Add Metrics Queries and Dashboards

**Files:**
- Create: `src/lib/repositories/metrics.ts`
- Create: `src/app/admin/metrics/page.tsx`
- Create: `src/app/metrics/page.tsx`
- Create: `tests/domain/metrics.test.ts`

- [ ] **Step 1: Add metrics test**

Create `tests/domain/metrics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getPeakSlots } from "../../src/lib/domain/metrics";

describe("metrics", () => {
  it("sorts slots by usage descending", () => {
    expect(
      getPeakSlots([
        { dayOfWeek: 1, hour: 10, usedMinutes: 60 },
        { dayOfWeek: 2, hour: 19, usedMinutes: 180 },
      ]),
    ).toEqual([{ dayOfWeek: 2, hour: 19, usedMinutes: 180 }, { dayOfWeek: 1, hour: 10, usedMinutes: 60 }]);
  });
});
```

- [ ] **Step 2: Implement metrics domain and repository**

Create `src/lib/domain/metrics.ts`:

```ts
export type UsageSlot = {
  dayOfWeek: number;
  hour: number;
  usedMinutes: number;
};

export function getPeakSlots(slots: UsageSlot[]): UsageSlot[] {
  return [...slots].sort((a, b) => b.usedMinutes - a.usedMinutes);
}
```

Create `src/lib/repositories/metrics.ts`:

```ts
import { createServiceSupabaseClient } from "../supabase/server";

export async function getAdminUsageMetrics() {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("reservations").select("apartment_id, starts_at, estimated_minutes, actual_minutes, status");
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 3: Add dashboard pages**

Create `src/app/admin/metrics/page.tsx`:

```tsx
import { getAdminUsageMetrics } from "../../../lib/repositories/metrics";

export default async function AdminMetricsPage() {
  const rows = await getAdminUsageMetrics();
  const totalMinutes = rows.reduce((sum, row) => sum + (row.actual_minutes ?? row.estimated_minutes ?? 0), 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Metricas</h1>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border p-4">
          <p className="text-sm text-slate-500">Uso total registrado</p>
          <p className="text-2xl font-semibold">{Math.round(totalMinutes / 60)}h</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-slate-500">Reservas</p>
          <p className="text-2xl font-semibold">{rows.length}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-slate-500">Atrasos</p>
          <p className="text-2xl font-semibold">{rows.filter((row) => row.status === "late").length}</p>
        </div>
      </section>
    </main>
  );
}
```

Create `src/app/metrics/page.tsx`:

```tsx
import { AppNav } from "../../components/AppNav";
import { getPeakSlots } from "../../lib/domain/metrics";

const sampleSlots = getPeakSlots([
  { dayOfWeek: 1, hour: 19, usedMinutes: 180 },
  { dayOfWeek: 3, hour: 10, usedMinutes: 60 },
  { dayOfWeek: 6, hour: 9, usedMinutes: 120 },
]);

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export default function ResidentMetricsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Horarios de pico</h1>
      <p className="text-sm text-slate-600">Use estes dados para escolher horarios mais tranquilos quando puder.</p>
      <section className="grid gap-2">
        {sampleSlots.map((slot) => (
          <div className="rounded border p-3" key={`${slot.dayOfWeek}-${slot.hour}`}>
            {dayNames[slot.dayOfWeek]} as {String(slot.hour).padStart(2, "0")}:00
          </div>
        ))}
      </section>
      <AppNav />
    </main>
  );
}
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- tests/domain/metrics.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/domain/metrics.ts src/lib/repositories/metrics.ts src/app/admin/metrics src/app/metrics tests/domain/metrics.test.ts
git commit -m "feat: add usage metrics"
```

## Task 14: Add E2E Smoke Tests

**Files:**
- Create: `tests/e2e/navigation.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Add Playwright smoke test**

Create `tests/e2e/navigation.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("resident pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Lava e Seca" })).toBeVisible();
  await page.getByRole("link", { name: "Agenda" }).click();
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
});
```

- [ ] **Step 2: Configure local web server**

Ensure `playwright.config.ts` contains:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
});
```

- [ ] **Step 3: Verify**

Run:

```powershell
npm run e2e
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add tests/e2e playwright.config.ts
git commit -m "test: add resident smoke tests"
```

## Task 15: Prepare Vercel and Supabase Deployment

**Files:**
- Create: `README.md`
- Create: `docs/deployment.md`
- Modify: `.env.example`

- [ ] **Step 1: Add README**

Create `README.md`:

```md
# Lava e Seca

App web para agenda compartilhada de uma lava e seca LG 16/10 kg em um predio com 14 apartamentos.

## Desenvolvimento

```powershell
npm install
npm run dev
```

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha os dados do Supabase.
```

- [ ] **Step 2: Add deployment notes**

Create `docs/deployment.md`:

```md
# Deploy

1. Criar projeto no Supabase.
2. Rodar `supabase/migrations/0001_initial_schema.sql`.
3. Criar admins no Supabase Auth.
4. Preencher variaveis no Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APARTMENT_SESSION_SECRET`
5. Fazer deploy na Vercel.
6. Trocar PIN inicial `1234` dos apartamentos.
```

- [ ] **Step 3: Verify production build**

Run:

```powershell
npm run test
npm run build
```

Expected: all tests pass and production build succeeds.

- [ ] **Step 4: Commit**

```powershell
git add README.md docs/deployment.md .env.example
git commit -m "docs: add deployment guide"
```

## Final Verification

- [ ] Run all unit tests:

```powershell
npm test
```

Expected: PASS.

- [ ] Run production build:

```powershell
npm run build
```

Expected: PASS.

- [ ] Run E2E smoke tests:

```powershell
npm run e2e
```

Expected: PASS.

- [ ] Check git status:

```powershell
git status --short
```

Expected: no uncommitted implementation changes except intentional local environment files.

## Coverage Review

This plan covers:

- apartment + PIN login: Task 6;
- admin login and admin area: Task 12;
- apartments 1 to 14: Task 4;
- weekly quota and weekly balance model: Tasks 2, 4, 13;
- current and next week reservations: Tasks 7 and 8;
- 07:00-23:00 rule: Tasks 2 and 7;
- 30-minute blocks and 4-hour max: Tasks 2, 3, 7;
- use now: Tasks 7 and 8;
- estimated and actual time: Tasks 4, 7, 9;
- early release, cancellation, late penalty: Task 9;
- offers, requests, partial acceptances: Task 10;
- internal notifications: Task 11;
- logs and auditability: Task 11;
- admin and resident metrics: Task 13;
- Vercel/Supabase deployment: Task 15.
