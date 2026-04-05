import type { Metadata } from "next";
import { PieChart, Calculator, Target, ExternalLink } from "lucide-react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "About — FolioStuff",
  description:
    "FolioStuff is a growing collection of free tools, calculators, and widgets for traders and investors — plus a curated directory of the best stock market resources on the web.",
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
    description: "Enter your risk tolerance, entry, and stop loss — get the exact share count to buy.",
    icon: <Target size={15} className="text-accent-gold" />,
    accent: "#FFB830",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24 grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb items={[{ label: "About", href: "/about" }]} />

        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
          About FolioStuff
        </h1>
        <p className="text-ink-secondary leading-relaxed mb-12 max-w-2xl">
          FolioStuff is a free, no-login collection of tools and calculators built for people who
          take their investing seriously. No ads, no paywalls, no fluff - just useful stuff.
        </p>

        {/* What it is */}
        <section className="mb-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">What it is</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
            <p>
              The core of FolioStuff is a growing set of{" "}
              <span className="text-ink-primary font-medium">homegrown tools and calculators</span>{" "}
              - things that are annoyingly hard to find elsewhere, or that exist but look terrible
              and are painful to use. Every tool is built to be fast, mobile-friendly, and actually
              useful in the moment you need it.
            </p>
            <p>
              Alongside the tools, FolioStuff also acts as a{" "}
              <span className="text-ink-primary font-medium">curated directory</span> of the best
              stock market resources around the web. Instead of Googling the same sites every time,
              they&apos;re all in one place - screeners, charting platforms, sentiment indicators,
              economic data, and more.
            </p>
            <p>
              The goal is simple: give traders and investors a single place to do quick math, make
              sense of their positions, and jump off to whatever else they need.
            </p>
          </div>
        </section>

        {/* Current tools */}
        <section className="mb-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">The tools</h2>
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
          <p className="text-xs text-ink-muted mt-4 pl-1">More tools in the works.</p>
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
              . Built because these tools didn&apos;t exist in a form worth using, so I made them.
              If you have ideas for tools you&apos;d like to see, reach out on{" "}
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
