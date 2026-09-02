import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

export interface AdminContext {
  admin: SupabaseClient;
  user: User;
}

// Returns the service-role client and the signed-in admin user, or null when
// the visitor is not signed in, not an admin, or the service key is missing.
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }

  const { data } = await admin
    .from("app_admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();
  return data ? { admin, user } : null;
}
