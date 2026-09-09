import { Activity, Calculator, Coins, PieChart, Target, TrendingUp } from "lucide-react";

// The calculators built into the site, in display order. Used by the
// homepage, the Tools page, and the hero search. Keywords are the extra
// terms the Tools page search matches beyond the title.
//
// Color and tag mean the same thing everywhere: purple is Visualize (the
// brand color, one flagship tool), green is Investing (long-term math),
// gold is Trading (risk and payoff). Cards are ordered so the colors
// cluster instead of alternating.
export const OWN_TOOLS = [
  {
    href: "/portfolio-visualizer",
    title: "Portfolio Visualizer",
    description:
      "Plug in your tickers and allocations, get a clean chart you can actually screenshot and share without it looking terrible.",
    icon: <PieChart size={14} className="text-accent-purple" />,
    accent: "#8B5CF6",
    tag: "Visualize",
    keywords: ["portfolio", "chart", "allocation", "holdings", "pie", "share", "visualizer", "weights", "diversification"],
  },
  {
    href: "/cost-basis",
    title: "Cost Basis Calculator",
    description:
      "Buying more? Selling some? See exactly what it does to your average cost before you do it.",
    icon: <Calculator size={14} className="text-accent-green" />,
    accent: "#00C896",
    tag: "Investing",
    keywords: ["cost basis", "average cost", "average down", "average up", "trim", "p&l", "profit", "loss", "shares", "break even", "investing"],
  },
  {
    href: "/compound-interest-calculator",
    title: "Compound Interest Calculator",
    description:
      "See what a starting amount plus monthly contributions grows into, with a chart of your money versus the interest it earned.",
    icon: <TrendingUp size={14} className="text-accent-green" />,
    accent: "#00C896",
    tag: "Investing",
    keywords: ["compound interest", "savings", "growth", "interest", "retirement", "contributions", "rule of 72", "investing", "future value"],
  },
  {
    href: "/dividend-calculator",
    title: "Dividend Calculator",
    description:
      "Project your dividend income year by year, with dividends reinvested through a DRIP or taken as cash.",
    icon: <Coins size={14} className="text-accent-green" />,
    accent: "#00C896",
    tag: "Investing",
    keywords: ["dividend", "drip", "reinvest", "yield", "income", "yield on cost", "passive income", "payout", "investing"],
  },
  {
    href: "/position-sizer",
    title: "Position Sizer",
    description:
      "Tell it how much you're willing to lose, where you're getting in, and where you're bailing. It tells you exactly how many shares to buy.",
    icon: <Target size={14} className="text-accent-gold" />,
    accent: "#FFB830",
    tag: "Trading",
    keywords: ["position size", "risk", "stop loss", "shares to buy", "account size", "risk per trade", "sizing", "trading"],
  },
  {
    href: "/options-profit-calculator",
    title: "Options Profit Calculator",
    description:
      "Breakeven, max profit, max loss, and a payoff chart for any call or put, bought or sold.",
    icon: <Activity size={14} className="text-accent-gold" />,
    accent: "#FFB830",
    tag: "Trading",
    keywords: ["options", "calls", "puts", "premium", "strike", "breakeven", "payoff", "expiration", "trading", "profit"],
  },
];
