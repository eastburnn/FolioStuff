import { normalizePublished } from "./listings";

export interface ScreenshotOrderResult {
  screenshot_paths: string[];
  // Present when the live copy was reordered too.
  published?: Record<string, unknown>;
  live: boolean;
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// Applies a new order to a listing's screenshots. The draft paths are always
// reordered. The live snapshot is reordered too when its source paths still
// match the draft, meaning no replacement screenshots are waiting for review;
// otherwise the pending edit carries the new order once approved.
export function applyScreenshotOrder(
  row: { screenshot_paths: string[]; published: unknown },
  order: number[]
): ScreenshotOrderResult | { error: string } {
  const paths = row.screenshot_paths;
  const valid =
    Array.isArray(order) &&
    order.length === paths.length &&
    order.every((i) => Number.isInteger(i) && i >= 0 && i < paths.length) &&
    new Set(order).size === paths.length;
  if (!valid) return { error: "That order does not match the screenshots on file. Reload and try again." };

  const screenshot_paths = order.map((i) => paths[i]);
  const pub = normalizePublished(row.published);
  if (!pub || !sameList(pub.source_screenshot_paths, paths) || pub.screenshot_paths.length !== paths.length) {
    return { screenshot_paths, live: false };
  }
  const raw = row.published as Record<string, unknown>;
  return {
    screenshot_paths,
    published: {
      ...raw,
      screenshot_paths: order.map((i) => pub.screenshot_paths[i]),
      source_screenshot_paths: screenshot_paths,
    },
    live: true,
  };
}
