"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/listings";
import { notifyAdminNewSubmission } from "@/lib/email";
import { verifyTurnstile } from "@/lib/turnstile";
import { extractFields, getUploadedFiles } from "@/lib/listing-form";
import { uploadListingImages } from "@/lib/listing-uploads";
import type { ListingFormState } from "@/components/directory/ListingForm";

export async function createListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in to submit." };

  // Maker identity comes from the profile, which is required to submit.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, x_handle")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.username || !profile?.display_name) {
    return { error: "Set a display name and username on your profile before submitting." };
  }

  // Validate fields before the captcha: Turnstile tokens are single-use, so a
  // plain validation error must not burn one.
  const parsed = extractFields(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { fields } = parsed;

  const { icon, screenshots } = getUploadedFiles(formData);
  if (!icon) return { error: "Please upload an icon or logo." };

  const captchaOk = await verifyTurnstile(
    String(formData.get("cf-turnstile-response") ?? "") || null
  );
  if (!captchaOk) {
    return { error: "Captcha verification failed. Please try again." };
  }

  const listingId = randomUUID();
  const uploaded = await uploadListingImages(supabase, user.id, listingId, icon, screenshots);
  if (uploaded.error) return { error: uploaded.error };

  // Insert with a slug retry: on a collision, append a numeric suffix.
  const baseSlug = slugify(fields.name) || "tool";
  let inserted = false;
  let lastError = "";
  for (let attempt = 0; attempt < 4 && !inserted; attempt++) {
    const slug =
      attempt === 0
        ? baseSlug
        : attempt < 3
          ? `${baseSlug}-${attempt + 1}`
          : `${baseSlug}-${listingId.slice(0, 6)}`;
    const { error } = await supabase.from("listings").insert({
      id: listingId,
      owner_id: user.id,
      slug,
      ...fields,
      maker_name: profile.display_name,
      maker_x_handle: profile.x_handle ?? null,
      icon_path: uploaded.iconPath ?? null,
      screenshot_paths: uploaded.screenshotPaths ?? [],
    });
    if (!error) {
      inserted = true;
    } else if (error.code === "23505") {
      lastError = "slug collision";
    } else {
      console.error("Listing insert failed:", error);
      await supabase.storage
        .from("listing-uploads")
        .remove([uploaded.iconPath, ...(uploaded.screenshotPaths ?? [])].filter((p): p is string => Boolean(p)));
      return { error: "Could not save your submission. Please try again." };
    }
  }
  if (!inserted) {
    console.error("Listing insert failed after slug retries:", lastError);
    await supabase.storage
      .from("listing-uploads")
      .remove([uploaded.iconPath, ...(uploaded.screenshotPaths ?? [])].filter((p): p is string => Boolean(p)));
    return { error: "Could not save your submission. Please try again." };
  }

  await notifyAdminNewSubmission(fields.name);
  redirect("/dashboard?submitted=1");
}
