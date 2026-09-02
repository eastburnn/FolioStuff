// Only same-origin relative paths are allowed as post-auth destinations, so a
// crafted ?next= link can never bounce a freshly logged-in user off-site.
export function safeNext(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || /[\\:]/.test(value)) return fallback;
  return value;
}
