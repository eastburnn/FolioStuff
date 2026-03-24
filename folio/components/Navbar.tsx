"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp } from "lucide-react";

const NAV_LINKS = [
  { href: "/portfolio-visualizer", label: "Portfolio" },
  { href: "/cost-basis", label: "Cost Basis" },
  { href: "/position-sizer", label: "Position Sizer" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(6, 8, 15, 0.85)", backdropFilter: "blur(16px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center group-hover:bg-accent-purple/30 transition-colors">
            <TrendingUp size={14} className="text-accent-purple" />
          </div>
          <span className="font-bold text-base tracking-tight text-ink-primary">
            FOLIO
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-white/[0.07] text-ink-primary"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu — minimal chip list */}
        <nav className="flex sm:hidden items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  active ? "bg-white/[0.08] text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
                }`}
              >
                {link.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
