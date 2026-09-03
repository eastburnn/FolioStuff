"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validImage, imageExtension, extractFields, getUploadedFiles } from "@/lib/listing-form";
import { uploadListingImages } from "@/lib/listing-uploads";
import { deleteListingFiles, deleteAvatarFiles, pruneFolder } from "@/lib/listing-cleanup";
import { normalizePublished } from "@/lib/listings";
import { notifyAdminNewSubmission } from "@/lib/email";
import { verifyTurnstile } from "@/lib/turnstile";
import { USERNAME_PATTERN, RESERVED_USERNAMES, normalizeLink } from "@/lib/profiles";
import { parseSocial, type SocialKey } from "@/lib/socials";
import type { ListingFormState } from "@/components/directory/ListingForm";
import type { ProfileFormState } from "@/components/directory/ProfileForm";

// Edits a listing the maker owns. The database trigger sends the row back to
// 'pending'; if the listing has been approved before, its snapshot stays live
// until the edit is approved, and the admin gets a distinct "edit" email.
export async function updateListing(
  listingId: string,
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  // RLS restricts this to the owner's own rows.
  const { data: existing } = await supabase
    .from("listings")
    .select("id, owner_id, name, is_published, icon_path, screenshot_paths, published")
    .eq("id", listingId)
    .maybeSingle();
  if (!existing || existing.owner_id !== user.id) return { error: "Listing not found." };

  const parsed = extractFields(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { fields } = parsed;

  const { icon, screenshots } = getUploadedFiles(formData);
  const removeScreenshots = formData.get("remove_screenshots") === "1";

  const captchaOk = await verifyTurnstile(
    String(formData.get("cf-turnstile-response") ?? "") || null
  );
  if (!captchaOk) return { error: "Captcha verification failed. Please try again." };

  const uploaded = await uploadListingImages(supabase, user.id, listingId, icon, screenshots);
  if (uploaded.error) return { error: uploaded.error };
  const freshUploads = [uploaded.iconPath, ...(uploaded.screenshotPaths ?? [])].filter(
    (p): p is string => Boolean(p)
  );

  const update: Record<string, unknown> = { ...fields };
  if (uploaded.iconPath) update.icon_path = uploaded.iconPath;
  if (uploaded.screenshotPaths && uploaded.screenshotPaths.length > 0) {
    update.screenshot_paths = uploaded.screenshotPaths;
  } else if (removeScreenshots) {
    update.screenshot_paths = [];
  }

  const { error } = await supabase.from("listings").update(update).eq("id", listingId);
  if (error) {
    console.error("Listing update failed:", error);
    if (freshUploads.length) {
      await supabase.storage.from("listing-uploads").remove(freshUploads);
    }
    return { error: "Could not save your changes. Please try again." };
  }

  // Replaced files that are not the live version's originals are orphans now.
  // Only paths inside this maker's own listing folder are ever removed.
  const snapshot = normalizePublished(existing.published);
  const keep = new Set<string>(
    snapshot ? [snapshot.source_icon_path, ...snapshot.source_screenshot_paths].filter((p): p is string => Boolean(p)) : []
  );
  const ownPrefix = `${user.id}/${listingId}/`;
  const orphaned: string[] = [];
  const replacedIcon = uploaded.iconPath ? existing.icon_path : null;
  const replacedShots = uploaded.screenshotPaths?.length || removeScreenshots ? (existing.screenshot_paths as string[]) : [];
  for (const p of [replacedIcon, ...replacedShots]) {
    if (p && p.startsWith(ownPrefix) && !keep.has(p) && !freshUploads.includes(p)) orphaned.push(p);
  }
  if (orphaned.length) {
    try {
      await createAdminClient().storage.from("listing-uploads").remove(orphaned);
    } catch (err) {
      console.error("Orphan cleanup failed:", err);
    }
  }

  const isEdit = Boolean(snapshot);
  await notifyAdminNewSubmission(fields.name, isEdit);
  redirect(isEdit ? "/dashboard?edited=1" : "/dashboard?submitted=1");
}

export async function deleteOwnListing(listingId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS restricts reads and deletes to the owner's own rows.
  const { data: listing } = await supabase
    .from("listings")
    .select("id, owner_id, slug, is_published")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.owner_id !== user.id) return;

  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) {
    console.error("Listing delete failed:", error);
    return;
  }

  // Storage cleanup with the service role: the whole private folder plus the
  // public folder, both derived from trigger-pinned ids.
  try {
    await deleteListingFiles(createAdminClient(), listing);
  } catch (err) {
    console.error("Storage cleanup failed:", err);
  }

  if (listing.is_published) {
    revalidatePath("/");
    revalidatePath("/directory");
    revalidatePath(`/directory/${listing.slug}`);
    revalidatePath("/sitemap.xml");
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    if (profile?.username) revalidatePath(`/makers/${profile.username}`);
  }
  redirect("/dashboard?deleted=1");
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const clean = (key: string, max: number) => {
    const v = String(formData.get(key) ?? "").trim().slice(0, max);
    return v.length ? v : null;
  };

  const requiredFlow = formData.get("required_flow") === "1";
  const display_name = clean("display_name", 80);
  const bio = clean("bio", 500);
  let username = clean("username", 30);
  // Social fields accept a profile link, "@handle", or a bare handle.
  const social = (key: SocialKey, field: string) => parseSocial(key, String(formData.get(field) ?? "").slice(0, 300));
  const socialInputs = {
    x: social("x", "x_handle"),
    bluesky: social("bluesky", "bluesky_handle"),
    threads: social("threads", "threads_handle"),
    linkedin: social("linkedin", "linkedin_url"),
    facebook: social("facebook", "facebook_url"),
  };
  for (const parsed of Object.values(socialInputs)) {
    if (parsed && "error" in parsed) return { error: parsed.error };
  }
  const handleOf = (p: (typeof socialInputs)[SocialKey]) => (p && "handle" in p ? p.handle : null);
  const urlOf = (p: (typeof socialInputs)[SocialKey]) => (p && "url" in p ? p.url : null);
  const x_handle = handleOf(socialInputs.x);
  const bluesky_handle = handleOf(socialInputs.bluesky);
  const threads_handle = handleOf(socialInputs.threads);
  const linkedin_url = urlOf(socialInputs.linkedin);
  const facebook_url = urlOf(socialInputs.facebook);

  // The website accepts a bare domain; the https prefix is added here.
  const website = normalizeLink(clean("website_url", 200), "Website");
  if (website.error) return { error: website.error };
  const website_url = website.url;

  if (username) {
    username = username.toLowerCase();
    if (!USERNAME_PATTERN.test(username)) {
      return { error: "Username must be 8 to 16 characters: lowercase letters, numbers, and hyphens." };
    }
    if (RESERVED_USERNAMES.has(username)) {
      return { error: "That username is reserved. Pick another." };
    }
  }

  // Optional avatar upload into the maker's own folder of the public bucket.
  let avatar_path: string | undefined;
  const avatarEntry = formData.get("avatar");
  if (avatarEntry instanceof File && avatarEntry.size > 0) {
    const err = validImage(avatarEntry);
    if (err) return { error: err };
    const path = `${user.id}/avatar-${Date.now()}.${imageExtension(avatarEntry)}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, Buffer.from(await avatarEntry.arrayBuffer()), {
        contentType: avatarEntry.type,
      });
    if (error) return { error: "Profile picture upload failed. Please try again." };
    avatar_path = path;
  }

  const { data: prevProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  // A username can be changed but not removed: the maker page and listings
  // depend on it.
  if (prevProfile?.username && !username) {
    return {
      error:
        "Your username can be changed but not removed, since it powers your maker page and listings.",
    };
  }

  const row: Record<string, unknown> = {
    id: user.id,
    username,
    display_name,
    bio,
    x_handle,
    bluesky_handle,
    threads_handle,
    linkedin_url,
    facebook_url,
    website_url,
  };
  if (avatar_path) row.avatar_path = avatar_path;

  const { error } = await supabase.from("profiles").upsert(row);
  if (error) {
    // The picture was uploaded before the save; do not leave it orphaned.
    if (avatar_path) await supabase.storage.from("avatars").remove([avatar_path]);
    if (error.code === "23505") return { error: "That username is already taken." };
    console.error("Profile save failed:", error);
    return { error: "Could not save your profile. Please try again." };
  }

  // A replaced picture leaves the previous file behind; drop everything in
  // the maker's own avatar folder except the one just saved.
  if (avatar_path) {
    try {
      const { data: current } = await supabase
        .from("profiles")
        .select("avatar_path")
        .eq("id", user.id)
        .maybeSingle();
      const keep = new Set([avatar_path, current?.avatar_path].filter((p): p is string => Boolean(p)));
      await pruneFolder(createAdminClient(), "avatars", user.id, keep);
    } catch (err) {
      console.error("Old avatar cleanup failed:", err);
    }
  }

  revalidatePath("/dashboard/profile");
  if (username) revalidatePath(`/makers/${username}`);
  if (prevProfile?.username && prevProfile.username !== username) {
    revalidatePath(`/makers/${prevProfile.username}`);
  }

  // In the pre-submission flow, either bounce back to /submit once the
  // identity is complete, or say exactly what is still missing.
  if (requiredFlow) {
    if (username && display_name) redirect("/submit");
    return {
      error: !display_name
        ? "Almost there: add a display name too. It is required to submit."
        : "Almost there: pick a username too. It is required to submit.",
    };
  }

  return { error: null, saved: true };
}

export interface DeleteAccountState {
  error: string | null;
}

// Full self-service account deletion, gated by typing "DELETE".
export async function deleteOwnAccount(
  _prev: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const confirmation = String(formData.get("confirm") ?? "").trim();
  if (confirmation !== "DELETE") {
    return { error: 'Type "DELETE" in all caps to confirm.' };
  }

  const admin = createAdminClient();

  const { data: listings } = await admin
    .from("listings")
    .select("id, owner_id, slug, is_published")
    .eq("owner_id", user.id);
  for (const listing of listings ?? []) {
    await deleteListingFiles(admin, listing);
  }

  await deleteAvatarFiles(admin, user.id);
  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  // Deleting the auth user cascades the listings and profile rows.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Account self-delete failed:", error);
    return { error: "Could not delete your account. Please try again or reach out." };
  }

  await supabase.auth.signOut();

  revalidatePath("/");
  revalidatePath("/directory");
  revalidatePath("/sitemap.xml");
  for (const listing of listings ?? []) {
    if (listing.is_published) revalidatePath(`/directory/${listing.slug}`);
  }
  if (profile?.username) revalidatePath(`/makers/${profile.username}`);

  redirect("/");
}
