import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin-gate";
import { normalizePublished, type ListingRow } from "@/lib/listings";
import { publicImageUrl } from "@/lib/supabase/config";
import AdminNav from "@/components/directory/AdminNav";
import AdminDirectoryGrid, { type AdminDirectoryItem } from "@/components/directory/AdminDirectoryGrid";
import { setListingPublished, setListingFeatured } from "../actions";

export const metadata: Metadata = {
  title: "Admin Directory",
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
      },
    ];
  });

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <AdminNav current="/admin/directory" />
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">Directory</h1>
        <p className="text-sm text-ink-secondary mb-8 max-w-2xl">
          Every approved tool. <span className="text-ink-primary">Live</span> controls whether it
          appears on the site and in the sitemap; switching it off pauses the listing without
          deleting anything. <span className="text-ink-primary">Featured</span> adds a larger card
          to the homepage Featured section.
        </p>
        <AdminDirectoryGrid
          items={items}
          publishAction={setListingPublished}
          featureAction={setListingFeatured}
        />
      </div>
    </div>
  );
}
