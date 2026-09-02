"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "Directory" },
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

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(6, 8, 15, 0.85)", backdropFilter: "blur(16px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <Image src="/favicon.png" alt="Foliostuff" width={28} height={28} className="w-7 h-7 rounded-lg" />
          <span
            className="font-black tracking-tight text-base transition-all duration-300 group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          >
            <span style={{ color: "#8B5CF6" }}>folio</span><span style={{ color: "#EEF2FF" }}>stuff</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          {/* Nav links */}
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive(pathname, link.href)
                    ? "bg-white/[0.07] text-ink-primary"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2">
            <Link
              href="/submit"
              className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-accent-purple/[0.12] border border-accent-purple/40 text-accent-purple hover:bg-accent-purple/[0.22] hover:border-accent-purple/60 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] transition-all duration-200 whitespace-nowrap"
            >
              Submit
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-white/[0.09] border border-white/[0.12] text-ink-primary hover:bg-white/[0.14] transition-all duration-200 whitespace-nowrap"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-white/[0.09] border border-white/[0.12] text-ink-primary hover:bg-white/[0.14] transition-all duration-200 whitespace-nowrap"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
