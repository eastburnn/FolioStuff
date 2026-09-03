import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  experimental: {
    serverActions: {
      // Image uploads arrive through server actions as multipart bodies.
      // Next's default cap is 1MB, which a single photo can exceed. Vercel
      // rejects function request bodies above 4.5MB, so this stays under it.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/ticker-bar",
        destination: "/",
        permanent: true,
      },
      { source: "/tools", destination: "/directory", permanent: true },
      { source: "/tools/:slug", destination: "/directory/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
