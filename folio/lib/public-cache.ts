import { unstable_cache } from "next/cache";

// Public data (live listings, maker profiles) is cached for five minutes so
// per-request page rendering does not mean a database query per view. Every
// write that changes public data clears the whole tag.
export const PUBLIC_DATA_TAG = "public-data";

export function cachedPublic<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) {
  return unstable_cache(fn, ["public", key], { revalidate: 300, tags: [PUBLIC_DATA_TAG] });
}
