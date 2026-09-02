"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ToolSearch from "./ToolSearch";

export interface AdminDirectoryItem {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  tags: string[];
  makerName: string;
  iconUrl: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  editPending: boolean;
}

interface AdminDirectoryGridProps {
  items: AdminDirectoryItem[];
  publishAction: (formData: FormData) => Promise<void>;
  featureAction: (formData: FormData) => Promise<void>;
}

function Toggle({
  action,
  id,
  on,
  label,
  onColor,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  on: boolean;
  label: string;
  onColor: string;
}) {
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={on ? "0" : "1"} />
      <button
        type="submit"
        role="switch"
        aria-checked={on}
        aria-label={`${label}: ${on ? "on" : "off"}`}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? onColor : "bg-white/[0.15]"}`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
      <span className="text-xs text-ink-secondary">{label}</span>
    </form>
  );
}

export default function AdminDirectoryGrid({ items, publishAction, featureAction }: AdminDirectoryGridProps) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.tagline.toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q))
    );
  }, [items, query]);

  return (
    <div>
      <ToolSearch names={items.map((i) => i.name)} value={query} onChange={setQuery} placeholder="Search tools by name" />

      <p className="text-xs text-ink-muted mt-3 mb-6" aria-live="polite">
        Showing {visible.length} of {items.length} tools.
      </p>

      {visible.length === 0 ? (
        <p className="text-sm text-ink-muted">{items.length === 0 ? "No approved tools yet." : "No tools match that search."}</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border bg-bg-card p-5 ${item.isPublished ? "border-white/[0.08]" : "border-white/[0.06] opacity-70"}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl shrink-0 overflow-hidden bg-white/[0.06]">
                  {item.iconUrl && (
                    <Image src={item.iconUrl} alt="" width={44} height={44} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-ink-primary">{item.name}</p>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        item.isPublished
                          ? "text-accent-green border-accent-green/30 bg-accent-green/[0.08]"
                          : "text-ink-muted border-white/[0.15] bg-white/[0.04]"
                      }`}
                    >
                      {item.isPublished ? "Live" : "Paused"}
                    </span>
                    {item.editPending && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-gold">edit pending</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed mt-1">{item.tagline}</p>
                  <p className="text-[11px] text-ink-muted mt-1.5">
                    {item.tags.join(", ")} · by {item.makerName} ·{" "}
                    <Link href={`/directory/${item.slug}`} className="underline underline-offset-2 hover:text-ink-secondary">
                      /directory/{item.slug}
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.05]">
                <Toggle action={publishAction} id={item.id} on={item.isPublished} label="Live" onColor="bg-accent-green" />
                <Toggle action={featureAction} id={item.id} on={item.isFeatured} label="Featured" onColor="bg-accent-purple" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
