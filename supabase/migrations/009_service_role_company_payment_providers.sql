-- service_role grants for Stripe checkout admin writes (RLS unchanged)
grant select, insert, update, delete on table public.company_payment_providers to service_role;
