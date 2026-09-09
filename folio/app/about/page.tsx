import type { Metadata } from "next";
import { PieChart, Calculator, Target, TrendingUp, Coins, Activity } from "lucide-react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "About",
  description:
    "A hand-reviewed directory of stock market, investing, and personal finance sites, built by people who understand the problems they solve. Plus our own calculators, free to use with no account.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | FolioStuff",
    description:
      "A hand-reviewed directory of stock market, investing, and personal finance sites, built by people who understand the problems they solve. Plus our own calculators, free to use with no account.",
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
    href: "/compound-interest-calculator",
    title: "Compound Interest Calculator",
    description: "See what a starting amount plus monthly contributions grows into over the years.",
    icon: <TrendingUp size={15} className="text-accent-green" />,
    accent: "#00C896",
  },
  {
    href: "/dividend-calculator",
    title: "Dividend Calculator",
    description: "Project dividend income year by year, reinvested through a DRIP or taken as cash.",
    icon: <Coins size={15} className="text-accent-green" />,
    accent: "#00C896",
  },
  {
    href: "/position-sizer",
    title: "Position Sizer",
    description: "Enter your risk tolerance, entry, and stop loss to get the exact share count to buy.",
    icon: <Target size={15} className="text-accent-gold" />,
    accent: "#FFB830",
  },
  {
    href: "/options-profit-calculator",
    title: "Options Profit Calculator",
    description: "Breakeven, max profit, max loss, and a payoff chart for calls and puts.",
    icon: <Activity size={15} className="text-accent-gold" />,
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
          FolioStuff is a home for useful tools for managing your money: a set of calculators
          we built ourselves, and a hand-reviewed{" "}
          <Link href="/directory" className="text-ink-primary underline underline-offset-2 hover:text-white">
            directory
          </Link>{" "}
          of investing and finance sites made by people who understand the problems they solve.
        </p>

        <section className="mb-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Our own tools</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
            <p>
              The site started with a few{" "}
              <span className="text-ink-primary font-medium">homegrown calculators</span>: things
              that were annoyingly hard to find elsewhere, or that existed but looked terrible and
              were painful to use. The{" "}
              <Link href="/portfolio-visualizer" className="text-ink-primary underline underline-offset-2 hover:text-white">
                Portfolio Visualizer
              </Link>
              ,{" "}
              <Link href="/cost-basis" className="text-ink-primary underline underline-offset-2 hover:text-white">
                Cost Basis Calculator
              </Link>
              , and{" "}
              <Link href="/position-sizer" className="text-ink-primary underline underline-offset-2 hover:text-white">
                Position Sizer
              </Link>{" "}
              came first. The{" "}
              <Link href="/compound-interest-calculator" className="text-ink-primary underline underline-offset-2 hover:text-white">
                Compound Interest Calculator
              </Link>
              ,{" "}
              <Link href="/dividend-calculator" className="text-ink-primary underline underline-offset-2 hover:text-white">
                Dividend Calculator
              </Link>
              , and{" "}
              <Link href="/options-profit-calculator" className="text-ink-primary underline underline-offset-2 hover:text-white">
                Options Profit Calculator
              </Link>{" "}
              followed. All of them run entirely in your browser, work on a phone, and need no
              account. Your numbers never leave your device. More are on the way, including
              personal finance tools that have nothing to do with the stock market.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">The directory</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
            <p>
              The{" "}
              <Link href="/directory" className="text-ink-primary font-medium underline underline-offset-2 hover:text-white">
                Community Directory
              </Link>{" "}
              collects stock market, investing, and personal finance sites that are genuinely worth
              your time. Some are free, some are paid, and they come from solo builders and small
              teams alike. What they have in common is that the people who made them understand
              the problem they set out to solve. You will not find the household names here; you
              already know about those.
            </p>
            <p>
              Every submission is reviewed by a person before it goes live. Each tool gets its own
              page with a description, screenshots, tags, and a link straight to the site, and
              you can browse by tag, for example{" "}
              <Link href="/directory?tag=calculator" className="text-ink-primary underline underline-offset-2 hover:text-white">
                calculators
              </Link>{" "}
              or{" "}
              <Link href="/directory?tag=tracker" className="text-ink-primary underline underline-offset-2 hover:text-white">
                trackers
              </Link>
              . Every maker has a public page too, like{" "}
              <Link href="/makers/itschrisray" className="text-ink-primary underline underline-offset-2 hover:text-white">
                this one
              </Link>
              , that gathers everything they have listed.
            </p>
            <p>
              Built something? Create an account, set up your maker profile, and{" "}
              <Link href="/submit" className="text-ink-primary font-medium underline underline-offset-2 hover:text-white">
                submit your site
              </Link>
              . Approved listings link back to your site, and you can edit or remove them
              whenever you like. Alongside the directory, the{" "}
              <Link href="/" className="text-ink-primary underline underline-offset-2 hover:text-white">
                homepage
              </Link>{" "}
              keeps a short list of established resources around the web, so screeners, charting
              platforms, and sentiment indicators are one click away.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Save what you use</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
            <p>
              Every calculator and every directory listing has a bookmark. With a free{" "}
              <Link href="/signup" className="text-ink-primary underline underline-offset-2 hover:text-white">
                account
              </Link>
              , tap it to keep that tool on the Saved tab of your{" "}
              <Link href="/dashboard" className="text-ink-primary underline underline-offset-2 hover:text-white">
                dashboard
              </Link>
              , a private page that collects the things you actually come back to, so you open one
              page instead of hunting for each tool again. Nobody else can see your list, and you
              can drop anything from it with the same bookmark.
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
              . The calculators exist because they did not exist anywhere else in a form worth
              using, and the directory exists because good tools deserve to be found. Ideas,
              feedback, or a tool to suggest? Use the{" "}
              <Link href="/contact" className="text-ink-primary hover:text-white transition-colors underline underline-offset-2">
                contact form
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
