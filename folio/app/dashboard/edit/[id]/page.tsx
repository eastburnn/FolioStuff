import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import ListingForm from "@/components/directory/ListingForm";
import { createClient } from "@/lib/supabase/server";
import type { ListingRow } from "@/lib/listings";
import { normalizeSocials } from "@/lib/socials";
import { updateListing } from "../../actions";

export const metadata: Metadata = {
  title: "Edit Listing",
  robots: { index: false },
};

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  const listing = data as ListingRow | null;
  if (!listing || listing.owner_id !== user.id) notFound();

  const action = updateListing.bind(null, listing.id);

  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Edit", href: `/dashboard/edit/${listing.id}` },
          ]}
        />
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
          Edit {listing.name}
        </h1>
        {listing.is_published ? (
          <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/[0.08] p-4 mb-8 text-sm text-accent-gold">
            This listing is live. Saving changes sends the new version to review, and the
            current version stays live until it is approved. If the changes are not approved,
            the current version stays exactly as it is.
          </div>
        ) : (
          <p className="text-sm text-ink-secondary mb-8 max-w-xl">
            Saving changes updates your submission in the review queue.
          </p>
        )}
        <ListingForm
          action={action}
          submitLabel={listing.is_published ? "Save and send for re-approval" : "Save changes"}
          initial={{
            name: listing.name,
            url: listing.url,
            tagline: listing.tagline,
            description: listing.description,
            tags: listing.tags ?? [],
            socials: normalizeSocials(listing.socials),
            hasIcon: Boolean(listing.icon_path),
            screenshotCount: listing.screenshot_paths.length,
          }}
        />
      </div>
    </div>
  );
}
