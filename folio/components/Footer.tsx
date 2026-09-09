import Link from "next/link";
import Image from "next/image";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { href: "/tools", label: "Browse Tools" },
      { href: "/directory", label: "Browse Directory" },
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

const DESCRIPTION =
  "Useful tools for managing your money, plus a hand-reviewed directory of investing and finance tools worth knowing about.";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] pt-8 sm:pt-10 pb-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Three columns at every width: brand on the left with the
            description wrapping beneath the wordmark, then the two link
            groups. Phones give the brand whatever the two groups leave, so
            the last group ends at the right edge; wider screens size the
            groups to their links and keep them close. */}
        <div className="grid grid-cols-[minmax(7rem,1fr)_auto_auto] gap-x-3 sm:gap-x-8 md:grid-cols-[280px_auto_auto] md:justify-center md:gap-x-16 mb-7 sm:mb-8">
          {/* Brand */}
          <div className="min-w-0 text-left">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-2.5 md:mb-3">
              <Image src="/favicon.png" alt="Foliostuff" width={28} height={28} className="w-7 h-7 rounded-lg" />
              <span className="font-black tracking-tight text-base">
                <span style={{ color: "#8B5CF6" }}>folio</span>
                <span style={{ color: "#EEF2FF" }}>stuff</span>
              </span>
            </Link>
            <p className="text-[11px] sm:text-xs text-ink-muted leading-relaxed pr-2 md:pr-0 md:max-w-[260px]">{DESCRIPTION}</p>
          </div>

          {COLUMNS.map((col, i) => (
            // Phones: the first group carries extra right padding, which
            // pulls it left by taking that width from the brand column.
            <div key={col.heading} className={`min-w-0${i === 0 ? " pr-4 sm:pr-0" : ""}`}>
              <h3 className="text-[10px] sm:text-xs text-ink-muted uppercase tracking-widest mb-2 sm:mb-3">
                {col.heading}
              </h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[11px] sm:text-sm text-ink-secondary hover:text-ink-primary transition-colors sm:whitespace-nowrap"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip: two short items. Desktop puts them at either end of
            one row; phones stack them as two lines that never wrap. */}
        <div className="border-t border-white/[0.05] pt-5 flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between text-[11px] sm:text-xs text-ink-muted">
          <p className="flex items-center gap-1.5 whitespace-nowrap">
            <span>
              © {new Date().getFullYear()} FolioStuff<span className="hidden sm:inline">. All rights reserved.</span>
            </span>
            <span>·</span>
            <span>Made by</span>
            <a href="https://www.itschrisray.com" target="_blank" rel="noopener noreferrer" className="text-ink-secondary hover:text-ink-primary transition-colors">itschrisray.com</a>
            <a href="https://x.com/itschrisray" target="_blank" rel="noopener noreferrer" aria-label="itschrisray on X" className="flex items-center opacity-60 hover:opacity-100 transition-opacity">
              <Image src="/twitter.png" alt="" width={12} height={12} className="w-3 h-3" />
            </a>
          </p>
          <p className="whitespace-nowrap">Not financial advice. Some links are affiliate links.</p>
        </div>
      </div>
    </footer>
  );
}
