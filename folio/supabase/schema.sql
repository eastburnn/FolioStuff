-- FolioStuff directory schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query > paste > Run).
-- Safe to re-run: statements use "if not exists" / "on conflict" where possible.

-- ── Admins ──────────────────────────────────────────────────────────────────
-- Accounts whose email appears here get admin powers (review queue, approve/reject).
create table if not exists public.app_admins (
  email text primary key
);

insert into public.app_admins (email)
values ('itschrisray@gmail.com')
on conflict (email) do nothing;

-- RLS with no policies: the table is invisible through the public API.
-- is_admin() still reads it because it is security definer.
alter table public.app_admins enable row level security;

-- True when the request is the service role (server-side admin client)
-- or a signed-in user whose email is in app_admins.
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

-- ── Listings ────────────────────────────────────────────────────────────────
-- One row per tool. A submission is a listing with status 'pending'.
-- The live site renders from the "published" jsonb snapshot, so a maker
-- editing their listing (which sends it back to review) never takes the
-- live version down.
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,58}[a-z0-9])?$'),
  name text not null check (char_length(name) between 2 and 60),
  url text not null check (url ~* '^https?://.+'),
  tagline text not null check (char_length(tagline) between 10 and 200),
  description text not null check (char_length(description) between 40 and 2000),
  tags text[] not null default '{}' check (array_length(tags, 1) is null or array_length(tags, 1) <= 3),
  socials jsonb not null default '{}'::jsonb check (jsonb_typeof(socials) = 'object'),
  maker_name text not null check (char_length(maker_name) between 1 and 80),
  maker_x_handle text check (maker_x_handle is null or char_length(maker_x_handle) <= 30),
  icon_path text,
  screenshot_paths text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_feedback text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  published jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_published_idx on public.listings (is_published) where is_published;
create index if not exists listings_owner_idx on public.listings (owner_id);
create index if not exists listings_featured_idx on public.listings (is_featured) where is_featured;

create or replace function public.valid_tags(t text[])
returns boolean
language sql
immutable
as $$
  select t is not null
    and array_ndims(t) = 1
    and array_length(t, 1) between 1 and 3
    and not exists (
      select 1 from unnest(t) x
      where x is null or x !~ '^[a-z0-9][a-z0-9-]{0,22}[a-z0-9]$'
    )
    and (select count(distinct x) from unnest(t) x) = array_length(t, 1);
$$;

