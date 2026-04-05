import Link from "next/link";
import { PieChart, Calculator, Target, ArrowRight } from "lucide-react";

const ALL_TOOLS = [
  {
    href: "/portfolio-visualizer",
    label: "Portfolio Visualizer",
    description: "Build a shareable chart of your holdings",
    icon: <PieChart size={13} className="text-accent-purple" />,
    accent: "#8B5CF6",
  },
  {
    href: "/cost-basis",
    label: "Cost Basis Calculator",
    description: "See how adding or trimming affects your average cost",
    icon: <Calculator size={13} className="text-accent-green" />,
    accent: "#00C896",
  },
  {
    href: "/position-sizer",
    label: "Position Sizer",
    description: "Get the exact share count based on your risk tolerance",
    icon: <Target size={13} className="text-accent-gold" />,
    accent: "#FFB830",
  },
];

export default function OtherTools({ current }: { current: string }) {
  const others = ALL_TOOLS.filter((t) => t.href !== current);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-16 pb-16">
      <div className="border-t border-white/[0.06] pt-10">
        <p className="text-xs text-ink-muted uppercase tracking-widest mb-4">Other tools</p>
        <div className="flex flex-col sm:flex-row gap-3">
          {others.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-bg-card/60 hover:border-white/[0.12] hover:bg-bg-card transition-all duration-200 flex-1"
            >
              <div
                style={{ background: `${tool.accent}18`, borderColor: `${tool.accent}28` }}
                className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
              >
                {tool.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-primary group-hover:text-white transition-colors truncate">
                  {tool.label}
                </p>
                <p className="text-xs text-ink-muted truncate">{tool.description}</p>
              </div>
              <ArrowRight
                size={13}
                className="text-ink-muted shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
