create or replace function cancel_reservation_with_balance(
  p_reservation_id uuid,
  p_apartment_id uuid
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
  v_cancelled_at timestamptz;
  v_refund_minutes integer := 0;
begin
  select * into v_reservation
  from reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reserva nao encontrada' using errcode = 'P0001';
  end if;
  if v_reservation.apartment_id is distinct from p_apartment_id then
    raise exception 'Nao e possivel cancelar reserva de outro apartamento' using errcode = 'P0001';
  end if;
  if v_reservation.status not in ('reserved', 'in_use', 'late') then
    raise exception 'Reserva nao esta ativa para cancelamento' using errcode = 'P0001';
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

  -- Check the actual cancellation time after any wait for either row lock.
  v_cancelled_at := clock_timestamp();
  if v_cancelled_at >= v_reservation.starts_at then
    raise exception 'Nao e possivel cancelar reserva que ja comecou' using errcode = 'P0001';
  end if;
  if v_cancelled_at <= v_reservation.starts_at - interval '60 minutes' then
    v_refund_minutes := v_reservation.estimated_minutes;
  end if;

  update reservations
  set status = 'cancelled', cancelled_at = v_cancelled_at, updated_at = v_cancelled_at
  where id = p_reservation_id;

  if v_refund_minutes > 0 then
    update weekly_balances
    set reserved_minutes = greatest(0, reserved_minutes - v_refund_minutes),
        refunded_minutes = refunded_minutes + v_refund_minutes,
        updated_at = v_cancelled_at
    where id = v_balance.id;
  end if;

  insert into audit_logs (actor_kind, actor_id, action, entity_type, entity_id, metadata)
  values ('apartment', p_apartment_id, 'reservation.cancelled', 'reservation',
          p_reservation_id, jsonb_build_object('refundMinutes', v_refund_minutes));
end;
$$;

revoke all on function cancel_reservation_with_balance(uuid, uuid)
from public, anon, authenticated;

grant execute on function cancel_reservation_with_balance(uuid, uuid)
to service_role;
