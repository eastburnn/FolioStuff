"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Tools" },
  { href: "/about", label: "About" },
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
          <img src="/favicon.png" alt="Foliostuff" className="w-7 h-7 rounded-lg" />
          <span
            className="font-black tracking-tight text-base transition-all duration-300 group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          >
            <span style={{ color: "#8B5CF6" }}>folio</span><span style={{ color: "#EEF2FF" }}>stuff</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" || pathname.startsWith("/portfolio") || pathname.startsWith("/cost-basis") || pathname.startsWith("/position-sizer") : pathname === link.href;
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

        {/* Mobile menu */}
        <nav className="flex sm:hidden items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" || pathname.startsWith("/portfolio") || pathname.startsWith("/cost-basis") || pathname.startsWith("/position-sizer") : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  active ? "bg-white/[0.08] text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
