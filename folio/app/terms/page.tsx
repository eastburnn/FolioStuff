import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using FolioStuff's free tools and submitting to the indie tool directory.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | FolioStuff",
    description:
      "The terms for using FolioStuff's free tools and submitting to the indie tool directory.",
    url: "/terms",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

const SECTIONS = [
  {
    heading: "Agreeing to these terms",
    paragraphs: [
      "By using FolioStuff, you agree to these terms and to our Privacy Policy. Creating an account or submitting a tool to the directory is an explicit agreement to both. If you do not agree with them, please do not use the site. We may update these terms from time to time, and the date at the bottom shows the latest revision. Continuing to use the site after a change means you accept the updated terms.",
    ],
  },
  {
    heading: "Not financial advice",
    paragraphs: [
      "FolioStuff provides calculators, visualizers, and a directory of third party tools for informational and educational purposes only. Nothing on this site is financial, investment, tax, or legal advice, and nothing here is a recommendation to buy or sell any security. The math our tools produce is only as good as the numbers you type in. Always do your own research, and talk to a licensed professional before making financial decisions.",
    ],
  },
  {
    heading: "Accounts",
    paragraphs: [
      "You need an account to submit a tool to the directory and manage your listing. You must be at least 18 years old to create one. You are responsible for keeping your login credentials secure and for everything that happens under your account. You must provide accurate information. Sessions end automatically after 24 hours without a visit. We may suspend or delete accounts that violate these terms, abuse the service, or submit spam.",
      "To submit a tool you must set a display name and a username. Both are public: they appear on your listings and on your maker page at /makers/your-username, along with any bio, picture, website, or social links you choose to add. Your email address is never shown publicly.",
    ],
  },
  {
    heading: "Directory submissions",
    paragraphs: [
      "When you submit a tool to the directory, you confirm that you have the right to share everything you upload, including names, descriptions, logos, and screenshots, and that your submission is accurate and not misleading. You grant FolioStuff a non-exclusive, royalty-free license to display, reproduce, resize, crop, re-encode, and distribute that content on the site and in promotion of the site, for as long as the listing exists. You keep ownership of your content.",
      "The directory is for stock market, investing, and finance tools built by independent makers. Submit only tools you built or represent, with a working public website. We do not list online gambling or betting sites, paid signal or tip services, get rich quick schemes, or anything that misleads users about risk or returns.",
      "Every submission is reviewed by hand. We may approve, reject, edit for clarity, pause, feature, or remove any listing at any time, at our sole discretion, with or without explanation. A paused listing is hidden from the site and from search engines but kept in your dashboard; a featured listing is shown more prominently, for example on the homepage. That includes removing a listing after it has gone live, and deleting an account along with its listings. A listing is free and does not create any partnership, endorsement, or obligation. We make no guarantees about traffic, placement, ranking, or how long a listing stays live.",
      "You can edit or permanently delete your own submissions at any time from your dashboard. Edits to a live listing go back through review: the current version stays live until the new one is approved, and if the changes are not approved the current version stays as it is. Deleting a listing removes it from the live directory and deletes its content and images. Rejected submissions and rejected edits are not stored; feedback is sent to you by email.",
    ],
  },
  {
    heading: "Notifications",
    paragraphs: [
      "By creating an account you agree to receive transactional email about it: account confirmation, password resets, and updates about your submissions such as approval, feedback, or removal. We do not send marketing email.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: [
      "Do not use the site to submit scams, pump and dump schemes, paid signal groups, malware, or anything illegal. Do not attempt to break, overload, scrape at abusive rates, or gain unauthorized access to the site or other people's accounts. Do not upload content that infringes someone else's intellectual property or privacy.",
    ],
  },
  {
    heading: "Third party sites and affiliate links",
    paragraphs: [
      "The directory and other parts of the site link to third party websites we do not control and are not responsible for. Directory listings are provided by their makers, and a listing here is not an endorsement or a guarantee of quality, safety, or accuracy. Some outbound links are affiliate links, meaning we may earn a commission if you sign up through them at no extra cost to you.",
    ],
  },
  {
    heading: "Disclaimer and limitation of liability",
    paragraphs: [
      "FolioStuff is provided as is and as available, without warranties of any kind, express or implied. To the maximum extent permitted by law, FolioStuff and its creator are not liable for any indirect, incidental, or consequential damages, or for any losses arising from your use of the site, its tools, or any third party site linked from it, including trading or investment losses.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb items={[{ label: "Terms of Service", href: "/terms" }]} />

        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
          Terms of Service
        </h1>
        <p className="text-ink-secondary leading-relaxed mb-12 max-w-2xl">
          The short version: the tools are free, use them at your own risk, nothing here is
          financial advice, and if you submit to the directory, be honest and own what you upload.
        </p>

        {SECTIONS.map((section) => (
          <section key={section.heading} className="mb-10">
            <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
              {section.heading}
            </h2>
            <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">Contact</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 text-sm text-ink-secondary leading-relaxed">
            <p>
              Questions about these terms? Reach out on{" "}
              <a
                href="https://x.com/itschrisray"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-primary hover:text-white transition-colors underline underline-offset-2"
              >
                X&nbsp;(@itschrisray)
              </a>
              .
            </p>
          </div>
        </section>

        <p className="text-xs text-ink-muted mt-10">Last updated: September 3, 2026</p>
      </div>
    </div>
  );
}
