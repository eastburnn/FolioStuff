import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabaseEnv } from "./supabase/config";
import { normalizeSocials, type Socials } from "./socials";

// The content snapshot that the public site renders. Written by the approve
// action; maker edits do not touch it until re-approved. The source_* paths
// record the private originals of the published images so a rejected edit
// can be rolled back to them.
export interface PublishedListing {
  slug: string;
  name: string;
  url: string;
  tagline: string;
  description: string;
  tags: string[];
  socials: Socials;
  maker_name: string;
  maker_x_handle: string | null;
  icon_path: string | null;
  screenshot_paths: string[];
  source_icon_path: string | null;
  source_screenshot_paths: string[];
  published_at: string;
}

export interface ListingRow {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  url: string;
  tagline: string;
  description: string;
  tags: string[];
  socials: Socials;
  maker_name: string;
  maker_x_handle: string | null;
  icon_path: string | null;
  screenshot_paths: string[];
  status: "pending" | "approved" | "rejected";
  review_feedback: string | null;
  is_published: boolean;
  published: PublishedListing | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

// Snapshots written by older code may lack newer keys; never let that crash
// a public page.
export function normalizePublished(raw: unknown): PublishedListing | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.slug !== "string" || typeof p.name !== "string") return null;
  const strings = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  return {
    slug: p.slug,
    name: p.name,
    url: typeof p.url === "string" ? p.url : "",
    tagline: typeof p.tagline === "string" ? p.tagline : "",
    description: typeof p.description === "string" ? p.description : "",
    tags: strings(p.tags),
    socials: normalizeSocials(p.socials),
    maker_name: typeof p.maker_name === "string" ? p.maker_name : "",
    maker_x_handle: typeof p.maker_x_handle === "string" ? p.maker_x_handle : null,
    icon_path: typeof p.icon_path === "string" ? p.icon_path : null,
    screenshot_paths: strings(p.screenshot_paths),
    source_icon_path: typeof p.source_icon_path === "string" ? p.source_icon_path : null,
    source_screenshot_paths: strings(p.source_screenshot_paths),
    published_at: typeof p.published_at === "string" ? p.published_at : "",
  };
}

// Public reads go through the published_listings view, which exposes only the
// live snapshot of published rows. Plain anon client with no cookies, so
// public pages can stay static/ISR.
function publicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function getPublishedListings(limit?: number): Promise<PublishedListing[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    let query = publicClient()
      .from("published_listings")
      .select("published")
      .order("reviewed_at", { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error || !data) return [];
    return data
      .map((row) => normalizePublished(row.published))
      .filter((p): p is PublishedListing => p !== null);
  } catch {
    return [];
  }
}

export async function getPublishedListing(slug: string): Promise<PublishedListing | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const { data, error } = await publicClient()
      .from("published_listings")
      .select("published")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return normalizePublished(data.published);
  } catch {
    return null;
  }
}

export async function getPublishedListingsByOwner(ownerId: string): Promise<PublishedListing[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const { data, error } = await publicClient()
      .from("published_listings")
      .select("published")
      .eq("owner_id", ownerId)
      .order("reviewed_at", { ascending: false });
    if (error || !data) return [];
    return data
      .map((row) => normalizePublished(row.published))
      .filter((p): p is PublishedListing => p !== null);
  } catch {
    return [];
  }
}

export async function getListingOwnerId(slug: string): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const { data, error } = await publicClient()
      .from("published_listings")
      .select("owner_id")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return data.owner_id as string;
  } catch {
    return null;
  }
}

// Produces a slug that satisfies the database's listings_slug_check pattern
// (starts and ends alphanumeric, max length). The default cap leaves room
// for a collision suffix.
export function slugify(name: string, maxLength = 52): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, "");
}
