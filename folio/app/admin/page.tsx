import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin-gate";
import type { ListingRow } from "@/lib/listings";
import { SOCIAL_PLATFORMS, normalizeSocials } from "@/lib/socials";
import AdminNav from "@/components/directory/AdminNav";
import ConfirmButton from "@/components/directory/ConfirmButton";
import {
  approveListing,
  rejectListing,
  unpublishListing,
  republishListing,
  deleteListing,
  deleteMakerAccount,
} from "./actions";

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
  const published = listings.filter((l) => l.is_published);
  const unpublished = listings.filter((l) => l.status === "approved" && !l.is_published);

  // Maker emails, one lookup per unique owner.
  const ownerEmails = new Map<string, string>();
  for (const ownerId of new Set(listings.map((l) => l.owner_id))) {
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
    <div className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <AdminNav current="/admin" />
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-10">
          Review queue
        </h1>

        <section className="mb-14">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
            Pending ({pendingViews.length})
          </h2>
          {pendingViews.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing waiting. Nice.</p>
          ) : (
            <div className="space-y-6">
              {pendingViews.map(({ listing, iconUrl, screenshotUrls }) => {
                const socials = normalizeSocials(listing.socials);
                const socialEntries = SOCIAL_PLATFORMS.filter((p) => socials[p.key]);
                const isEdit = Boolean(listing.published);
                return (
                  <div key={listing.id} className="rounded-2xl border border-white/[0.08] bg-bg-card p-6">
                    {isEdit && (
                      <div className="flex items-center justify-between gap-3 mb-4 rounded-lg border border-accent-gold/30 bg-accent-gold/[0.08] px-3 py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-gold">
                          {listing.is_published ? "Edit of a live listing" : "Edit of an unpublished listing"}
                        </span>
                        {listing.is_published && (
                          <a href={`/tools/${listing.slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-accent-gold hover:underline">
                            Compare with the live version
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-4">
                      {iconUrl ? (
                        // Signed URL from the private bucket; plain img avoids
                        // exposing the signed link through the optimizer.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={iconUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.06] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-ink-primary">{listing.name}</p>
                        <a href={listing.url} target="_blank" rel="noopener noreferrer nofollow"
                          className="text-xs text-accent-purple hover:underline break-all">
                          {listing.url}
                        </a>
                        <p className="text-xs text-ink-muted mt-1">
                          {(listing.tags ?? []).join(", ") || "no tags"} · by {listing.maker_name}
                          {listing.maker_x_handle ? ` (@${listing.maker_x_handle})` : ""}
                          {" · "}{ownerEmails.get(listing.owner_id) ?? "unknown email"}
                        </p>
                        {socialEntries.map((p) => (
                          <p key={p.key} className="text-xs text-ink-muted mt-1 break-all">
                            {p.label}:{" "}
                            <a href={socials[p.key]} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-ink-secondary underline underline-offset-2">
                              {socials[p.key]}
                            </a>
                          </p>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-ink-secondary mb-1 font-medium">{listing.tagline}</p>
                    <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line mb-4">
                      {listing.description}
                    </p>

                    {screenshotUrls.length > 0 && (
                      <div className="flex gap-3 mb-5 overflow-x-auto">
                        {screenshotUrls.map((url) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={url} src={url} alt="" className="h-28 rounded-lg border border-white/[0.08] object-cover" />
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <form action={approveListing.bind(null, listing.id)}>
                        <button type="submit"
                          className="rounded-xl bg-accent-green/[0.15] border border-accent-green/40 hover:bg-accent-green/[0.25] transition-colors px-5 py-2.5 text-sm font-semibold text-accent-green">
                          {listing.is_published ? "Approve and replace live version" : "Approve and publish"}
                        </button>
                      </form>
                      <form action={rejectListing.bind(null, listing.id)} className="flex flex-1 gap-3">
                        <input name="feedback" type="text" required maxLength={1000}
                          placeholder={isEdit ? "Feedback (the previous version is kept)" : "Feedback for the maker (required to reject)"}
                          className="flex-1 bg-bg-primary border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-white/20" />
                        <button type="submit"
                          className="rounded-xl bg-red-400/[0.12] border border-red-400/40 hover:bg-red-400/[0.2] transition-colors px-5 py-2.5 text-sm font-semibold text-red-400">
                          {isEdit ? "Reject changes" : "Reject"}
                        </button>
                      </form>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.05]">
                      {dangerLinks(listing)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-14">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
            Live ({published.length})
          </h2>
          {published.length === 0 ? (
            <p className="text-sm text-ink-muted">No published listings yet.</p>
          ) : (
            <div className="space-y-3">
              {published.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-bg-card/60 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-primary">
                      {l.published?.name ?? l.name}
                      {l.status === "pending" && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-accent-gold">edit pending</span>
                      )}
                    </p>
                    <a href={`/tools/${l.slug}`} className="text-xs text-ink-muted hover:text-ink-secondary">
                      /tools/{l.slug}
                    </a>
                    <span className="text-xs text-ink-muted/70"> · {ownerEmails.get(l.owner_id) ?? "unknown email"}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <form action={unpublishListing.bind(null, l.id)}>
                      <button type="submit" className="text-xs text-ink-muted hover:text-red-400 transition-colors">
                        Unpublish
                      </button>
                    </form>
                    {dangerLinks(l)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {unpublished.length > 0 && (
          <section className="mb-14">
            <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
              Unpublished ({unpublished.length})
            </h2>
            <div className="space-y-3">
              {unpublished.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-bg-card/60 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-primary">{l.published?.name ?? l.name}</p>
                    <span className="text-xs text-ink-muted">/tools/{l.slug} · {ownerEmails.get(l.owner_id) ?? "unknown email"}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {l.published && (
                      <form action={republishListing.bind(null, l.id)}>
                        <button type="submit" className="text-xs text-accent-green hover:underline transition-colors">
                          Republish
                        </button>
                      </form>
                    )}
                    {dangerLinks(l)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
