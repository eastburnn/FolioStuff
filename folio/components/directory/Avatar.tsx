import Image from "next/image";
import { avatarUrl } from "@/lib/profiles";

// The hero wordmark's hover palette.
const PALETTE = [
  "#A78BFA",
  "#00C896",
  "#FFB830",
  "#3B82F6",
  "#EC4899",
  "#F97316",
  "#06B6D4",
  "#8B5CF6",
  "#FF4B5C",
];

// Deterministic pick per user: looks random, never changes between visits.
function colorFor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  userId: string;
  avatarPath: string | null;
  size: number;
  alt: string;
}

export default function Avatar({ userId, avatarPath, size, alt }: AvatarProps) {
  if (avatarPath) {
    return (
      <div
        className="rounded-full overflow-hidden bg-white/[0.06] shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={avatarUrl(avatarPath)}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={alt}
      className="rounded-full shrink-0"
      style={{ width: size, height: size, background: colorFor(userId) }}
    />
  );
}
