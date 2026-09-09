import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OWN_TOOLS } from "./OwnTools";

// Short names for the compact phone tiles and one-line blurbs for the
// desktop rows, keyed by route. Everything else comes from OWN_TOOLS.
const EXTRA: Record<string, { short: string; blurb: string }> = {
  "/portfolio-visualizer": { short: "Portfolio Visualizer", blurb: "Build a shareable chart of your holdings" },
  "/cost-basis": { short: "Cost Basis", blurb: "See how adding or trimming affects your average cost" },
  "/compound-interest-calculator": { short: "Compound Interest", blurb: "Watch contributions and interest grow over time" },
  "/dividend-calculator": { short: "Dividend Calculator", blurb: "Project dividend income with or without DRIP" },
  "/position-sizer": { short: "Position Sizer", blurb: "Get the exact share count based on your risk tolerance" },
  "/options-profit-calculator": { short: "Options Profit", blurb: "Breakeven and payoff for any call or put" },
};

// Three related tools: the same category first, then the rest in site order.
export function relatedTools(current: string, count = 3) {
  const me = OWN_TOOLS.find((t) => t.href === current);
  const others = OWN_TOOLS.filter((t) => t.href !== current);
  return [...others.filter((t) => t.tag === me?.tag), ...others.filter((t) => t.tag !== me?.tag)].slice(0, count);
}

// Phones and tablets: three compact tiles across, icon over a short name.
// Desktop: the same three as rows with a one-line blurb and an arrow.
export default function OtherTools({ current }: { current: string }) {
  const tools = relatedTools(current);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-16 pb-16">
      <div className="border-t border-white/[0.06] pt-10">
        <p className="text-xs text-ink-muted uppercase tracking-widest mb-4">Other tools</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {tools.map((tool) => {
            const extra = EXTRA[tool.href] ?? { short: tool.title, blurb: tool.description };
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex flex-col items-center text-center gap-2 px-2 py-3 lg:flex-row lg:items-center lg:text-left lg:gap-3 lg:px-4 rounded-xl border border-white/[0.06] bg-bg-card/60 hover:border-white/[0.12] hover:bg-bg-card transition-all duration-200"
              >
                <div
                  style={{ background: `${tool.accent}18`, borderColor: `${tool.accent}28` }}
                  className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
                >
                  {tool.icon}
                </div>
                <div className="min-w-0 lg:flex-1">
                  <p className="text-xs lg:text-sm font-medium text-ink-primary leading-snug group-hover:text-white transition-colors lg:truncate">
                    <span className="lg:hidden">{extra.short}</span>
                    <span className="hidden lg:inline">{tool.title}</span>
                  </p>
                  <p className="hidden lg:block text-xs text-ink-muted truncate">{extra.blurb}</p>
                </div>
                <ArrowRight
                  size={13}
                  className="hidden lg:block text-ink-muted shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            );
          })}
        </div>
        <Link
          href="/tools"
          className="inline-block mt-5 text-xs font-semibold uppercase tracking-widest text-ink-secondary hover:text-ink-primary transition-colors"
        >
          Browse all tools →
        </Link>
      </div>
    </div>
  );
}
