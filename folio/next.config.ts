import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  async redirects() {
    return [
      {
        source: "/ticker-bar",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