create or replace function public.valid_socials(s jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(s) = 'object'
    and not exists (
      select 1 from jsonb_each(s) kv
      where jsonb_typeof(kv.value) <> 'string'
         or char_length(kv.value #>> '{}') > 300
         or not (
              (kv.key = 'x'        and (kv.value #>> '{}') ~* '^https://([a-z0-9-]+\.)*(x\.com|twitter\.com)(/|$)')
           or (kv.key = 'facebook' and (kv.value #>> '{}') ~* '^https://([a-z0-9-]+\.)*facebook\.com(/|$)')
           or (kv.key = 'linkedin' and (kv.value #>> '{}') ~* '^https://([a-z0-9-]+\.)*linkedin\.com(/|$)')
           or (kv.key = 'bluesky'  and (kv.value #>> '{}') ~* '^https://([a-z0-9-]+\.)*bsky\.app(/|$)')
           or (kv.key = 'threads'  and (kv.value #>> '{}') ~* '^https://([a-z0-9-]+\.)*(threads\.net|threads\.com)(/|$)')
         )
    );
$$;

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

-- Non-admin writes can never touch moderation fields, and maker identity
-- always comes from the owner's profile: inserts require a profile with a
-- display name and username, and maker_name/maker_x_handle are overwritten
-- from it regardless of what the caller sends.
create or replace function public.guard_listing_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  maker_profile public.profiles%rowtype;
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.owner_id := auth.uid();
      new.status := 'pending';
      new.review_feedback := null;
      new.is_published := false;
      new.published := null;
      new.reviewed_at := null;

      select * into maker_profile from public.profiles where id = new.owner_id;
      if maker_profile.id is null
         or maker_profile.username is null
         or maker_profile.display_name is null then
        raise exception 'A profile with a display name and username is required to submit.';
      end if;
      new.maker_name := maker_profile.display_name;
      new.maker_x_handle := maker_profile.x_handle;
    end if;
  elsif tg_op = 'UPDATE' then
    if not public.is_admin() then
      new.id := old.id;
      new.owner_id := old.owner_id;
      new.slug := old.slug;
      new.is_published := old.is_published;
      new.published := old.published;
      new.reviewed_at := old.reviewed_at;
      new.status := 'pending';
      new.review_feedback := null;
      new.maker_name := old.maker_name;
      new.maker_x_handle := old.maker_x_handle;
    end if;
  end if;

  if not public.is_admin() then
    if not coalesce(public.valid_tags(new.tags), false) then
      raise exception 'Tags must be 1 to 3 unique tags of 2 to 24 lowercase letters, numbers, or hyphens.';
    end if;
    if not coalesce(public.valid_socials(new.socials), false) then
      raise exception 'Social links must be https URLs on the platform''s own domain.';
    end if;
    if not coalesce(public.valid_image_paths(new.owner_id, new.id, new.icon_path, new.screenshot_paths), false) then
      raise exception 'Image paths must be inside your own listing folder.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guard_listing_writes on public.listings;
create trigger guard_listing_writes
  before insert or update on public.listings
  for each row execute function public.guard_listing_writes();

-- ── Row level security ──────────────────────────────────────────────────────
alter table public.listings enable row level security;

-- Public reads go through the published_listings view (below); the table
-- itself is readable only by the owner and admins.
drop policy if exists "read published or own" on public.listings;
drop policy if exists "read own or admin" on public.listings;
create policy "read own or admin"
  on public.listings for select
  using (owner_id = auth.uid() or public.is_admin());

drop view if exists public.published_listings;
create view public.published_listings
with (security_barrier = true) as
  select slug, owner_id, reviewed_at, is_featured,
         published - 'source_icon_path' - 'source_screenshot_paths' as published
  from public.listings
  where is_published = true and published is not null;

revoke all on public.published_listings from anon, authenticated;
grant select on public.published_listings to anon, authenticated;

drop policy if exists "owners insert" on public.listings;
create policy "owners insert"
  on public.listings for insert
  with check (auth.uid() is not null);

drop policy if exists "owners update own" on public.listings;
create policy "owners update own"
  on public.listings for update
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "owners delete own" on public.listings;
create policy "owners delete own"
  on public.listings for delete
  using (owner_id = auth.uid() or public.is_admin());

-- ── Storage ─────────────────────────────────────────────────────────────────
-- listing-uploads: private; makers upload here, only they and admins can read.
-- listing-public: public; the approve action copies images here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-uploads', 'listing-uploads', false, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('listing-public', 'listing-public', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Makers can only write inside a folder named after their own user id.
drop policy if exists "makers upload own folder" on storage.objects;
create policy "makers upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-uploads'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and array_length(storage.foldername(name), 1) = 2
  );

drop policy if exists "makers read own folder" on storage.objects;
create policy "makers read own folder"
  on storage.objects for select
  using (
    bucket_id = 'listing-uploads'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "makers delete own folder" on storage.objects;
create policy "makers delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'listing-uploads'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Public bucket reads work through its public URL; no select policy needed.
-- Nothing besides the service role can write to listing-public (no policies).
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
  facebook_url text check (facebook_url is null or facebook_url ~* '^https://([a-z0-9-]+\.)?facebook\.com/.+'),
  threads_handle text check (threads_handle is null or char_length(threads_handle) <= 30),
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
    if new.username is not null and new.username in (
      'admin', 'api', 'about', 'auth', 'dashboard', 'directory', 'login', 'logout', 'signup',
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
    and array_length(storage.foldername(name), 1) = 1
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

-- ── Tag search ──────────────────────────────────────────────────────────────
-- Autocomplete source for the submit form. Security invoker, so row level
-- security applies and only published listings contribute.
create or replace function public.search_tags(prefix text default '', max_results int default 8)
returns table (tag text, uses bigint)
language sql
stable
as $$
  with p as (
    select replace(replace(replace(lower(left(coalesce(prefix, ''), 24)),
             '\', '\\'), '%', '\%'), '_', '\_') as pat
  )
  select t as tag, count(*) as uses
  from public.published_listings l
       cross join jsonb_array_elements_text(coalesce(l.published->'tags', '[]'::jsonb)) as t
       cross join p
  where t like p.pat || '%'
  group by t
  order by uses desc, t asc
  limit least(greatest(max_results, 1), 20);
$$;
