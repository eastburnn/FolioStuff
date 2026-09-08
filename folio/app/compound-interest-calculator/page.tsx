import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import CompoundInterestCalculator from "@/components/widgets/CompoundInterestCalculator";
import Breadcrumb from "@/components/Breadcrumb";
import OtherTools from "@/components/OtherTools";
import ToolJsonLd from "@/components/ToolJsonLd";
import ToolInfo from "@/components/ToolInfo";

const INFO_SECTIONS = [
  {
    "heading": "How the math works",
    "body": [
      "Compound interest means you earn interest on your interest. Each period, the balance grows by the rate, and the next period's growth is calculated on the new, larger balance. Over a few years the effect is modest. Over a few decades it is most of the money.",
      "This calculator compounds at the frequency you choose and adds your monthly contribution at the end of each month. Interest earned is simply the ending balance minus everything you contributed, including the starting amount."
    ]
  },
  {
    "heading": "A quick example",
    "body": [
      "Start with $10,000, add $500 a month, and earn 7% a year compounded monthly. After 20 years you have put in $130,000, but the balance is about $300,000. The other $170,000 is interest, and most of it arrived in the second decade."
    ]
  }
];

const INFO_FAQS = [
  {
    "q": "What rate should I use?",
    "a": "For a savings account, use the rate the bank quotes. For stock market investments, a long run average of 7% after inflation is a common planning number, though real returns swing widely from year to year and nothing is guaranteed."
  },
  {
    "q": "Does compounding frequency matter much?",
    "a": "Less than people expect. At 7% a year, monthly compounding versus annual compounding adds roughly 0.2 percentage points of effective return. The rate, the time, and the contributions matter far more than the frequency."
  },
  {
    "q": "Are taxes and inflation included?",
    "a": "No. The numbers are before taxes and in today's dollars only if you use a rate that already subtracts inflation. For a rough inflation adjusted view, use a rate a few points lower than the nominal return you expect."
  },
  {
    "q": "What is the rule of 72?",
    "a": "A shortcut: divide 72 by the annual rate to estimate how many years it takes money to double. At 7%, about ten years. At 10%, about seven. The calculator does the exact math, but the rule is handy for a quick sense check."
  }
];

const DESCRIPTION =
  "Free compound interest calculator with monthly contributions. See how your savings or investments grow year by year, with a chart of balance versus what you put in.";

export const metadata: Metadata = {
  title: "Compound Interest Calculator",
  description: DESCRIPTION,
  alternates: { canonical: "/compound-interest-calculator" },
  openGraph: {
    title: "Compound Interest Calculator | FolioStuff",
    description: DESCRIPTION,
    url: "/compound-interest-calculator",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <div className="pt-16">
      <ToolJsonLd name="Compound Interest Calculator" description={DESCRIPTION} path="/compound-interest-calculator" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <Breadcrumb items={[{ label: "Compound Interest Calculator", href: "/compound-interest-calculator" }]} />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent-purple/[0.15] border border-accent-purple/30 flex items-center justify-center">
            <TrendingUp size={16} className="text-accent-purple" />
          </div>
          <span className="text-xs text-accent-purple uppercase tracking-widest font-semibold">
            Grow
          </span>
        </div>
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight">Compound Interest Calculator</h1>
        <p className="text-ink-secondary mt-2 max-w-xl">
          See what a starting amount plus regular contributions turns into over time. Pick the rate and how often it compounds, and watch the chart separate your money from the interest it earned.
        </p>
      </div>

      <CompoundInterestCalculator />
      <ToolInfo sections={INFO_SECTIONS} faqs={INFO_FAQS} className="max-w-3xl" />
      <OtherTools current="/compound-interest-calculator" />
    </div>
  );
}
