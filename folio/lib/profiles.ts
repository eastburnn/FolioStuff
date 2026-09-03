import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabaseEnv } from "./supabase/config";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  x_handle: string | null;
  linkedin_url: string | null;
  bluesky_handle: string | null;
  website_url: string | null;
  facebook_url: string | null;
  threads_handle: string | null;
  created_at: string;
  updated_at: string;
}

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9-]{7,15}$/;

// Route names and brand terms a maker cannot claim as a username.
export const RESERVED_USERNAMES = new Set([
  "admin", "api", "about", "auth", "dashboard", "login", "logout", "signup",
  "submit", "tools", "directory", "makers", "privacy", "terms", "settings", "profile",
  "folio", "foliostuff", "www", "mail", "support", "help",
]);

// Makers can type a bare domain such as "itschrisray.com"; the https prefix
// is added on save. Returns the normalized link, or an error to show.
export function normalizeLink(raw: string | null, label: string, maxLength = 200): { url: string | null; error?: string } {
  if (!raw) return { url: null };
  let value = raw.trim();
  if (!value) return { url: null };
  if (value.length > maxLength) return { url: null, error: `${label} link is too long.` };
  if (/\s/.test(value)) return { url: null, error: `${label} link cannot contain spaces.` };
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { url: null, error: `${label} link does not look like a web address.` };
  }
  const hostOk = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(parsed.hostname);
  if (!hostOk || parsed.username || parsed.password) {
    return { url: null, error: `${label} link does not look like a web address.` };
  }
  // Store the parser's canonical form (ASCII host, lowercase scheme) so the
  // database check constraint always agrees; a bare domain keeps no slash.
  const bare = parsed.pathname === "/" && !parsed.search && !parsed.hash && !value.endsWith("/");
  return { url: bare ? parsed.href.replace(/\/$/, "") : parsed.href };
}

export function avatarUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

function publicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const { data, error } = await publicClient()
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const { data, error } = await publicClient()
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}
