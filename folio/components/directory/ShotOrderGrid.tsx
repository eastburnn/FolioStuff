"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface ShotItem {
  key: string;
  url: string;
}

interface ShotOrderGridProps {
  items: ShotItem[];
  onMove: (from: number, to: number) => void;
  // Removes one tile; the X only shows when provided.
  onRemove?: (index: number) => void;
  // Position numbering starts after this many earlier tiles.
  offset?: number;
}

const POSITION = ["Shown first", "2nd", "3rd", "4th", "5th", "6th"];
const control =
  "rounded-md bg-accent-purple/85 hover:bg-accent-purple text-white p-1 transition-colors disabled:opacity-30 disabled:hover:bg-accent-purple/85";

// Thumbnails in their display order. Drag one onto another to swap places,
// or use the arrows, which also cover touch screens and keyboards. The first
// tile is labeled so nobody has to guess which image leads the page.
export default function ShotOrderGrid({ items, onMove, onRemove, offset = 0 }: ShotOrderGridProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Screenshot order">
      {items.map((item, i) => {
        const position = offset + i;
        return (
          <li
            key={item.key}
            draggable
            onDragStart={(e) => {
              setDragging(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (over !== i) setOver(i);
            }}
            onDragLeave={() => setOver((o) => (o === i ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging !== null && dragging !== i) onMove(dragging, i);
              setDragging(null);
              setOver(null);
            }}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            className={`relative aspect-[16/10] rounded-xl border overflow-hidden bg-bg-card cursor-grab active:cursor-grabbing transition-colors ${
              over === i && dragging !== i ? "border-accent-purple/60" : "border-white/[0.1]"
            } ${dragging === i ? "opacity-50" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={`Screenshot ${position + 1}`} className="w-full h-full object-cover object-top pointer-events-none" draggable={false} />
            <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-purple text-white">
              {POSITION[position] ?? `${position + 1}th`}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove screenshot ${position + 1}`}
                className={`absolute top-1.5 right-1.5 ${control}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
            <div className="absolute bottom-1.5 right-1.5 flex gap-1">
              <button
                type="button"
                onClick={() => onMove(i, i - 1)}
                disabled={i === 0}
                aria-label={`Move screenshot ${position + 1} earlier`}
                className={control}
              >
                <ChevronLeft size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onMove(i, i + 1)}
                disabled={i === items.length - 1}
                aria-label={`Move screenshot ${position + 1} later`}
                className={control}
              >
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
