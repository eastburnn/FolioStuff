import type { MetadataRoute } from "next";
import { getPublishedListings } from "@/lib/listings";
import { getMakerUsernames } from "@/lib/profiles";

const BASE_URL = "https://www.foliostuff.com";

// Public pages only. Account pages, the submit form, and admin routes are
// left out and disallowed in robots.ts. Approvals, edits, pauses, and
// deletions revalidate this route so listings stay current.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, makers] = await Promise.all([getPublishedListings(), getMakerUsernames()]);

  const listingEntries: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${BASE_URL}/directory/${l.slug}`,
    lastModified: l.published_at ? new Date(l.published_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const makerEntries: MetadataRoute.Sitemap = makers.map((m) => ({
    url: `${BASE_URL}/makers/${m.username}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/tools`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/portfolio-visualizer`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/cost-basis`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/position-sizer`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/compound-interest-calculator`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/dividend-calculator`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/options-profit-calculator`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/directory`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    ...listingEntries,
    ...makerEntries,
  ];
}
