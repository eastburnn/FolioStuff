-- 003: Enforce maker identity at the database layer.
-- 1) Listings can only be inserted by users whose profile has a display name
--    and username, and maker_name/maker_x_handle are always taken from that
--    profile, never from the caller. This closes the direct-API bypass of the
--    app-level profile gate.
-- 2) Reserved usernames are rejected at the database, not just in the app.

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
  new.updated_at := now();
  return new;
end;
$$;

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
  end if;
  new.updated_at := now();
  return new;
end;
$$;
