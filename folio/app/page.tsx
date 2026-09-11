import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import WidgetCard from "@/components/WidgetCard";
import HeroWordmark from "@/components/HeroWordmark";
import ListingCard from "@/components/directory/ListingCard";
import FeaturedListingCard from "@/components/directory/FeaturedListingCard";
import HeroSearch from "@/components/directory/HeroSearch";
import BookmarkButton from "@/components/directory/BookmarkButton";
import { OWN_TOOLS } from "@/components/OwnTools";
import { getPublishedListings, getFeaturedListings } from "@/lib/listings";
import { safeJsonLd } from "@/lib/json-ld";

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FolioStuff",
  url: "https://www.foliostuff.com",
  description:
    "A hand-reviewed directory of stock market, investing, and personal finance sites, built by people who understand the problems they solve. Plus our own calculators, free to use with no account.",
};



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
  {
    href: "https://finviz.com/map",
    name: "S&P 500 Heat Map",
    description: "Finviz's map of the market, sized by market cap and colored by the day's move",
    accent: "#55AEF9",
    logo: "/finviz.jpg",
  },
];

export default async function Home() {
  const [allListings, featuredListings] = await Promise.all([
    getPublishedListings(),
    getFeaturedListings(),
  ]);
  const communityListings = allListings.slice(0, 6);
  const searchTools = allListings.map((l) => ({ name: l.name, slug: l.slug }));
  const searchTags = [...new Set(allListings.flatMap((l) => l.tags))].sort();

  return (
    <div className="grid-bg hero-glow min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(WEBSITE_JSON_LD) }}
      />
      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 text-center">
        <HeroWordmark />
        {/* Tucked under the wordmark so it reads as part of it. */}
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-ink-muted mb-6 sm:mb-7">
          Useful tools for managing your money
        </p>
        <HeroSearch ownTools={OWN_TOOLS.map((w) => ({ name: w.title, href: w.href, keywords: w.keywords }))} tools={searchTools} tags={searchTags} />
      </section>

      {/* Widget cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4 sm:mb-6">
          The tools
        </h2>
        {/* Phones: a swipeable row with the next card peeking in from the
            right and a fade over the edge. Wider screens: the usual grid. */}
        <div className="relative -mx-4 sm:mx-0">
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-none px-4 sm:px-0 pb-1 sm:pb-0">
            {OWN_TOOLS.map((w, i) => (
              <div key={w.href} className="relative flex snap-start shrink-0 w-[80%] sm:w-auto sm:shrink">
                <WidgetCard {...w} delay={i * 80} />
                <BookmarkButton kind="tool" refId={w.href} className="absolute top-3 right-3" />
              </div>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="sm:hidden pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-bg-surface via-bg-surface/60 to-transparent"
          />
        </div>
        <Link
          href="/tools"
          className="inline-block mt-6 text-xs font-semibold uppercase tracking-widest text-ink-secondary hover:text-ink-primary transition-colors"
        >
          Browse all tools →
        </Link>
      </section>

      {/* Featured listings, chosen in the admin directory */}
      {featuredListings.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
          <div className="border-t border-white/[0.06] pt-12">
            <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-6">
              Featured stuff
            </h2>
            <div className="grid sm:grid-cols-2 auto-rows-fr gap-6">
              {featuredListings.map((listing) => (
                <div key={listing.slug} className="relative">
                  <FeaturedListingCard listing={listing} />
                  <BookmarkButton kind="listing" refId={listing.slug} className="absolute top-3 right-3" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
              Submit your site
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          {communityListings.length === 0 ? (
            <p className="text-sm text-ink-muted">
              A hand-reviewed directory of genuinely useful investing and finance sites.
              Built something?{" "}
              <Link href="/submit" className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
                Be the first listing.
              </Link>
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 auto-rows-fr gap-4">
                {communityListings.map((listing) => (
                  <div key={listing.slug} className="relative">
                    <ListingCard listing={listing} />
                    <BookmarkButton kind="listing" refId={listing.slug} className="absolute top-3 right-3" />
                  </div>
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
          {/* Phones: two square tiles per row; wider screens keep the row layout. */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {EXTERNAL_TOOLS.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3.5 p-3.5 sm:p-4 rounded-xl border border-white/[0.06] bg-bg-card/60 hover:border-white/[0.12] hover:bg-bg-card transition-all duration-200"
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
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-primary group-hover:text-white transition-colors">
                    {tool.name}
                  </p>
                  <p className="text-[11px] sm:text-xs text-ink-muted leading-relaxed mt-0.5 line-clamp-3 sm:line-clamp-none min-h-[3.4rem] sm:min-h-0">
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
