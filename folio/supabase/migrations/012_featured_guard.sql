-- Makers could set is_featured (and created_at) on their own rows: the
-- write guard never pinned those columns. Also treats direct database
-- sessions as admin so maintenance updates keep their status.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.role(), '') = 'service_role'
    -- Direct database sessions (psql, the SQL editor) count as admin, so
    -- maintenance never trips the non-admin write guard.
    or session_user = 'postgres'
    or exists (
      select 1 from public.app_admins
      where email = (auth.jwt() ->> 'email')
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
      new.is_featured := false;
      new.created_at := now();

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
      new.is_featured := old.is_featured;
      new.created_at := old.created_at;
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
