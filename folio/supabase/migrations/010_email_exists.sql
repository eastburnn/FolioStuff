-- 010: exact email lookup for the login form. After a failed password login
-- the server action calls this (service role only) to tell "no account with
-- that email" from "password incorrect". Every login attempt is captcha
-- gated, so this is not an open enumeration endpoint.

create or replace function public.auth_email_exists(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from auth.users u where lower(u.email) = lower(trim(p_email))
  );
$$;

revoke all on function public.auth_email_exists(text) from public;
revoke all on function public.auth_email_exists(text) from anon, authenticated;
grant execute on function public.auth_email_exists(text) to service_role;
