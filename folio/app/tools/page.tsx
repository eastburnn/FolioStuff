import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import DirectoryGrid from "@/components/directory/DirectoryGrid";
import { getPublishedListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Indie Tool Directory",
  description:
    "A hand-reviewed directory of stock market, investing, and finance tools built by indie developers and regular people, not giant companies.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Indie Tool Directory | FolioStuff",
    description:
      "A hand-reviewed directory of stock market, investing, and finance tools built by indie developers and regular people, not giant companies.",
    url: "/tools",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

// Rendered per request so the ?tag= filter is applied server-side: no
// unfiltered flash or layout jump, and crawlers see the real cards.
export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  await searchParams;
  const listings = await getPublishedListings();

  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb items={[{ label: "Directory", href: "/tools" }]} />

        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
          Indie tool directory
        </h1>
        <p className="text-ink-secondary leading-relaxed mb-4 max-w-2xl">
          Stock market, investing, and finance tools built by indie developers and regular
          people. Every listing is submitted by its maker and reviewed by hand before it
          appears here.
        </p>
        <Link
          href="/submit"
          className="inline-block rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] hover:border-accent-purple/60 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] transition-all duration-200 px-5 py-2.5 text-sm font-semibold text-accent-purple mb-12"
        >
          Submit your tool
        </Link>

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-8 text-center">
            <p className="text-sm text-ink-secondary">
              The directory is just getting started. Built something?{" "}
              <Link href="/submit" className="text-ink-primary underline underline-offset-2">
                Be the first listing.
              </Link>
            </p>
          </div>
        ) : (
          <DirectoryGrid listings={listings} />
        )}
      </div>
    </div>
  );
}
