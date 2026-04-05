import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import CostBasisCalculator from "@/components/widgets/CostBasisCalculator";
import Breadcrumb from "@/components/Breadcrumb";
import OtherTools from "@/components/OtherTools";

export const metadata: Metadata = {
  title: "Cost Basis Calculator — Folio",
  description:
    "Calculate how adding to or trimming a position changes your average cost per share.",
};

export default function CostBasisPage() {
  return (
    <div className="pt-20">
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
      <OtherTools current="/cost-basis" />
    </div>
  );
}
