import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import ListingForm from "@/components/directory/ListingForm";
import { createClient } from "@/lib/supabase/server";
import { createListing } from "./actions";

export const metadata: Metadata = {
  title: "Submit Your Tool",
  description:
    "Submit your stock market, investing, or finance tool to the FolioStuff directory. Free listing with a backlink and dedicated page for indie builders.",
  alternates: { canonical: "/submit" },
};

const GUIDELINES = [
  "Built by an indie developer, a small team, or a regular person, not a large company.",
  "Related to stocks, investing, trading, or personal finance.",
  "Actually working and publicly accessible. Landing pages for unlaunched products get rejected.",
  "Free or paid is fine. Scams, pump groups, and signal sellers are not.",
  "No online gambling or betting sites.",
];

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/submit");

  // Submitting requires a maker identity: display name and username.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.username || !profile?.display_name) {
    redirect("/dashboard/profile?required=1");
  }

  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb items={[{ label: "Submit Your Tool", href: "/submit" }]} />

        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">
          Submit your tool
        </h1>
        <p className="text-ink-secondary leading-relaxed mb-8 max-w-xl">
          Get your project in front of traders and investors. Approved tools get their own card
          in the directory, a dedicated page, and a link back to your site. Every submission is
          reviewed by hand before it goes live.
        </p>

        <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 mb-10">
          <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
            What gets approved
          </h2>
          <ul className="space-y-2 text-sm text-ink-secondary leading-relaxed list-disc pl-4">
            {GUIDELINES.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>

        <ListingForm action={createListing} submitLabel="Submit for review" />
      </div>
    </div>
  );
}
