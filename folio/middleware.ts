import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SESSION_COOKIE_MAX_AGE } from "@/lib/supabase/config";
import { LAST_SEEN_COOKIE, clearedLastSeenCookie, lastSeenCookie } from "@/lib/session-stamp";
import { CSP_HEADER, buildCsp } from "@/lib/csp";
import { safeNext } from "@/lib/safe-next";

const PROTECTED_PREFIXES = ["/submit", "/dashboard", "/admin", "/reset-password"];

// Rolling inactivity logout, per device: every request from a signed-in user
// stamps this browser's cookie; a request arriving more than 24h after the
// last stamp ends the session on this device only. Other devices keep their
// own clocks. Independent of Supabase's own session settings.
const INACTIVITY_LIMIT_MS = SESSION_COOKIE_MAX_AGE * 1000;

export async function middleware(request: NextRequest) {
  // A fresh nonce per request. Next.js reads it from the policy on the
  // request headers to mark its own scripts; the layout reads x-nonce for
  // ours. The browser gets the policy on the response.
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CSP_HEADER, csp);
  const withCsp = <T extends NextResponse>(res: T): T => {
    res.headers.set(CSP_HEADER, csp);
    return res;
  };

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return withCsp(response);

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Refreshed cookies must reach the page render along with the nonce.
        requestHeaders.set("cookie", request.headers.get("cookie") ?? "");
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshes the session cookie when expired; required for SSR auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (user) {
    const lastSeen = Number(request.cookies.get(LAST_SEEN_COOKIE)?.value ?? 0);
    // Every path that creates a session writes a fresh stamp in the same
    // response, so a stamp this old means this browser has been idle that
    // long, whatever happened on the account from other devices.
    const stale = lastSeen > 0 && Date.now() - lastSeen > INACTIVITY_LIMIT_MS;
    if (stale) {
      // Away too long: end the session on this device only, then log in again.
      await supabase.auth.signOut({ scope: "local" });
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?expired=1${needsAuth ? `&next=${encodeURIComponent(pathname)}` : ""}`;
      const redirect = NextResponse.redirect(loginUrl);
      // Carry the cookie deletions from signOut onto the redirect response.
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      redirect.cookies.set(LAST_SEEN_COOKIE, "", clearedLastSeenCookie());
      return withCsp(redirect);
    }
    response.cookies.set(LAST_SEEN_COOKIE, String(Date.now()), lastSeenCookie());
  }

  // Already signed in: the login and signup pages have nothing to offer, so
  // go straight to the destination (or the dashboard).
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const dest = request.nextUrl.clone();
    dest.pathname = safeNext(request.nextUrl.searchParams.get("next"));
    dest.search = "";
    const redirect = NextResponse.redirect(dest);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return withCsp(redirect);
  }

  // A stamp with no session is a leftover; drop it so the next login starts
  // a clean clock even if it arrives through a path that writes no stamp.
  const dropStamp = !user && request.cookies.has(LAST_SEEN_COOKIE);

  if (needsAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    const redirect = NextResponse.redirect(loginUrl);
    if (dropStamp) redirect.cookies.set(LAST_SEEN_COOKIE, "", clearedLastSeenCookie());
    return withCsp(redirect);
  }

  if (dropStamp) response.cookies.set(LAST_SEEN_COOKIE, "", clearedLastSeenCookie());
  return withCsp(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|apple-icon.png|sitemap.xml|robots.txt|llms.txt|api/csp-report|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)",
  ],
};
