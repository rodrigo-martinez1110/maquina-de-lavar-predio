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
