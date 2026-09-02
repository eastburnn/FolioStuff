// Social links a maker can attach to a tool listing. Stored as a jsonb object
// keyed by platform, values are full https URLs on the platform's own domain.

export const SOCIAL_PLATFORMS = [
  { key: "x", label: "X (Twitter)", hosts: ["x.com", "twitter.com"], placeholder: "https://x.com/yourtool" },
  { key: "facebook", label: "Facebook", hosts: ["facebook.com"], placeholder: "https://facebook.com/yourtool" },
  { key: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"], placeholder: "https://linkedin.com/company/yourtool" },
  { key: "bluesky", label: "Bluesky", hosts: ["bsky.app"], placeholder: "https://bsky.app/profile/yourtool.bsky.social" },
  { key: "threads", label: "Threads", hosts: ["threads.net", "threads.com"], placeholder: "https://threads.net/@yourtool" },
] as const;

export type SocialKey = (typeof SOCIAL_PLATFORMS)[number]["key"];
export type Socials = Partial<Record<SocialKey, string>>;

const MAX_URL_LENGTH = 300;

function hostMatches(hostname: string, hosts: readonly string[]): boolean {
  return hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

// Returns the cleaned URL, null for an empty field, or an error message.
export function validateSocialUrl(
  key: SocialKey,
  raw: string
): { url: string } | { error: string } | null {
  const value = raw.trim();
  if (!value) return null;
  const platform = SOCIAL_PLATFORMS.find((p) => p.key === key)!;
  if (value.length > MAX_URL_LENGTH) return { error: `${platform.label} link is too long.` };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { error: `${platform.label} link must be a full URL starting with https://` };
  }
  if (parsed.protocol !== "https:" || !hostMatches(parsed.hostname.toLowerCase(), platform.hosts)) {
    return { error: `${platform.label} link must be an https:// URL on ${platform.hosts[0]}.` };
  }
  return { url: parsed.toString() };
}

// Reads social_<key> fields from a form submission.
export function parseSocials(formData: FormData): { socials: Socials } | { error: string } {
  const socials: Socials = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const result = validateSocialUrl(platform.key, String(formData.get(`social_${platform.key}`) ?? ""));
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
