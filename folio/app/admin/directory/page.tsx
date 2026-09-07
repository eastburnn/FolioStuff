import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin-gate";
import { normalizePublished, type ListingRow } from "@/lib/listings";
import { publicImageUrl } from "@/lib/supabase/config";
import AdminDirectoryGrid, { type AdminDirectoryItem } from "@/components/directory/AdminDirectoryGrid";
import { setListingPublished, setListingFeatured, deleteListingForm, deleteMakerAccountForm } from "../actions";

export const metadata: Metadata = {
  title: "Manage Directory",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDirectoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/directory");

  const ctx = await getAdminContext();
  if (!ctx) notFound();
  const { admin } = ctx;

  // Every tool that has been approved at least once, live or paused.
  const { data } = await admin
    .from("listings")
    .select("*")
    .not("published", "is", null)
    .order("reviewed_at", { ascending: false });
  const rows = (data ?? []) as ListingRow[];

  // Maker emails, one lookup per unique owner, for the delete confirmations.
  const ownerEmails = new Map<string, string>();
  for (const ownerId of new Set(rows.map((r) => r.owner_id))) {
    const { data: owner } = await admin.auth.admin.getUserById(ownerId);
    if (owner?.user?.email) ownerEmails.set(ownerId, owner.user.email);
  }

  const items: AdminDirectoryItem[] = rows.flatMap((row) => {
    const snapshot = normalizePublished(row.published);
    if (!snapshot) return [];
    return [
      {
        id: row.id,
        slug: row.slug,
        name: snapshot.name,
        tagline: snapshot.tagline,
        tags: snapshot.tags,
        makerName: snapshot.maker_name,
        iconUrl: snapshot.icon_path ? publicImageUrl(snapshot.icon_path) : null,
        isPublished: row.is_published,
        isFeatured: row.is_featured,
        editPending: row.status === "pending",
        ownerId: row.owner_id,
        ownerEmail: ownerEmails.get(row.owner_id) ?? "unknown email",
      },
    ];
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">Manage Directory</h1>
      <p className="text-sm text-ink-secondary mb-8 max-w-2xl">
        Every tool that has been approved, live or paused, with its controls in one place.{" "}
        <span className="text-ink-primary">Live</span> shows or hides it on the site and in the
        sitemap without deleting anything. <span className="text-ink-primary">Featured</span>{" "}
        adds a larger card to the homepage. Deleting a listing or a maker account is permanent.
      </p>
      <AdminDirectoryGrid
        items={items}
        publishAction={setListingPublished}
        featureAction={setListingFeatured}
        deleteAction={deleteListingForm}
        deleteAccountAction={deleteMakerAccountForm}
      />
    </div>
  );
}
