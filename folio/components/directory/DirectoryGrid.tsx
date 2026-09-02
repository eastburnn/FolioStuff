"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ListingCard from "./ListingCard";
import type { PublishedListing } from "@/lib/listings";
import { normalizeTag } from "@/lib/tags";

// Tag-filterable grid of published listings. The active tag lives in the URL
// (?tag=) so filtered views can be shared and Back/Forward work; filtering
// itself is client-side so the directory page stays static.
export default function DirectoryGrid({ listings }: { listings: PublishedListing[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTag = searchParams.get("tag");
  const activeTag = rawTag ? normalizeTag(rawTag) : null;

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of listings) for (const t of l.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [listings]);

  const knownTag = activeTag !== null && tagCounts.some(([t]) => t === activeTag);
  const visible = activeTag ? listings.filter((l) => l.tags.includes(activeTag)) : listings;

  const select = (tag: string | null) => {
    router.replace(tag ? `/tools?tag=${encodeURIComponent(tag)}` : "/tools", { scroll: false });
  };

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
      active
        ? "bg-accent-purple/[0.15] border-accent-purple/40 text-accent-purple"
        : "border-white/[0.1] text-ink-secondary hover:text-ink-primary hover:border-white/[0.2]"
    }`;

  return (
    <div>
      {tagCounts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6" role="group" aria-label="Filter by tag">
          <button type="button" onClick={() => select(null)} aria-pressed={activeTag === null} className={chipClass(activeTag === null)}>
            All ({listings.length})
          </button>
          {tagCounts.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => select(activeTag === tag ? null : tag)}
              aria-pressed={activeTag === tag}
              className={chipClass(activeTag === tag)}
            >
              {tag} ({count})
            </button>
          ))}
          {activeTag && !knownTag && (
            <button type="button" onClick={() => select(null)} aria-pressed className={chipClass(true)}>
              {activeTag} (0)
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-ink-muted mb-6" aria-live="polite">
        {activeTag
          ? `Showing ${visible.length} of ${listings.length} listings tagged "${activeTag}".`
          : `Showing all ${listings.length} listings.`}
      </p>

      {visible.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No listings tagged &quot;{activeTag}&quot; yet.{" "}
          <button type="button" onClick={() => select(null)} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
            Show all listings
          </button>
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((listing) => (
            <ListingCard key={listing.slug} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
