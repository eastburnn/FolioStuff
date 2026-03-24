"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface WidgetCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  tag: string;
  delay?: number;
}

export default function WidgetCard({
  href,
  title,
  description,
  icon,
  accent,
  tag,
  delay = 0,
}: WidgetCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      className="block h-full"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderColor: hovered ? `${accent}55` : "rgba(255,255,255,0.07)",
          boxShadow: hovered
            ? `0 0 40px ${accent}18, 0 0 80px ${accent}08, inset 0 0 30px ${accent}06`
            : "none",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
        }}
        className="relative rounded-2xl border bg-bg-card p-7 cursor-pointer transition-all duration-300 overflow-hidden select-none h-full"
      >
        {/* Radial glow overlay */}
        <div
          style={{
            background: `radial-gradient(circle at 0% 0%, ${accent}14, transparent 65%)`,
            opacity: hovered ? 1 : 0,
          }}
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none rounded-2xl"
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Icon + Tag row */}
          <div className="flex items-center gap-3 mb-5">
            <div
              style={{
                background: `${accent}18`,
                borderColor: `${accent}30`,
              }}
              className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300"
            >
              {icon}
            </div>
            <span
              style={{
                color: accent,
                background: `${accent}15`,
                borderColor: `${accent}28`,
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider"
            >
              {tag}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-ink-primary mb-2 leading-snug">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-ink-secondary leading-relaxed">
            {description}
          </p>

          {/* CTA */}
          <div
            style={{ color: accent }}
            className="flex items-center gap-1.5 mt-auto pt-5 text-xs font-semibold uppercase tracking-widest"
          >
            <span>Open tool</span>
            <ArrowRight
              size={12}
              style={{
                transform: hovered ? "translateX(4px)" : "translateX(0)",
                transition: "transform 0.2s ease",
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
