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

import { USERNAME_PATTERN, RESERVED_USERNAMES } from "./profile-rules";
import { cachedPublic } from "./public-cache";
export { USERNAME_PATTERN, RESERVED_USERNAMES };

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

async function getProfileByUsernameUncached(username: string): Promise<Profile | null> {
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
export const getProfileByUsername = cachedPublic(getProfileByUsernameUncached, "getProfileByUsername");

// Every maker with a public page, for the sitemap.
async function getMakerUsernamesUncached(): Promise<{ id: string; username: string; updated_at: string }[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const { data, error } = await publicClient()
      .from("profiles")
      .select("id, username, updated_at")
      .not("username", "is", null);
    if (error || !data) return [];
    return data.filter((row): row is { id: string; username: string; updated_at: string } => Boolean(row.username));
  } catch {
    return [];
  }
}
export const getMakerUsernames = cachedPublic(getMakerUsernamesUncached, "getMakerUsernames");

async function getProfileByIdUncached(id: string): Promise<Profile | null> {
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
export const getProfileById = cachedPublic(getProfileByIdUncached, "getProfileById");
