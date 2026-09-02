import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { PublishedListing } from "@/lib/listings";
import { publicImageUrl } from "@/lib/supabase/config";

// Larger, glowing variant of the directory card for tools the admin features
// on the homepage. The tool keeps its normal card in the directory too.
export default function FeaturedListingCard({ listing }: { listing: PublishedListing }) {
  return (
    <Link
      href={`/directory/${listing.slug}`}
      className="group relative flex items-start gap-5 p-6 rounded-2xl border border-accent-purple/40 bg-bg-card hover:border-accent-purple/70 hover:shadow-[0_0_40px_rgba(139,92,246,0.18)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{ background: "radial-gradient(circle at 0% 0%, rgba(139,92,246,0.14), transparent 60%)" }}
      />
      <div className="relative w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-white/[0.06]">
        {listing.icon_path && (
          <Image
            src={publicImageUrl(listing.icon_path)}
            alt={listing.name}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="relative min-w-0 flex flex-col">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-semibold text-ink-primary group-hover:text-white transition-colors">
            {listing.name}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-accent-purple/40 bg-accent-purple/[0.12] text-accent-purple">
            <Star size={10} />
            Featured
          </span>
        </div>
        <p className="text-sm text-ink-secondary leading-relaxed mt-1.5">{listing.tagline}</p>
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          {listing.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-muted">
              {tag}
            </span>
          ))}
          <span className="text-[11px] text-ink-muted ml-auto">by {listing.maker_name}</span>
        </div>
      </div>
    </Link>
  );
}
