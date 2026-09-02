import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import ListingCard from "@/components/directory/ListingCard";
import Avatar from "@/components/directory/Avatar";
import { getProfileByUsername, avatarUrl } from "@/lib/profiles";
import { getPublishedListingsByOwner } from "@/lib/listings";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Not Found" };

  const name = profile.display_name || profile.username || "Maker";
  return {
    title: `${name} - Maker Profile`,
    description:
      profile.bio ?? `Tools built by ${name}, listed in the FolioStuff indie tool directory.`,
    alternates: { canonical: `/makers/${username}` },
    openGraph: {
      title: `${name} | FolioStuff Makers`,
      description:
        profile.bio ?? `Tools built by ${name}, listed in the FolioStuff indie tool directory.`,
      url: `/makers/${username}`,
      siteName: "FolioStuff",
      type: "profile",
      images: profile.avatar_path
        ? [{ url: avatarUrl(profile.avatar_path) }]
        : [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function MakerPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const listings = await getPublishedListingsByOwner(profile.id);
  const name = profile.display_name || profile.username || "Maker";

  const socials = [
    profile.website_url && {
      label: profile.website_url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href: profile.website_url,
    },
    profile.x_handle && { label: `@${profile.x_handle}`, href: `https://x.com/${profile.x_handle}` },
    profile.bluesky_handle && { label: profile.bluesky_handle, href: `https://bsky.app/profile/${profile.bluesky_handle}` },
    profile.threads_handle && { label: `Threads @${profile.threads_handle}`, href: `https://www.threads.net/@${profile.threads_handle}` },
    profile.linkedin_url && { label: "LinkedIn", href: profile.linkedin_url },
    profile.facebook_url && { label: "Facebook", href: profile.facebook_url },
  ].filter((s): s is { label: string; href: string } => Boolean(s));

  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb
          items={[
            { label: "Directory", href: "/tools" },
            { label: name, href: `/makers/${username}` },
          ]}
        />

        <div className="flex items-start gap-5 mb-10">
          <Avatar userId={profile.id} avatarPath={profile.avatar_path} size={80} alt={name} />
          <div className="min-w-0 pt-1">
            <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-1">{name}</h1>
            {profile.bio && (
              <p className="text-sm text-ink-secondary leading-relaxed max-w-xl whitespace-pre-line">
                {profile.bio}
              </p>
            )}
            {socials.length > 0 && (
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {socials.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-xs text-ink-secondary hover:text-ink-primary underline underline-offset-2"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <section>
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-5">
            Tools in the directory ({listings.length})
          </h2>
          {listings.length === 0 ? (
            <p className="text-sm text-ink-muted">No live listings yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.slug} listing={listing} />
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-ink-muted mt-12">
          Part of the{" "}
          <Link href="/tools" className="underline underline-offset-2 hover:text-ink-secondary">
            FolioStuff indie tool directory
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
