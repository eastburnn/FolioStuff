-- 004: Replace the fixed category with free-form tags (max 3), raise the
-- tagline limit to 200 characters, and add a tag search function that powers
-- autocomplete from tags used on published listings.

alter table public.listings
  add column if not exists tags text[] not null default '{}';

alter table public.listings
  drop constraint if exists listings_tags_check;
alter table public.listings
  add constraint listings_tags_check check (
    array_length(tags, 1) is null or array_length(tags, 1) <= 3
  );

alter table public.listings
  drop constraint if exists listings_category_check;
alter table public.listings
  drop column if exists category;

alter table public.listings
  drop constraint if exists listings_tagline_check;
alter table public.listings
  add constraint listings_tagline_check check (char_length(tagline) between 10 and 200);

-- Tag autocomplete. Security invoker, so row level security applies and only
-- published listings contribute; anon callers never see tags from pending
-- submissions.
create or replace function public.search_tags(prefix text default '', max_results int default 8)
returns table (tag text, uses bigint)
language sql
stable
as $$
  select t as tag, count(*) as uses
  from public.listings l, unnest(l.tags) as t
  where l.is_published = true
    and t like lower(coalesce(prefix, '')) || '%'
  group by t
  order by uses desc, t asc
  limit least(greatest(max_results, 1), 20);
$$;
