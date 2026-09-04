import type { Metadata } from "next";
import { PieChart, Calculator, Target } from "lucide-react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "About",
  description:
    "Free tools for traders and investors, plus a hand-reviewed directory of finance tools built by indie makers.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | FolioStuff",
    description:
      "Free tools for traders and investors, plus a hand-reviewed directory of finance tools built by indie makers.",
    url: "/about",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

const TOOLS = [
  {
    href: "/portfolio-visualizer",
    title: "Portfolio Visualizer",
    description: "Build a shareable donut chart of your holdings. Download a clean PNG card for Twitter/X.",
    icon: <PieChart size={15} className="text-accent-purple" />,
    accent: "#8B5CF6",
  },
  {
    href: "/cost-basis",
    title: "Cost Basis Calculator",
    description: "See exactly how buying more or trimming a position affects your average cost and P&L.",
    icon: <Calculator size={15} className="text-accent-green" />,
    accent: "#00C896",
  },
  {
    href: "/position-sizer",
    title: "Position Sizer",
    description: "Enter your risk tolerance, entry, and stop loss to get the exact share count to buy.",
    icon: <Target size={15} className="text-accent-gold" />,
    accent: "#FFB830",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb items={[{ label: "About", href: "/about" }]} />

        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
          About FolioStuff
        </h1>
        <p className="text-ink-secondary leading-relaxed mb-12 max-w-2xl">
          FolioStuff is two things: a set of free, no-login tools for people who take their
          investing seriously, and a hand-reviewed directory of finance tools built by indie
          makers. No ads, no paywalls, no fluff.
        </p>

        {/* What it is */}
        <section className="mb-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">The tools</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
            <p>
              The core of FolioStuff is a growing set of{" "}
              <span className="text-ink-primary font-medium">homegrown tools and calculators</span>:
              things that are annoyingly hard to find elsewhere, or that exist but look terrible
              and are painful to use. Every tool runs entirely in your browser, works on a phone,
              and needs no account. Your numbers never leave your device.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">The directory</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
            <p>
              The{" "}
              <Link href="/directory" className="text-ink-primary font-medium underline underline-offset-2 hover:text-white">
                indie tool directory
              </Link>{" "}
              is where independent makers list the stock market, investing, and finance tools they
              have built. Every submission is reviewed by a person before it goes live, so what you
              find here is real, working, and worth a look. Each tool gets its own page with a
              description, screenshots, tags, and a link straight to the maker.
            </p>
            <p>
              Built something yourself? Create a free account, set up your maker profile, and{" "}
              <Link href="/submit" className="text-ink-primary font-medium underline underline-offset-2 hover:text-white">
                submit your tool
              </Link>
              . Approved listings link back to your site, and your public maker page collects
              everything you have listed in one place. You stay in control: edit or remove your
              listings whenever you like.
            </p>
            <p>
              Alongside the directory, the homepage keeps a short list of the best established
              resources around the web, so screeners, charting platforms, and sentiment indicators
              are one click away.
            </p>
          </div>
        </section>

        {/* Current tools */}
        <section className="mb-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Try them</h2>
          <div className="space-y-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex items-start gap-4 p-4 rounded-xl border border-white/[0.06] bg-bg-card/60 hover:border-white/[0.12] hover:bg-bg-card transition-all duration-200"
              >
                <div
                  style={{ background: `${tool.accent}18`, borderColor: `${tool.accent}28` }}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                >
                  {tool.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-primary group-hover:text-white transition-colors">
                    {tool.title}
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{tool.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-4 pl-1">More tools in the works. Want one built? Say so.</p>
        </section>

        {/* Who made it */}
        <section>
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Who made it</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 text-sm text-ink-secondary leading-relaxed">
            <p>
              FolioStuff is a side project by{" "}
              <a
                href="https://www.itschrisray.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-primary hover:text-white transition-colors underline underline-offset-2"
              >
                Chris Ray
              </a>
              . The tools exist because they did not exist anywhere else in a form worth using,
              and the directory exists because indie makers deserve a place to be found. Ideas,
              feedback, or a tool to suggest? Reach out on{" "}
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
      </div>
    </div>
  );
}
