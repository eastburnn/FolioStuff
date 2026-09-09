import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/profiles";
import Avatar from "./Avatar";
import Breadcrumb from "@/components/Breadcrumb";
import DashboardTabs from "./DashboardTabs";

interface DashboardShellProps {
  user: User;
  profile: Profile | null;
  isAdmin: boolean;
  // A maker page is public only once a submission has been approved.
  hasPublishedListing: boolean;
  children: React.ReactNode;
}

// Shared frame for the dashboard tabs: title, sign out, the profile card
// with its edit link, then the Saved / Maker / Admin tabs.
export default function DashboardShell({ user, profile, isAdmin, hasPublishedListing, children }: DashboardShellProps) {
  const pageLive = Boolean(profile?.username) && hasPublishedListing;
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
        <p className="text-sm text-ink-secondary mb-6">Signed in as {user.email}.</p>

        {/* Profile card */}
        <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-5 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar userId={user.id} avatarPath={profile?.avatar_path ?? null} size={44} alt="" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-primary truncate">
                  {profile?.display_name || "Your profile"}
                </p>
                <p className="text-xs text-ink-muted truncate">
                  {pageLive
                    ? `Public page: /makers/${profile!.username}`
                    : profile?.username
                    ? `Maker page reserved at /makers/${profile.username}`
                    : "Add a name, photo, bio, and links"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs">
              {pageLive && (
                <Link href={`/makers/${profile!.username}`} className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
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
          {!pageLive && (
            <p className="text-[11px] text-ink-muted mt-3 pt-3 border-t border-white/[0.05]">
              Your public maker page only appears once a site you submit is approved for the directory.
            </p>
          )}
        </div>

        <DashboardTabs isAdmin={isAdmin} />
        {children}
      </div>
    </div>
  );
}
