import { normalizeTags, MAX_TAGS } from "./tags";
import { parseSocials, type Socials } from "./socials";

// Shared server-side validation for the submit and edit actions.

export interface ListingFields {
  name: string;
  url: string;
  tagline: string;
  description: string;
  tags: string[];
  socials: Socials;
}

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_SCREENSHOTS = 3;

export function extractFields(formData: FormData): { fields: ListingFields } | { error: string } {
  // Honeypot: bots fill every field; humans never see this one.
  if (String(formData.get("website") ?? "").length > 0) {
    return { error: "Submission could not be processed." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").replace(/\s+/g, " ").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tags = normalizeTags(formData.getAll("tags").map((t) => String(t)));

  if (name.length < 2 || name.length > 60) return { error: "Tool name must be 2 to 60 characters." };
  if (!/^https?:\/\/.+\..+/.test(url) || url.length > 300) return { error: "Enter a valid URL starting with http(s)://" };
  if (tagline.length < 10 || tagline.length > 200) return { error: "Tagline must be 10 to 200 characters." };
  if (description.length < 40 || description.length > 2000) return { error: "Description must be 40 to 2000 characters." };
  if (tags.length < 1) return { error: `Add at least one tag (up to ${MAX_TAGS}).` };

  const parsedSocials = parseSocials(formData);
  if ("error" in parsedSocials) return { error: parsedSocials.error };

  return { fields: { name, url, tagline, description, tags, socials: parsedSocials.socials } };
}

export function validImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Images must be PNG, JPEG, or WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "Images must be 2MB or smaller.";
  if (file.size === 0) return "An uploaded image appears to be empty.";
  return null;
}

export function imageExtension(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export function getUploadedFiles(formData: FormData): { icon: File | null; screenshots: File[] } {
  const iconEntry = formData.get("icon");
  const icon = iconEntry instanceof File && iconEntry.size > 0 ? iconEntry : null;
  const screenshots = formData
    .getAll("screenshots")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_SCREENSHOTS);
  return { icon, screenshots };
}
