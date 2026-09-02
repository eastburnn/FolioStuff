-- Maker profiles: optional fields the user fills at their own discretion.
-- Profiles are public by design; the page at /makers/[username] exists once
-- the maker picks a username.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-z0-9][a-z0-9-]{7,15}$'),
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  bio text check (bio is null or char_length(bio) <= 500),
  avatar_path text,
  x_handle text check (x_handle is null or char_length(x_handle) <= 30),
  linkedin_url text check (linkedin_url is null or linkedin_url ~* '^https://([a-z0-9-]+\.)?linkedin\.com/.+'),
  bluesky_handle text check (bluesky_handle is null or char_length(bluesky_handle) <= 100),
  website_url text check (website_url is null or website_url ~* '^https?://.+\..+'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guard_profile_writes on public.profiles;
create trigger guard_profile_writes
  before insert or update on public.profiles
  for each row execute function public.guard_profile_writes();

alter table public.profiles enable row level security;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public"
  on public.profiles for select
  using (true);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
  on public.profiles for insert
  with check (auth.uid() is not null);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

drop policy if exists "delete own profile" on public.profiles;
create policy "delete own profile"
  on public.profiles for delete
  using (id = auth.uid() or public.is_admin());

-- Public avatars bucket; owners write only inside their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatar upload own folder" on storage.objects;
create policy "avatar upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar update own folder" on storage.objects;
create policy "avatar update own folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar delete own folder" on storage.objects;
create policy "avatar delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
