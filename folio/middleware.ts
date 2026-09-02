import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SESSION_COOKIE_MAX_AGE } from "@/lib/supabase/config";

const PROTECTED_PREFIXES = ["/submit", "/dashboard", "/admin", "/reset-password"];

// Rolling inactivity logout: every request from a signed-in user stamps this
// cookie; a request arriving more than 24h after the last stamp ends the
// session. Independent of Supabase's own session settings, so it holds on
// any plan.
const LAST_SEEN_COOKIE = "fs-last-seen";
const INACTIVITY_LIMIT_MS = SESSION_COOKIE_MAX_AGE * 1000;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
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
    if (lastSeen > 0 && Date.now() - lastSeen > INACTIVITY_LIMIT_MS) {
      // Away too long: end the session and send them to log in again.
      await supabase.auth.signOut();
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?expired=1${needsAuth ? `&next=${encodeURIComponent(pathname)}` : ""}`;
      const redirect = NextResponse.redirect(loginUrl);
      // Carry the cookie deletions from signOut onto the redirect response.
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      redirect.cookies.set(LAST_SEEN_COOKIE, "", { path: "/", maxAge: 0 });
      return redirect;
    }
    response.cookies.set(LAST_SEEN_COOKIE, String(Date.now()), {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 400,
    });
  }

  if (needsAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|apple-icon.png|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)",
  ],
};
