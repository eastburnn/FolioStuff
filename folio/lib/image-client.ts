"use client";

import {
  MAX_SOURCE_BYTES,
  MAX_IMAGE_BYTES,
  PASSTHROUGH_BYTES,
} from "./image-limits";

// Browser-side image preparation shared by the listing and profile forms.
// Images are decoded, downscaled to a bounded size, and re-encoded before
// they are submitted, so what reaches the server is always small.

export class ImagePrepError extends Error {}

export type DecodedSource = ImageBitmap | HTMLImageElement;

export interface Decoded {
  source: DecodedSource;
  width: number;
  height: number;
  // Frees the decoded pixels and any object URL. Call once you are done.
  release: () => void;
}

const PASSTHROUGH_TYPES = ["image/png", "image/jpeg", "image/webp"];

// Prefers createImageBitmap so phone photos come out the right way up, and
// falls back to a plain image element on older browsers. Rejects when the
// browser cannot decode the file at all (HEIC on Chrome, corrupt data).
export async function decodeImage(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Either the option is unsupported (older browsers, which would also
      // ignore the photo's rotation tag) or the file cannot be decoded. The
      // image element below handles both correctly.
      bitmap = null;
    }
    if (bitmap && bitmap.width > 0 && bitmap.height > 0) {
      const b = bitmap;
      return { source: b, width: b.width, height: b.height, release: () => b.close() };
    }
    bitmap?.close();
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new ImagePrepError("We could not read that image. Try a PNG or JPEG instead.");
  }
  if (!img.naturalWidth || !img.naturalHeight) {
    URL.revokeObjectURL(url);
    throw new ImagePrepError("We could not read that image. Try a PNG or JPEG instead.");
  }
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

export interface PrepareOptions {
  // Longest side of the output, in pixels. Images are never upscaled.
  maxSide: number;
  // Lossy quality for WebP or JPEG output, 0 to 1.
  quality: number;
  // Logos and icons often need transparency: when the browser cannot encode
  // WebP, fall back to PNG instead of JPEG.
  keepAlpha: boolean;
}

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function render(
  decoded: Decoded,
  maxSide: number,
  quality: number,
  keepAlpha: boolean,
  sourceType: string
): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
  const w = Math.max(1, Math.round(decoded.width * scale));
  const h = Math.max(1, Math.round(decoded.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImagePrepError("We could not process that image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(decoded.source, 0, 0, w, h);

  // WebP where the browser can encode it; others hand back PNG for the
  // requested type, so check what actually came out. JPEG would flatten
  // transparent areas to black, so PNG sources stay PNG.
  let blob = await encode(canvas, "image/webp", quality);
  if (!blob || blob.type !== "image/webp") {
    const png = keepAlpha || sourceType === "image/png";
    blob = png ? await encode(canvas, "image/png") : await encode(canvas, "image/jpeg", quality);
  }
  if (!blob) throw new ImagePrepError("We could not process that image.");
  return blob;
}

function extensionFor(type: string): string {
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  return "jpg";
}

// Returns a File ready to upload: the original when it is already small and
// within bounds, otherwise a downscaled, re-encoded copy. Throws
// ImagePrepError with a message safe to show to the user.
export async function prepareImage(file: File, options: PrepareOptions): Promise<File> {
  if (file.size === 0) throw new ImagePrepError("That file appears to be empty.");
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImagePrepError("Images must be 10MB or smaller before compression.");
  }

  let decoded: Decoded;
  try {
    decoded = await decodeImage(file);
  } catch (err) {
    if (err instanceof ImagePrepError) throw err;
    throw new ImagePrepError("We could not read that image. Try a PNG or JPEG instead.");
  }

  try {
    const fits = Math.max(decoded.width, decoded.height) <= options.maxSide;
    if (fits && file.size <= PASSTHROUGH_BYTES && PASSTHROUGH_TYPES.includes(file.type)) {
      return file;
    }

    let blob = await render(decoded, options.maxSide, options.quality, options.keepAlpha, file.type);
    // Very noisy content can stay large; tighten once before giving up.
    if (blob.size > MAX_IMAGE_BYTES) {
      blob = await render(decoded, Math.round(options.maxSide * 0.7), Math.min(options.quality, 0.7), options.keepAlpha, file.type);
    }
    if (blob.size > MAX_IMAGE_BYTES) {
      throw new ImagePrepError("That image is still too large after compression. Try a smaller one.");
    }
    const base = file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "image";
    return new File([blob], `${base}.${extensionFor(blob.type)}`, { type: blob.type });
  } finally {
    decoded.release();
  }
}
