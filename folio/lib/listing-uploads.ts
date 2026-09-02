import type { SupabaseClient } from "@supabase/supabase-js";
import { validImage, imageExtension } from "./listing-form";

// Uploads submitted images into the private listing-uploads bucket under the
// maker's own folder (enforced by storage RLS). Server-side use only.
export async function uploadListingImages(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  icon: File | null,
  screenshots: File[]
): Promise<{ iconPath?: string; screenshotPaths?: string[]; error?: string }> {
  let iconPath: string | undefined;
  const screenshotPaths: string[] = [];

  if (icon) {
    const err = validImage(icon);
    if (err) return { error: err };
  }
  for (const shot of screenshots) {
    const err = validImage(shot);
    if (err) return { error: err };
  }

  if (icon) {
    const path = `${userId}/${listingId}/icon-${Date.now()}.${imageExtension(icon)}`;
    const { error } = await supabase.storage
      .from("listing-uploads")
      .upload(path, Buffer.from(await icon.arrayBuffer()), { contentType: icon.type });
    if (error) return { error: "Icon upload failed. Please try again." };
    iconPath = path;
  }

  for (let i = 0; i < screenshots.length; i++) {
    const shot = screenshots[i];
    const path = `${userId}/${listingId}/shot-${Date.now()}-${i}.${imageExtension(shot)}`;
    const { error } = await supabase.storage
      .from("listing-uploads")
      .upload(path, Buffer.from(await shot.arrayBuffer()), { contentType: shot.type });
    if (error) return { error: "Screenshot upload failed. Please try again." };
    screenshotPaths.push(path);
  }

  return { iconPath, screenshotPaths };
}
