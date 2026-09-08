import Link from "next/link";
import Image from "next/image";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { href: "/tools", label: "Browse the Tools" },
      { href: "/directory", label: "Browse the Directory" },
      { href: "/submit", label: "Submit Your Tool" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    heading: "Site",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] pt-8 sm:pt-10 pb-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Phones: brand across the top, then the two link groups side by
            side. Wider screens: brand on the left with the two groups sized to
            their links and kept close, not spread across the full width. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-[280px_auto_auto] md:justify-center md:gap-x-16 mb-7 sm:mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 text-center md:text-left">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
              <Image src="/favicon.png" alt="Foliostuff" width={28} height={28} className="w-7 h-7 rounded-lg" />
              <span className="font-black tracking-tight text-base">
                <span style={{ color: "#8B5CF6" }}>folio</span>
                <span style={{ color: "#EEF2FF" }}>stuff</span>
              </span>
            </Link>
            <p className="text-xs text-ink-muted leading-relaxed max-w-[300px] mx-auto md:mx-0 md:max-w-[260px]">
              Useful tools for managing your money, plus a hand-reviewed directory of investing
              and finance tools worth knowing about.
            </p>
          </div>

          {COLUMNS.map((col, i) => (
            // Phones: the first group hugs the center from the right, the
            // second from the left. Wider screens: everything left aligned.
            <div key={col.heading} className={i === 0 ? "text-right md:text-left" : ""}>
              <h3 className="text-[10px] sm:text-xs text-ink-muted uppercase tracking-widest mb-2 sm:mb-3">
                {col.heading}
              </h3>
              <ul className="space-y-1.5 sm:space-y-2">
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

        <div className="border-t border-white/[0.05] pt-5 flex flex-col items-center gap-2">
          <p className="text-[11px] text-ink-muted text-center">
            Not financial advice. Some links are affiliate links, which may earn us a commission.
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
