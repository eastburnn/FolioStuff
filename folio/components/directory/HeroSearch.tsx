"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Search, Tag, Wrench } from "lucide-react";

interface HeroSearchProps {
  // The site's own calculators.
  ownTools: { name: string; href: string }[];
  // Directory listings.
  tools: { name: string; slug: string }[];
  tags: string[];
}

type Suggestion =
  | { kind: "own"; label: string; href: string }
  | { kind: "tool"; label: string; href: string }
  | { kind: "tag"; label: string; href: string };

// Homepage search. Suggests the site's own tools (wrench), directory
// listings (globe), and tags (which open the directory filtered to that
// tag). Pressing Enter with free text opens the directory with that search
// applied, unless it exactly names a tool.
export default function HeroSearch({ ownTools, tools, tags }: HeroSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef<HTMLFormElement>(null);

  const q = value.trim().toLowerCase();
  const byPrefix = (a: string, b: string) =>
    Number(!a.toLowerCase().startsWith(q)) - Number(!b.toLowerCase().startsWith(q)) || a.localeCompare(b);
  const suggestions: Suggestion[] = q
    ? [
        ...ownTools
          .filter((t) => t.name.toLowerCase().includes(q))
          .sort((a, b) => byPrefix(a.name, b.name))
          .slice(0, 3)
          .map((t) => ({ kind: "own" as const, label: t.name, href: t.href })),
        ...tools
          .filter((t) => t.name.toLowerCase().includes(q))
          .sort((a, b) => byPrefix(a.name, b.name))
          .slice(0, 5)
          .map((t) => ({ kind: "tool" as const, label: t.name, href: `/directory/${t.slug}` })),
        ...tags
          .filter((t) => t.includes(q))
          .sort(byPrefix)
          .slice(0, 4)
          .map((t) => ({ kind: "tag" as const, label: t, href: `/directory?tag=${encodeURIComponent(t)}` })),
      ]
    : [];
  const showList = open && suggestions.length > 0;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const submit = () => {
    const text = value.trim();
    if (!text) return;
    // An exact tool name goes straight to the tool; anything else searches.
    const own = ownTools.find((t) => t.name.toLowerCase() === text.toLowerCase());
    if (own) return go(own.href);
    const exact = tools.find((t) => t.name.toLowerCase() === text.toLowerCase());
    go(exact ? `/directory/${exact.slug}` : `/directory?q=${encodeURIComponent(text)}`);
  };

  return (
    <form
      ref={wrapperRef}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (showList && highlight >= 0) go(suggestions[highlight].href);
        else submit();
      }}
      className="relative max-w-xl mx-auto text-left"
    >
      <input
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls="hero-search-listbox"
        aria-activedescendant={highlight >= 0 ? `hero-search-option-${highlight}` : undefined}
        aria-label="Search the directory"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && showList) {
            e.preventDefault();
            setHighlight((h) => (h + 1) % suggestions.length);
          } else if (e.key === "ArrowUp" && showList) {
            e.preventDefault();
            setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Search tools or tags"
        className="w-full bg-bg-card/80 backdrop-blur border border-accent-purple/25 rounded-2xl pl-5 pr-14 py-3.5 text-sm sm:text-base text-ink-primary placeholder-ink-muted shadow-[0_0_28px_rgba(139,92,246,0.28),0_0_70px_rgba(139,92,246,0.14)] hover:border-accent-purple/40 hover:shadow-[0_0_32px_rgba(139,92,246,0.36),0_0_80px_rgba(139,92,246,0.18)] focus:outline-none focus:border-accent-purple/60 focus:shadow-[0_0_36px_rgba(139,92,246,0.45),0_0_90px_rgba(139,92,246,0.22)] transition-all"
      />
      {/* Clickable search button for people who do not press Enter. */}
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-xl bg-accent-purple text-white hover:bg-accent-purple/90 shadow-[0_0_16px_rgba(139,92,246,0.45)] transition-colors"
      >
        <Search size={16} aria-hidden="true" />
      </button>
      {showList && (
        <ul
          id="hero-search-listbox"
          role="listbox"
          className="absolute z-30 mt-2 w-full rounded-xl border border-white/[0.1] bg-bg-card shadow-xl overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.kind}-${s.label}`}
              id={`hero-search-option-${i}`}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => go(s.href)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === highlight ? "bg-white/[0.06] text-ink-primary" : "text-ink-secondary hover:bg-white/[0.06] hover:text-ink-primary"
              }`}
            >
              {s.kind === "own" ? (
                <Wrench size={14} className="text-accent-purple shrink-0" aria-hidden="true" />
              ) : s.kind === "tool" ? (
                <Globe size={14} className="text-sky-400 shrink-0" aria-hidden="true" />
              ) : (
                <Tag size={14} className="text-accent-green shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{s.label}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-ink-muted shrink-0">
                {s.kind === "own" ? "Tool" : s.kind === "tool" ? "Directory" : "Tag"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
