// Shared tag rules for the submission form (client) and server actions.

export const MAX_TAGS = 3;
export const TAG_MIN_LENGTH = 2;
export const TAG_MAX_LENGTH = 24;

// Shown as suggestions alongside tags from published listings, so the
// autocomplete is useful before the directory has many entries.
export const STARTER_TAGS = [
  "calculator",
  "screener",
  "charting",
  "portfolio-tracker",
  "visualizer",
  "research",
  "news",
  "education",
  "game",
  "personal-finance",
  "budgeting",
  "retirement",
  "dividends",
  "options",
  "crypto",
  "tax",
  "backtesting",
  "alerts",
  "ai",
];

// Lowercases, collapses whitespace to single hyphens, strips anything that
// is not a letter, number, or hyphen. Returns null when nothing usable remains.
export function normalizeTag(raw: string): string | null {
  const tag = raw
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (tag.length < TAG_MIN_LENGTH || tag.length > TAG_MAX_LENGTH) return null;
  return tag;
}

export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>();
  for (const r of raw) {
    const tag = normalizeTag(r);
    if (tag && !seen.has(tag)) seen.add(tag);
    if (seen.size >= MAX_TAGS) break;
  }
  return [...seen];
}
