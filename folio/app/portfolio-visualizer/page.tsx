import type { Metadata } from "next";
import { PieChart } from "lucide-react";
import PortfolioVisualizer from "@/components/widgets/PortfolioVisualizer";
import Breadcrumb from "@/components/Breadcrumb";
import OtherTools from "@/components/OtherTools";

const BASE_URL = "https://www.foliostuff.com";

export const metadata: Metadata = {
  title: "Portfolio Visualizer | FolioStuff",
  description:
    "Build a shareable portfolio chart. Input your tickers and allocations, then download a beautiful PNG card for Twitter.",
  alternates: { canonical: `${BASE_URL}/portfolio-visualizer` },
  openGraph: {
    title: "Portfolio Visualizer | FolioStuff",
    description:
      "Build a shareable portfolio chart. Input your tickers and allocations, then download a beautiful PNG card for Twitter.",
    url: `${BASE_URL}/portfolio-visualizer`,
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.png", width: 1200, height: 630 }],
  },
};

export default function PortfolioVisualizerPage() {
  return (
    <div className="pt-24">
      {/* Page header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <Breadcrumb items={[{ label: "Portfolio Visualizer", href: "/portfolio-visualizer" }]} />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-accent-purple/[0.15] border border-accent-purple/30 flex items-center justify-center">
            <PieChart size={16} className="text-accent-purple" />
          </div>
          <span className="text-xs text-accent-purple uppercase tracking-widest font-semibold">
            Visualize
          </span>
        </div>
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight">
          Portfolio Visualizer
        </h1>
        <p className="text-ink-secondary mt-2 max-w-xl">
          Add your tickers and percentage allocations to generate a clean, shareable donut chart.
          Hit download for a retina-ready PNG, perfect for Twitter/X.
        </p>
      </div>

      <PortfolioVisualizer />
      <OtherTools current="/portfolio-visualizer" />
    </div>
  );
}
