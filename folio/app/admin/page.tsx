import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin-gate";
import type { ListingRow } from "@/lib/listings";
import { normalizeSocials } from "@/lib/socials";
import ConfirmButton from "@/components/directory/ConfirmButton";
import PendingCard from "@/components/directory/PendingCard";
import { approveListing, rejectListing, deleteListing, deleteMakerAccount } from "./actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Review queue is always fresh, never cached.
export const dynamic = "force-dynamic";

interface PendingView {
  listing: ListingRow;
  iconUrl: string | null;
  screenshotUrls: string[];
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  // Non-admin accounts get a 404, revealing nothing.
  const ctx = await getAdminContext();
  if (!ctx) notFound();
  const { admin } = ctx;

  const { data: rows } = await admin
    .from("listings")
    .select("*")
    .order("created_at", { ascending: true });
  const listings = (rows ?? []) as ListingRow[];

  const pending = listings.filter((l) => l.status === "pending");

  // Maker emails, one lookup per unique owner.
  const ownerEmails = new Map<string, string>();
  for (const ownerId of new Set(pending.map((l) => l.owner_id))) {
    const { data } = await admin.auth.admin.getUserById(ownerId);
    if (data?.user?.email) ownerEmails.set(ownerId, data.user.email);
  }

  // Signed URLs so pending images can be previewed from the private bucket.
  const pendingViews: PendingView[] = await Promise.all(
    pending.map(async (listing) => {
      const paths = [listing.icon_path, ...listing.screenshot_paths].filter(
        (p): p is string => Boolean(p)
      );
      const { data: signed } = paths.length
        ? await admin.storage.from("listing-uploads").createSignedUrls(paths, 3600)
        : { data: [] };
      const urls = (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => Boolean(u));
      const iconUrl = listing.icon_path ? (urls[0] ?? null) : null;
      const screenshotUrls = listing.icon_path ? urls.slice(1) : urls;
      return { listing, iconUrl, screenshotUrls };
    })
  );

  const dangerLinks = (l: ListingRow, size = "text-xs") => (
    <>
      {/* Wrapped by the caller's flex row; each is its own form. */}
      <form action={deleteListing.bind(null, l.id)}>
        <ConfirmButton
          message={`Permanently delete the listing "${l.published?.name ?? l.name}" and its images?`}
          className={`${size} text-ink-muted hover:text-red-400 transition-colors`}
        >
          Delete listing
        </ConfirmButton>
      </form>
      <form action={deleteMakerAccount.bind(null, l.owner_id)}>
        <ConfirmButton
          message={`Delete this maker's ACCOUNT (${ownerEmails.get(l.owner_id) ?? "unknown"}) along with all of their listings and files? This cannot be undone.`}
          className={`${size} text-ink-muted hover:text-red-400 transition-colors`}
        >
          Delete account
        </ConfirmButton>
      </form>
    </>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-10">
        Review queue
      </h1>

      <section>
        <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
          Pending ({pendingViews.length})
        </h2>
        {pendingViews.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing waiting. Nice.</p>
        ) : (
          <div className="space-y-4">
            {pendingViews.map(({ listing, iconUrl, screenshotUrls }) => {
              const isEdit = Boolean(listing.published);
              return (
                <PendingCard
                  key={listing.id}
                  listing={{
                    slug: listing.slug,
                    name: listing.name,
                    url: listing.url,
                    tagline: listing.tagline,
                    description: listing.description,
                    tags: listing.tags ?? [],
                    socials: normalizeSocials(listing.socials),
                    maker_name: listing.maker_name,
                    maker_x_handle: listing.maker_x_handle,
                    iconSrc: iconUrl,
                    screenshots: screenshotUrls,
                  }}
                  ownerEmail={ownerEmails.get(listing.owner_id) ?? "unknown email"}
                  isEdit={isEdit}
                  isLive={listing.is_published}
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <form action={approveListing.bind(null, listing.id)} className="sm:shrink-0">
                      <button type="submit"
                        className="w-full rounded-xl bg-accent-green/[0.15] border border-accent-green/40 hover:bg-accent-green/[0.25] transition-colors px-5 py-2.5 text-sm font-semibold text-accent-green whitespace-nowrap">
                        {listing.is_published ? "Approve and replace live" : "Approve and publish"}
                      </button>
                    </form>
                    <form action={rejectListing.bind(null, listing.id)} className="flex flex-col sm:flex-row flex-1 gap-3 min-w-0">
                      <input name="feedback" type="text" required maxLength={1000}
                        placeholder={isEdit ? "Feedback (previous version is kept)" : "Feedback for the maker"}
                        className="flex-1 min-w-0 bg-bg-base border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-white/20" />
                      <button type="submit"
                        className="rounded-xl bg-red-400/[0.12] border border-red-400/40 hover:bg-red-400/[0.2] transition-colors px-5 py-2.5 text-sm font-semibold text-red-400 whitespace-nowrap">
                        {isEdit ? "Reject changes" : "Reject"}
                      </button>
                    </form>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-white/[0.05]">
                    {dangerLinks(listing)}
                  </div>
                </PendingCard>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
