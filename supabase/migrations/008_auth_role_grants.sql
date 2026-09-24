-- Artecium Platform — auth role resolution for routing and session guards
-- Run AFTER 001–007
--
-- Post-login routing reads role slugs via user_roles → roles (slug).
-- RLS policies exist in 004 but table-level GRANT SELECT was missing, causing
-- PostgREST "permission denied for table user_roles" and defaulting users to CLIENT.

revoke all on public.roles from anon;
revoke all on public.roles from public;
grant select on table public.roles to authenticated;

revoke all on public.user_roles from anon;
revoke all on public.user_roles from public;
grant select on table public.user_roles to authenticated;

-- SECURITY DEFINER fallback: returns current user's role slugs without exposing tables.
create or replace function public.get_my_role_slugs()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(r.slug order by r.slug),
    array[]::text[]
  )
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = auth.uid();
$$;

revoke all on function public.get_my_role_slugs() from public;
grant execute on function public.get_my_role_slugs() to authenticated;

comment on function public.get_my_role_slugs() is
  'Returns role slugs for auth.uid(); used by client/server session and login redirects.';

comment on schema public is
  '008: auth role grants + get_my_role_slugs() for routing; RLS unchanged.';
