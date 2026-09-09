import type { Metadata } from "next";
import { Coins } from "lucide-react";
import DividendCalculator from "@/components/widgets/DividendCalculator";
import Breadcrumb from "@/components/Breadcrumb";
import OtherTools from "@/components/OtherTools";
import ToolJsonLd from "@/components/ToolJsonLd";
import ToolInfo from "@/components/ToolInfo";
import BookmarkButton from "@/components/directory/BookmarkButton";

const INFO_SECTIONS = [
  {
    "heading": "How the math works",
    "body": [
      "Each payout is the dividend per share times the shares you hold. With reinvesting turned on, that cash buys more shares at the current price, so the next payout is a little bigger. Turned off, the cash is counted as income and the share count only changes when you add money.",
      "The dividend per share rises once a year by the growth rate you set, and the share price drifts every period by the price growth rate. Yield on cost is your final year's income divided by everything you invested, which is why long held dividend growers can end up yielding far more on the original money than the headline yield suggests."
    ]
  },
  {
    "heading": "What DRIP means",
    "body": [
      "DRIP stands for dividend reinvestment plan. Instead of receiving dividends as cash, they automatically buy more shares, often fractional ones, with no commission. Most brokers let you switch it on per holding. The calculator's reinvest option models exactly that, and the chart shows the gap it opens up against taking the cash."
    ]
  }
];

const INFO_FAQS = [
  {
    "q": "Where do I find the dividend yield?",
    "a": "Any quote page lists it. It is the annual dividend per share divided by the share price. If you know the dividend per share instead, divide it by the price and enter the result as a percentage."
  },
  {
    "q": "Is reinvesting always better?",
    "a": "For growing the position, yes, since reinvested dividends compound. If you need the income to live on, taking cash is the point. Many people reinvest while working and switch to cash in retirement."
  },
  {
    "q": "Are dividends taxed when reinvested?",
    "a": "In a taxable account, yes. Reinvested dividends are taxed the same year as cash dividends. Inside a retirement account they are not taxed until withdrawal, or not at all in a Roth. The calculator does not subtract taxes."
  },
  {
    "q": "What are realistic growth numbers?",
    "a": "Established dividend growers often raise payouts 5% to 8% a year, and share prices tend to follow earnings over long periods. Higher yields usually come with slower growth. Try a few combinations rather than trusting one set of assumptions."
  }
];

const DESCRIPTION =
  "Free dividend calculator with DRIP. Project your annual dividend income, total dividends collected, and portfolio value with dividends reinvested or taken as cash.";

export const metadata: Metadata = {
  title: "Dividend Calculator with DRIP Reinvestment",
  description: DESCRIPTION,
  alternates: { canonical: "/dividend-calculator" },
  openGraph: {
    title: "Dividend Calculator with DRIP Reinvestment | FolioStuff",
    description: DESCRIPTION,
    url: "/dividend-calculator",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <div className="pt-16">
      <ToolJsonLd name="Dividend Calculator" description={DESCRIPTION} path="/dividend-calculator" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <Breadcrumb items={[{ label: "Dividend Calculator", href: "/dividend-calculator" }]} />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent-green/[0.15] border border-accent-green/30 flex items-center justify-center">
            <Coins size={16} className="text-accent-green" />
          </div>
          <span className="text-xs text-accent-green uppercase tracking-widest font-semibold">
            Investing
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-ink-primary tracking-tight">Dividend Calculator</h1>
          <BookmarkButton kind="tool" refId="/dividend-calculator" withLabel className="mt-1 shrink-0" />
        </div>
        <p className="text-ink-secondary mt-2 max-w-xl">
          Project what a dividend stock or fund pays you over time. Switch between reinvesting dividends (DRIP) and taking them as cash, add dividend growth, and see how the income compounds year by year.
        </p>
      </div>

      <DividendCalculator />
      <ToolInfo sections={INFO_SECTIONS} faqs={INFO_FAQS} className="max-w-3xl" />
      <OtherTools current="/dividend-calculator" />
    </div>
  );
}
