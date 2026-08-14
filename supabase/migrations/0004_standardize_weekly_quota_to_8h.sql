-- Standardize the base weekly quota for the current and future weeks.
-- Existing manual_adjustment_minutes values are intentionally preserved for later review.
update weekly_balances
set quota_minutes = 480,
    updated_at = now()
where week_start >= date_trunc('week', now() at time zone 'America/Sao_Paulo')::date
  and quota_minutes <> 480;
