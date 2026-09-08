import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import ContactForm from "@/components/directory/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send FolioStuff a feature idea, a bug report, feedback, or a question about listing your tool.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | FolioStuff",
    description: "Send FolioStuff a feature idea, a bug report, feedback, or a question about listing your tool.",
    url: "/contact",
    siteName: "FolioStuff",
    type: "website",
    images: [{ url: "/foliostuff-thumbnail.jpg", width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb items={[{ label: "Contact", href: "/contact" }]} />
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">Contact</h1>
        <p className="text-ink-secondary leading-relaxed mb-10 max-w-xl">
          Ideas for tools, bugs you hit, feedback, or questions about listing something in the
          directory: it all goes straight to the person who runs the site.
        </p>
        <ContactForm />
      </div>
    </div>
  );
}
