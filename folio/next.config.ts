import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  poweredByHeader: false,
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
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://project.supabase.co").hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Baseline hardening on every response. The Content Security Policy is set
  // per request in middleware.ts (it carries a nonce); it must not be set
  // here, because on Vercel a header configured here also reaches the render
  // as a request header and would shadow the one Next.js reads the nonce from.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/ticker-bar",
        destination: "/",
        permanent: true,
      },
      { source: "/tools/:slug", destination: "/directory/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
