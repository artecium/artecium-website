-- Google OAuth tokens and metric row uniqueness (GA4 / Search Console integrations)
-- Tokens: service_role only — no authenticated access.

-- ---------------------------------------------------------------------------
-- OAuth authorization states (single-use CSRF / replay protection)
-- ---------------------------------------------------------------------------

create table if not exists public.google_oauth_authorization_states (
  id uuid primary key default gen_random_uuid(),
  integration text not null check (
    integration in ('google_analytics', 'google_search_console')
  ),
  company_id uuid not null references public.companies(id) on delete cascade,
  initiator_user_id uuid not null,
  initiator_context text not null check (initiator_context in ('staff', 'client')),
  connection_id uuid,
  return_path text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_google_oauth_auth_states_expires
  on public.google_oauth_authorization_states(expires_at)
  where consumed_at is null;

alter table public.google_oauth_authorization_states enable row level security;

-- No policies: authenticated/anon cannot read or write; service_role bypasses RLS.

revoke all on public.google_oauth_authorization_states from anon;
revoke all on public.google_oauth_authorization_states from public;
revoke all on public.google_oauth_authorization_states from authenticated;
grant all on table public.google_oauth_authorization_states to service_role;

-- ---------------------------------------------------------------------------
-- OAuth refresh tokens (server-only)
-- ---------------------------------------------------------------------------

create table if not exists public.google_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  integration text not null check (
    integration in ('google_analytics', 'google_search_console')
  ),
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  scopes text[] not null default '{}',
  google_account_email text,
  google_account_sub text,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_oauth_tokens_company_integration_unique unique (company_id, integration)
);

create index if not exists idx_google_oauth_tokens_company
  on public.google_oauth_tokens(company_id);

alter table public.google_oauth_tokens enable row level security;

revoke all on public.google_oauth_tokens from anon;
revoke all on public.google_oauth_tokens from public;
revoke all on public.google_oauth_tokens from authenticated;
grant all on table public.google_oauth_tokens to service_role;

-- ---------------------------------------------------------------------------
-- Dedupe daily metric rows, then enforce uniqueness per connection + date
-- ---------------------------------------------------------------------------

delete from public.analytics_data a
using public.analytics_data b
where a.connection_id = b.connection_id
  and a.metric_date = b.metric_date
  and a.id > b.id;

delete from public.seo_data a
using public.seo_data b
where a.connection_id = b.connection_id
  and a.metric_date = b.metric_date
  and a.id > b.id;

create unique index if not exists idx_analytics_data_connection_metric_date
  on public.analytics_data(connection_id, metric_date);

create unique index if not exists idx_seo_data_connection_metric_date
  on public.seo_data(connection_id, metric_date);

comment on table public.google_oauth_tokens is
  'Google OAuth credentials for GA4 and Search Console; accessible only via service_role.';
