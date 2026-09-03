import Link from "next/link";
import Image from "next/image";

const COLUMNS = [
  {
    heading: "Tools",
    links: [
      { href: "/portfolio-visualizer", label: "Portfolio Visualizer" },
      { href: "/cost-basis", label: "Cost Basis Calculator" },
      { href: "/position-sizer", label: "Position Sizer" },
    ],
  },
  {
    heading: "Directory",
    links: [
      { href: "/directory", label: "Browse the Directory" },
      { href: "/submit", label: "Submit Your Tool" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    heading: "Site",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] pt-8 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Phones: brand across the top, then the three link groups spread
            across one row, each column sized to its longest link. */}
        <div className="grid grid-cols-[auto_auto_auto] justify-between gap-x-3 gap-y-6 sm:gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="col-span-3 sm:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
              <Image src="/favicon.png" alt="Foliostuff" width={28} height={28} className="w-7 h-7 rounded-lg" />
              <span className="font-black tracking-tight text-base">
                <span style={{ color: "#8B5CF6" }}>folio</span>
                <span style={{ color: "#EEF2FF" }}>stuff</span>
              </span>
            </Link>
            <p className="text-xs text-ink-muted leading-relaxed sm:max-w-[220px]">
              Free tools for traders and investors, plus a hand-reviewed directory of finance
              tools built by indie makers.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[10px] sm:text-xs text-ink-muted uppercase tracking-widest mb-2.5 sm:mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-1.5 sm:space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[11px] sm:text-sm text-ink-secondary hover:text-ink-primary transition-colors whitespace-nowrap"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.05] pt-5 sm:pt-6 flex flex-col items-center gap-2.5 sm:gap-3">
          <p className="text-[11px] text-ink-muted text-center max-w-xl">
            For information only, not financial advice. Some links are affiliate links that may
            earn us a commission at no cost to you.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span>Made by</span>
            <a href="https://www.itschrisray.com" target="_blank" rel="noopener noreferrer" className="text-ink-secondary hover:text-ink-primary transition-colors">itschrisray.com</a>
            <span>·</span>
            <a href="https://x.com/itschrisray" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-ink-secondary hover:text-ink-primary transition-colors">
              <Image src="/twitter.png" alt="X" width={12} height={12} className="w-3 h-3 opacity-60" />
              @itschrisray
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
