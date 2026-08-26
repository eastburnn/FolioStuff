import { ChevronDown } from "lucide-react";

interface ToolInfoSection {
  heading: string;
  body: string[];
}

interface ToolInfoFaq {
  q: string;
  a: string;
}

interface ToolInfoProps {
  sections: ToolInfoSection[];
  faqs: ToolInfoFaq[];
  className?: string;
}

export default function ToolInfo({ sections, faqs, className = "max-w-3xl" }: ToolInfoProps) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <div className={`${className} mx-auto px-4 sm:px-6 pb-24`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {sections.map((section) => (
        <section key={section.heading} className="mb-12">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
            {section.heading}
          </h2>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
            {section.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-white/[0.06] bg-bg-card/60 hover:border-white/[0.12] transition-colors duration-200"
            >
              <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h3 className="text-sm font-semibold text-ink-primary">{faq.q}</h3>
                <ChevronDown
                  size={16}
                  className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="px-5 pb-5 text-sm text-ink-secondary leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
