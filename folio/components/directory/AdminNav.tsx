"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Review queue" },
  { href: "/admin/directory", label: "Directory" },
  { href: "/admin/emails", label: "Emails" },
];

// Rendered once by the admin layout; the active tab follows the pathname.
export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="mb-10">
      <p className="text-xs text-ink-muted uppercase tracking-widest mb-4">Admin dashboard</p>
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-3">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={pathname === tab.href ? "page" : undefined}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              pathname === tab.href
                ? "bg-white/[0.07] text-ink-primary"
                : "text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
