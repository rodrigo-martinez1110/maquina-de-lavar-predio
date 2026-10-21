-- Normaliza os saldos existentes e transforma os limites em regras do banco.
update weekly_balances wb
set quota_minutes = 600,
    manual_adjustment_minutes = 0,
    received_minutes = 0,
    sent_minutes = 0,
    refunded_minutes = 0,
    penalty_minutes = 0,
    reserved_minutes = (
      select coalesce(sum(r.estimated_minutes), 0)::integer
      from reservations r
      where r.apartment_id = wb.apartment_id
        and r.status in ('reserved', 'in_use', 'late')
        and date_trunc('week', r.starts_at at time zone 'America/Sao_Paulo')::date = wb.week_start
    ),
    updated_at = now()
where wb.week_start >= date_trunc('week', now() at time zone 'America/Sao_Paulo')::date;

create or replace function enforce_daily_reservation_limit()
returns trigger
language plpgsql
as $$
declare
  v_daily_reserved_minutes integer;
  v_day date;
begin
  if new.status not in ('reserved', 'in_use', 'late') then
    return new;
  end if;

  v_day := (new.starts_at at time zone 'America/Sao_Paulo')::date;
  perform pg_advisory_xact_lock(hashtext(new.apartment_id::text || ':' || v_day::text));

  select coalesce(sum(r.estimated_minutes), 0)::integer
    into v_daily_reserved_minutes
  from reservations r
  where r.apartment_id = new.apartment_id
    and r.id <> new.id
    and r.status in ('reserved', 'in_use', 'late')
    and (r.starts_at at time zone 'America/Sao_Paulo')::date = v_day;

  if v_daily_reserved_minutes + new.estimated_minutes > 480 then
    raise exception 'Limite diario de 8h atingido' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_daily_limit on reservations;
create trigger reservations_daily_limit
before insert or update of apartment_id, starts_at, estimated_minutes, status on reservations
for each row execute function enforce_daily_reservation_limit();
