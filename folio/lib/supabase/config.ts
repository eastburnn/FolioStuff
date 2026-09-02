export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function publicImageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/listing-public/${path}`;
}

// Sessions end 24 hours after the user last visited. Enforced in middleware
// via a last-seen stamp (Supabase's cookie helper pins its own cookie
// lifetime, so this cannot be done through cookie max-age), and mirrored by
// the project's server-side inactivity timeout.
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24;
