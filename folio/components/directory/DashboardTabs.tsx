"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardTabsProps {
  isAdmin: boolean;
}

// Saved is the private list of bookmarks; Maker holds submissions. Admin
// only renders for the site admin (the server decides, never the client).
export default function DashboardTabs({ isAdmin }: DashboardTabsProps) {
  const pathname = usePathname();
  const tabs = [
    { href: "/dashboard", label: "Saved", active: pathname === "/dashboard" },
    { href: "/dashboard/maker", label: "Maker", active: pathname.startsWith("/dashboard/maker") },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", active: pathname.startsWith("/admin") }] : []),
  ];
  return (
    <div className="flex items-center gap-1 border-b border-white/[0.06] pb-3 mb-8">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            tab.active
              ? "bg-white/[0.07] text-ink-primary"
              : "text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04]"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
