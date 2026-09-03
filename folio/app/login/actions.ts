"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeNext } from "@/lib/safe-next";

export interface LoginState {
  emailError?: string | null;
  passwordError?: string | null;
  formError?: string | null;
}

// Password login as a server action, so a failed attempt can say which field
// is wrong. Supabase answers "Invalid login credentials" for both an unknown
// email and a wrong password; the exact email lookup below tells them apart.
// Every attempt carries a captcha token that Supabase verifies first, so the
// lookup cannot be used to probe for accounts without solving a captcha.
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "") || undefined;
  const next = safeNext(String(formData.get("next") ?? "") || null);
  if (!email || !password) return { formError: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });
  if (!error) redirect(next);

  const message = error.message.toLowerCase();
  if (message.includes("invalid login credentials")) {
    const exists = await emailExists(email);
    if (exists === false) return { emailError: "No account found with that email." };
    if (exists === true) return { passwordError: "Password incorrect." };
    return { formError: "Email or password is incorrect." };
  }
  if (message.includes("not confirmed")) {
    return { emailError: "This email has not been confirmed yet. Check your inbox for the link." };
  }
  if (message.includes("captcha")) {
    return { formError: "Captcha verification failed. Please try again." };
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return { formError: "Too many attempts. Please wait a minute and try again." };
  }
  console.error("Login failed:", error.message);
  return { formError: "Could not log you in. Please try again." };
}

// null means the lookup itself failed, so the caller falls back to a
// generic message rather than guessing.
async function emailExists(email: string): Promise<boolean | null> {
  try {
    const { data, error } = await createAdminClient().rpc("auth_email_exists", { p_email: email });
    if (error) {
      console.error("Email lookup failed:", error);
      return null;
    }
    return Boolean(data);
  } catch (err) {
    console.error("Email lookup failed:", err);
    return null;
  }
}
