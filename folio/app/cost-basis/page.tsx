import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import CostBasisCalculator from "@/components/widgets/CostBasisCalculator";
import Breadcrumb from "@/components/Breadcrumb";
import OtherTools from "@/components/OtherTools";
import ToolJsonLd from "@/components/ToolJsonLd";
import ToolInfo from "@/components/ToolInfo";

const INFO_SECTIONS = [
  {
    heading: "How the math works",
    body: [
      "Your average cost is total dollars invested divided by total shares held. When you buy more, the calculator adds the new dollars and shares to what you already own and recalculates. Buying below your average pulls it down, buying above pushes it up.",
      "Selling works differently. Trimming shares does not move the average cost of what you keep. Instead, the shares you sell lock in a gain or loss against what you paid for them, and the calculator shows that realized P&L next to the cost basis of your remaining position. If you sold a specific lot rather than at your average, enter that lot's cost and the math adjusts.",
    ],
  },
  {
    heading: "A quick example",
    body: [
      "Say you hold 100 shares at a $50 average, so $5,000 invested. The stock drops to $35 and you buy 50 more for $1,750. You now own 150 shares with $6,750 in, which works out to a $45 average. The stock only has to climb back to $45 for you to break even, not $50.",
    ],
  },
];

const INFO_FAQS = [
  {
    q: "Does selling shares change my average cost?",
    a: "No. Selling locks in a gain or loss on the shares you sell, but the average cost of the shares you keep stays the same. What shrinks is your total cost basis, since fewer shares remain.",
  },
  {
    q: "Is this the method my broker uses for taxes?",
    a: "Not necessarily. Brokers commonly default to FIFO for stocks, meaning your oldest shares sell first, and many let you pick specific lots. This tool uses the average cost method to show you the math of a position. For actual tax reporting, go by the lot accounting on your broker statement.",
  },
  {
    q: "Should I average down?",
    a: "That depends on the stock, and it is your call to make. Averaging down lowers your break even point, but it also puts more money into a position that is moving against you. The calculator shows you exactly what a buy does to your numbers before you place it, so at least the decision is an informed one.",
  },
  {
    q: "Do reinvested dividends count?",
    a: "Yes. Each reinvestment is a new purchase at that day's price, so it adds shares and nudges your average cost. Enter it like any other buy.",
  },
];

export const metadata: Metadata = {
  title: "Stock Average Cost Basis Calculator",
  description:
    "Free stock average cost basis calculator. See how adding to or trimming a position changes your average cost per share and realized P&L.",
  alternates: { canonical: "/cost-basis" },
  openGraph: {
    title: "Stock Average Cost Basis Calculator | FolioStuff",
    description:
      "Free stock average cost basis calculator. See how adding to or trimming a position changes your average cost per share and realized P&L.",
    url: "/cost-basis",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

export default function CostBasisPage() {
  return (
    <div className="pt-16">
      <ToolJsonLd
        name="Cost Basis Calculator"
        description="Free stock average cost basis calculator. See how adding to or trimming a position changes your average cost per share and realized P&L."
        path="/cost-basis"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <Breadcrumb items={[{ label: "Cost Basis Calculator", href: "/cost-basis" }]} />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent-green/[0.15] border border-accent-green/30 flex items-center justify-center">
            <Calculator size={16} className="text-accent-green" />
          </div>
          <span className="text-xs text-accent-green uppercase tracking-widest font-semibold">
            Calculate
          </span>
        </div>
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight">
          Cost Basis Calculator
        </h1>
        <p className="text-ink-secondary mt-2 max-w-xl">
          See how buying more shares changes your average cost, or how selling shares affects your
          realized P&L and remaining cost basis. Supports averaging down, averaging up, and trimming.
        </p>
      </div>

      <CostBasisCalculator />
      <ToolInfo sections={INFO_SECTIONS} faqs={INFO_FAQS} className="max-w-3xl" />
      <OtherTools current="/cost-basis" />
    </div>
  );
}
