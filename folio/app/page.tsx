import { PieChart, Calculator, Target, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import WidgetCard from "@/components/WidgetCard";
import HeroWordmark from "@/components/HeroWordmark";
import ListingCard from "@/components/directory/ListingCard";
import FeaturedListingCard from "@/components/directory/FeaturedListingCard";
import { getPublishedListings, getFeaturedListings } from "@/lib/listings";
import { safeJsonLd } from "@/lib/json-ld";

export const revalidate = 300;

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FolioStuff",
  url: "https://www.foliostuff.com",
  description:
    "Portfolio visualizer, cost basis calculator, position sizer, and more. Built for active traders and investors.",
};

const WIDGETS = [
  {
    href: "/portfolio-visualizer",
    title: "Portfolio Visualizer",
    description:
      "Plug in your tickers and allocations, get a clean chart you can actually screenshot and share without it looking terrible.",
    icon: <PieChart size={20} className="text-accent-purple" />,
    accent: "#8B5CF6",
    tag: "Visualize",
  },
  {
    href: "/cost-basis",
    title: "Cost Basis Calculator",
    description:
      "Buying more? Selling some? See exactly what it does to your average cost before you do it.",
    icon: <Calculator size={20} className="text-accent-green" />,
    accent: "#00C896",
    tag: "Calculate",
  },
  {
    href: "/position-sizer",
    title: "Position Sizer",
    description:
      "Tell it how much you're willing to lose, where you're getting in, and where you're bailing. It tells you exactly how many shares to buy.",
    icon: <Target size={20} className="text-accent-gold" />,
    accent: "#FFB830",
    tag: "Risk Manage",
  },
];

const OTHER_STUFF = [
  {
    href: "https://www.howmanytradingdays.com",
    name: "How Many Trading Days",
    description:
      "Instantly see how many trading days are left in the year, whether the market is open, and every U.S. market holiday. All live, always accurate, and free.",
    accent: "#8B5CF6",
    logo: "/howmanytradingdays.png",
  },
];

const EXTERNAL_TOOLS = [
  {
    href: "https://www.tradingview.com/?aff_id=165315",
    name: "TradingView",
    description: "Advanced charting, real-time data, and trade ideas",
    accent: "#2962FF",
    logo: "/tradingview.png",
  },
  {
    href: "https://fiscal.ai/?via=welcome",
    name: "FiscalAI",
    description: "AI-powered financial research and earnings analysis",
    accent: "#FF6B6B",
    logo: "/fiscalai.png",
  },
  {
    href: "https://edition.cnn.com/markets/fear-and-greed",
    name: "Fear & Greed Index",
    description: "CNN's market sentiment indicator, from extreme fear to greed",
    accent: "#FF6B6B",
    logo: "/fearandgreed.png",
  },
];

export default async function Home() {
  const [communityListings, featuredListings] = await Promise.all([
    getPublishedListings(6),
    getFeaturedListings(),
  ]);

  return (
    <div className="grid-bg hero-glow min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(WEBSITE_JSON_LD) }}
      />
      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 text-center">
        <HeroWordmark />

        <p className="text-base sm:text-lg text-ink-secondary max-w-lg mx-auto leading-relaxed">
          Tools for traders, investors, and stock market enthusiasts.
        </p>
      </section>

      {/* Widget cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-6">
          The tools
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {WIDGETS.map((w, i) => (
            <WidgetCard key={w.href} {...w} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* Our other stuff */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="border-t border-white/[0.06] pt-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-6">
            Featured stuff
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {OTHER_STUFF.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-5 p-6 rounded-2xl border border-white/[0.07] bg-bg-card hover:border-white/[0.16] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden">
                  <Image
                    src={item.logo}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <p className="text-base font-semibold text-ink-primary group-hover:text-white transition-colors">
                    {item.name}
                  </p>
                  <p className="text-sm text-ink-secondary leading-relaxed mt-1.5">
                    {item.description}
                  </p>
                  <span
                    style={{ color: item.accent }}
                    className="flex items-center gap-1.5 mt-4 text-xs font-semibold uppercase tracking-widest"
                  >
                    Visit site
                    <ExternalLink
                      size={12}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </a>
            ))}
            {featuredListings.map((listing) => (
              <FeaturedListingCard key={listing.slug} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* Community directory */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="border-t border-white/[0.06] pt-12">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h2 className="text-xs text-ink-muted uppercase tracking-widest">
              From the community
            </h2>
            <Link
              href="/submit"
              className="group inline-flex items-center gap-1.5 rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] hover:border-accent-purple/60 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] transition-all duration-200 px-4 py-2 text-xs font-semibold text-accent-purple"
            >
              Submit your tool
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          {communityListings.length === 0 ? (
            <p className="text-sm text-ink-muted">
              A hand-reviewed directory of investing and finance tools built by indie makers.
              Built something?{" "}
              <Link href="/submit" className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
                Be the first listing.
              </Link>
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {communityListings.map((listing) => (
                  <ListingCard key={listing.slug} listing={listing} />
                ))}
              </div>
              <Link
                href="/directory"
                className="inline-block mt-6 text-xs font-semibold uppercase tracking-widest text-ink-secondary hover:text-ink-primary transition-colors"
              >
                Browse the full directory →
              </Link>
            </>
          )}
        </div>
      </section>

      {/* External tools */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-32">
        <div className="border-t border-white/[0.06] pt-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-6">
            Good stuff around the web
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXTERNAL_TOOLS.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3.5 p-4 rounded-xl border border-white/[0.06] bg-bg-card/60 hover:border-white/[0.12] hover:bg-bg-card transition-all duration-200"
              >
                <div
                  style={tool.logo ? undefined : { background: `${tool.accent}18`, borderColor: `${tool.accent}28` }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 overflow-hidden${tool.logo ? "" : " border"}`}
                >
                  {tool.logo
                    ? <Image src={tool.logo} alt={tool.name} width={32} height={32} className="w-full h-full object-cover" />
                    : <ExternalLink size={13} style={{ color: tool.accent }} />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-primary group-hover:text-white transition-colors">
                    {tool.name}
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
