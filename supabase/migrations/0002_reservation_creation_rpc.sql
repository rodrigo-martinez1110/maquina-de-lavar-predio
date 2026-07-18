create or replace function create_reservation_with_balance(
  p_apartment_id uuid,
  p_kind reservation_kind,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_estimated_minutes integer,
  p_week_start date,
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
  v_reservation_id uuid;
begin
  select *
  into v_balance
  from weekly_balances
  where apartment_id = p_apartment_id
    and week_start = p_week_start
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

  if v_available_minutes < p_estimated_minutes then
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
    p_estimated_minutes
  )
  returning id into v_reservation_id;

  update weekly_balances
  set reserved_minutes = reserved_minutes + p_estimated_minutes,
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
      'estimatedMinutes', p_estimated_minutes,
      'weekStart', p_week_start
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
  integer,
  date,
  jsonb
) from public;

grant execute on function create_reservation_with_balance(
  uuid,
  reservation_kind,
  timestamptz,
  timestamptz,
  integer,
  date,
  jsonb
) to service_role;
