import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import TickerBar from "@/components/TickerBar";
import { TickerPricesProvider } from "@/context/TickerPricesContext";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = "https://foliostuff.com";

export const metadata: Metadata = {
  title: "FolioStuff - Stock Market Tools",
  description:
    "Portfolio visualizer, cost basis calculator, position sizer, and more. Built for active traders and investors.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "600x600" },
    ],
    apple: { url: "/favicon.png", sizes: "600x600", type: "image/png" },
  },
  openGraph: {
    title: "FolioStuff - Stock Market Tools",
    description:
      "Portfolio visualizer, cost basis calculator, position sizer, and more. Built for active traders and investors.",
    url: BASE_URL,
    siteName: "FolioStuff",
    type: "website",
    locale: "en_US",
    images: [{ url: "/foliostuff-thumbnail.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@itschrisray",
    images: ["/foliostuff-thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-5466YPT0MV" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5466YPT0MV');
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col">
        <TickerPricesProvider>
          <Navbar />
          <TickerBar />
          <main className="flex-1">{children}</main>
        </TickerPricesProvider>
        <footer className="border-t border-white/[0.05] py-6 px-4">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-2">
            <p className="text-[11px] text-ink-muted text-center">
              For informational purposes only. Nothing on this site constitutes financial advice.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span>Made by</span>
              <a href="https://www.itschrisray.com" target="_blank" rel="noopener noreferrer" className="text-ink-secondary hover:text-ink-primary transition-colors">itschrisray.com</a>
              <span>·</span>
              <a href="https://x.com/itschrisray" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-ink-secondary hover:text-ink-primary transition-colors">
                <img src="/twitter.png" alt="X" className="w-3 h-3 opacity-60" />
                @itschrisray
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
