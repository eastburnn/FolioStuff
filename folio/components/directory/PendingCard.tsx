"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, X } from "lucide-react";
import ListingDetail, { type ListingDetailData } from "./ListingDetail";
import { tagLabel } from "@/lib/tags";

interface PendingCardProps {
  listing: ListingDetailData;
  ownerEmail: string;
  isEdit: boolean;
  isLive: boolean;
  // The approve, reject, and delete forms, rendered by the server page.
  children: React.ReactNode;
}

// A compact card for one submission in the review queue. Clicking the
// summary opens a popup that renders the listing exactly as its public page
// would look once approved: icon, tags, tagline, description, screenshots
// with the lightbox, and the maker line.
export default function PendingCard({ listing, ownerEmail, isEdit, isLive, children }: PendingCardProps) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // The screenshot lightbox owns Escape while it is open.
      if (e.key === "Escape" && !document.documentElement.dataset.lightbox) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [open]);

  let hostname = listing.url;
  try {
    hostname = new URL(listing.url).hostname.replace(/^www\./, "");
  } catch {
    // Keep the raw value.
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-4 sm:p-5">
      {isEdit && (
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3 rounded-lg border border-accent-gold/30 bg-accent-gold/[0.08] px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-gold">
            {isLive ? "Edit of a live listing" : "Edit of an unpublished listing"}
          </span>
          {isLive && (
            <a
              href={`/directory/${listing.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent-gold hover:underline"
            >
              Compare with the live version
            </a>
          )}
        </div>
      )}

      {/* The summary is one button: anywhere on it opens the preview. */}
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="group w-full text-left rounded-xl -m-2 p-2 mb-1 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          {listing.iconSrc ? (
            // Signed URL from the private bucket; a plain img keeps it out of the optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.iconSrc} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-ink-primary leading-tight truncate group-hover:text-white transition-colors">
              {listing.name}
            </p>
            <p className="text-xs text-ink-muted truncate">
              {hostname} · by {listing.maker_name} · {ownerEmail}
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-white/[0.1] px-2.5 py-1.5 text-xs font-medium text-ink-secondary group-hover:text-ink-primary group-hover:border-white/[0.2] transition-colors">
            <Eye size={13} aria-hidden="true" />
            Preview page
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {listing.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-muted">
              {tagLabel(tag)}
            </span>
          ))}
          {listing.tags.length === 0 && <span className="text-xs text-ink-muted">no tags</span>}
          <span className="text-xs text-ink-muted ml-auto">
            {listing.screenshots.length} screenshot{listing.screenshots.length === 1 ? "" : "s"}
            <span className="sm:hidden"> · tap to preview</span>
          </span>
        </div>
      </button>

      <div className="mt-3">{children}</div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview of ${listing.name}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          className="fixed inset-0 z-[55] overflow-y-auto bg-black/75 backdrop-blur-sm px-3 py-4 sm:px-6 sm:py-8"
        >
          <div className="relative max-w-3xl mx-auto rounded-2xl border border-white/[0.1] bg-bg-base grid-bg shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b border-white/[0.06] bg-bg-base/95 backdrop-blur px-4 sm:px-6 py-3">
              <p className="text-xs text-ink-muted">
                <span className="font-semibold uppercase tracking-wider text-accent-gold">Preview</span>
                <span className="hidden sm:inline"> · how this page will look once approved</span>
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close preview"
                className="rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-ink-primary p-2 transition-colors"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="px-4 sm:px-6 pt-6 pb-10">
              <p className="text-xs text-ink-muted mb-6">Directory › {listing.name}</p>
              <ListingDetail listing={listing} preview />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
