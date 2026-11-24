-- Local test-only objects (never apply to Supabase).

create or replace function phase2_harness._test_fail_customer_delete()
returns trigger
language plpgsql
as $$
begin
  if current_setting('phase2_harness.fail_customer_delete', true) = 'on' then
    raise exception 'harness_test_fail_customer_delete' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

drop trigger if exists harness_test_fail_customer_delete on public.booking_customers;
create trigger harness_test_fail_customer_delete
  before delete on public.booking_customers
  for each row execute function phase2_harness._test_fail_customer_delete();

create table if not exists phase2_harness.pg_test_barrier (
  run_id uuid primary key,
  phase text not null,
  updated_at timestamptz not null default now()
);
