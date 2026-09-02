import Link from "next/link";
import Image from "next/image";
import type { PublishedListing } from "@/lib/listings";
import { publicImageUrl } from "@/lib/supabase/config";

export default function ListingCard({ listing }: { listing: PublishedListing }) {
  return (
    <Link
      href={`/directory/${listing.slug}`}
      className="group flex items-start gap-4 p-5 rounded-2xl border border-white/[0.07] bg-bg-card hover:border-white/[0.16] transition-all duration-300 hover:-translate-y-1"
    >
      <div className="w-11 h-11 rounded-xl shrink-0 overflow-hidden bg-white/[0.06]">
        {listing.icon_path && (
          <Image
            src={publicImageUrl(listing.icon_path)}
            alt={listing.name}
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-primary group-hover:text-white transition-colors">
          {listing.name}
        </p>
        <p className="text-xs text-ink-secondary leading-relaxed mt-1">{listing.tagline}</p>
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
          {listing.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-muted"
            >
              {tag}
            </span>
          ))}
          <span className="text-[11px] text-ink-muted ml-auto">by {listing.maker_name}</span>
        </div>
      </div>
    </Link>
  );
}
