import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = "https://www.foliostuff.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "FolioStuff - Stock Market Tools",
    template: "%s | FolioStuff",
  },
  description:
    "Portfolio visualizer, cost basis calculator, position sizer, and more. Built for active traders and investors.",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "600x600" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "FolioStuff - Stock Market Tools",
    description:
      "Portfolio visualizer, cost basis calculator, position sizer, and more. Built for active traders and investors.",
    url: "/",
    siteName: "FolioStuff",
    type: "website",
    locale: "en_US",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@itschrisray",
    images: ["/foliostuff-thumbnail.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-5466YPT0MV" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5466YPT0MV');
          `}
        </Script>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/[0.05] py-6 px-4">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-2">
            <p className="text-[11px] text-ink-muted text-center">
              For informational purposes only. Nothing on this site constitutes financial advice.
            </p>
            <p className="text-[11px] text-ink-muted text-center">
              Some links on this site are affiliate links. We may earn a commission if you sign up
              through them, at no extra cost to you.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span>Made by</span>
              <a href="https://www.itschrisray.com" target="_blank" rel="noopener noreferrer" className="text-ink-secondary hover:text-ink-primary transition-colors">itschrisray.com</a>
              <span>·</span>
              <a href="https://x.com/itschrisray" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-ink-secondary hover:text-ink-primary transition-colors">
                <Image src="/twitter.png" alt="X" width={12} height={12} className="w-3 h-3 opacity-60" />
                @itschrisray
              </a>
              <span>·</span>
              <Link href="/privacy" className="text-ink-secondary hover:text-ink-primary transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
