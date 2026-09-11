import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LAST_SEEN_COOKIE, clearedLastSeenCookie } from "@/lib/session-stamp";

export async function POST(request: NextRequest) {
  // Only our own pages may log a device out; a cross-site form post is refused.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const supabase = await createClient();
  // This device only: other devices keep their own sessions and clocks.
  await supabase.auth.signOut({ scope: "local" });
  const response = NextResponse.redirect(new URL("/", request.url), { status: 302 });
  // Drop the last-visit stamp so it cannot expire the next login early.
  response.cookies.set(LAST_SEEN_COOKIE, "", clearedLastSeenCookie());
  return response;
}
