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
    alternates: { canonical: `/tools/${slug}` },
    openGraph: {
      title: `${listing.name} | FolioStuff Directory`,
      description,
      url: `/tools/${slug}`,
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
            { label: "Directory", href: "/tools" },
            { label: listing.name, href: `/tools/${slug}` },
          ]}
        />

        <div className="flex items-start gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl shrink-0 overflow-hidden bg-white/[0.06]">
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
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl font-bold text-ink-primary tracking-tight">
                {listing.name}
              </h1>
              {listing.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tools?tag=${encodeURIComponent(tag)}`}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/[0.1] text-ink-muted hover:text-ink-primary hover:border-white/[0.2] transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
            <p className="text-ink-secondary">{listing.tagline}</p>
          </div>
        </div>

        <a
          href={listing.url}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-xl bg-white/[0.09] border border-white/[0.12] hover:bg-white/[0.14] transition-colors px-6 py-3 text-sm font-semibold text-ink-primary mb-10"
        >
          Visit {listing.name}
          <ExternalLink size={14} />
        </a>

        {socialLinks.length > 0 && (
          <p className="text-xs text-ink-muted -mt-6 mb-10 flex items-center gap-3 flex-wrap">
            <span>Follow {listing.name}:</span>
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
            <div className="grid sm:grid-cols-2 gap-4">
              {listing.screenshot_paths.map((path) => (
                <Image
                  key={path}
                  src={publicImageUrl(path)}
                  alt={`${listing.name} screenshot`}
                  width={800}
                  height={500}
                  className="w-full rounded-xl border border-white/[0.08]"
                />
              ))}
            </div>
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
          <Link href="/tools" className="underline underline-offset-2 hover:text-ink-secondary">
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
