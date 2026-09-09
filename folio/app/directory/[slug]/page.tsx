import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { getPublishedListing, getListingOwnerId } from "@/lib/listings";
import { getProfileById } from "@/lib/profiles";
import { publicImageUrl } from "@/lib/supabase/config";
import { safeJsonLd } from "@/lib/json-ld";
import ListingDetail from "@/components/directory/ListingDetail";

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

        <ListingDetail
          listing={{
            slug,
            name: listing.name,
            url: listing.url,
            tagline: listing.tagline,
            description: listing.description,
            tags: listing.tags,
            socials: listing.socials,
            maker_name: listing.maker_name,
            maker_x_handle: listing.maker_x_handle,
            iconSrc: listing.icon_path ? publicImageUrl(listing.icon_path) : null,
            screenshots: listing.screenshot_paths.map((path) => publicImageUrl(path)),
          }}
          makerPageUrl={makerPageUrl}
        />
      </div>
    </div>
  );
}
