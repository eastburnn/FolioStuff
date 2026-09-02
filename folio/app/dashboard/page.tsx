import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ListingRow } from "@/lib/listings";
import type { Profile } from "@/lib/profiles";
import Avatar from "@/components/directory/Avatar";
import Breadcrumb from "@/components/Breadcrumb";
import ConfirmButton from "@/components/directory/ConfirmButton";
import { deleteOwnListing } from "./actions";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

function statusFor(l: ListingRow): { label: string; className: string } {
  if (l.status === "pending" && l.is_published) {
    return {
      label: "Live · edit in review",
      className: "text-accent-gold border-accent-gold/30 bg-accent-gold/[0.08]",
    };
  }
  if (l.status === "pending") {
    return {
      label: "In review",
      className: "text-accent-gold border-accent-gold/30 bg-accent-gold/[0.08]",
    };
  }
  if (l.status === "rejected") {
    return {
      label: "Not approved",
      className: "text-red-400 border-red-400/30 bg-red-400/[0.08]",
    };
  }
  if (!l.is_published) {
    return {
      label: "Unpublished",
      className: "text-ink-muted border-white/[0.15] bg-white/[0.04]",
    };
  }
  return {
    label: "Live",
    className: "text-accent-green border-accent-green/30 bg-accent-green/[0.08]",
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; edited?: string; deleted?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { submitted, edited, deleted } = await searchParams;

  const [{ data }, { data: profileData }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);
  const listings = (data ?? []) as ListingRow[];
  const profile = profileData as Profile | null;

  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }]} />
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-3xl font-bold text-ink-primary tracking-tight">Dashboard</h1>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-xs text-ink-muted hover:text-ink-secondary transition-colors">
              Log out
            </button>
          </form>
        </div>
        <p className="text-sm text-ink-secondary mb-8">
          Signed in as {user.email}. Edits to a live listing go back through review, and the
          current version stays live in the meantime.
        </p>

        {submitted && (
          <div className="rounded-xl border border-accent-green/30 bg-accent-green/[0.08] p-4 mb-8 text-sm text-accent-green">
            Submission received. It is now in the review queue, and you will hear back by email.
          </div>
        )}
        {edited && (
          <div className="rounded-xl border border-accent-green/30 bg-accent-green/[0.08] p-4 mb-8 text-sm text-accent-green">
            Changes received. Your current version stays live while the new one is reviewed, and
            you will hear back by email.
          </div>
        )}
        {deleted && (
          <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-4 mb-8 text-sm text-ink-secondary">
            Listing deleted.
          </div>
        )}

        {/* Profile card */}
        <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-5 mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar userId={user.id} avatarPath={profile?.avatar_path ?? null} size={44} alt="" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-primary truncate">
                {profile?.display_name || "Your profile"}
              </p>
              <p className="text-xs text-ink-muted truncate">
                {profile?.username
                  ? `Public page: /makers/${profile.username}`
                  : "Add a name, photo, bio, and links"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs">
            {profile?.username && (
              <Link href={`/makers/${profile.username}`} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
                View
              </Link>
            )}
            <Link
              href="/dashboard/profile"
              className="rounded-lg border border-white/[0.12] px-3 py-1.5 font-medium text-ink-secondary hover:text-ink-primary hover:border-white/[0.2] transition-colors"
            >
              Edit profile
            </Link>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-8 text-center">
            <p className="text-sm text-ink-secondary mb-4">You have no submissions yet.</p>
            <Link
              href="/submit"
              className="inline-block rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] transition-colors px-5 py-2.5 text-sm font-semibold text-accent-purple"
            >
              Submit your tool
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((l) => {
              const status = statusFor(l);
              return (
                <div key={l.id} className="rounded-2xl border border-white/[0.06] bg-bg-card p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-ink-primary">{l.name}</p>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mb-3">{l.tagline}</p>

                  <div className="flex items-center gap-4 text-xs">
                    <Link href={`/dashboard/edit/${l.id}`} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
                      Edit
                    </Link>
                    {l.is_published && (
                      <Link href={`/tools/${l.slug}`} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
                        View live listing
                      </Link>
                    )}
                    <form action={deleteOwnListing.bind(null, l.id)} className="ml-auto">
                      <ConfirmButton
                        message={`Delete "${l.name}"? This removes it permanently, including from the live directory. This cannot be undone.`}
                        className="text-ink-muted hover:text-red-400 transition-colors"
                      >
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              );
            })}
            <Link
              href="/submit"
              className="inline-block text-xs text-ink-muted hover:text-ink-secondary transition-colors pt-2"
            >
              Submit another tool
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
