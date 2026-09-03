"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { decodeImage, type Decoded } from "@/lib/image-client";
import { AVATAR_OUTPUT_SIZE } from "@/lib/image-limits";

// Circular crop editor for profile pictures. The chosen image is decoded in
// the browser, the maker drags and zooms it inside a round window, and the
// result is rendered to a fixed 512 by 512 image. That output is what the
// form uploads, so the original photo's size never reaches the server.

const VIEW = 288;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

interface AvatarCropperProps {
  file: File;
  onDone: (result: File) => void;
  onCancel: () => void;
}

interface Placement {
  zoom: number;
  x: number;
  y: number;
}

export default function AvatarCropper({ file, onDone, onCancel }: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const decodedRef = useRef<Decoded | null>(null);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<null | "decode" | "encode">(null);
  const [busy, setBusy] = useState(false);
  const [placement, setPlacement] = useState<Placement>({ zoom: 1, x: 0, y: 0 });

  // Scale that makes the shorter side exactly fill the window at zoom 1.
  const baseScale = useCallback(() => {
    const d = decodedRef.current;
    if (!d) return 1;
    return VIEW / Math.min(d.width, d.height);
  }, []);

  // The window must always be fully covered by the image.
  const clamp = useCallback(
    (p: Placement): Placement => {
      const d = decodedRef.current;
      if (!d) return p;
      const s = baseScale() * p.zoom;
      return {
        zoom: p.zoom,
        x: Math.min(0, Math.max(VIEW - d.width * s, p.x)),
        y: Math.min(0, Math.max(VIEW - d.height * s, p.y)),
      };
    },
    [baseScale]
  );

  // Keeps the point at the center of the window fixed while zooming.
  const zoomTo = useCallback(
    (p: Placement, zoom: number): Placement => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
      const s1 = baseScale() * p.zoom;
      const s2 = baseScale() * next;
      const cx = (VIEW / 2 - p.x) / s1;
      const cy = (VIEW / 2 - p.y) / s1;
      return clamp({ zoom: next, x: VIEW / 2 - cx * s2, y: VIEW / 2 - cy * s2 });
    },
    [baseScale, clamp]
  );

  // Decode once, then start centered.
  useEffect(() => {
    let cancelled = false;
    let decoded: Decoded | null = null;
    decodeImage(file)
      .then((d) => {
        if (cancelled) {
          d.release();
          return;
        }
        decoded = d;
        decodedRef.current = d;
        const s = VIEW / Math.min(d.width, d.height);
        setPlacement({ zoom: 1, x: (VIEW - d.width * s) / 2, y: (VIEW - d.height * s) / 2 });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed("decode");
      });
    return () => {
      cancelled = true;
      decoded?.release();
      decodedRef.current = null;
    };
  }, [file]);

  // Redraw the window whenever the placement changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const d = decodedRef.current;
    if (!canvas || !d || !ready) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (canvas.width !== VIEW * dpr) {
      canvas.width = VIEW * dpr;
      canvas.height = VIEW * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = baseScale() * placement.zoom;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW, VIEW);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(d.source, placement.x, placement.y, d.width * s, d.height * s);
    // Dim everything outside the circle so the crop is obvious.
    ctx.beginPath();
    ctx.rect(0, 0, VIEW, VIEW);
    ctx.arc(VIEW / 2, VIEW / 2, VIEW / 2 - 1, 0, Math.PI * 2, true);
    ctx.fillStyle = "rgba(6, 8, 14, 0.62)";
    ctx.fill("evenodd");
    ctx.beginPath();
    ctx.arc(VIEW / 2, VIEW / 2, VIEW / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [placement, ready, baseScale]);

  // Mouse wheel and trackpad zoom, without scrolling the page behind.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setPlacement((p) => zoomTo(p, p.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [zoomTo, ready]);

  // Keyboard focus moves into the dialog, then onto the confirm button once
  // the photo is ready.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);
  useEffect(() => {
    if (ready) confirmRef.current?.focus();
  }, [ready]);

  // Escape cancels; the page behind stays put while the editor is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onCancel]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, originX: placement.x, originY: placement.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setPlacement((p) => clamp({ zoom: p.zoom, x: d.originX + dx, y: d.originY + dy }));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  };

  // Renders the visible circle's bounding square at the output size.
  const finish = async () => {
    const d = decodedRef.current;
    if (!d || busy) return;
    setBusy(true);
    try {
      const s = baseScale() * placement.zoom;
      const side = VIEW / s;
      const sx = Math.min(Math.max(0, -placement.x / s), Math.max(0, d.width - side));
      const sy = Math.min(Math.max(0, -placement.y / s), Math.max(0, d.height - side));
      const out = document.createElement("canvas");
      out.width = AVATAR_OUTPUT_SIZE;
      out.height = AVATAR_OUTPUT_SIZE;
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(d.source, sx, sy, side, side, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);

      const toBlob = (type: string, quality?: number) =>
        new Promise<Blob | null>((resolve) => out.toBlob(resolve, type, quality));
      // WebP where the browser can encode it; browsers that cannot hand back
      // a PNG instead, which the server accepts too.
      let blob = await toBlob("image/webp", 0.9);
      if (!blob || blob.type !== "image/webp") blob = await toBlob("image/png");
      if (!blob) throw new Error("encode failed");
      const ext = blob.type === "image/webp" ? "webp" : "png";
      onDone(new File([blob], `avatar.${ext}`, { type: blob.type }));
    } catch {
      setFailed("encode");
    } finally {
      setBusy(false);
    }
  };

  const buttonBase = "rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
      <div
        className="min-h-full flex items-center justify-center"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
      >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-cropper-title"
        className="w-full max-w-[360px] rounded-2xl border border-white/[0.08] bg-bg-card p-6 shadow-2xl outline-none"
      >
        <h2 id="avatar-cropper-title" className="text-base font-semibold text-ink-primary mb-1">
          Adjust your photo
        </h2>
        <p className="text-xs text-ink-muted mb-4">
          Drag to reposition. Use the slider or scroll to zoom.
        </p>

        {failed ? (
          <div>
            <p className="text-sm text-red-400 mb-5">
              {failed === "decode"
                ? "We could not read that image. Try a PNG or JPEG instead."
                : "We could not save the cropped photo. Please try again or pick a different image."}
            </p>
            <button type="button" onClick={onCancel}
              className={`${buttonBase} w-full bg-white/[0.09] border border-white/[0.12] hover:bg-white/[0.14] text-ink-primary`}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mx-auto rounded-xl overflow-hidden bg-black/40" style={{ width: VIEW, height: VIEW }}>
              <canvas
                ref={canvasRef}
                width={VIEW}
                height={VIEW}
                style={{ width: VIEW, height: VIEW, touchAction: "none", cursor: ready ? "grab" : "default" }}
                aria-label="Crop preview. Drag to move the photo inside the circle."
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />
            </div>
            {!ready && <p className="text-xs text-ink-muted text-center mt-3">Loading your photo...</p>}

            <label htmlFor="avatar-zoom" className="block text-xs text-ink-muted uppercase tracking-widest mt-5 mb-2">
              Zoom
            </label>
            <input
              id="avatar-zoom"
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={placement.zoom}
              disabled={!ready}
              onChange={(e) => {
                const zoom = Number(e.target.value);
                setPlacement((p) => zoomTo(p, zoom));
              }}
              className="w-full accent-[#8B5CF6]"
            />

            <div className="flex items-center justify-end gap-3 mt-6">
              <button type="button" onClick={onCancel}
                className={`${buttonBase} text-ink-secondary hover:text-ink-primary`}>
                Cancel
              </button>
              <button ref={confirmRef} type="button" onClick={finish} disabled={!ready || busy}
                className={`${buttonBase} bg-accent-purple text-white hover:bg-accent-purple/90`}>
                {busy ? "One moment..." : "Use photo"}
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
