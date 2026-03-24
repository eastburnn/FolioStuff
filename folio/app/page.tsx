import { PieChart, Calculator, Target, ExternalLink } from "lucide-react";
import WidgetCard from "@/components/WidgetCard";
import HeroWordmark from "@/components/HeroWordmark";

const WIDGETS = [
  {
    href: "/portfolio-visualizer",
    title: "Portfolio Visualizer",
    description:
      "Plug in your tickers and allocations, get a clean chart you can actually screenshot and share without it looking terrible.",
    icon: <PieChart size={20} className="text-accent-purple" />,
    accent: "#8B5CF6",
    tag: "Visualize",
  },
  {
    href: "/cost-basis",
    title: "Cost Basis Calculator",
    description:
      "Buying more? Selling some? See exactly what it does to your average cost before you do it.",
    icon: <Calculator size={20} className="text-accent-green" />,
    accent: "#00C896",
    tag: "Calculate",
  },
  {
    href: "/position-sizer",
    title: "Position Sizer",
    description:
      "Tell it how much you're willing to lose, where you're getting in, and where you're bailing — it tells you how many shares to buy.",
    icon: <Target size={20} className="text-accent-gold" />,
    accent: "#FFB830",
    tag: "Risk Manage",
  },
];

const EXTERNAL_TOOLS = [
  {
    href: "https://www.tradingview.com",
    name: "TradingView",
    description: "Advanced charting, real-time data, and trade ideas",
    accent: "#2962FF",
  },
  {
    href: "https://finviz.com",
    name: "Finviz",
    description: "Stock screener, heat maps, and market news",
    accent: "#00C896",
  },
  {
    href: "https://fiscal.ai/?via=welcome",
    name: "FiscalAI",
    description: "AI-powered financial research and earnings analysis",
    accent: "#FF6B6B",
  },
  {
    href: "https://fred.stlouisfed.org",
    name: "FRED",
    description: "Federal Reserve macroeconomic data and charts",
    accent: "#FFB830",
  },
  {
    href: "https://www.howmanytradingdays.com",
    name: "How Many Trading Days",
    description: "See how many trading days are left this year",
    accent: "#8B5CF6",
  },
  {
    href: "https://www.marketwatch.com",
    name: "MarketWatch",
    description: "Breaking market news, data, and analysis",
    accent: "#3B82F6",
  },
];

export default function Home() {
  return (
    <div className="grid-bg hero-glow min-h-screen">
      {/* Hero */}
      <section className="pt-36 pb-20 px-4 sm:px-6 text-center">
        <HeroWordmark />

        <p className="text-base sm:text-lg text-ink-secondary max-w-md mx-auto leading-relaxed">
          Free stock market tools for traders and investors — no sign-up, just click and open a new tab.
        </p>
      </section>

      {/* Widget cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-6">
          The tools
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {WIDGETS.map((w, i) => (
            <WidgetCard key={w.href} {...w} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* External tools */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-32">
        <div className="border-t border-white/[0.06] pt-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-6">
            Good stuff around the web
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXTERNAL_TOOLS.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3.5 p-4 rounded-xl border border-white/[0.06] bg-bg-card/60 hover:border-white/[0.12] hover:bg-bg-card transition-all duration-200"
              >
                <div
                  style={{ background: `${tool.accent}18`, borderColor: `${tool.accent}28` }}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                >
                  <ExternalLink size={13} style={{ color: tool.accent }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-primary group-hover:text-white transition-colors">
                    {tool.name}
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-6 px-4 text-center">
        <p className="text-xs text-ink-muted">
          Not financial advice. Just a tab you had open. ✌️
        </p>
      </footer>
    </div>
  );
}
