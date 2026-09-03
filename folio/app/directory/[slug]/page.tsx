import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { getPublishedListing, getListingOwnerId } from "@/lib/listings";
import { getProfileById } from "@/lib/profiles";
import { publicImageUrl } from "@/lib/supabase/config";
import { safeJsonLd } from "@/lib/json-ld";
import { SOCIAL_PLATFORMS } from "@/lib/socials";
import ScreenshotGallery from "@/components/directory/ScreenshotGallery";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublishedListing(slug);
  if (!listing) return { title: "Not Found" };

  const description = listing.tagline;
  return {
    title: listing.name,
    description,
    alternates: { canonical: `/directory/${slug}` },
    openGraph: {
      title: `${listing.name} | FolioStuff Directory`,
      description,
      url: `/directory/${slug}`,
      siteName: "FolioStuff",
      type: "website",
      images: listing.icon_path
        ? [{ url: publicImageUrl(listing.icon_path) }]
        : [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getPublishedListing(slug);
  if (!listing) notFound();

  const ownerId = await getListingOwnerId(slug);
  const makerProfile = ownerId ? await getProfileById(ownerId) : null;
  const makerPageUrl = makerProfile?.username ? `/makers/${makerProfile.username}` : null;
  const socialLinks = SOCIAL_PLATFORMS.filter((p) => listing.socials[p.key]).map((p) => ({
    key: p.key,
    label: p.label,
    href: listing.socials[p.key]!,
  }));
  let hostname = "";
  try {
    hostname = new URL(listing.url).hostname.replace(/^www\./, "");
  } catch {
    hostname = "";
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: listing.name,
    description: listing.tagline,
    url: listing.url,
    applicationCategory: "FinanceApplication",
    keywords: listing.tags.join(", "),
    author: { "@type": "Person", name: listing.maker_name },
  };

  return (
    <div className="pt-16 grid-bg min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb
          items={[
            { label: "Directory", href: "/directory" },
            { label: listing.name, href: `/directory/${slug}` },
          ]}
        />

        {/* Icon beside the name and tags, tagline full width beneath, then
            the visit button with the site's domain and any social links. */}
        <div className="mb-8">
          <div className="flex items-center gap-3.5 sm:gap-5 mb-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 overflow-hidden bg-white/[0.06]">
              {listing.icon_path && (
                <Image
                  src={publicImageUrl(listing.icon_path)}
                  alt={listing.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-ink-primary tracking-tight leading-tight">
                {listing.name}
              </h1>
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {listing.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/directory?tag=${encodeURIComponent(tag)}`}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-muted hover:text-ink-primary hover:border-white/[0.2] transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-ink-secondary leading-relaxed mb-5">{listing.tagline}</p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <a
              href={listing.url}
              target="_blank"
              rel="noopener"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-accent-purple text-white hover:bg-accent-purple/90 shadow-[0_0_28px_rgba(139,92,246,0.3)] hover:shadow-[0_0_36px_rgba(139,92,246,0.45)] transition-all duration-200 px-5 py-3 text-sm font-semibold w-full sm:w-auto"
            >
              <span>Visit {listing.name}</span>
              {hostname && <span className="text-white/70 font-normal hidden sm:inline">{hostname}</span>}
              <ExternalLink size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            {socialLinks.length > 0 && (
              <p className="text-xs text-ink-muted flex items-center gap-3 flex-wrap">
                <span>Follow:</span>
                {socialLinks.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-ink-secondary hover:text-ink-primary underline underline-offset-2"
                  >
                    {s.label}
                  </a>
                ))}
              </p>
            )}
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">About</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6">
            <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>
        </section>

        {listing.screenshot_paths.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Screenshots</h2>
            <ScreenshotGallery
              shots={listing.screenshot_paths.map((path, i) => ({
                src: publicImageUrl(path),
                alt: `${listing.name} screenshot ${i + 1}`,
              }))}
            />
          </section>
        )}

        <section>
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Maker</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 text-sm text-ink-secondary">
            <p>
              Built by{" "}
              {makerPageUrl ? (
                <Link href={makerPageUrl} className="text-ink-primary font-medium hover:text-white underline underline-offset-2">
                  {listing.maker_name}
                </Link>
              ) : (
                <span className="text-ink-primary font-medium">{listing.maker_name}</span>
              )}
              {listing.maker_x_handle && (
                <>
                  {" "}·{" "}
                  <a
                    href={`https://x.com/${listing.maker_x_handle}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-ink-primary hover:text-white underline underline-offset-2"
                  >
                    @{listing.maker_x_handle}
                  </a>
                </>
              )}
            </p>
          </div>
        </section>

        <p className="text-xs text-ink-muted mt-10">
          Listed in the{" "}
          <Link href="/directory" className="underline underline-offset-2 hover:text-ink-secondary">
            FolioStuff indie tool directory
          </Link>
          . Built something yourself?{" "}
          <Link href="/submit" className="underline underline-offset-2 hover:text-ink-secondary">
            Submit it.
          </Link>
        </p>
      </div>
    </div>
  );
}
