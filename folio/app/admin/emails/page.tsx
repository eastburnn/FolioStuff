import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin-gate";
import {
  adminNewSubmissionEmail,
  approvedEmail,
  rejectedEmail,
} from "@/lib/email-templates";
import AdminNav from "@/components/directory/AdminNav";
import { sendTestEmail } from "../actions";

export const metadata: Metadata = {
  title: "Email Templates",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TEMPLATES = [
  { key: "admin", label: "New submission (to you)" },
  { key: "admin-edit", label: "Edit awaiting re-approval (to you)" },
  { key: "approved", label: "Approved (to maker)" },
  { key: "approved-edit", label: "Edit approved (to maker)" },
  { key: "rejected", label: "Rejected (to maker)" },
  { key: "rejected-edit", label: "Edit rejected (to maker)" },
];

const SAMPLE_FEEDBACK =
  "The screenshots are too low resolution to see what the tool does. Mind re-uploading sharper ones?";

function sampleFor(key: string) {
  switch (key) {
    case "approved":
      return approvedEmail("DivRadar", "divradar");
    case "approved-edit":
      return approvedEmail("DivRadar", "divradar", true);
    case "rejected":
      return rejectedEmail("DivRadar", SAMPLE_FEEDBACK);
    case "rejected-edit":
      return rejectedEmail("DivRadar", SAMPLE_FEEDBACK, true);
    case "admin-edit":
      return adminNewSubmissionEmail("DivRadar", true);
    default:
      return adminNewSubmissionEmail("DivRadar");
  }
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; sent?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/emails");

  const ctx = await getAdminContext();
  if (!ctx) notFound();

  const { template: rawTemplate, sent } = await searchParams;
  const template = TEMPLATES.some((t) => t.key === rawTemplate) ? rawTemplate! : "approved";
  const content = sampleFor(template);
  const sendAction = sendTestEmail.bind(null, template);

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <AdminNav current="/admin/emails" />

        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
          Email templates
        </h1>
        <p className="text-sm text-ink-secondary mb-8 max-w-xl">
          Previews use sample data. Edit the designs in{" "}
          <span className="font-mono text-xs text-ink-primary">lib/email-templates.ts</span>{" "}
          and refresh to see changes.
        </p>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {TEMPLATES.map((t) => (
            <Link
              key={t.key}
              href={`/admin/emails?template=${t.key}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                template === t.key
                  ? "bg-accent-purple/[0.15] border-accent-purple/40 text-accent-purple"
                  : "border-white/[0.1] text-ink-secondary hover:text-ink-primary hover:border-white/[0.2]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.08] overflow-hidden mb-6 bg-white">
          <div className="px-4 py-2.5 bg-bg-card border-b border-white/[0.08] text-xs text-ink-muted">
            Subject: <span className="text-ink-secondary">{content.subject}</span>
          </div>
          <iframe
            title="Email preview"
            srcDoc={content.html}
            sandbox=""
            className="w-full block"
            style={{ height: 640, border: 0, background: "#F4F5F7" }}
          />
        </div>

        <div className="flex items-center gap-4">
          <form action={sendAction}>
            <button
              type="submit"
              className="rounded-xl bg-white/[0.09] border border-white/[0.12] hover:bg-white/[0.14] transition-colors px-5 py-2.5 text-sm font-semibold text-ink-primary"
            >
              Send test to my inbox
            </button>
          </form>
          {sent && <p className="text-sm text-accent-green">Sent to {user.email}.</p>}
        </div>
      </div>
    </div>
  );
}
