"use client";

import { useState } from "react";
import ToolSearch from "@/components/directory/ToolSearch";
import BookmarkButton from "@/components/directory/BookmarkButton";
import WidgetCard from "@/components/WidgetCard";
import { OWN_TOOLS } from "@/components/OwnTools";

// Searchable grid of the site's own calculators. Matches the title, the
// short description, the category tag, and each tool's keyword list, with
// title suggestions as you type.
export default function ToolsGrid() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = OWN_TOOLS.filter(
    (t) =>
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tag.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.includes(q))
  );

  return (
    <div>
      <div className="mb-4">
        <ToolSearch names={OWN_TOOLS.map((t) => t.title)} value={query} onChange={setQuery} placeholder="Search tools by name or what they do" />
      </div>
      <p className="text-xs text-ink-muted mb-6" aria-live="polite">
        {q ? `Showing ${visible.length} of ${OWN_TOOLS.length} tools matching "${query.trim()}".` : `Showing all ${OWN_TOOLS.length} tools.`}
      </p>

      {visible.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No tools match.{" "}
          <button type="button" onClick={() => setQuery("")} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
            Show all tools
          </button>
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {visible.map((tool, i) => (
            <div key={tool.href} className="relative">
              <WidgetCard {...tool} delay={i * 60} />
              <BookmarkButton kind="tool" refId={tool.href} className="absolute top-3 right-3" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
