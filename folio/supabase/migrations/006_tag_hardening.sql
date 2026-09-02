-- 006: Harden tags and socials at the database.
-- * search_tags reads the published snapshot instead of the live working copy,
--   so unreviewed edits never reach autocomplete; LIKE wildcards in the prefix
--   are escaped and the prefix is bounded.
-- * Tag and social link shapes are validated in the write guard for non-admin
--   writes, matching the app rules (1 to 3 unique tags, 2 to 24 chars of
--   [a-z0-9-]; socials only known platforms with https URLs).
-- * Snapshots that predate tags are backfilled.

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
  from public.listings l
       cross join jsonb_array_elements_text(coalesce(l.published->'tags', '[]'::jsonb)) as t
       cross join p
  where l.is_published = true
    and t like p.pat || '%'
  group by t
  order by uses desc, t asc
  limit least(greatest(max_results, 1), 20);
$$;

update public.listings
set published = (published - 'category') || jsonb_build_object('tags', to_jsonb(tags))
where published is not null and not (published ? 'tags');

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
      where kv.key not in ('x', 'facebook', 'linkedin', 'bluesky', 'threads')
         or jsonb_typeof(kv.value) <> 'string'
         or char_length(kv.value #>> '{}') > 300
         or (kv.value #>> '{}') !~ '^https://'
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
      raise exception 'Social links must be https URLs for known platforms.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;
