"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Directory" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return (
      pathname === "/" ||
      pathname.startsWith("/portfolio") ||
      pathname.startsWith("/cost-basis") ||
      pathname.startsWith("/position-sizer")
    );
  }
  return pathname.startsWith(href);
}

const submitClass =
  "rounded-lg text-sm font-semibold bg-accent-purple/[0.12] border border-accent-purple/40 text-accent-purple hover:bg-accent-purple/[0.22] hover:border-accent-purple/60 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] transition-all duration-200 whitespace-nowrap";
const accountClass =
  "rounded-lg text-sm font-semibold bg-white/[0.09] border border-white/[0.12] text-ink-primary hover:bg-white/[0.14] transition-all duration-200 whitespace-nowrap";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // The phone menu closes on navigation, Escape, or a tap outside it.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const account = user
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: "/login", label: "Login" };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(6, 8, 15, 0.85)", backdropFilter: "blur(16px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0" ref={menuRef}>
          {/* Phone menu button, left of the logo */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="md:hidden -ml-2 p-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-white/[0.06] transition-colors"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <Image src="/favicon.png" alt="Foliostuff" width={28} height={28} className="w-7 h-7 rounded-lg" />
            <span
              className="font-black tracking-tight text-base transition-all duration-300 group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            >
              <span style={{ color: "#8B5CF6" }}>folio</span><span style={{ color: "#EEF2FF" }}>stuff</span>
            </span>
          </Link>

          {/* Phone dropdown */}
          {open && (
            <div
              id="mobile-menu"
              className="md:hidden absolute left-4 top-[calc(100%+0.5rem)] w-56 rounded-2xl border border-white/[0.08] bg-bg-card p-2 shadow-2xl"
            >
              <nav className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(pathname, link.href)
                        ? "bg-white/[0.07] text-ink-primary"
                        : "text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-white/[0.06] mt-2 pt-2 flex flex-col gap-2">
                <Link href="/submit" className={`${submitClass} px-3 py-2.5 text-center`}>
                  Submit
                </Link>
                <Link href={account.href} className={`${accountClass} px-3 py-2.5 text-center`}>
                  {account.label}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Desktop links and actions */}
        <div className="hidden md:flex items-center gap-2 min-w-0">
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(pathname, link.href)
                    ? "bg-white/[0.07] text-ink-primary"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 pl-2">
            <Link href="/submit" className={`${submitClass} px-3.5 py-1.5`}>
              Submit
            </Link>
            <Link href={account.href} className={`${accountClass} px-3.5 py-1.5`}>
              {account.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
