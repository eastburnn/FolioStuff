import { safeJsonLd } from "@/lib/json-ld";
const BASE_URL = "https://www.foliostuff.com";

interface ToolJsonLdProps {
  name: string;
  description: string;
  path: string;
}

export default function ToolJsonLd({ name, description, path }: ToolJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: `${BASE_URL}${path}`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    creator: {
      "@type": "Person",
      name: "Chris Ray",
      url: "https://www.itschrisray.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}
