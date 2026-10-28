alter table reservations
add column non_use_reason text
check (non_use_reason in ('occupied', 'machine_problem', 'other'));

create or replace function report_reservation_nonuse(
  p_reservation_id uuid,
  p_apartment_id uuid,
  p_reason text,
  p_details text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation reservations%rowtype;
  v_balance weekly_balances%rowtype;
  v_week_start date;
  v_reported_at timestamptz;
begin
  if p_reason is null or p_reason not in ('occupied', 'machine_problem', 'other') then
    raise exception 'Motivo invalido' using errcode = 'P0001';
  end if;
  if p_details is not null and p_reason <> 'other' then
    raise exception 'Detalhe permitido apenas para outro motivo' using errcode = 'P0001';
  end if;
  if p_details is not null and char_length(p_details) > 160 then
    raise exception 'Detalhe muito longo' using errcode = 'P0001';
  end if;

  select * into v_reservation
  from reservations
  where id = p_reservation_id
  for update;

  if not found or v_reservation.apartment_id <> p_apartment_id then
    raise exception 'Reserva nao encontrada' using errcode = 'P0001';
  end if;

  v_week_start := date_trunc(
    'week', v_reservation.starts_at at time zone 'America/Sao_Paulo'
  )::date;
  select * into v_balance
  from weekly_balances
  where apartment_id = p_apartment_id and week_start = v_week_start
  for update;
  if not found then
    raise exception 'Saldo semanal nao encontrado' using errcode = 'P0001';
  end if;

  v_reported_at := clock_timestamp();
  if v_reservation.status not in ('reserved', 'in_use', 'late')
     or v_reported_at < v_reservation.starts_at or v_reported_at >= v_reservation.ends_at then
    raise exception 'Reserva fora do periodo para marcar nao utilizacao' using errcode = 'P0001';
  end if;

  update reservations
  set status = 'unregistered', non_use_reason = p_reason,
      released_at = v_reported_at, updated_at = v_reported_at
  where id = p_reservation_id;

  update weekly_balances
  set refunded_minutes = refunded_minutes + v_reservation.estimated_minutes,
      updated_at = v_reported_at
  where id = v_balance.id;

  insert into audit_logs (actor_kind, actor_id, action, entity_type, entity_id, metadata)
  values ('apartment', p_apartment_id, 'reservation.not_used', 'reservation',
          p_reservation_id,
          jsonb_build_object('reason', p_reason, 'details', p_details,
                             'refundedMinutes', v_reservation.estimated_minutes));
end;
$$;

revoke all on function report_reservation_nonuse(uuid, uuid, text, text)
from public, anon, authenticated;

grant execute on function report_reservation_nonuse(uuid, uuid, text, text)
to service_role;
