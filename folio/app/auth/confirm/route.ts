import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { LAST_SEEN_COOKIE, lastSeenCookie } from "@/lib/session-stamp";

// Target of the confirmation and recovery links in Supabase auth emails.
// Handles both link styles: token_hash (OTP verify) and code (PKCE exchange).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  // A confirmed link creates a session, so it starts this device's idle
  // clock fresh, exactly like the login form does.
  const signedIn = () => {
    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.set(LAST_SEEN_COOKIE, String(Date.now()), lastSeenCookie());
    return response;
  };

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return signedIn();
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return signedIn();
  }

  return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
}
