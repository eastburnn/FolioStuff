"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySubmissionApproved, notifySubmissionRejected, sendEmailContent } from "@/lib/email";
import { adminNewSubmissionEmail, approvedEmail, rejectedEmail } from "@/lib/email-templates";
import { deleteListingFiles, deleteAvatarFiles, pruneFolder, privateFolder, imageExt } from "@/lib/listing-cleanup";
import { getAdminContext } from "@/lib/admin-gate";
import { normalizePublished, type ListingRow, type PublishedListing } from "@/lib/listings";
import { normalizeSocials } from "@/lib/socials";

// Returns the admin client only after verifying the signed-in user's email
// is in app_admins. Every admin action goes through this gate.
async function requireAdmin(): Promise<SupabaseClient | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("app_admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();
  return data ? admin : null;
}

function revalidateDirectory(slug?: string) {
  revalidatePath("/");
  revalidatePath("/tools");
  if (slug) revalidatePath(`/tools/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
}

// The maker's public page lists their tools from the same snapshot.
async function revalidateMakerPage(admin: SupabaseClient, ownerId: string) {
  const { data } = await admin.from("profiles").select("username").eq("id", ownerId).maybeSingle();
  if (data?.username) revalidatePath(`/makers/${data.username}`);
}

async function copyToPublic(admin: SupabaseClient, fromPath: string, toPath: string): Promise<boolean> {
  const { data: file, error: downloadError } = await admin.storage
    .from("listing-uploads")
    .download(fromPath);
  if (downloadError || !file) return false;
  const { error: uploadError } = await admin.storage
    .from("listing-public")
    .upload(toPath, file, { contentType: file.type, upsert: true });
  return !uploadError;
}

async function ownerEmail(admin: SupabaseClient, ownerId: string): Promise<string | null> {
  const { data } = await admin.auth.admin.getUserById(ownerId);
  return data?.user?.email ?? null;
}

// Publishes the row's current content. Images are copied to versioned public
// names first; if any copy fails nothing is written and the row stays
// pending so the admin can retry. Stale files are pruned only after the
// database update succeeds, so a live listing never loses its images.
export async function approveListing(listingId: string): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");

  const { data } = await admin.from("listings").select("*").eq("id", listingId).maybeSingle();
  const listing = data as ListingRow | null;
  if (!listing || listing.status !== "pending") return;
  const isEdit = listing.is_published;
  const stamp = Date.now();

  let publicIcon: string | null = null;
  if (listing.icon_path) {
    publicIcon = `${listing.id}/icon-${stamp}.${imageExt(listing.icon_path)}`;
    if (!(await copyToPublic(admin, listing.icon_path, publicIcon))) {
      throw new Error("Could not copy the icon to public storage. Nothing was published; try again.");
    }
  }
  const publicShots: string[] = [];
  for (let i = 0; i < listing.screenshot_paths.length; i++) {
    const from = listing.screenshot_paths[i];
    const to = `${listing.id}/shot-${stamp}-${i}.${imageExt(from)}`;
    if (!(await copyToPublic(admin, from, to))) {
      await admin.storage.from("listing-public").remove([publicIcon, ...publicShots].filter((p): p is string => Boolean(p)));
      throw new Error("Could not copy a screenshot to public storage. Nothing was published; try again.");
    }
    publicShots.push(to);
  }

  const published: PublishedListing = {
    slug: listing.slug,
    name: listing.name,
    url: listing.url,
    tagline: listing.tagline,
    description: listing.description,
    tags: listing.tags ?? [],
    socials: normalizeSocials(listing.socials),
    maker_name: listing.maker_name,
    maker_x_handle: listing.maker_x_handle,
    icon_path: publicIcon,
    screenshot_paths: publicShots,
    source_icon_path: listing.icon_path,
    source_screenshot_paths: listing.screenshot_paths,
    published_at: new Date(stamp).toISOString(),
  };

  const { error } = await admin
    .from("listings")
    .update({
      status: "approved",
      review_feedback: null,
      is_published: true,
      published,
      reviewed_at: new Date(stamp).toISOString(),
    })
    .eq("id", listingId);
  if (error) {
    await admin.storage.from("listing-public").remove([publicIcon, ...publicShots].filter((p): p is string => Boolean(p)));
    console.error("Approve failed:", error);
    throw new Error("Approve failed. Nothing was published; try again.");
  }

  // Now safe to drop superseded public copies and previous private originals.
  try {
    await pruneFolder(admin, "listing-public", listing.id, new Set([publicIcon, ...publicShots].filter((p): p is string => Boolean(p))));
    await pruneFolder(
      admin,
      "listing-uploads",
      privateFolder(listing),
      new Set([listing.icon_path, ...listing.screenshot_paths].filter((p): p is string => Boolean(p)))
    );
  } catch (err) {
    console.error("Image prune failed:", err);
  }

  revalidateDirectory(listing.slug);
  await revalidateMakerPage(admin, listing.owner_id);

  const email = await ownerEmail(admin, listing.owner_id);
  if (email) await notifySubmissionApproved(email, listing.name, listing.slug, isEdit);
}

// Rejecting a submission that has never been approved deletes it outright:
// the maker gets the feedback by email and resubmits fresh. Rejecting an edit
// of a previously approved listing rolls the row back to its snapshot,
// discarding the edit and its uploads, whether or not it is currently live.
export async function rejectListing(listingId: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");

  const feedback = String(formData.get("feedback") ?? "").trim().slice(0, 1000);
  if (!feedback) return;

  const { data } = await admin.from("listings").select("*").eq("id", listingId).maybeSingle();
  const listing = data as ListingRow | null;
  if (!listing || listing.status !== "pending") return;

  const email = await ownerEmail(admin, listing.owner_id);
  const snapshot = normalizePublished(listing.published);

  if (!snapshot) {
    await deleteListingFiles(admin, listing);
    const { error } = await admin.from("listings").delete().eq("id", listingId);
    if (error) {
      console.error("Reject failed:", error);
      throw new Error("Reject failed.");
    }
    revalidatePath("/admin");
    if (email) await notifySubmissionRejected(email, listing.name, feedback);
    return;
  }

  const restoredIcon = snapshot.source_icon_path;
  const restoredShots = snapshot.source_screenshot_paths;

  const { error } = await admin
    .from("listings")
    .update({
      name: snapshot.name,
      url: snapshot.url,
      tagline: snapshot.tagline,
      description: snapshot.description,
      tags: snapshot.tags,
      socials: snapshot.socials,
      icon_path: restoredIcon,
      screenshot_paths: restoredShots,
      status: "approved",
      review_feedback: null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", listingId);
  if (error) {
    console.error("Reject edit failed:", error);
    throw new Error("Reject failed.");
  }

  // Discard the edit's uploads; keep only the live version's originals.
  try {
    await pruneFolder(
      admin,
      "listing-uploads",
      privateFolder(listing),
      new Set([restoredIcon, ...restoredShots].filter((p): p is string => Boolean(p)))
    );
  } catch (err) {
    console.error("Edit upload cleanup failed:", err);
  }

  revalidatePath("/admin");
  if (email) await notifySubmissionRejected(email, snapshot.name, feedback, true);
}

// Full removal: row plus all stored images, even after a listing is live.
export async function deleteListing(listingId: string): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");

  const { data } = await admin
    .from("listings")
    .select("id, owner_id, slug, is_published")
    .eq("id", listingId)
    .maybeSingle();
  if (!data) return;

  await deleteListingFiles(admin, data);
  const { error } = await admin.from("listings").delete().eq("id", listingId);
  if (error) {
    console.error("Admin listing delete failed:", error);
    throw new Error("Delete failed.");
  }
  revalidateDirectory(data.slug);
  await revalidateMakerPage(admin, data.owner_id);
}

// Removes the account, every listing it owns (rows cascade), and all files.
export async function deleteMakerAccount(ownerId: string): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");

  const { data: listings } = await admin
    .from("listings")
    .select("id, owner_id, slug, is_published")
    .eq("owner_id", ownerId);
  for (const listing of listings ?? []) {
    await deleteListingFiles(admin, listing);
  }

  await deleteAvatarFiles(admin, ownerId);
  const { data: profile } = await admin.from("profiles").select("username").eq("id", ownerId).maybeSingle();

  const { error } = await admin.auth.admin.deleteUser(ownerId);
  if (error) {
    console.error("Account delete failed:", error);
    throw new Error("Account delete failed.");
  }
  revalidateDirectory();
  for (const listing of listings ?? []) {
    if (listing.is_published) revalidatePath(`/tools/${listing.slug}`);
  }
  if (profile?.username) revalidatePath(`/makers/${profile.username}`);
}

// Sends a sample of one of the notification templates to the admin's own inbox.
export async function sendTestEmail(template: string): Promise<void> {
  const ctx = await getAdminContext();
  if (!ctx?.user.email) throw new Error("Not authorized.");

  const feedback =
    "The screenshots are too low resolution to see what the tool does. Mind re-uploading sharper ones?";
  const content =
    template === "approved"
      ? approvedEmail("DivRadar", "divradar")
      : template === "approved-edit"
        ? approvedEmail("DivRadar", "divradar", true)
        : template === "rejected"
          ? rejectedEmail("DivRadar", feedback)
          : template === "rejected-edit"
            ? rejectedEmail("DivRadar", feedback, true)
            : template === "admin-edit"
              ? adminNewSubmissionEmail("DivRadar", true)
              : adminNewSubmissionEmail("DivRadar");

  await sendEmailContent(ctx.user.email, content);
  redirect(`/admin/emails?template=${encodeURIComponent(template)}&sent=1`);
}

// Takes a listing off the public site; the snapshot is kept so it can be
// republished as-is.
export async function unpublishListing(listingId: string): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");

  const { data } = await admin.from("listings").select("slug, owner_id").eq("id", listingId).maybeSingle();
  if (!data) return;

  const { error } = await admin.from("listings").update({ is_published: false }).eq("id", listingId);
  if (error) {
    console.error("Unpublish failed:", error);
    throw new Error("Unpublish failed.");
  }
  revalidateDirectory(data.slug);
  await revalidateMakerPage(admin, data.owner_id);
}

// Puts an unpublished listing back on the site using its existing snapshot.
export async function republishListing(listingId: string): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");

  const { data } = await admin
    .from("listings")
    .select("slug, owner_id, published, status")
    .eq("id", listingId)
    .maybeSingle();
  if (!data || !data.published || data.status !== "approved") return;

  const { error } = await admin.from("listings").update({ is_published: true }).eq("id", listingId);
  if (error) {
    console.error("Republish failed:", error);
    throw new Error("Republish failed.");
  }
  revalidateDirectory(data.slug);
  await revalidateMakerPage(admin, data.owner_id);
}
