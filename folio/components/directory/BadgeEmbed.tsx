"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { BADGE_HEIGHT, BADGE_WIDTH, badgeEmbedCode } from "@/lib/badge";

// Preview of the "Listed on FolioStuff" badge plus the snippet a maker pastes
// into their own site. Shown on the Maker tab for each live listing.
export default function BadgeEmbed({ slug }: { slug: string }) {
  const code = badgeEmbedCode(slug);
  const [copied, setCopied] = useState(false);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: select the code so a manual copy is one keystroke.
      boxRef.current?.focus();
      boxRef.current?.select();
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
      <p className="text-xs font-semibold text-ink-primary mb-1">Badge for your site</p>
      <p className="text-xs text-ink-muted mb-3">
        Paste this anywhere on your site, such as the footer. It links back to your listing.
      </p>
      {/* Phones: badge and button side by side above the code. Desktop: the
          badge with the button beneath it on the left, the code on the right. */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-stretch sm:gap-2 shrink-0">
          <a href={`/directory/${slug}`} className="shrink-0 self-start">
            {/* Plain img: the badge is a static SVG and must render exactly as makers will see it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/badge.svg" alt="Listed on FolioStuff" width={BADGE_WIDTH} height={BADGE_HEIGHT} />
          </a>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] px-2.5 py-1 text-xs font-medium text-ink-secondary hover:text-ink-primary hover:border-white/[0.2] transition-colors"
          >
            {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
        <textarea
          ref={boxRef}
          readOnly
          value={code}
          rows={3}
          aria-label="Badge embed code"
          onFocus={(e) => e.currentTarget.select()}
          className="w-full min-w-0 text-[11px] leading-relaxed font-mono bg-bg-surface border border-white/[0.08] rounded-lg p-2.5 text-ink-secondary resize-none focus:outline-none focus:border-white/[0.16]"
        />
      </div>
    </div>
  );
}
