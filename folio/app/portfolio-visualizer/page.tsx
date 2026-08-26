import type { Metadata } from "next";
import { PieChart } from "lucide-react";
import PortfolioVisualizer from "@/components/widgets/PortfolioVisualizer";
import Breadcrumb from "@/components/Breadcrumb";
import OtherTools from "@/components/OtherTools";
import ToolJsonLd from "@/components/ToolJsonLd";
import ToolInfo from "@/components/ToolInfo";

const INFO_SECTIONS = [
  {
    heading: "How it works",
    body: [
      "Add each ticker and the percentage it takes up in your portfolio. The donut chart updates live as you type, with a color assigned to every holding. If your numbers do not land exactly on 100, you can fill whatever is left over with a Cash slice in one click.",
      "When it looks right, hit download. The card exports as a PNG at double resolution, so it stays sharp on retina screens and does not turn to mush when a feed compresses it.",
    ],
  },
];

const INFO_FAQS = [
  {
    q: "Is my portfolio data saved anywhere?",
    a: "No. The whole tool runs in your browser. Your holdings are never uploaded or stored, and nothing you type leaves the page.",
  },
  {
    q: "Do my allocations have to add up to exactly 100%?",
    a: "No. The chart sizes each slice relative to your total, so the proportions always come out right. If you want a clean 100, there is a shortcut that drops the remainder into a Cash slice.",
  },
  {
    q: "Can I add ETFs, crypto, or cash?",
    a: "Yes. Tickers are free text, so anything with a symbol works, along with labels like Cash or Bonds. If it has a name and a percentage, it can go on the chart.",
  },
  {
    q: "What am I actually downloading?",
    a: "A PNG of the share card rendered at twice its on-screen size. It is sized and styled to hold up well when posted on X, but it works anywhere you can attach an image.",
  },
];

export const metadata: Metadata = {
  title: "Portfolio Visualizer",
  description:
    "Build a shareable portfolio chart. Input your tickers and allocations, then download a beautiful PNG card for Twitter.",
  alternates: { canonical: "/portfolio-visualizer" },
  openGraph: {
    title: "Portfolio Visualizer | FolioStuff",
    description:
      "Build a shareable portfolio chart. Input your tickers and allocations, then download a beautiful PNG card for Twitter.",
    url: "/portfolio-visualizer",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

export default function PortfolioVisualizerPage() {
  return (
    <div className="pt-16">
      <ToolJsonLd
        name="Portfolio Visualizer"
        description="Build a shareable portfolio chart. Input your tickers and allocations, then download a beautiful PNG card for Twitter."
        path="/portfolio-visualizer"
      />
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
      <ToolInfo sections={INFO_SECTIONS} faqs={INFO_FAQS} className="max-w-5xl" />
      <OtherTools current="/portfolio-visualizer" />
    </div>
  );
}
