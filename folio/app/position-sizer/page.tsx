import type { Metadata } from "next";
import { Target } from "lucide-react";
import PositionSizer from "@/components/widgets/PositionSizer";
import Breadcrumb from "@/components/Breadcrumb";
import OtherTools from "@/components/OtherTools";

const BASE_URL = "https://www.foliostuff.com";

export const metadata: Metadata = {
  title: "Position Sizer | FolioStuff",
  description:
    "Risk-based position sizing calculator. Know exactly how many shares to buy based on your account size and max risk tolerance.",
  alternates: { canonical: `${BASE_URL}/position-sizer` },
  openGraph: {
    title: "Position Sizer | FolioStuff",
    description:
      "Risk-based position sizing calculator. Know exactly how many shares to buy based on your account size and max risk tolerance.",
    url: `${BASE_URL}/position-sizer`,
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.png", width: 1200, height: 630 }],
  },
};

export default function PositionSizerPage() {
  return (
    <div className="pt-24">
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
      <OtherTools current="/position-sizer" />
    </div>
  );
}
