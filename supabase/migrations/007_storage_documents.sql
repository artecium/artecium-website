-- Artecium — Supabase Storage for platform documents (private bucket)
-- Run AFTER 001–006

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'platform-documents',
  'platform-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {company_id}/{project_id|general}/{document_id}/{filename}

drop policy if exists "Staff upload platform documents" on storage.objects;
create policy "Staff upload platform documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'platform-documents'
    and public.is_staff_member()
    and (storage.foldername(name))[1] is not null
    and public.staff_can_access_company((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Staff update platform documents" on storage.objects;
create policy "Staff update platform documents"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'platform-documents'
    and public.is_staff_member()
    and public.staff_can_access_company((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'platform-documents'
    and public.is_staff_member()
    and public.staff_can_access_company((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Staff delete platform documents" on storage.objects;
create policy "Staff delete platform documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'platform-documents'
    and public.is_staff_member()
    and public.staff_can_access_company((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Read platform documents" on storage.objects;
create policy "Read platform documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'platform-documents'
    and (
      (
        public.is_staff_member()
        and public.staff_can_access_company((storage.foldername(name))[1]::uuid)
      )
      or (storage.foldername(name))[1]::uuid in (select public.user_company_ids())
    )
  );

grant select on table public.document_versions to authenticated;
