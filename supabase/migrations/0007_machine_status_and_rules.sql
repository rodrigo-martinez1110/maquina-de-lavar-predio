alter table reservations add column if not exists started_at timestamptz;
alter table reservations add column if not exists finished_at timestamptz;

create type machine_report_status as enum ('open', 'resolved', 'maintenance');

create table machine_reports (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references apartments(id),
  status machine_report_status not null default 'open',
  kind text not null check (kind in ('occupied', 'finished', 'problem')),
  message text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table rule_acknowledgments (
  apartment_id uuid not null references apartments(id),
  version text not null,
  acknowledged_at timestamptz not null default now(),
  primary key (apartment_id, version)
);

create index machine_reports_status_idx on machine_reports (status, created_at desc);
alter table machine_reports enable row level security;
alter table rule_acknowledgments enable row level security;
revoke all on machine_reports from anon, authenticated;
revoke all on rule_acknowledgments from anon, authenticated;
