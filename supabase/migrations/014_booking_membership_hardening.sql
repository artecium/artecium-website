-- Artecium Booking — membership invite-only writes & invite token handling
-- Run AFTER 013_booking_security_invites.sql
--
-- Fixes:
--   - Managers could INSERT/UPDATE booking_business_members directly (bypass invites)
--   - booking_accept_member_invite expected pre-hashed token in API param

create extension if not exists pgcrypto;

-- Membership changes only via SECURITY DEFINER RPCs (create business, accept invite).
drop policy if exists "Booking managers write membership" on public.booking_business_members;

revoke all on function public.booking_accept_member_invite(text) from public;
drop function if exists public.booking_accept_member_invite(text);

create or replace function public.booking_accept_member_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.booking_member_invites%rowtype;
  v_profile_email text;
  v_hash text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if p_token is null or trim(p_token) = '' then
    raise exception 'token required' using errcode = '22023';
  end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select email into v_profile_email from public.profiles where id = auth.uid();
  if v_profile_email is null then
    raise exception 'profile email required' using errcode = '22023';
  end if;

  select * into v_invite
  from public.booking_member_invites i
  where i.token_hash = v_hash
    and i.accepted_at is null
    and i.expires_at > now()
  limit 1
  for update;

  if not found then
    raise exception 'invite not found or expired' using errcode = 'P0002';
  end if;

  if lower(trim(v_profile_email)) <> lower(trim(v_invite.email)) then
    raise exception 'invite email mismatch' using errcode = '42501';
  end if;

  insert into public.booking_business_members (business_id, user_id, role)
  values (v_invite.business_id, auth.uid(), v_invite.role)
  on conflict (business_id, user_id) do update set role = excluded.role;

  update public.booking_member_invites
  set accepted_at = now()
  where id = v_invite.id;

  return v_invite.business_id;
end;
$$;

grant execute on function public.booking_accept_member_invite(text) to authenticated;

comment on function public.booking_accept_member_invite(text) is
  'Accept invite using raw token from invite link; hashed server-side. Single-use via accepted_at.';
