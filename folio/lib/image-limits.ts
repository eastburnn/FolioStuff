// Image size rules shared by the browser (pre-submit preparation) and the
// server (validation backstop). Keep this file free of server-only imports.

// Largest original file the browser will try to open and compress.
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

// Largest single image the server accepts after preparation.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Largest combined payload of images in one submission. Server actions run
// with a 4MB request body cap (see next.config.ts), so this leaves room for
// text fields, the captcha token, and multipart framing.
export const MAX_TOTAL_IMAGE_BYTES = Math.floor(3.5 * 1024 * 1024);

export const MAX_SCREENSHOTS = 3;

// Output bounds for browser-side preparation. Longest side in pixels.
export const ICON_MAX_SIDE = 512;
export const SCREENSHOT_MAX_SIDE = 1600;
export const AVATAR_OUTPUT_SIZE = 512;

// Small files that already fit are uploaded untouched.
export const PASSTHROUGH_BYTES = 400 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}
