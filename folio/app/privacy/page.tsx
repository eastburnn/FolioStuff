import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FolioStuff handles your data: what we collect, what we never see, and how affiliate links work.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | FolioStuff",
    description:
      "How FolioStuff handles your data: what we collect, what we never see, and how affiliate links work.",
    url: "/privacy",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

const SECTIONS = [
  {
    heading: "The short version",
    paragraphs: [
      "FolioStuff has no accounts, no logins, and no forms asking for your personal information. The numbers you type into the tools are processed entirely in your browser and never sent to our servers. The only data we collect is anonymous usage analytics, described below.",
    ],
  },
  {
    heading: "What happens in the tools",
    paragraphs: [
      "The calculators and the portfolio visualizer run completely on your device. Your tickers, allocations, position sizes, and cost basis numbers are never uploaded, stored, or seen by us. Close the tab and they are gone.",
    ],
  },
  {
    heading: "Analytics",
    paragraphs: [
      "We use Google Analytics to understand how the site is used: which pages get visited, roughly where visitors come from, and what kind of device they use. This data is aggregated and does not identify you personally. Google Analytics sets cookies to do this. You can block these with a browser extension or your browser's cookie settings, and the site works exactly the same without them.",
    ],
  },
  {
    heading: "Affiliate links",
    paragraphs: [
      "Some outbound links on this site are affiliate links, meaning we may earn a commission if you sign up for or purchase something through them. This costs you nothing extra, and it does not affect which sites we choose to link to. We link to things because they are useful, not because they pay.",
    ],
  },
  {
    heading: "External sites",
    paragraphs: [
      "FolioStuff links out to third party sites we do not control. Once you leave this site, their privacy practices apply, not ours. We encourage you to review the privacy policy of any site you visit.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "If the way we handle data changes, this page will be updated to reflect it. The date below always shows the last revision.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb items={[{ label: "Privacy Policy", href: "/privacy" }]} />

        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-ink-secondary leading-relaxed mb-12 max-w-2xl">
          FolioStuff is built to be useful without collecting much of anything. Here is exactly
          what we do and do not know about you.
        </p>

        {SECTIONS.map((section) => (
          <section key={section.heading} className="mb-10">
            <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
              {section.heading}
            </h2>
            <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Questions</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 text-sm text-ink-secondary leading-relaxed">
            <p>
              If you have questions about any of this, reach out on{" "}
              <a
                href="https://x.com/itschrisray"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-primary hover:text-white transition-colors underline underline-offset-2"
              >
                X&nbsp;(@itschrisray)
              </a>
              .
            </p>
          </div>
        </section>

        <p className="text-xs text-ink-muted mt-10">Last updated: August 25, 2026</p>
      </div>
    </div>
  );
}
