-- Phase 2 test harness — persistent run tracking (v2.6 candidata). Test Supabase project only.
-- Separate file from 023 v2.5; digest v3 unchanged.
-- Does NOT modify migration 022 or product RLS/grants.

create schema if not exists phase2_harness;

revoke all on schema phase2_harness from public;
revoke all on schema phase2_harness from anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table phase2_harness.runs (
  run_id uuid primary key,
  status text not null
    check (status in ('started', 'prepared', 'tested', 'cleanup_approved', 'cleaned', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  operator text not null,
  metadata jsonb not null default '{}'::jsonb,
  test_results jsonb,
  cleanup_status text not null default 'not_requested'
    check (cleanup_status in (
      'not_requested', 'pending_review', 'approved', 'rejected', 'executed', 'aborted'
    )),
  cleanup_approved_at timestamptz,
  cleanup_approved_by text,
  cleanup_approval_digest text,
  cleanup_executed_at timestamptz,
  failure_reason text,
  updated_at timestamptz not null default now(),
  next_snapshot_seq bigint not null default 1
);

create table phase2_harness.run_tracking (
  run_id uuid not null references phase2_harness.runs (run_id) on delete restrict,
  kind text not null check (kind in ('customer', 'note')),
  customer_id uuid not null,
  fixture_key text,
  created_at timestamptz not null default now(),
  fixture_removed_at timestamptz,
  primary key (run_id, kind, customer_id)
);

create index phase2_harness_run_tracking_run_id_idx
  on phase2_harness.run_tracking (run_id);

create table phase2_harness.cleanup_audit_snapshots (
  run_id uuid not null references phase2_harness.runs (run_id) on delete restrict,
  snapshot_seq bigint not null,
  snapshot_at timestamptz not null default now(),
  operator text not null,
  audit_payload jsonb not null,
  fixture_pairs jsonb not null,
  digest text not null,
  is_superseded boolean not null default false,
  primary key (run_id, snapshot_seq)
);

create unique index phase2_harness_one_active_snapshot_per_run
  on phase2_harness.cleanup_audit_snapshots (run_id)
  where (is_superseded = false);

create table phase2_harness.deployment_guard (
  id int primary key default 1 check (id = 1),
  cleanup_armed boolean not null default false,
  armed_at timestamptz,
  armed_by text,
  environment_tag text
);

insert into phase2_harness.deployment_guard (id, cleanup_armed)
values (1, false);

alter table phase2_harness.runs enable row level security;
alter table phase2_harness.run_tracking enable row level security;
alter table phase2_harness.cleanup_audit_snapshots enable row level security;
alter table phase2_harness.deployment_guard enable row level security;

revoke all on phase2_harness.runs from public, anon, authenticated, service_role;
revoke all on phase2_harness.run_tracking from public, anon, authenticated, service_role;
revoke all on phase2_harness.cleanup_audit_snapshots from public, anon, authenticated, service_role;
revoke all on phase2_harness.deployment_guard from public, anon, authenticated, service_role;

comment on schema phase2_harness is 'Phase 2 notes/RLS test harness. Not part of booking multi-tenant API.';
comment on table phase2_harness.deployment_guard is
  'Fail-closed gate for cleanup_execute. Arm manually on authorized test project only.';
comment on table phase2_harness.run_tracking is
  'Append-only creation proof; no FK to booking_customers. INSERT only after product INSERT.';

-- ---------------------------------------------------------------------------
-- Fixture contract (must stay aligned with booking-phase2-p2-notes-lib.mjs)
-- ---------------------------------------------------------------------------

create or replace function phase2_harness.expected_fixture_email(p_key text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_key
    when 'p15' then 'phase2-notes-fixture-a@artecium.test'
    when 'p16' then 'phase2-notes-fixture-p16-a@artecium.test'
    when 'p17' then 'phase2-notes-fixture-p17-a@artecium.test'
    when 'p19' then 'phase2-notes-fixture-b@artecium.test'
    when 'p21' then 'phase2-notes-fixture-p21-a@artecium.test'
    when 'p22' then 'phase2-notes-fixture-p22-a@artecium.test'
    else null
  end;
$$;

create or replace function phase2_harness.json_escape(p_text text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_i int;
  v_c text;
  v_out text := '';
  v_code int;
begin
  if p_text is null then
    return null;
  end if;
  for v_i in 1 .. length(p_text) loop
    v_c := substr(p_text, v_i, 1);
    v_code := ascii(v_c);
    if v_c = E'\\' then
      v_out := v_out || E'\\\\';
    elsif v_c = '"' then
      v_out := v_out || E'\\"';
    elsif v_code < 32 then
      v_out := v_out || '\u' || lpad(to_hex(v_code), 4, '0');
    else
      v_out := v_out || v_c;
    end if;
  end loop;
  return v_out;
end;
$$;

create or replace function phase2_harness.normalize_uuid_text(p uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p is null then null else lower(p::text) end;
$$;

create or replace function phase2_harness.validate_fixture_pairs(
  p_fixture_pairs jsonb,
  p_business_a_id uuid,
  p_business_b_id uuid
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_keys text[] := array['p15', 'p16', 'p17', 'p19', 'p21', 'p22'];
  v_key text;
  v_found boolean;
  v_elem jsonb;
  v_fixture_key text;
  v_customer_id uuid;
  v_email text;
  v_business_id uuid;
  v_expected_email text;
  v_expected_business uuid;
  v_seen_keys text[] := '{}';
  v_seen_ids uuid[] := '{}';
  v_out jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_fixture_pairs) <> 'array' then
    raise exception 'fixture_pairs must be a JSON array' using errcode = 'P0001';
  end if;

  if jsonb_array_length(p_fixture_pairs) <> 6 then
    raise exception 'fixture_pairs must contain exactly 6 entries' using errcode = 'P0001';
  end if;

  foreach v_key in array v_keys loop
    v_found := false;
    for v_elem in select value from jsonb_array_elements(p_fixture_pairs) loop
      v_fixture_key := v_elem ->> 'fixture_key';
      if v_fixture_key = v_key then
        v_found := true;
        if v_fixture_key = any (v_seen_keys) then
          raise exception 'duplicate fixture_key %', v_fixture_key using errcode = 'P0001';
        end if;
        v_seen_keys := array_append(v_seen_keys, v_fixture_key);

        begin
          v_customer_id := (v_elem ->> 'customer_id')::uuid;
        exception when others then
          raise exception 'invalid customer_id for %', v_fixture_key using errcode = 'P0001';
        end;

        if v_customer_id = any (v_seen_ids) then
          raise exception 'duplicate customer_id %', v_customer_id using errcode = 'P0001';
        end if;
        v_seen_ids := array_append(v_seen_ids, v_customer_id);

        v_email := lower(trim(coalesce(v_elem ->> 'email_normalized', v_elem ->> 'email', '')));
        if v_email = '' then
          raise exception 'missing email for %', v_fixture_key using errcode = 'P0001';
        end if;

        begin
          v_business_id := (v_elem ->> 'business_id')::uuid;
        exception when others then
          raise exception 'invalid business_id for %', v_fixture_key using errcode = 'P0001';
        end;

        v_expected_email := phase2_harness.expected_fixture_email(v_fixture_key);
        if v_expected_email is null then
          raise exception 'unknown fixture_key %', v_fixture_key using errcode = 'P0001';
        end if;
        if v_email <> lower(v_expected_email) then
          raise exception 'email mismatch for %', v_fixture_key using errcode = 'P0001';
        end if;
        if v_email not like 'phase2-notes-fixture%@artecium.test' then
          raise exception 'email not fixture-shaped for %', v_fixture_key using errcode = 'P0001';
        end if;

        v_expected_business := case when v_fixture_key = 'p19' then p_business_b_id else p_business_a_id end;
        if v_business_id is distinct from v_expected_business then
          raise exception 'business_id mismatch for %', v_fixture_key using errcode = 'P0001';
        end if;

        v_out := v_out || jsonb_build_array(jsonb_build_object(
          'fixture_key', v_fixture_key,
          'customer_id', phase2_harness.normalize_uuid_text(v_customer_id),
          'email_normalized', v_email,
          'business_id', phase2_harness.normalize_uuid_text(v_business_id)
        ));
      end if;
    end loop;
    if not v_found then
      raise exception 'missing fixture_key %', v_key using errcode = 'P0001';
    end if;
  end loop;

  return (
    select jsonb_agg(elem order by elem ->> 'fixture_key')
    from jsonb_array_elements(v_out) as elem
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixture creation tracking (SECURITY DEFINER; no SET ROLE — session scripts use JWT)
-- ---------------------------------------------------------------------------

create or replace function phase2_harness._assert_run_allows_tracking(p_run_id uuid)
returns phase2_harness.runs
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row phase2_harness.runs;
begin
  select * into v_row from phase2_harness.runs where run_id = p_run_id;
  if not found then
    raise exception 'run not found' using errcode = 'P0001';
  end if;
  if v_row.status not in ('started', 'prepared') then
    raise exception 'tracking only allowed during prep (status %)', v_row.status using errcode = 'P0001';
  end if;
  return v_row;
end;
$$;

create or replace function phase2_harness._validate_fixture_customer_row(
  p_fixture_key text,
  p_customer_id uuid,
  p_business_a_id uuid,
  p_business_b_id uuid
)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  v_expected_email text;
  v_expected_business uuid;
  v_c public.booking_customers%rowtype;
begin
  v_expected_email := phase2_harness.expected_fixture_email(p_fixture_key);
  if v_expected_email is null then
    raise exception 'unknown fixture_key %', p_fixture_key using errcode = 'P0001';
  end if;
  v_expected_business := case when p_fixture_key = 'p19' then p_business_b_id else p_business_a_id end;

  select * into v_c from public.booking_customers where id = p_customer_id;
  if not found then
    raise exception 'customer % not found for tracking', p_customer_id using errcode = 'P0001';
  end if;
  if lower(v_c.email) is distinct from lower(v_expected_email) then
    raise exception 'customer email mismatch for %', p_fixture_key using errcode = 'P0001';
  end if;
  if v_c.business_id is distinct from v_expected_business then
    raise exception 'customer business_id mismatch for %', p_fixture_key using errcode = 'P0001';
  end if;
  if v_c.email not like 'phase2-notes-fixture%@artecium.test' then
    raise exception 'customer email not fixture-shaped for %', p_fixture_key using errcode = 'P0001';
  end if;
end;
$$;

create or replace function phase2_harness.track_fixture_customer(
  p_run_id uuid,
  p_customer_id uuid,
  p_fixture_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run phase2_harness.runs;
  v_business_a uuid;
  v_business_b uuid;
  v_c public.booking_customers%rowtype;
begin
  v_run := phase2_harness._assert_run_allows_tracking(p_run_id);
  v_business_a := (v_run.metadata ->> 'business_a_id')::uuid;
  v_business_b := (v_run.metadata ->> 'business_b_id')::uuid;
  if v_business_a is null or v_business_b is null then
    raise exception 'run metadata must include business_a_id and business_b_id' using errcode = 'P0001';
  end if;

  perform phase2_harness._validate_fixture_customer_row(p_fixture_key, p_customer_id, v_business_a, v_business_b);

  select * into v_c from public.booking_customers where id = p_customer_id;
  if v_c.created_at < v_run.started_at - interval '5 seconds' then
    raise exception 'customer predates run (not created this prep)' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from phase2_harness.run_tracking t
    where t.run_id = p_run_id and t.kind = 'customer' and t.customer_id = p_customer_id
  ) then
    raise exception 'customer already tracked for run' using errcode = 'P0001';
  end if;

  insert into phase2_harness.run_tracking (run_id, kind, customer_id, fixture_key)
  values (p_run_id, 'customer', p_customer_id, p_fixture_key);
end;
$$;

create or replace function phase2_harness.track_fixture_note(
  p_run_id uuid,
  p_customer_id uuid,
  p_fixture_key text,
  p_notes_exact text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run phase2_harness.runs;
  v_business_a uuid;
  v_business_b uuid;
  v_notes text;
begin
  if p_notes_exact is null or p_notes_exact = '' then
    raise exception 'p_notes_exact required' using errcode = 'P0001';
  end if;
  if p_notes_exact not like 'phase2-%' then
    raise exception 'note must use phase2- prefix for harness' using errcode = 'P0001';
  end if;

  v_run := phase2_harness._assert_run_allows_tracking(p_run_id);
  v_business_a := (v_run.metadata ->> 'business_a_id')::uuid;
  v_business_b := (v_run.metadata ->> 'business_b_id')::uuid;
  if v_business_a is null or v_business_b is null then
    raise exception 'run metadata must include business_a_id and business_b_id' using errcode = 'P0001';
  end if;

  perform phase2_harness._validate_fixture_customer_row(p_fixture_key, p_customer_id, v_business_a, v_business_b);

  select n.notes into v_notes
  from public.booking_customer_internal_notes n
  where n.customer_id = p_customer_id;

  if not found then
    raise exception 'note row missing for customer %', p_customer_id using errcode = 'P0001';
  end if;
  if v_notes is distinct from p_notes_exact then
    raise exception 'note text mismatch for tracking' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from phase2_harness.run_tracking t
    where t.run_id = p_run_id and t.kind = 'note' and t.customer_id = p_customer_id
  ) then
    raise exception 'note already tracked for run' using errcode = 'P0001';
  end if;

  insert into phase2_harness.run_tracking (run_id, kind, customer_id, fixture_key)
  values (p_run_id, 'note', p_customer_id, p_fixture_key);
end;
$$;

comment on function phase2_harness.track_fixture_customer(uuid, uuid, text) is
  'Administrative prep only: record customer creation for run after INSERT in same transaction. Not RLS proof.';
comment on function phase2_harness.track_fixture_note(uuid, uuid, text, text) is
  'Administrative prep only: record note creation after authenticated INSERT + RESET ROLE in same session txn. Not RLS proof.';

-- ---------------------------------------------------------------------------
-- Cleanup eligibility + deployment guard (fail-closed)
-- ---------------------------------------------------------------------------

create or replace function phase2_harness._cleanup_armed()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select g.cleanup_armed from phase2_harness.deployment_guard g where g.id = 1),
    false
  );
$$;

create or replace function phase2_harness._assert_cleanup_armed()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not phase2_harness._cleanup_armed() then
    raise exception 'cleanup_execute: environment not armed (phase2_harness.deployment_guard)'
      using errcode = 'P0001';
  end if;
end;
$$;

-- True when a note row exists that prevents customer delete (022: at most one row per customer_id).
create or replace function phase2_harness.internal_note_blocks_customer_delete(
  p_run_id uuid,
  p_customer_id uuid
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.booking_customer_internal_notes n
    where n.customer_id = p_customer_id
      and (
        n.notes is null
        or n.notes not like 'phase2-%'
        or not exists (
          select 1
          from phase2_harness.run_tracking t
          where t.run_id = p_run_id
            and t.kind = 'note'
            and t.customer_id = n.customer_id
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Audit collection + canonical digest (v3)
-- ---------------------------------------------------------------------------

create or replace function phase2_harness.compute_cleanup_digest(
  p_run_id uuid,
  p_fixture_pairs jsonb
)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_run_id text := phase2_harness.normalize_uuid_text(p_run_id);
  v_pairs text := '';
  v_fixture_pairs jsonb;
  v_business_a uuid;
  v_business_b uuid;
  v_canonical text;
  v_records text := '';
  v_pair text;
  v_rec record;
  v_section_order text[] := array[
    'created_this_run',
    'pre_existing_untracked_customer',
    'pre_existing_untracked_note',
    'to_delete_note',
    'to_delete_customer'
  ];
  v_sec text;
begin
  select
    (r.metadata ->> 'business_a_id')::uuid,
    (r.metadata ->> 'business_b_id')::uuid
  into v_business_a, v_business_b
  from phase2_harness.runs r
  where r.run_id = p_run_id;

  if v_business_a is null or v_business_b is null then
    raise exception 'run metadata must include business_a_id and business_b_id' using errcode = 'P0001';
  end if;

  v_fixture_pairs := phase2_harness.validate_fixture_pairs(p_fixture_pairs, v_business_a, v_business_b);

  v_canonical := '{"digest_algorithm_version":3,"run_id":"' || phase2_harness.json_escape(v_run_id) || '","fixture_pairs":[';

  for v_rec in
    select elem
    from jsonb_array_elements(v_fixture_pairs) elem
    order by elem ->> 'fixture_key'
  loop
    if v_pairs <> '' then v_pairs := v_pairs || ','; end if;
    v_pairs := v_pairs || '{"fixture_key":"' || phase2_harness.json_escape(v_rec.elem ->> 'fixture_key') || '",'
      || '"customer_id":"' || phase2_harness.json_escape(v_rec.elem ->> 'customer_id') || '",'
      || '"email_normalized":"' || phase2_harness.json_escape(v_rec.elem ->> 'email_normalized') || '",'
      || '"business_id":"' || phase2_harness.json_escape(v_rec.elem ->> 'business_id') || '"}';
  end loop;
  v_canonical := v_canonical || v_pairs || '],"records":[';

  foreach v_sec in array v_section_order loop
    for v_rec in
      with fp as (
        select
          (e ->> 'fixture_key') as fixture_key,
          (e ->> 'customer_id')::uuid as customer_id,
          lower(e ->> 'email_normalized') as email_normalized,
          (e ->> 'business_id')::uuid as business_id
        from jsonb_array_elements(v_fixture_pairs) e
      ),
      created as (
        select
          'created_this_run'::text as section,
          t.kind,
          t.fixture_key,
          t.customer_id,
          null::text as email_normalized,
          null::uuid as business_id,
          case when t.kind = 'note' then n.notes else null end as notes
        from phase2_harness.run_tracking t
        left join public.booking_customer_internal_notes n
          on t.kind = 'note' and n.customer_id = t.customer_id
        where t.run_id = p_run_id
      ),
      pre_cust as (
        select
          'pre_existing_untracked_customer'::text as section,
          null::text as kind,
          fp.fixture_key,
          c.id as customer_id,
          lower(c.email) as email_normalized,
          c.business_id,
          null::text as notes
        from public.booking_customers c
        inner join fp on fp.customer_id = c.id
          and lower(c.email) = fp.email_normalized
          and c.business_id = fp.business_id
        where c.email like 'phase2-notes-fixture%@artecium.test'
          and not exists (
            select 1 from phase2_harness.run_tracking t
            where t.run_id = p_run_id and t.kind = 'customer' and t.customer_id = c.id
          )
      ),
      pre_note as (
        select
          'pre_existing_untracked_note'::text as section,
          null::text as kind,
          fp.fixture_key,
          n.customer_id,
          lower(c.email) as email_normalized,
          c.business_id,
          n.notes
        from public.booking_customer_internal_notes n
        inner join public.booking_customers c on c.id = n.customer_id
        inner join fp on fp.customer_id = c.id
          and lower(c.email) = fp.email_normalized
          and c.business_id = fp.business_id
        where n.notes like 'phase2-%'
          and not exists (
            select 1 from phase2_harness.run_tracking t
            where t.run_id = p_run_id and t.kind = 'note' and t.customer_id = n.customer_id
          )
      ),
      del_note as (
        select
          'to_delete_note'::text as section,
          'note'::text as kind,
          fp.fixture_key,
          n.customer_id,
          lower(c.email) as email_normalized,
          c.business_id,
          n.notes
        from public.booking_customer_internal_notes n
        inner join public.booking_customers c on c.id = n.customer_id
        inner join fp on fp.customer_id = c.id
          and lower(c.email) = fp.email_normalized
          and c.business_id = fp.business_id
        inner join phase2_harness.run_tracking t
          on t.run_id = p_run_id and t.kind = 'note' and t.customer_id = n.customer_id
        where n.notes like 'phase2-%'
      ),
      del_cust as (
        select
          'to_delete_customer'::text as section,
          'customer'::text as kind,
          fp.fixture_key,
          c.id as customer_id,
          lower(c.email) as email_normalized,
          c.business_id,
          null::text as notes
        from public.booking_customers c
        inner join fp on fp.customer_id = c.id
          and lower(c.email) = fp.email_normalized
          and c.business_id = fp.business_id
        inner join phase2_harness.run_tracking t
          on t.run_id = p_run_id and t.kind = 'customer' and t.customer_id = c.id
        where c.email like 'phase2-notes-fixture%@artecium.test'
          and not phase2_harness.internal_note_blocks_customer_delete(p_run_id, c.id)
      ),
      all_rows as (
        select section, kind, fixture_key, customer_id, email_normalized, business_id, notes from created
        union all select section, kind, fixture_key, customer_id, email_normalized, business_id, notes from pre_cust
        union all select section, kind, fixture_key, customer_id, email_normalized, business_id, notes from pre_note
        union all select section, kind, fixture_key, customer_id, email_normalized, business_id, notes from del_note
        union all select section, kind, fixture_key, customer_id, email_normalized, business_id, notes from del_cust
      )
      select *
      from all_rows
      where section = v_sec
      order by
        kind nulls first,
        fixture_key nulls last,
        customer_id nulls last,
        email_normalized nulls last,
        business_id nulls last,
        notes nulls first
    loop
      if v_records <> '' then v_records := v_records || ','; end if;
      v_pair := '{"section":"' || phase2_harness.json_escape(v_rec.section) || '",'
        || '"run_id":"' || phase2_harness.json_escape(v_run_id) || '",'
        || '"kind":' || case when v_rec.kind is null then 'null' else '"' || phase2_harness.json_escape(v_rec.kind) || '"' end || ','
        || '"fixture_key":' || case when v_rec.fixture_key is null then 'null' else '"' || phase2_harness.json_escape(v_rec.fixture_key) || '"' end || ','
        || '"customer_id":' || case when v_rec.customer_id is null then 'null' else '"' || phase2_harness.normalize_uuid_text(v_rec.customer_id) || '"' end || ','
        || '"email_normalized":' || case when v_rec.email_normalized is null then 'null' else '"' || phase2_harness.json_escape(v_rec.email_normalized) || '"' end || ','
        || '"business_id":' || case when v_rec.business_id is null then 'null' else '"' || phase2_harness.normalize_uuid_text(v_rec.business_id) || '"' end || ','
        || '"notes":' || case when v_rec.notes is null then 'null' else '"' || phase2_harness.json_escape(v_rec.notes) || '"' end
        || '}';
      v_records := v_records || v_pair;
    end loop;
  end loop;

  v_canonical := v_canonical || v_records || ']}';
  return encode(extensions.digest(v_canonical, 'sha256'), 'hex');
end;
$$;

-- ---------------------------------------------------------------------------
-- Run lifecycle
-- ---------------------------------------------------------------------------

create or replace function phase2_harness.run_start(
  p_run_id uuid,
  p_operator text,
  p_metadata jsonb default '{}'::jsonb
)
returns phase2_harness.runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row phase2_harness.runs;
begin
  if p_operator is null or trim(p_operator) = '' then
    raise exception 'operator required' using errcode = 'P0001';
  end if;
  insert into phase2_harness.runs (run_id, status, operator, metadata)
  values (p_run_id, 'started', trim(p_operator), coalesce(p_metadata, '{}'::jsonb))
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function phase2_harness.mark_prepared(p_run_id uuid)
returns phase2_harness.runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row phase2_harness.runs;
begin
  select * into v_row from phase2_harness.runs where run_id = p_run_id for update;
  if not found then raise exception 'run not found' using errcode = 'P0001'; end if;
  if v_row.status <> 'started' then
    raise exception 'mark_prepared requires status started (got %)', v_row.status using errcode = 'P0001';
  end if;
  update phase2_harness.runs
  set status = 'prepared', updated_at = now()
  where run_id = p_run_id
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function phase2_harness.mark_tested(
  p_run_id uuid,
  p_test_results jsonb default null
)
returns phase2_harness.runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row phase2_harness.runs;
begin
  select * into v_row from phase2_harness.runs where run_id = p_run_id for update;
  if not found then raise exception 'run not found' using errcode = 'P0001'; end if;
  if v_row.status <> 'prepared' then
    raise exception 'mark_tested requires status prepared (got %)', v_row.status using errcode = 'P0001';
  end if;
  update phase2_harness.runs
  set status = 'tested', test_results = p_test_results, updated_at = now()
  where run_id = p_run_id
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function phase2_harness.mark_failed(
  p_run_id uuid,
  p_reason text default null
)
returns phase2_harness.runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row phase2_harness.runs;
begin
  select * into v_row from phase2_harness.runs where run_id = p_run_id for update;
  if not found then raise exception 'run not found' using errcode = 'P0001'; end if;
  if v_row.status = 'cleaned' then
    raise exception 'cannot fail a cleaned run' using errcode = 'P0001';
  end if;
  update phase2_harness.runs
  set status = 'failed',
      failure_reason = p_reason,
      finished_at = coalesce(finished_at, now()),
      updated_at = now()
  where run_id = p_run_id
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function phase2_harness._invalidate_approval_locked(p_run_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update phase2_harness.runs
  set status = case when status = 'cleanup_approved' then 'tested' else status end,
      cleanup_approval_digest = null,
      cleanup_approved_at = null,
      cleanup_approved_by = null,
      updated_at = now()
  where run_id = p_run_id;
end;
$$;

create or replace function phase2_harness.cleanup_preview(
  p_run_id uuid,
  p_operator text,
  p_fixture_pairs jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row phase2_harness.runs;
  v_business_a uuid;
  v_business_b uuid;
  v_normalized jsonb;
  v_digest text;
  v_seq bigint;
  v_payload jsonb;
begin
  select * into v_row from phase2_harness.runs where run_id = p_run_id for update;
  if not found then raise exception 'run not found' using errcode = 'P0001'; end if;

  if v_row.status not in ('tested', 'cleanup_approved') then
    raise exception 'cleanup_preview requires status tested or cleanup_approved (got %)', v_row.status
      using errcode = 'P0001';
  end if;
  if v_row.status = 'tested' and v_row.cleanup_status not in (
    'not_requested', 'pending_review', 'rejected', 'aborted', 'approved'
  ) then
    raise exception 'cleanup_preview not allowed for cleanup_status %', v_row.cleanup_status using errcode = 'P0001';
  end if;

  select
    (v_row.metadata ->> 'business_a_id')::uuid,
    (v_row.metadata ->> 'business_b_id')::uuid
  into v_business_a, v_business_b;

  v_normalized := phase2_harness.validate_fixture_pairs(p_fixture_pairs, v_business_a, v_business_b);
  v_digest := phase2_harness.compute_cleanup_digest(p_run_id, v_normalized);

  update phase2_harness.cleanup_audit_snapshots
  set is_superseded = true
  where run_id = p_run_id and is_superseded = false;

  v_seq := v_row.next_snapshot_seq;
  update phase2_harness.runs
  set next_snapshot_seq = next_snapshot_seq + 1,
      cleanup_status = 'pending_review',
      updated_at = now()
  where run_id = p_run_id;

  perform phase2_harness._invalidate_approval_locked(p_run_id);

  v_payload := jsonb_build_object(
    'digest', v_digest,
    'fixture_pairs', v_normalized,
    'generated_at', now()
  );

  insert into phase2_harness.cleanup_audit_snapshots (
    run_id, snapshot_seq, operator, audit_payload, fixture_pairs, digest, is_superseded
  ) values (
    p_run_id, v_seq, trim(p_operator), v_payload, v_normalized, v_digest, false
  );

  return jsonb_build_object(
    'run_id', p_run_id,
    'snapshot_seq', v_seq,
    'digest', v_digest,
    'fixture_pairs', v_normalized
  );
end;
$$;

create or replace function phase2_harness.cleanup_approve(
  p_run_id uuid,
  p_operator text,
  p_digest text
)
returns phase2_harness.runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row phase2_harness.runs;
  v_snap record;
begin
  select * into v_row from phase2_harness.runs where run_id = p_run_id for update;
  if not found then raise exception 'run not found' using errcode = 'P0001'; end if;
  if v_row.status <> 'tested' then
    raise exception 'cleanup_approve requires status tested (got %)', v_row.status using errcode = 'P0001';
  end if;

  select * into v_snap
  from phase2_harness.cleanup_audit_snapshots s
  where s.run_id = p_run_id and s.is_superseded = false
  order by s.snapshot_seq desc
  limit 1;

  if not found then raise exception 'no active snapshot for run' using errcode = 'P0001'; end if;
  if lower(trim(p_digest)) <> lower(trim(v_snap.digest)) then
    raise exception 'digest mismatch with active snapshot' using errcode = 'P0001';
  end if;

  update phase2_harness.runs
  set status = 'cleanup_approved',
      cleanup_status = 'approved',
      cleanup_approval_digest = lower(trim(v_snap.digest)),
      cleanup_approved_at = now(),
      cleanup_approved_by = trim(p_operator),
      updated_at = now()
  where run_id = p_run_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function phase2_harness._cleanup_abort_run(
  p_run_id uuid,
  p_failure_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update phase2_harness.runs
  set status = 'tested',
      cleanup_status = 'aborted',
      cleanup_approval_digest = null,
      cleanup_approved_at = null,
      cleanup_approved_by = null,
      failure_reason = p_failure_reason,
      updated_at = now()
  where run_id = p_run_id;
end;
$$;

create or replace function phase2_harness.cleanup_reject(
  p_run_id uuid,
  p_operator text,
  p_reason text default null
)
returns phase2_harness.runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row phase2_harness.runs;
begin
  select * into v_row from phase2_harness.runs where run_id = p_run_id for update;
  if not found then raise exception 'run not found' using errcode = 'P0001'; end if;
  if v_row.status <> 'tested' then
    raise exception 'cleanup_reject requires status tested (got %)', v_row.status using errcode = 'P0001';
  end if;

  perform phase2_harness._invalidate_approval_locked(p_run_id);

  update phase2_harness.runs
  set cleanup_status = 'rejected',
      updated_at = now(),
      failure_reason = coalesce(p_reason, failure_reason)
  where run_id = p_run_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function phase2_harness.cleanup_execute(
  p_run_id uuid,
  p_operator text,
  p_digest text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row phase2_harness.runs;
  v_snap record;
  v_recalc text;
  v_deleted_notes int := 0;
  v_deleted_customers int := 0;
  v_business_a uuid;
  v_business_b uuid;
  v_fixture_pairs jsonb;
  v_snapshot_digest text;
begin
  select * into v_row from phase2_harness.runs where run_id = p_run_id for update;
  if not found then raise exception 'run not found' using errcode = 'P0001'; end if;

  if v_row.status = 'cleaned' then
    raise exception 'run already cleaned' using errcode = 'P0001';
  end if;
  if v_row.status <> 'cleanup_approved' or v_row.cleanup_status <> 'approved' then
    raise exception 'cleanup_execute requires cleanup_approved + approved' using errcode = 'P0001';
  end if;
  if v_row.cleanup_approval_digest is null then
    raise exception 'missing approval digest' using errcode = 'P0001';
  end if;
  if lower(trim(p_digest)) <> lower(v_row.cleanup_approval_digest) then
    raise exception 'digest argument does not match approved digest' using errcode = 'P0001';
  end if;

  select * into v_snap
  from phase2_harness.cleanup_audit_snapshots s
  where s.run_id = p_run_id and s.is_superseded = false
  order by s.snapshot_seq desc
  limit 1;
  if not found then raise exception 'no active snapshot' using errcode = 'P0001'; end if;

  v_business_a := (v_row.metadata ->> 'business_a_id')::uuid;
  v_business_b := (v_row.metadata ->> 'business_b_id')::uuid;
  if v_business_a is null or v_business_b is null then
    raise exception 'run metadata must include business_a_id and business_b_id' using errcode = 'P0001';
  end if;

  begin
    v_fixture_pairs := phase2_harness.validate_fixture_pairs(v_snap.fixture_pairs, v_business_a, v_business_b);
  exception
    when others then
      perform phase2_harness._cleanup_abort_run(p_run_id, 'invalid_fixture_pairs');
      return jsonb_build_object(
        'ok', false,
        'reason', 'invalid_fixture_pairs',
        'detail', sqlerrm
      );
  end;

  v_snapshot_digest := phase2_harness.compute_cleanup_digest(p_run_id, v_fixture_pairs);
  if lower(v_snapshot_digest) <> lower(trim(v_snap.digest)) then
    perform phase2_harness._cleanup_abort_run(p_run_id, 'snapshot_digest_invalid');
    return jsonb_build_object(
      'ok', false,
      'reason', 'snapshot_digest_invalid',
      'snapshot_digest', v_snap.digest,
      'recalc', v_snapshot_digest
    );
  end if;

  if not phase2_harness._cleanup_armed() then
    perform phase2_harness._cleanup_abort_run(p_run_id, 'cleanup_not_armed');
    return jsonb_build_object('ok', false, 'reason', 'cleanup_not_armed');
  end if;

  -- v2.6 C1: all six validated fixture customers must exist before row locks.
  if exists (
    select 1
    from jsonb_array_elements(v_fixture_pairs) e
    where not exists (
      select 1
      from public.booking_customers c
      where c.id = (e ->> 'customer_id')::uuid
        and lower(c.email) = lower(e ->> 'email_normalized')
        and c.business_id = (e ->> 'business_id')::uuid
        and c.email like 'phase2-notes-fixture%@artecium.test'
    )
  ) then
    perform phase2_harness._cleanup_abort_run(p_run_id, 'fixture_customers_incomplete');
    return jsonb_build_object('ok', false, 'reason', 'fixture_customers_incomplete');
  end if;

  -- v2.6 digest stabilization: lock harness run_tracking, all validated fixture customers (F ⊃ S), then notes.
  -- Post-lock digest recalc vs approved digest before any DELETE (digest_mismatch_after_lock).

  perform 1
  from phase2_harness.run_tracking tr
  where tr.run_id = p_run_id
  order by tr.kind, tr.customer_id
  for update;

  perform 1
  from public.booking_customers c
  inner join lateral (
    select
      (e ->> 'customer_id')::uuid as customer_id,
      lower(e ->> 'email_normalized') as email_normalized,
      (e ->> 'business_id')::uuid as business_id
    from jsonb_array_elements(v_fixture_pairs) e
  ) fp on fp.customer_id = c.id
    and lower(c.email) = fp.email_normalized
    and c.business_id = fp.business_id
  where c.email like 'phase2-notes-fixture%@artecium.test'
  order by c.id
  for update of c;

  perform 1
  from public.booking_customer_internal_notes n
  inner join public.booking_customers c on c.id = n.customer_id
  inner join lateral (
    select
      (e ->> 'customer_id')::uuid as customer_id,
      lower(e ->> 'email_normalized') as email_normalized,
      (e ->> 'business_id')::uuid as business_id
    from jsonb_array_elements(v_fixture_pairs) e
  ) fp on fp.customer_id = c.id
    and lower(c.email) = fp.email_normalized
    and c.business_id = fp.business_id
  where c.email like 'phase2-notes-fixture%@artecium.test'
  order by n.customer_id
  for update of n;

  v_recalc := phase2_harness.compute_cleanup_digest(p_run_id, v_fixture_pairs);
  if lower(v_recalc) <> lower(v_row.cleanup_approval_digest) then
    perform phase2_harness._cleanup_abort_run(p_run_id, 'digest_mismatch_after_lock');
    return jsonb_build_object(
      'ok', false,
      'reason', 'digest_mismatch_after_lock',
      'recalc', v_recalc
    );
  end if;

  if exists (
    select 1
    from public.booking_customers c
    inner join phase2_harness.run_tracking t
      on t.run_id = p_run_id and t.kind = 'customer' and t.customer_id = c.id
    inner join lateral (
      select
        (e ->> 'customer_id')::uuid as customer_id,
        lower(e ->> 'email_normalized') as email_normalized,
        (e ->> 'business_id')::uuid as business_id
      from jsonb_array_elements(v_fixture_pairs) e
    ) fp on fp.customer_id = c.id
      and lower(c.email) = fp.email_normalized
      and c.business_id = fp.business_id
    where c.email like 'phase2-notes-fixture%@artecium.test'
      and phase2_harness.internal_note_blocks_customer_delete(p_run_id, c.id)
  ) then
    perform phase2_harness._cleanup_abort_run(p_run_id, 'ineligible_internal_note');
    return jsonb_build_object('ok', false, 'reason', 'ineligible_internal_note');
  end if;

  begin
    if not phase2_harness._cleanup_armed() then
      raise exception 'cleanup_execute: environment not armed' using errcode = 'P0001';
    end if;

    if exists (
      select 1
      from public.booking_customers c
      inner join phase2_harness.run_tracking t
        on t.run_id = p_run_id and t.kind = 'customer' and t.customer_id = c.id
      inner join lateral (
        select
          (e ->> 'customer_id')::uuid as customer_id,
          lower(e ->> 'email_normalized') as email_normalized,
          (e ->> 'business_id')::uuid as business_id
        from jsonb_array_elements(v_fixture_pairs) e
      ) fp on fp.customer_id = c.id
        and lower(c.email) = fp.email_normalized
        and c.business_id = fp.business_id
      where c.email like 'phase2-notes-fixture%@artecium.test'
        and phase2_harness.internal_note_blocks_customer_delete(p_run_id, c.id)
    ) then
      perform phase2_harness._cleanup_abort_run(p_run_id, 'ineligible_internal_note');
      return jsonb_build_object('ok', false, 'reason', 'ineligible_internal_note');
    end if;

    -- v2.6 Solution A: second digest immediately before first DELETE (digest_mismatch_before_delete).
    v_recalc := phase2_harness.compute_cleanup_digest(p_run_id, v_fixture_pairs);
    if lower(v_recalc) <> lower(v_row.cleanup_approval_digest) then
      perform phase2_harness._cleanup_abort_run(p_run_id, 'digest_mismatch_before_delete');
      return jsonb_build_object(
        'ok', false,
        'reason', 'digest_mismatch_before_delete',
        'recalc', v_recalc
      );
    end if;

    with fp as (
      select
        (e ->> 'customer_id')::uuid as customer_id,
        lower(e ->> 'email_normalized') as email_normalized,
        (e ->> 'business_id')::uuid as business_id
      from jsonb_array_elements(v_fixture_pairs) e
    ),
    del_notes as (
      delete from public.booking_customer_internal_notes n
      using public.booking_customers c, phase2_harness.run_tracking t, fp
      where n.customer_id = c.id
        and t.run_id = p_run_id
        and t.kind = 'note'
        and t.customer_id = n.customer_id
        and fp.customer_id = c.id
        and lower(c.email) = fp.email_normalized
        and c.business_id = fp.business_id
        and n.notes like 'phase2-%'
      returning n.customer_id
    )
    select count(*) into v_deleted_notes from del_notes;

    with fp as (
      select
        (e ->> 'customer_id')::uuid as customer_id,
        lower(e ->> 'email_normalized') as email_normalized,
        (e ->> 'business_id')::uuid as business_id
      from jsonb_array_elements(v_fixture_pairs) e
    ),
    del_cust as (
      delete from public.booking_customers c
      using phase2_harness.run_tracking t, fp
      where t.run_id = p_run_id
        and t.kind = 'customer'
        and t.customer_id = c.id
        and fp.customer_id = c.id
        and lower(c.email) = fp.email_normalized
        and c.business_id = fp.business_id
        and c.email like 'phase2-notes-fixture%@artecium.test'
        and not phase2_harness.internal_note_blocks_customer_delete(p_run_id, c.id)
      returning c.id
    )
    select count(*) into v_deleted_customers from del_cust;

    update phase2_harness.run_tracking
    set fixture_removed_at = now()
    where run_id = p_run_id and fixture_removed_at is null;

  exception when others then
    update phase2_harness.runs
    set status = 'tested',
        cleanup_status = 'aborted',
        cleanup_approval_digest = null,
        cleanup_approved_at = null,
        cleanup_approved_by = null,
        failure_reason = coalesce(sqlerrm, 'delete_failed'),
        updated_at = now()
    where run_id = p_run_id;
    return jsonb_build_object('ok', false, 'reason', 'delete_failed', 'detail', sqlerrm);
  end;

  update phase2_harness.runs
  set status = 'cleaned',
      cleanup_status = 'executed',
      cleanup_executed_at = now(),
      finished_at = now(),
      updated_at = now()
  where run_id = p_run_id;

  return jsonb_build_object(
    'ok', true,
    'deleted_notes', v_deleted_notes,
    'deleted_customers', v_deleted_customers
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Function privileges — postgres only (v2.6)
-- ---------------------------------------------------------------------------

revoke all on all functions in schema phase2_harness from public;
revoke all on all functions in schema phase2_harness from anon, authenticated, service_role;

grant execute on all functions in schema phase2_harness to postgres;
