-- 007: Hardening from review.
-- * Public reads go through a view exposing only the published snapshot, so
--   anon callers never see the working copy, private paths, or pending edits.
-- * Non-admin writes may only reference image paths inside their own
--   <owner_id>/<listing_id>/ folder; id is pinned on update; slug is
--   validated on insert; social links must be on the platform's domain.
-- * Snapshots that predate source_* paths are backfilled.

-- Slug format (app slugify produces exactly this shape).
alter table public.listings drop constraint if exists listings_slug_check;
alter table public.listings
  add constraint listings_slug_check check (slug ~ '^[a-z0-9]([a-z0-9-]{0,58}[a-z0-9])?$');

-- Social links: https and on the platform's own domain.
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

-- Image paths must live inside the listing's own private folder.
create or replace function public.valid_image_paths(owner uuid, listing uuid, icon text, shots text[])
returns boolean
language sql
immutable
as $$
  select (icon is null or (icon not like '%..%' and icon like owner::text || '/' || listing::text || '/%'))
    and shots is not null
    and coalesce(array_length(shots, 1), 0) <= 3
    and not exists (
      select 1 from unnest(shots) p
      where p is null or p like '%..%' or p not like owner::text || '/' || listing::text || '/%'
    );
$$;

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

-- Public read surface: only the published snapshot of live listings.
-- The view runs as its owner, so the restricted table policy below does not
-- block it; the WHERE clause is the guard.
create or replace view public.published_listings as
  select slug, owner_id, reviewed_at, published
  from public.listings
  where is_published = true and published is not null;

grant select on public.published_listings to anon, authenticated;

drop policy if exists "read published or own" on public.listings;
drop policy if exists "read own or admin" on public.listings;
create policy "read own or admin"
  on public.listings for select
  using (owner_id = auth.uid() or public.is_admin());

-- Tag search reads the public view.
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

-- Backfill source paths for snapshots created before they existed.
update public.listings
set published = published || jsonb_build_object(
  'source_icon_path', icon_path,
  'source_screenshot_paths', to_jsonb(screenshot_paths)
)
where published is not null and not (published ? 'source_icon_path');
