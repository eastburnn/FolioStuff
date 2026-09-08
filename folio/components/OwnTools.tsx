import { Activity, Calculator, Coins, PieChart, Target, TrendingUp } from "lucide-react";

// The calculators built into the site, in display order. Used by the
// homepage, the Tools page, and the hero search.
export const OWN_TOOLS = [
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
      "Tell it how much you're willing to lose, where you're getting in, and where you're bailing. It tells you exactly how many shares to buy.",
    icon: <Target size={20} className="text-accent-gold" />,
    accent: "#FFB830",
    tag: "Risk Manage",
  },
  {
    href: "/compound-interest-calculator",
    title: "Compound Interest Calculator",
    description:
      "See what a starting amount plus monthly contributions grows into, with a chart of your money versus the interest it earned.",
    icon: <TrendingUp size={20} className="text-accent-purple" />,
    accent: "#8B5CF6",
    tag: "Grow",
  },
  {
    href: "/dividend-calculator",
    title: "Dividend Calculator",
    description:
      "Project your dividend income year by year, with dividends reinvested through a DRIP or taken as cash.",
    icon: <Coins size={20} className="text-accent-green" />,
    accent: "#00C896",
    tag: "Income",
  },
  {
    href: "/options-profit-calculator",
    title: "Options Profit Calculator",
    description:
      "Breakeven, max profit, max loss, and a payoff chart for any call or put, bought or sold.",
    icon: <Activity size={20} className="text-accent-gold" />,
    accent: "#FFB830",
    tag: "Trade",
  },
];
