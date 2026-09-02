import type { SupabaseClient } from "@supabase/supabase-js";

// Storage helpers for listing images. All operate on listing folders derived
// from trigger-pinned columns (owner_id, id), never on maker-supplied paths,
// so a tampered row can never reach another maker's files. Folders are flat
// by policy (uploads deeper than <owner>/<listing>/<file> are rejected), so a
// paged direct-children listing covers everything.

export function privateFolder(listing: { owner_id: string; id: string }): string {
  return `${listing.owner_id}/${listing.id}`;
}

async function listFolder(admin: SupabaseClient, bucket: string, folder: string): Promise<string[]> {
  const pageSize = 500;
  const paths: string[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data } = await admin.storage.from(bucket).list(folder, { limit: pageSize, offset });
    const page = data ?? [];
    paths.push(...page.filter((f) => f.id !== null).map((f) => `${folder}/${f.name}`));
    if (page.length < pageSize) break;
  }
  return paths;
}

// Removes every file in a bucket folder that is not in the keep set.
export async function pruneFolder(
  admin: SupabaseClient,
  bucket: string,
  folder: string,
  keep: Set<string>
): Promise<void> {
  const stale = (await listFolder(admin, bucket, folder)).filter((p) => !keep.has(p));
  for (let i = 0; i < stale.length; i += 100) {
    await admin.storage.from(bucket).remove(stale.slice(i, i + 100));
  }
}

// Removes a listing's files from both buckets: the whole private folder
// (current working copy plus the live version's originals) and the whole
// public folder.
export async function deleteListingFiles(
  admin: SupabaseClient,
  listing: { id: string; owner_id: string }
): Promise<void> {
  await pruneFolder(admin, "listing-uploads", privateFolder(listing), new Set());
  await pruneFolder(admin, "listing-public", listing.id, new Set());
}

// Removes every avatar file a user has uploaded (their folder is their id).
export async function deleteAvatarFiles(admin: SupabaseClient, userId: string): Promise<void> {
  await pruneFolder(admin, "avatars", userId, new Set());
}

// Public copies are named from a whitelisted extension so a hostile private
// path can never produce a nested or odd public object name.
export function imageExt(path: string): string {
  const m = path.match(/\.(png|jpe?g|webp)$/i);
  return m ? m[1].toLowerCase() : "png";
}
