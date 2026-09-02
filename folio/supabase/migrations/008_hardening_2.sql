-- 008: Second hardening pass.
-- * published_listings view: read-only for API roles, security barrier, and
--   no private-bucket paths in the projected snapshot.
-- * is_admin() can never be NULL (a NULL made trigger guards fail open).
-- * Image paths must be flat <owner>/<listing>/<file>.<png|jpg|jpeg|webp>,
--   and storage policies enforce the same depth on upload.
-- * profiles.avatar_path must live inside the user's own avatars folder.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.role(), '') = 'service_role'
    or exists (
      select 1 from public.app_admins
      where email = (auth.jwt() ->> 'email')
    );
$$;

create or replace view public.published_listings
with (security_barrier = true) as
  select slug, owner_id, reviewed_at,
         published - 'source_icon_path' - 'source_screenshot_paths' as published
  from public.listings
  where is_published = true and published is not null;

revoke all on public.published_listings from anon, authenticated;
grant select on public.published_listings to anon, authenticated;

create or replace function public.valid_image_paths(owner uuid, listing uuid, icon text, shots text[])
returns boolean
language sql
immutable
as $$
  select (icon is null
          or icon ~ ('^' || owner::text || '/' || listing::text || '/[A-Za-z0-9._-]+\.(png|jpe?g|webp)$'))
    and shots is not null
    and coalesce(array_length(shots, 1), 0) <= 3
    and not exists (
      select 1 from unnest(shots) p
      where p is null
         or p !~ ('^' || owner::text || '/' || listing::text || '/[A-Za-z0-9._-]+\.(png|jpe?g|webp)$')
    );
$$;

-- Uploads must be exactly <owner>/<listing>/<file> (private) or <owner>/<file> (avatars).
drop policy if exists "makers upload own folder" on storage.objects;
create policy "makers upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-uploads'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and array_length(storage.foldername(name), 1) = 2
  );

drop policy if exists "avatar upload own folder" on storage.objects;
create policy "avatar upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and array_length(storage.foldername(name), 1) = 1
  );

create or replace function public.guard_profile_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.id := auth.uid();
    else
      new.id := old.id;
    end if;
    if new.username is not null and new.username in (
      'admin', 'api', 'about', 'auth', 'dashboard', 'login', 'logout', 'signup',
      'submit', 'tools', 'makers', 'privacy', 'terms', 'settings', 'profile',
      'folio', 'foliostuff', 'www', 'mail', 'support', 'help'
    ) then
      raise exception 'That username is reserved.';
    end if;
    if new.avatar_path is not null
       and new.avatar_path !~ ('^' || new.id::text || '/[A-Za-z0-9._-]+\.(png|jpe?g|webp)$') then
      raise exception 'Avatar path must be inside your own folder.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
