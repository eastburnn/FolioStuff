-- 009: Featured listings, admin account swap, and the /directory rename.
-- * listings.is_featured: admin-only flag that also shows the tool in the
--   homepage Featured section (in addition to the normal directory).
-- * published_listings view exposes is_featured.
-- * Admin account is itschrisray@gmail.com.
-- * "directory" joins the reserved usernames.

alter table public.listings
  add column if not exists is_featured boolean not null default false;
create index if not exists listings_featured_idx on public.listings (is_featured) where is_featured;

drop view if exists public.published_listings;
create view public.published_listings
with (security_barrier = true) as
  select slug, owner_id, reviewed_at, is_featured,
         published - 'source_icon_path' - 'source_screenshot_paths' as published
  from public.listings
  where is_published = true and published is not null;

revoke all on public.published_listings from anon, authenticated;
grant select on public.published_listings to anon, authenticated;

delete from public.app_admins where email = 'chrris.ray@gmail.com';
insert into public.app_admins (email) values ('itschrisray@gmail.com')
on conflict (email) do nothing;

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
