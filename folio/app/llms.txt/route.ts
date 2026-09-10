import { OWN_TOOLS } from "@/components/OwnTools";
import { getPublishedListings } from "@/lib/listings";
import { tagLabel } from "@/lib/tags";

const BASE_URL = "https://www.foliostuff.com";

// /llms.txt: a Markdown summary of the site for AI assistants, following the
// llmstxt.org convention. Generated from the same data as the pages, so new
// tools appear on deploy and directory changes appear through the same
// revalidation the sitemap uses. Cached for an hour otherwise.
export const revalidate = 3600;

export async function GET() {
  const listings = await getPublishedListings();

  const tools = OWN_TOOLS.map(
    (t) => `- [${t.title}](${BASE_URL}${t.href}): ${t.description} Category: ${t.tag}.`
  );

  const directory = listings.map((l) => {
    const tags = l.tags.length ? ` Tags: ${l.tags.map(tagLabel).join(", ")}.` : "";
    return `- [${l.name}](${BASE_URL}/directory/${l.slug}): ${l.tagline} By ${l.maker_name}.${tags}`;
  });

  const body = `# FolioStuff

> Useful tools for managing your money: browser-based calculators and visualizers for investors and traders, plus a hand-reviewed Community Directory of investing and personal finance sites built by the people who made them.

FolioStuff (${BASE_URL}) has two halves. The tools are built in-house, run entirely in the browser, and need no account; the numbers a visitor types never leave their device. The Community Directory lists stock market, investing, and personal finance sites submitted by their makers and reviewed by hand before they appear, each with its own page, screenshots, tags, and a link to the site. Visitors with a free account can bookmark any tool or listing. Nothing on the site is financial advice.

## Tools

${tools.join("\n")}

All tools: ${BASE_URL}/tools

## Community Directory

- [Browse the directory](${BASE_URL}/directory): Every listing, searchable by name, tag, or maker.
${directory.join("\n")}

## Site

- [About](${BASE_URL}/about): What FolioStuff is, who built it, and how the directory is reviewed.
- [Contact](${BASE_URL}/contact): Feature ideas, bug reports, feedback, and questions about listing a site.
- [Submit a site](${BASE_URL}/submit): Makers can list their own finance site. A free account is required.
- [Privacy Policy](${BASE_URL}/privacy)
- [Terms of Service](${BASE_URL}/terms)

## Optional

- [Sitemap](${BASE_URL}/sitemap.xml): Every public page with last-modified dates.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
