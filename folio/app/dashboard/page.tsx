import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin-gate";
import { getPublishedListingsBySlugs } from "@/lib/listings";
import type { Profile } from "@/lib/profiles";
import { OWN_TOOLS } from "@/components/OwnTools";
import WidgetCard from "@/components/WidgetCard";
import ListingCard from "@/components/directory/ListingCard";
import BookmarkButton from "@/components/directory/BookmarkButton";
import DashboardShell from "@/components/directory/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

// The Saved tab: the visitor's private bookmarks, rendered as the same cards
// used across the site so it doubles as a personal launchpad.
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profileData }, { data: bookmarkRows }, { count: publishedCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("bookmarks").select("kind, ref, created_at").order("created_at", { ascending: false }),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_published", true),
  ]);
  const profile = profileData as Profile | null;
  const bookmarks = (bookmarkRows ?? []) as { kind: "tool" | "listing"; ref: string; created_at: string }[];
  const isAdmin = Boolean(await getAdminContext());

  const toolRefs = bookmarks.filter((b) => b.kind === "tool").map((b) => b.ref);
  const savedTools = toolRefs
    .map((ref) => OWN_TOOLS.find((t) => t.href === ref))
    .filter((t): t is (typeof OWN_TOOLS)[number] => Boolean(t));
  const listingSlugs = bookmarks.filter((b) => b.kind === "listing").map((b) => b.ref);
  const listings = await getPublishedListingsBySlugs(listingSlugs);
  const savedListings = listingSlugs
    .map((slug) => listings.find((l) => l.slug === slug))
    .filter((l): l is (typeof listings)[number] => Boolean(l));

  const nothing = savedTools.length === 0 && savedListings.length === 0;

  return (
    <DashboardShell user={user} profile={profile} isAdmin={isAdmin} hasPublishedListing={(publishedCount ?? 0) > 0}>
      {nothing ? (
        <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-8 text-center">
          <p className="text-sm text-ink-secondary mb-2">Nothing saved yet.</p>
          <p className="text-xs text-ink-muted mb-5">
            Tap the bookmark on any tool or directory listing to keep it here for quick access.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/tools" className="rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] transition-colors px-5 py-2.5 text-sm font-semibold text-accent-purple">
              Browse the tools
            </Link>
            <Link href="/directory" className="rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-colors px-5 py-2.5 text-sm font-semibold text-ink-primary">
              Browse the directory
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {savedTools.length > 0 && (
            <section>
              <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Saved tools</h2>
              <div className="grid sm:grid-cols-2 auto-rows-fr gap-4">
                {savedTools.map((tool) => (
                  <div key={tool.href} className="relative">
                    <WidgetCard {...tool} />
                    <BookmarkButton kind="tool" refId={tool.href} refreshOnChange className="absolute top-3 right-3" />
                  </div>
                ))}
              </div>
            </section>
          )}
          {savedListings.length > 0 && (
            <section>
              <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Saved from the directory</h2>
              <div className="grid sm:grid-cols-2 auto-rows-fr gap-4">
                {savedListings.map((listing) => (
                  <div key={listing.slug} className="relative">
                    <ListingCard listing={listing} />
                    <BookmarkButton kind="listing" refId={listing.slug} refreshOnChange className="absolute top-3 right-3" />
                  </div>
                ))}
              </div>
            </section>
          )}
          <p className="text-xs text-ink-muted">
            Only you can see this list. Remove anything with its bookmark button.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
