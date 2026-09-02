"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { MAX_TAGS, STARTER_TAGS, TAG_MAX_LENGTH, normalizeTag } from "@/lib/tags";

interface Suggestion {
  tag: string;
  uses: number;
}

interface TagsInputProps {
  initialTags?: string[];
}

// Up to MAX_TAGS free-form tags. Suggestions combine tags used on published
// listings (with counts) and a starter list, filtered by prefix. Accessible
// as a combobox: arrow keys move through suggestions, Enter picks or adds,
// Escape closes. The draft input is itself submitted as a tag so a typed but
// unconfirmed entry is never silently dropped.
export default function TagsInput({ initialTags = [] }: TagsInputProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [notice, setNotice] = useState<string | null>(null);
  const [refocusPending, setRefocusPending] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const full = tags.length >= MAX_TAGS;

  // After a chip is removed the input may just have become enabled; focus it
  // once the DOM reflects that.
  useEffect(() => {
    if (refocusPending && !full) {
      inputRef.current?.focus();
      setRefocusPending(false);
    }
  }, [refocusPending, full]);

  useEffect(() => {
    if (!open || full) return;
    const prefix = (normalizeTag(draft) ?? draft.toLowerCase().trim()).slice(0, TAG_MAX_LENGTH);
    let cancelled = false;

    const timer = setTimeout(async () => {
      let fromDb: Suggestion[] = [];
      if (hasSupabaseEnv()) {
        try {
          const { data } = await createClient().rpc("search_tags", { prefix, max_results: 8 });
          fromDb = (data as Suggestion[] | null) ?? [];
        } catch {
          fromDb = [];
        }
      }
      if (cancelled) return;
      const seen = new Set(fromDb.map((s) => s.tag));
      const starters = STARTER_TAGS.filter((t) => t.startsWith(prefix) && !seen.has(t)).map(
        (tag) => ({ tag, uses: 0 })
      );
      setSuggestions([...fromDb, ...starters].filter((s) => !tags.includes(s.tag)).slice(0, 8));
      setHighlight(-1);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft, open, full, tags]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Adds one or more raw entries (comma-separated input is split). Returns
  // whether anything was added; sets a notice explaining any rejection.
  const addTags = (raw: string): boolean => {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return false;
    const next = [...tags];
    let rejected: string | null = null;
    for (const part of parts) {
      if (next.length >= MAX_TAGS) {
        rejected = `You can add up to ${MAX_TAGS} tags.`;
        break;
      }
      const tag = normalizeTag(part);
      if (!tag) {
        rejected = "Tags need 2 to 24 letters, numbers, or hyphens.";
        continue;
      }
      if (next.includes(tag)) {
        rejected = `"${tag}" is already added.`;
        continue;
      }
      next.push(tag);
    }
    const added = next.length > tags.length;
    setTags(next);
    setNotice(rejected);
    if (added) setDraft("");
    return added;
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    setNotice(null);
    setRefocusPending(true);
  };

  const listboxId = "tags-listbox";
  const showList = open && !full && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className="relative">
      {tags.map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}

      <div
        className={`flex flex-wrap items-center gap-2 w-full bg-bg-card border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-white/20 transition-colors ${full ? "opacity-80" : ""}`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-accent-purple/40 bg-accent-purple/[0.12] px-2.5 py-1 text-xs font-medium text-accent-purple"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id="tags"
          name="tags"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-activedescendant={highlight >= 0 ? `${listboxId}-${highlight}` : undefined}
          aria-describedby="tags-help"
          required={tags.length === 0}
          disabled={full}
          value={draft}
          maxLength={TAG_MAX_LENGTH}
          onChange={(e) => {
            setDraft(e.target.value);
            setNotice(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (draft.trim()) addTags(draft);
            setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && showList) {
              e.preventDefault();
              setHighlight((h) => (h + 1) % suggestions.length);
            } else if (e.key === "ArrowUp" && showList) {
              e.preventDefault();
              setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
            } else if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (showList && highlight >= 0) addTags(suggestions[highlight].tag);
              else addTags(draft);
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "Backspace" && draft === "" && tags.length) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          className="flex-1 min-w-[140px] bg-transparent py-1 text-sm text-ink-primary placeholder-ink-muted focus:outline-none disabled:cursor-not-allowed"
          placeholder={
            full ? `${MAX_TAGS} of ${MAX_TAGS} tags added` : tags.length === 0 ? "Type a tag and press Enter" : "Add another"
          }
        />
      </div>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Tag suggestions"
          className="absolute z-20 mt-2 w-full rounded-xl border border-white/[0.1] bg-bg-card shadow-xl overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.tag}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => {
                addTags(s.tag);
                inputRef.current?.focus();
              }}
              className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === highlight ? "bg-white/[0.06] text-ink-primary" : "text-ink-secondary hover:bg-white/[0.06] hover:text-ink-primary"
              }`}
            >
              <span>{s.tag}</span>
              {s.uses > 0 && (
                <span className="text-xs text-ink-muted">
                  {s.uses} {s.uses === 1 ? "listing" : "listings"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p id="tags-help" className={`text-xs mt-2 ${notice ? "text-red-400" : "text-ink-muted"}`} aria-live="polite">
        {notice ??
          (full
            ? `${MAX_TAGS} of ${MAX_TAGS} tags added. Remove one to change it.`
            : `Up to ${MAX_TAGS} tags, 2 to 24 letters, numbers, or hyphens each. Press Enter or comma after each one. Popular tags from other listings show up as you type.`)}
      </p>
    </div>
  );
}
