"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

interface Shot {
  src: string;
  alt: string;
}

// Swipeable row of screenshots, each cropped to the same 16:10 frame so the
// row lines up. Tapping one opens the full image in a lightbox where a
// tap, double click, or the zoom buttons switch between fit and 2x; when
// zoomed, the image scrolls in both directions. Arrow keys and the side
// buttons move between screenshots, Escape closes.
export default function ScreenshotGallery({ shots }: { shots: Shot[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Edge hints only appear when there is something to scroll to in that
  // direction, and disappear at either end of the row.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const update = () => {
      setCanLeft(row.scrollLeft > 4);
      setCanRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 4);
    };
    update();
    row.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => {
      row.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [shots.length]);

  const scrollRow = (direction: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.firstElementChild as HTMLElement | null;
    const amount = card ? card.getBoundingClientRect().width + 16 : row.clientWidth * 0.8;
    row.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  const open = (i: number) => {
    setZoomed(false);
    setOpenIndex(i);
  };
  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setOpenIndex((i) => (i === null ? i : (i + delta + shots.length) % shots.length));
      setZoomed(false);
    },
    [shots.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openIndex, close, step]);

  // Zooming centers the view on the image.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (zoomed) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    }
  }, [zoomed, openIndex]);

  const current = openIndex === null ? null : shots[openIndex];
  const iconButton =
    "rounded-full bg-white/[0.1] hover:bg-white/[0.2] text-ink-primary p-2.5 transition-colors backdrop-blur";

  return (
    <>
      {/* Phones: swipe through with the next one peeking in. Wider screens:
          a two-up row that still scrolls when there are more. */}
      <div className="relative -mx-4 sm:mx-0">
        <div ref={rowRef} className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-0 scrollbar-none px-4 sm:px-0">
          {shots.map((shot, i) => (
            <button
              key={shot.src}
              type="button"
              onClick={() => open(i)}
              aria-label={`Open screenshot ${i + 1} of ${shots.length}`}
              className="group snap-start shrink-0 w-[84%] sm:w-[calc(50%-0.5rem)] aspect-[16/10] rounded-xl border border-white/[0.08] hover:border-white/[0.2] overflow-hidden bg-bg-card transition-colors"
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                width={800}
                height={500}
                sizes="(max-width: 640px) 84vw, 400px"
                className="w-full h-full object-cover object-top group-hover:opacity-90 transition-opacity"
              />
            </button>
          ))}
        </div>
        {/* Phones: a soft fade at whichever edge still has more to show. */}
        {canRight && (
          <div
            aria-hidden="true"
            className="sm:hidden pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl bg-gradient-to-l from-bg-surface/80 to-transparent transition-opacity"
          />
        )}
        {canLeft && (
          <div
            aria-hidden="true"
            className="sm:hidden pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-xl bg-gradient-to-r from-bg-surface/80 to-transparent transition-opacity"
          />
        )}
        {/* Wider screens: chevrons that step the row one card at a time. */}
        {canLeft && (
          <button
            type="button"
            onClick={() => scrollRow(-1)}
            aria-label="Scroll screenshots left"
            className={`${iconButton} hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 shadow-lg`}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
        )}
        {canRight && (
          <button
            type="button"
            onClick={() => scrollRow(1)}
            aria-label="Scroll screenshots right"
            className={`${iconButton} hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 shadow-lg`}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${current.alt}, ${openIndex! + 1} of ${shots.length}`}
          className="fixed inset-0 z-[60] bg-black/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            ref={scrollerRef}
            className="absolute inset-0 overflow-auto scrollbar-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className={zoomed ? "inline-block min-w-full min-h-full p-4" : "flex items-center justify-center min-h-full p-4 sm:p-10"}>
              {/* Plain img: the public URL is already the final file. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.src}
                alt={current.alt}
                onDoubleClick={() => setZoomed((z) => !z)}
                onClick={() => setZoomed((z) => !z)}
                style={zoomed ? { width: "200vw", maxWidth: "none" } : undefined}
                className={
                  zoomed
                    ? "block h-auto cursor-zoom-out select-none"
                    : "block max-w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-5rem)] w-auto h-auto object-contain rounded-lg cursor-zoom-in select-none"
                }
                draggable={false}
              />
            </div>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button type="button" onClick={() => setZoomed((z) => !z)} aria-label={zoomed ? "Zoom out" : "Zoom in"} className={iconButton}>
              {zoomed ? <ZoomOut size={18} aria-hidden="true" /> : <ZoomIn size={18} aria-hidden="true" />}
            </button>
            <button ref={closeRef} type="button" onClick={close} aria-label="Close" className={iconButton}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {shots.length > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Previous screenshot"
                className={`${iconButton} absolute left-3 top-1/2 -translate-y-1/2`}>
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next screenshot"
                className={`${iconButton} absolute right-3 top-1/2 -translate-y-1/2`}>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-ink-secondary bg-black/50 rounded-full px-3 py-1">
                {openIndex! + 1} / {shots.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
