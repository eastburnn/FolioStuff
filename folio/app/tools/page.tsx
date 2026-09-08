import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import ToolsGrid from "@/components/ToolsGrid";

const DESCRIPTION =
  "Free calculators for investors and anyone managing money: compound interest, dividends with DRIP, options profit, cost basis, position sizing, and a portfolio visualizer. No account needed.";

export const metadata: Metadata = {
  title: "Tools",
  description: DESCRIPTION,
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Tools | FolioStuff",
    description: DESCRIPTION,
    url: "/tools",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

export default function ToolsPage() {
  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb items={[{ label: "Tools", href: "/tools" }]} />

        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">Tools</h1>
        <p className="text-ink-secondary leading-relaxed mb-10 max-w-2xl">
          Calculators we built ourselves. Every one runs in your browser, works on a phone, and
          needs no account. Your numbers never leave your device.
        </p>

        <ToolsGrid />

        <p className="text-xs text-ink-muted mt-12">
          Looking for tools made by other people? Browse the{" "}
          <Link href="/directory" className="underline underline-offset-2 hover:text-ink-secondary">
            directory
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
