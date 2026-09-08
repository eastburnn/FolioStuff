-- 011: private bookmarks. A user can save the site's own tools (kind 'tool',
-- ref is the tool path) and directory listings (kind 'listing', ref is the
-- slug). Rows are visible and writable only by their owner.

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('tool', 'listing')),
  ref text not null check (char_length(ref) between 1 and 80 and ref ~ '^[A-Za-z0-9/_-]+$'),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);

create index if not exists bookmarks_user_created_idx on public.bookmarks (user_id, created_at desc);

alter table public.bookmarks enable row level security;

drop policy if exists "read own bookmarks" on public.bookmarks;
create policy "read own bookmarks" on public.bookmarks for select using (user_id = auth.uid());

drop policy if exists "add own bookmarks" on public.bookmarks;
create policy "add own bookmarks" on public.bookmarks for insert with check (user_id = auth.uid());

drop policy if exists "remove own bookmarks" on public.bookmarks;
create policy "remove own bookmarks" on public.bookmarks for delete using (user_id = auth.uid());

revoke all on public.bookmarks from anon;
grant select, insert, delete on public.bookmarks to authenticated;
