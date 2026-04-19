import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import TickerBarContent from "./TickerBarContent";

const BASE_URL = "https://foliostuff.com";

export const metadata: Metadata = {
  title: "Ticker Bar | FolioStuff",
  description:
    "Vote for the stocks you want to see on the FolioStuff live ticker bar. View today's leaderboard, trending tickers, and community voting stats.",
  openGraph: {
    title: "Ticker Bar | FolioStuff",
    description:
      "Vote for the stocks you want to see on the FolioStuff live ticker bar. View today's leaderboard, trending tickers, and community voting stats.",
    url: `${BASE_URL}/ticker-bar`,
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.png", width: 1200, height: 630 }],
  },
};

export default function TickerBarPage() {
  return (
    <div className="pt-24 grid-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <Breadcrumb items={[{ label: "Ticker Bar", href: "/ticker-bar" }]} />
      </div>
      <TickerBarContent />
    </div>
  );
}
