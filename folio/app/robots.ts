import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or account-only routes; nothing here is worth indexing.
      disallow: ["/admin", "/dashboard", "/auth/", "/login", "/signup", "/forgot-password", "/reset-password", "/submit"],
    },
    sitemap: "https://www.foliostuff.com/sitemap.xml",
  };
}
