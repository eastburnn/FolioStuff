// Social accounts for tool listings and maker profiles. Makers can paste a
// full profile link, type "@handle", or type a bare handle; parseSocial works
// out what they meant and returns both the handle and a canonical https URL.
// Listing socials are stored as URLs (jsonb keyed by platform); profiles keep
// handles for X, Bluesky, and Threads and URLs for LinkedIn and Facebook.

export const SOCIAL_PLATFORMS = [
  { key: "x", label: "X (Twitter)", hosts: ["x.com", "twitter.com"], placeholder: "@yourtool or x.com/yourtool" },
  { key: "facebook", label: "Facebook", hosts: ["facebook.com", "fb.com"], placeholder: "yourtool or facebook.com/yourtool" },
  { key: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"], placeholder: "linkedin.com/company/yourtool" },
  { key: "bluesky", label: "Bluesky", hosts: ["bsky.app"], placeholder: "@yourtool.bsky.social" },
  { key: "threads", label: "Threads", hosts: ["threads.net", "threads.com"], placeholder: "@yourtool" },
] as const;

export type SocialKey = (typeof SOCIAL_PLATFORMS)[number]["key"];
export type Socials = Partial<Record<SocialKey, string>>;

// Bare LinkedIn handles become a person page for profiles and a company page
// for tool listings.
export type SocialContext = "person" | "tool";

// Matches the database limits: listing socials are capped at 300 characters
// and profile handles at 30 (X, Threads) or 100 (Bluesky).
const MAX_INPUT_LENGTH = 300;
const MAX_URL_LENGTH = 300;

const HANDLE_RULES: Record<SocialKey, RegExp> = {
  x: /^[A-Za-z0-9_]{1,15}$/,
  facebook: /^[A-Za-z0-9.]{1,60}$/,
  linkedin: /^(?=.{2,100}$)[\p{L}\p{N}-]+$/u,
  bluesky: /^(?=.{1,100}$)[a-z0-9-]+(\.[a-z0-9-]+)+$/i,
  threads: /^[A-Za-z0-9._]{1,30}$/,
};

// Accounts without a resolved handle are shared as DIDs on Bluesky.
const BLUESKY_DID = /^(?=.{1,100}$)did:(plc|web):[a-z0-9.:_-]+$/i;

// Path words that are never a handle on x.com.
const X_RESERVED = new Set([
  "i", "intent", "home", "search", "explore", "hashtag", "settings", "messages",
  "notifications", "compose", "login", "share", "tos", "privacy", "about",
]);

// Facebook links whose first path segment is a section, not a page name.
const FACEBOOK_SECTIONS = new Set(["people", "pages", "pg", "groups", "share", "events", "profile"]);
const FACEBOOK_SEGMENT = /^[A-Za-z0-9._-]{1,100}$/;

const LINKEDIN_TYPES = new Set(["in", "company", "school", "showcase", "pub"]);

function hostMatches(hostname: string, hosts: readonly string[]): boolean {
  return hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

function platformFor(key: SocialKey) {
  return SOCIAL_PLATFORMS.find((p) => p.key === key)!;
}

function invalid(key: SocialKey): { error: string } {
  return { error: `That ${platformFor(key).label} entry does not look like a handle or profile link.` };
}

// Something with a known host or a scheme is treated as a link.
const ANY_HOST = /^(https?:\/\/)?(www\.|m\.|mobile\.)?([a-z0-9-]+\.)*(x\.com|twitter\.com|facebook\.com|fb\.com|linkedin\.com|bsky\.app|threads\.net|threads\.com)(\/|\?|$)/i;

export interface ParsedSocial {
  handle: string;
  url: string;
}

function fromHandle(key: SocialKey, raw: string, context: SocialContext): ParsedSocial | { error: string } {
  let handle = raw.replace(/^@+/, "");
  if (key === "bluesky") {
    if (BLUESKY_DID.test(handle)) return { handle, url: `https://bsky.app/profile/${handle}` };
    if (handle && !handle.includes(".")) handle = `${handle}.bsky.social`;
    handle = handle.toLowerCase();
  }
  if (!HANDLE_RULES[key].test(handle)) return invalid(key);
  switch (key) {
    case "x":
      return { handle, url: `https://x.com/${handle}` };
    case "facebook":
      return { handle, url: `https://facebook.com/${handle}` };
    case "linkedin":
      return {
        handle,
        url: `https://linkedin.com/${context === "tool" ? "company" : "in"}/${encodeURIComponent(handle)}`,
      };
    case "bluesky":
      return { handle, url: `https://bsky.app/profile/${handle}` };
    case "threads":
      return { handle, url: `https://threads.net/@${handle}` };
  }
}

function decodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function fromLink(key: SocialKey, raw: string, context: SocialContext): ParsedSocial | { error: string } {
  const platform = platformFor(key);
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return invalid(key);
  }
  if (!hostMatches(parsed.hostname.toLowerCase(), platform.hosts)) {
    return { error: `That link is not on ${platform.hosts[0]}. Paste your ${platform.label} profile link or just the handle.` };
  }
  const decoded = parsed.pathname.split("/").filter(Boolean).map(decodeSegment);
  if (decoded.some((s) => s === null)) return invalid(key);
  const segments = decoded as string[];
  const first = (segments[0] ?? "").toLowerCase();

  switch (key) {
    case "x": {
      if (first === "intent") {
        const name = parsed.searchParams.get("screen_name") ?? "";
        return name ? fromHandle(key, name, context) : invalid(key);
      }
      if (X_RESERVED.has(first)) return invalid(key);
      return fromHandle(key, segments[0] ?? "", context);
    }
    case "threads":
      return fromHandle(key, segments[0] ?? "", context);
    case "bluesky":
      return fromHandle(key, first === "profile" ? (segments[1] ?? "") : (segments[0] ?? ""), context);
    case "facebook": {
      // Numeric profiles live at profile.php?id=...
      if (first === "profile.php") {
        const id = parsed.searchParams.get("id") ?? "";
        if (!/^\d{1,30}$/.test(id)) return invalid(key);
        return { handle: id, url: `https://facebook.com/profile.php?id=${id}` };
      }
      // Section links (people, pages, groups, share) keep their whole path.
      if (FACEBOOK_SECTIONS.has(first)) {
        if (segments.length < 2 || !segments.every((s) => FACEBOOK_SEGMENT.test(s))) return invalid(key);
        return { handle: segments[segments.length - 1], url: `https://facebook.com/${segments.join("/")}` };
      }
      return fromHandle(key, segments[0] ?? "", context);
    }
    case "linkedin": {
      // Find the page type wherever it sits (mobile links prefix /mwlite/).
      const i = segments.findIndex((s) => LINKEDIN_TYPES.has(s.toLowerCase()));
      const name = i >= 0 ? segments[i + 1] : undefined;
      if (name && HANDLE_RULES.linkedin.test(name)) {
        return { handle: name, url: `https://linkedin.com/${segments[i].toLowerCase()}/${encodeURIComponent(name)}` };
      }
      return fromHandle(key, segments[segments.length - 1] ?? "", context);
    }
  }
}

// Returns the parsed account, null for an empty field, or an error message
// that is safe to show to the maker.
export function parseSocial(
  key: SocialKey,
  raw: string,
  context: SocialContext = "person"
): ParsedSocial | { error: string } | null {
  const value = raw.trim();
  if (!value) return null;
  const label = platformFor(key).label;
  if (value.length > MAX_INPUT_LENGTH) return { error: `${label} link is too long.` };
  if (/\s/.test(value)) return { error: `${label} handle or link cannot contain spaces.` };
  const result =
    ANY_HOST.test(value) || /^https?:\/\//i.test(value) || value.includes("/")
      ? fromLink(key, value, context)
      : fromHandle(key, value, context);
  if ("url" in result && result.url.length > MAX_URL_LENGTH) return { error: `${label} link is too long.` };
  return result;
}

// Reads social_<key> fields from a listing form submission into full URLs.
export function parseSocials(formData: FormData): { socials: Socials } | { error: string } {
  const socials: Socials = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const result = parseSocial(platform.key, String(formData.get(`social_${platform.key}`) ?? ""), "tool");
    if (result === null) continue;
    if ("error" in result) return { error: result.error };
    socials[platform.key] = result.url;
  }
  return { socials };
}

// Defensive read of stored data: keeps only known keys with string values.
export function normalizeSocials(value: unknown): Socials {
  const out: Socials = {};
  if (!value || typeof value !== "object") return out;
  for (const platform of SOCIAL_PLATFORMS) {
    const v = (value as Record<string, unknown>)[platform.key];
    if (typeof v === "string" && v.startsWith("https://")) out[platform.key] = v;
  }
  return out;
}
