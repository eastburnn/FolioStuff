import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Script from "next/script";
import { headers } from "next/headers";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Content Security Policy nonce for this request, from the middleware.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  // Temporary diagnostic: which request headers survive the edge on Vercel.
  const h = await headers();
  const seen = ["x-nonce", "content-security-policy", "content-security-policy-report-only"].map((n) => `${n}=[${(h.get(n) ?? "").slice(0, 70)}]`).join(" | ");
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col" data-hdr={seen}>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-5466YPT0MV" strategy="afterInteractive" nonce={nonce} />
        <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5466YPT0MV');
          `}
        </Script>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
