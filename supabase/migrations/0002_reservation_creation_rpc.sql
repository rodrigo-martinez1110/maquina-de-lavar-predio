drop function if exists create_reservation_with_balance(
  uuid,
  reservation_kind,
  timestamptz,
  timestamptz,
  integer,
  date,
  jsonb
);

create or replace function create_reservation_with_balance(
  p_apartment_id uuid,
  p_kind reservation_kind,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_actor_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance weekly_balances%rowtype;
  v_available_minutes integer;
  v_duration_seconds numeric;
  v_estimated_minutes integer;
  v_week_start date;
  v_reservation_id uuid;
begin
  v_duration_seconds := extract(epoch from (p_ends_at - p_starts_at));
  v_week_start := date_trunc('week', p_starts_at at time zone 'America/Sao_Paulo')::date;

  if p_ends_at <= p_starts_at then
    raise exception 'Janela de reserva invalida'
      using errcode = 'P0001';
  end if;

  if v_duration_seconds < 30 * 60
    or v_duration_seconds > 240 * 60
    or mod(v_duration_seconds, 60) <> 0
    or mod(v_duration_seconds / 60, 30) <> 0 then
    raise exception 'Duracao de reserva invalida'
      using errcode = 'P0001';
  end if;

  v_estimated_minutes := (v_duration_seconds / 60)::integer;

  if (p_starts_at at time zone 'America/Sao_Paulo')::date <> (p_ends_at at time zone 'America/Sao_Paulo')::date then
    raise exception 'Reservas devem terminar no mesmo dia'
      using errcode = 'P0001';
  end if;

  if (p_starts_at at time zone 'America/Sao_Paulo')::time < time '08:00'
    or (p_ends_at at time zone 'America/Sao_Paulo')::time > time '23:00' then
    raise exception 'Reservas devem ocorrer entre 08:00 e 23:00'
      using errcode = 'P0001';
  end if;

  select *
  into v_balance
  from weekly_balances
  where apartment_id = p_apartment_id
    and week_start = v_week_start
  for update;

  if not found then
    raise exception 'Saldo semanal nao encontrado'
      using errcode = 'P0001';
  end if;

  v_available_minutes :=
    v_balance.quota_minutes
    + v_balance.manual_adjustment_minutes
    + v_balance.received_minutes
    - v_balance.sent_minutes
    - v_balance.reserved_minutes
    + v_balance.refunded_minutes
    - v_balance.penalty_minutes;

  if v_available_minutes < v_estimated_minutes then
    raise exception 'Saldo insuficiente'
      using errcode = 'P0001';
  end if;

  insert into reservations (
    apartment_id,
    kind,
    starts_at,
    ends_at,
    estimated_minutes
  )
  values (
    p_apartment_id,
    p_kind,
    p_starts_at,
    p_ends_at,
    v_estimated_minutes
  )
  returning id into v_reservation_id;

  update weekly_balances
  set reserved_minutes = reserved_minutes + v_estimated_minutes,
      updated_at = now()
  where id = v_balance.id;

  insert into audit_logs (
    actor_kind,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'apartment',
    p_apartment_id,
    'reservation.created',
    'reservation',
    v_reservation_id,
    p_actor_metadata || jsonb_build_object(
      'kind', p_kind,
      'startIso', p_starts_at,
      'endIso', p_ends_at,
      'estimatedMinutes', v_estimated_minutes,
      'weekStart', v_week_start
    )
  );

  return v_reservation_id;
end;
$$;

revoke all on function create_reservation_with_balance(
  uuid,
  reservation_kind,
  timestamptz,
  timestamptz,
  jsonb
) from public;

grant execute on function create_reservation_with_balance(
  uuid,
  reservation_kind,
  timestamptz,
  timestamptz,
  jsonb
) to service_role;
