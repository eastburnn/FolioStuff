import { Activity, Calculator, Coins, PieChart, Target, TrendingUp } from "lucide-react";

// The calculators built into the site, in display order. Used by the
// homepage, the Tools page, and the hero search. Keywords are the extra
// terms the Tools page search matches beyond the title.
export const OWN_TOOLS = [
  {
    href: "/portfolio-visualizer",
    title: "Portfolio Visualizer",
    description:
      "Plug in your tickers and allocations, get a clean chart you can actually screenshot and share without it looking terrible.",
    icon: <PieChart size={20} className="text-accent-purple" />,
    accent: "#8B5CF6",
    tag: "Visualize",
    keywords: ["portfolio", "chart", "allocation", "holdings", "pie", "share", "visualizer", "weights", "diversification"],
  },
  {
    href: "/cost-basis",
    title: "Cost Basis Calculator",
    description:
      "Buying more? Selling some? See exactly what it does to your average cost before you do it.",
    icon: <Calculator size={20} className="text-accent-green" />,
    accent: "#00C896",
    tag: "Calculate",
    keywords: ["cost basis", "average cost", "average down", "average up", "trim", "p&l", "profit", "loss", "shares", "break even"],
  },
  {
    href: "/position-sizer",
    title: "Position Sizer",
    description:
      "Tell it how much you're willing to lose, where you're getting in, and where you're bailing. It tells you exactly how many shares to buy.",
    icon: <Target size={20} className="text-accent-gold" />,
    accent: "#FFB830",
    tag: "Risk Manage",
    keywords: ["position size", "risk", "stop loss", "shares to buy", "account size", "risk per trade", "sizing", "trading"],
  },
  {
    href: "/compound-interest-calculator",
    title: "Compound Interest Calculator",
    description:
      "See what a starting amount plus monthly contributions grows into, with a chart of your money versus the interest it earned.",
    icon: <TrendingUp size={20} className="text-accent-purple" />,
    accent: "#8B5CF6",
    tag: "Grow",
    keywords: ["compound interest", "savings", "growth", "interest", "retirement", "contributions", "rule of 72", "investing", "future value"],
  },
  {
    href: "/dividend-calculator",
    title: "Dividend Calculator",
    description:
      "Project your dividend income year by year, with dividends reinvested through a DRIP or taken as cash.",
    icon: <Coins size={20} className="text-accent-green" />,
    accent: "#00C896",
    tag: "Income",
    keywords: ["dividend", "drip", "reinvest", "yield", "income", "yield on cost", "passive income", "payout"],
  },
  {
    href: "/options-profit-calculator",
    title: "Options Profit Calculator",
    description:
      "Breakeven, max profit, max loss, and a payoff chart for any call or put, bought or sold.",
    icon: <Activity size={20} className="text-accent-gold" />,
    accent: "#FFB830",
    tag: "Trade",
    keywords: ["options", "calls", "puts", "premium", "strike", "breakeven", "payoff", "expiration", "trading", "profit"],
  },
];
