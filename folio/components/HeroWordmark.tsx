"use client";

import { useState } from "react";

const LETTERS = [
  { char: "f", base: "#8B5CF6" },
  { char: "o", base: "#7B6EF5" },
  { char: "l", base: "#6B80F4" },
  { char: "i", base: "#5090F2" },
  { char: "o", base: "#3B82F6" },
  { char: "s", base: "#EEF2FF" },
  { char: "t", base: "#EEF2FF" },
  { char: "u", base: "#EEF2FF" },
  { char: "f", base: "#EEF2FF" },
  { char: "f", base: "#EEF2FF" },
];

const HOVER_COLORS = [
  "#A78BFA",
  "#00C896",
  "#FFB830",
  "#3B82F6",
  "#EC4899",
  "#F97316",
  "#06B6D4",
  "#8B5CF6",
  "#FF4B5C",
  "#FFB830",
];

export default function HeroWordmark() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <h1
      className="font-black tracking-tight leading-none mb-6 flex justify-center flex-wrap"
      style={{ fontSize: "clamp(4rem, 12vw, 9rem)" }}
    >
      {LETTERS.map((letter, i) => (
        <span
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: "inline-block",
            color: hovered === i ? HOVER_COLORS[i] : letter.base,
            transform: hovered === i ? "translateY(-10px) scale(1.12)" : "translateY(0) scale(1)",
            transition: "transform 0.12s ease, color 0.12s ease",
            cursor: "default",
            userSelect: "none",
          }}
        >
          {letter.char}
        </span>
      ))}
    </h1>
  );
}
