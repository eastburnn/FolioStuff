import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin-gate";
import {
  adminNewSubmissionEmail,
  approvedEmail,
  directMessageEmail,
  rejectedEmail,
} from "@/lib/email-templates";
import { SAMPLE_DIRECT_MESSAGE } from "@/lib/email-samples";
import { senderOptions } from "@/lib/email";
import AdminComposeForm, { type Recipient } from "@/components/directory/AdminComposeForm";
import { sendTestEmail } from "../actions";

export const metadata: Metadata = {
  title: "Emails",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TEMPLATES = [
  { key: "message", label: "Direct message (to a user)" },
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
    case "message":
      return directMessageEmail(SAMPLE_DIRECT_MESSAGE);
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
  const { admin } = ctx;

  // Everyone with an account, makers first, labeled with their listings.
  const [{ data: usersData }, { data: listingRows }, { data: profileRows }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("listings").select("owner_id, name"),
    admin.from("profiles").select("id, display_name"),
  ]);
  const listingsByOwner = new Map<string, string[]>();
  for (const row of (listingRows ?? []) as { owner_id: string; name: string }[]) {
    listingsByOwner.set(row.owner_id, [...(listingsByOwner.get(row.owner_id) ?? []), row.name]);
  }
  const displayNames = new Map(
    ((profileRows ?? []) as { id: string; display_name: string | null }[]).map((r) => [r.id, r.display_name])
  );
  const recipients: Recipient[] = (usersData?.users ?? [])
    .filter((u) => Boolean(u.email))
    .map((u) => {
      const listings = listingsByOwner.get(u.id) ?? [];
      const name = displayNames.get(u.id) ?? null;
      const who = name ? `${name} (${u.email})` : u.email!;
      return { email: u.email!, label: listings.length ? `${who} · ${listings.join(", ")}` : who, maker: listings.length > 0 };
    })
    .sort((a, b) => Number(b.maker) - Number(a.maker) || a.label.localeCompare(b.label))
    .map(({ email, label }) => ({ email, label }));

  const { template: rawTemplate, sent } = await searchParams;
  const template = TEMPLATES.some((t) => t.key === rawTemplate) ? rawTemplate! : "approved";
  const content = sampleFor(template);
  const sendAction = sendTestEmail.bind(null, template);

  return (
    <div className="max-w-3xl">

      <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
        Emails
      </h1>
      <p className="text-sm text-ink-secondary mb-8 max-w-xl">
        Write to a user directly, with the same branding as every other email the site sends.
      </p>

      <section className="rounded-2xl border border-white/[0.08] bg-bg-card p-5 sm:p-6 mb-12">
        <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-5">Send an email</h2>
        <AdminComposeForm recipients={recipients} senders={senderOptions()} />
      </section>

      <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-3">Templates</h2>
      <p className="text-sm text-ink-secondary mb-6 max-w-xl">
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
  );
}
