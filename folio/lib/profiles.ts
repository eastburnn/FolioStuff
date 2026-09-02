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
  "submit", "tools", "makers", "privacy", "terms", "settings", "profile",
  "folio", "foliostuff", "www", "mail", "support", "help",
]);

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
