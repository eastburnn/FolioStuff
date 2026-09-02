import Link from "next/link";

const TABS = [
  { href: "/admin", label: "Review queue" },
  { href: "/admin/emails", label: "Emails" },
];

export default function AdminNav({ current }: { current: string }) {
  return (
    <div className="flex items-center gap-1 mb-10 border-b border-white/[0.06] pb-3">
      <span className="text-xs text-ink-muted uppercase tracking-widest mr-4">Admin</span>
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            current === tab.href
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
