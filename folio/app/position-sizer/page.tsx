import type { Metadata } from "next";
import { Target } from "lucide-react";
import PositionSizer from "@/components/widgets/PositionSizer";
import Breadcrumb from "@/components/Breadcrumb";
import OtherTools from "@/components/OtherTools";
import ToolJsonLd from "@/components/ToolJsonLd";
import ToolInfo from "@/components/ToolInfo";

const INFO_SECTIONS = [
  {
    heading: "How the math works",
    body: [
      "Position sizing starts from one question: how much are you willing to lose if this trade fails? The calculator multiplies your account size by your risk percentage to get that dollar amount. Then it looks at the distance between your entry and your stop loss, which is your risk per share. Divide the dollar risk by the risk per share and you have your share count.",
      "Add a target price and it also shows your potential reward and the risk to reward ratio, so you can judge whether the trade pays enough to be worth taking in the first place.",
    ],
  },
  {
    heading: "A quick example",
    body: [
      "Take a $20,000 account risking 1% per trade, which is $200. You want in at $40 with a stop at $38, so you are risking $2 per share. That gives you 100 shares and a $4,000 position. If the stop hits, you lose $200 and the account lives to trade another day.",
    ],
  },
];

const INFO_FAQS = [
  {
    q: "What percentage of my account should I risk per trade?",
    a: "Many traders keep it between 0.5% and 2%, and the calculator flags anything above 2% as high. Small numbers keep a losing streak survivable. Ten straight losses at 1% leaves you down roughly 10%. At 5% per trade, the same streak costs you about 40% of the account.",
  },
  {
    q: "Why does a tighter stop let me buy more shares?",
    a: "A tighter stop means less risk per share, so the same dollar risk spreads across more shares. That is not a reason to tuck your stop right under your entry, though. A stop that is too tight gets hit by ordinary noise, and you lose your full risk amount on a trade that might have worked with more room.",
  },
  {
    q: "Does this work for short positions?",
    a: "Yes. Put your stop above your entry and the math is identical. The calculator uses the distance between the two prices regardless of trade direction.",
  },
  {
    q: "What if the position costs more than I have in my account?",
    a: "That happens with tight stops. The share count controls your risk, not your buying power. If the position value is bigger than the cash you can deploy, cap the size at what you can actually buy and know that your real dollar risk lands below your set amount.",
  },
];

export const metadata: Metadata = {
  title: "Position Size Calculator for Stocks",
  description:
    "Free risk-based position size calculator. Know exactly how many shares to buy based on your account size, entry, stop loss, and max risk tolerance.",
  alternates: { canonical: "/position-sizer" },
  openGraph: {
    title: "Position Size Calculator for Stocks | FolioStuff",
    description:
      "Free risk-based position size calculator. Know exactly how many shares to buy based on your account size, entry, stop loss, and max risk tolerance.",
    url: "/position-sizer",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

export default function PositionSizerPage() {
  return (
    <div className="pt-16">
      <ToolJsonLd
        name="Position Sizer"
        description="Free risk-based position size calculator. Know exactly how many shares to buy based on your account size, entry, stop loss, and max risk tolerance."
        path="/position-sizer"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <Breadcrumb items={[{ label: "Position Sizer", href: "/position-sizer" }]} />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent-gold/[0.15] border border-accent-gold/30 flex items-center justify-center">
            <Target size={16} className="text-accent-gold" />
          </div>
          <span className="text-xs text-accent-gold uppercase tracking-widest font-semibold">
            Risk Manage
          </span>
        </div>
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight">
          Position Sizer
        </h1>
        <p className="text-ink-secondary mt-2 max-w-xl">
          Never risk more than you intend to. Enter your account size, risk percentage, entry
          price, and stop loss. Instantly see the exact number of shares to buy and your full
          risk/reward breakdown.
        </p>
      </div>

      <PositionSizer />
      <ToolInfo sections={INFO_SECTIONS} faqs={INFO_FAQS} className="max-w-4xl" />
      <OtherTools current="/position-sizer" />
    </div>
  );
}
