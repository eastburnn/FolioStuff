"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface ToolSearchProps {
  names: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Search box with a suggestion dropdown of tool names matching what has been
// typed. Names come from data the page already loaded, so suggestions are
// instant and never expose anything the page could not already show.
export default function ToolSearch({ names, value, onChange, placeholder = "Search tools" }: ToolSearchProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const q = value.trim().toLowerCase();
  const suggestions =
    q.length === 0
      ? []
      : names
          .filter((n) => n.toLowerCase().includes(q))
          .sort((a, b) => Number(!a.toLowerCase().startsWith(q)) - Number(!b.toLowerCase().startsWith(q)) || a.localeCompare(b))
          .slice(0, 8);
  const showList = open && suggestions.length > 0 && !(suggestions.length === 1 && suggestions[0].toLowerCase() === q);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
    setHighlight(-1);
  };

  return (
    <div ref={wrapperRef} className="relative max-w-md">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
      <input
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls="tool-search-listbox"
        aria-activedescendant={highlight >= 0 ? `tool-search-option-${highlight}` : undefined}
        aria-label="Search tools"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
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
          } else if (e.key === "Enter" && showList && highlight >= 0) {
            e.preventDefault();
            pick(suggestions[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="w-full bg-bg-card border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:border-white/20 transition-colors"
      />
      {showList && (
        <ul
          id="tool-search-listbox"
          role="listbox"
          className="absolute z-20 mt-2 w-full rounded-xl border border-white/[0.1] bg-bg-card shadow-xl overflow-hidden"
        >
          {suggestions.map((name, i) => (
            <li
              key={name}
              id={`tool-search-option-${i}`}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => pick(name)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === highlight ? "bg-white/[0.06] text-ink-primary" : "text-ink-secondary hover:bg-white/[0.06] hover:text-ink-primary"
              }`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
