"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_DATA_TAG } from "@/lib/public-cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySubmissionApproved, notifySubmissionRejected, sendDirectMessage, sendEmailContent } from "@/lib/email";
import { adminNewSubmissionEmail, approvedEmail, directMessageEmail, rejectedEmail } from "@/lib/email-templates";
import { SAMPLE_DIRECT_MESSAGE } from "@/lib/email-samples";
import { deleteListingFiles, deleteAvatarFiles, deleteUserUploads, pruneFolder, privateFolder, imageExt } from "@/lib/listing-cleanup";
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
  revalidatePath("/directory");
  if (slug) revalidatePath(`/directory/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidateTag(PUBLIC_DATA_TAG);
  revalidatePath("/llms.txt");
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

  await deleteUserUploads(admin, ownerId);
  await deleteAvatarFiles(admin, ownerId);
  const { data: profile } = await admin.from("profiles").select("username").eq("id", ownerId).maybeSingle();

  const { error } = await admin.auth.admin.deleteUser(ownerId);
  if (error) {
    console.error("Account delete failed:", error);
    throw new Error("Account delete failed.");
  }
  revalidateDirectory();
  for (const listing of listings ?? []) {
    if (listing.is_published) revalidatePath(`/directory/${listing.slug}`);
  }
  if (profile?.username) revalidatePath(`/makers/${profile.username}`);
  revalidateTag(PUBLIC_DATA_TAG);
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
              : template === "message"
                ? directMessageEmail(SAMPLE_DIRECT_MESSAGE)
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

// Directory tab toggles. Pausing a listing hides it from the site and the
// sitemap (its page 404s) without touching the maker's data; featuring adds
// it to the homepage Featured section.
export async function setListingPublished(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");
  const id = String(formData.get("id") ?? "");
  const on = formData.get("value") === "1";
  if (!id) return;

  const { data } = await admin.from("listings").select("slug, owner_id, published").eq("id", id).maybeSingle();
  if (!data || !data.published) return;

  const { error } = await admin.from("listings").update({ is_published: on }).eq("id", id);
  if (error) {
    console.error("Publish toggle failed:", error);
    throw new Error("Could not update the listing.");
  }
  revalidateDirectory(data.slug);
  revalidatePath("/admin/directory");
  revalidateTag(PUBLIC_DATA_TAG);
  await revalidateMakerPage(admin, data.owner_id);
}

export async function setListingFeatured(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized.");
  const id = String(formData.get("id") ?? "");
  const on = formData.get("value") === "1";
  if (!id) return;

  const { error } = await admin.from("listings").update({ is_featured: on }).eq("id", id);
  if (error) {
    console.error("Feature toggle failed:", error);
    throw new Error("Could not update the listing.");
  }
  revalidatePath("/");
  revalidatePath("/admin/directory");
  revalidateTag(PUBLIC_DATA_TAG);
}

// Form versions of the destructive actions for the Manage Directory grid,
// which is a client component and passes ids through hidden inputs.
export async function deleteListingForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteListing(id);
  revalidatePath("/admin/directory");
  revalidateTag(PUBLIC_DATA_TAG);
}

export async function deleteMakerAccountForm(formData: FormData): Promise<void> {
  const owner = String(formData.get("owner") ?? "");
  if (!owner) return;
  await deleteMakerAccount(owner);
  revalidatePath("/admin/directory");
  revalidateTag(PUBLIC_DATA_TAG);
}

export interface ComposeState {
  sent?: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sends a one-off branded email written in the Emails tab. Admin only.
export async function sendComposedEmail(_prev: ComposeState, formData: FormData): Promise<ComposeState> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Not authorized." };

  const picked = String(formData.get("recipient") ?? "").trim();
  const other = String(formData.get("recipientOther") ?? "").trim();
  const to = (picked === "other" ? other : picked).toLowerCase();
  if (!EMAIL_RE.test(to) || to.length > 254) return { error: "Choose a recipient or enter a valid email address." };

  const sender = String(formData.get("sender") ?? "site");
  const subject = String(formData.get("subject") ?? "").replace(/\s+/g, " ").trim();
  const preheader = String(formData.get("preheader") ?? "").replace(/\s+/g, " ").trim();
  const message = String(formData.get("message") ?? "").replace(/\r\n?/g, "\n").trim();
  if (subject.length < 2 || subject.length > 150) return { error: "Subject must be 2 to 150 characters." };
  if (preheader.length > 150) return { error: "Preview text must be 150 characters or fewer." };
  if (message.length < 2 || message.length > 5000) return { error: "Message must be 2 to 5000 characters." };
  const copy = formData.get("copy") === "1";

  const ok = await sendDirectMessage(to, sender, { subject, preheader, message }, copy);
  if (!ok) return { error: "The email could not be sent. Check the email configuration and try again." };
  return { sent: to };
}
