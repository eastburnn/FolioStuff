import type { Metadata } from "next";
import { Activity } from "lucide-react";
import OptionsProfitCalculator from "@/components/widgets/OptionsProfitCalculator";
import Breadcrumb from "@/components/Breadcrumb";
import OtherTools from "@/components/OtherTools";
import ToolJsonLd from "@/components/ToolJsonLd";
import ToolInfo from "@/components/ToolInfo";

const INFO_SECTIONS = [
  {
    "heading": "How the math works",
    "body": [
      "At expiration an option is worth only its intrinsic value. A call is worth the stock price minus the strike if that is positive, otherwise nothing. A put is worth the strike minus the stock price if that is positive, otherwise nothing. Your profit is that value minus the premium you paid, or the premium you collected minus that value if you sold the option.",
      "Every number is multiplied by 100 shares per contract and by the number of contracts. Breakeven is the strike plus the premium for calls and the strike minus the premium for puts. Buying caps your loss at the premium; selling caps your gain at the premium and leaves the other side open."
    ]
  },
  {
    "heading": "A quick example",
    "body": [
      "You buy one $100 call for $5 per share, so $500 total. At expiration the stock is at $112. The call is worth $12 per share, or $1,200, and your profit is $700. At $100 or below it expires worthless and you lose the $500. Breakeven is $105."
    ]
  }
];

const INFO_FAQS = [
  {
    "q": "Why does the chart only show expiration?",
    "a": "Before expiration an option also carries time value, which depends on volatility and the days left and needs a pricing model to estimate. Expiration is the one moment the value is certain, which makes it the honest baseline for comparing trades."
  },
  {
    "q": "Is max loss on a short call really unlimited?",
    "a": "In theory, yes: a stock has no ceiling, and a naked short call loses more the higher it goes. In practice brokers require margin and most traders cap the risk by owning the shares (a covered call) or buying a higher strike call (a spread)."
  },
  {
    "q": "Does this handle spreads or multi leg trades?",
    "a": "Not yet. This version models one leg at a time. You can approximate a spread by running each leg and adding the results at the same expiration price."
  },
  {
    "q": "Are commissions and assignment included?",
    "a": "No. Commissions are small at most brokers today but not zero, and early assignment on American style options can change the outcome before expiration. Treat the numbers as the clean case."
  }
];

const DESCRIPTION =
  "Free options profit calculator for calls and puts, long or short. See breakeven, max profit, max loss, and a payoff chart of profit at expiration across stock prices.";

export const metadata: Metadata = {
  title: "Options Profit Calculator",
  description: DESCRIPTION,
  alternates: { canonical: "/options-profit-calculator" },
  openGraph: {
    title: "Options Profit Calculator | FolioStuff",
    description: DESCRIPTION,
    url: "/options-profit-calculator",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <div className="pt-16">
      <ToolJsonLd name="Options Profit Calculator" description={DESCRIPTION} path="/options-profit-calculator" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <Breadcrumb items={[{ label: "Options Profit Calculator", href: "/options-profit-calculator" }]} />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent-gold/[0.15] border border-accent-gold/30 flex items-center justify-center">
            <Activity size={16} className="text-accent-gold" />
          </div>
          <span className="text-xs text-accent-gold uppercase tracking-widest font-semibold">
            Trade
          </span>
        </div>
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight">Options Profit Calculator</h1>
        <p className="text-ink-secondary mt-2 max-w-xl">
          Work out what a call or put makes or loses at expiration. Enter the strike, the premium, and how many contracts, then see the breakeven, the best and worst case, and a payoff chart across stock prices.
        </p>
      </div>

      <OptionsProfitCalculator />
      <ToolInfo sections={INFO_SECTIONS} faqs={INFO_FAQS} className="max-w-3xl" />
      <OtherTools current="/options-profit-calculator" />
    </div>
  );
}
