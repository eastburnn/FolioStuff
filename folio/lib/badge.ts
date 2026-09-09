// The "Listed on FolioStuff" badge a maker can embed on their own site. The
// image is a static SVG served by this site, and the link goes to the maker's
// listing page, which is what earns the backlink.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.foliostuff.com";

export const BADGE_WIDTH = 128;
export const BADGE_HEIGHT = 44;

export function listingUrl(slug: string): string {
  return `${SITE_URL}/directory/${slug}`;
}

export function badgeImageUrl(format: "svg" | "png" = "svg"): string {
  return `${SITE_URL}/badge.${format}`;
}

// Slugs are limited to [a-z0-9-] by the database, so nothing needs escaping.
export function badgeEmbedCode(slug: string): string {
  return `<a href="${listingUrl(slug)}" target="_blank" rel="noopener"><img src="${badgeImageUrl()}" alt="Listed on FolioStuff" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" style="border:0"></a>`;
}
