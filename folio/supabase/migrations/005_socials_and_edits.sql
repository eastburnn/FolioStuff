-- 005: Social links on listings and profiles, and support for editing live
-- listings. The row stays the maker's working copy; the "published" snapshot
-- stays live until an edit is approved. Rejected edits are rolled back from
-- the snapshot, which now also records the private source image paths so the
-- rollback can restore them.

alter table public.listings
  add column if not exists socials jsonb not null default '{}'::jsonb;
alter table public.listings
  drop constraint if exists listings_socials_check;
alter table public.listings
  add constraint listings_socials_check check (jsonb_typeof(socials) = 'object');

alter table public.profiles
  add column if not exists facebook_url text
    check (facebook_url is null or facebook_url ~* '^https://([a-z0-9-]+\.)?facebook\.com/.+');
alter table public.profiles
  add column if not exists threads_handle text
    check (threads_handle is null or char_length(threads_handle) <= 30);
