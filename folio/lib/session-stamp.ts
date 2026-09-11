// The per-browser last-visit stamp behind the 24 hour idle logout. It is the
// only input to the clock: every path that creates a session writes a fresh
// stamp in the same response, the middleware refreshes it on every visit,
// and a stamp older than the limit ends the session on that device only.
export const LAST_SEEN_COOKIE = "fs-last-seen";

export function lastSeenCookie() {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 400,
  };
}

export function clearedLastSeenCookie() {
  return { path: "/", maxAge: 0 };
}
