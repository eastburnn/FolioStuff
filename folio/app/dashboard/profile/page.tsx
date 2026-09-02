import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import ProfileForm from "@/components/directory/ProfileForm";
import DeleteAccountSection from "@/components/directory/DeleteAccountSection";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/profiles";
import { updateProfile, deleteOwnAccount } from "../actions";

export const metadata: Metadata = {
  title: "Your Profile",
  robots: { index: false },
};

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const { required } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/profile");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const profile = data as Profile | null;

  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Profile", href: "/dashboard/profile" },
          ]}
        />
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">Your profile</h1>
        <p className="text-sm text-ink-secondary mb-8 max-w-xl">
          A display name and username are required to submit a tool, and together they create
          your public maker page. Everything else here is optional.
          {profile?.username && (
            <>
              {" "}Yours is at{" "}
              <Link href={`/makers/${profile.username}`} className="text-ink-primary underline underline-offset-2">
                /makers/{profile.username}
              </Link>
              .
            </>
          )}
        </p>

        {required && (
          <div className="rounded-xl border border-accent-purple/40 bg-accent-purple/[0.08] p-4 mb-8 text-sm text-accent-purple">
            One step before you can submit: pick a display name and a username. That is all
            you need, the rest is optional.
          </div>
        )}
        <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-5 mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-ink-muted uppercase tracking-widest mb-1">Account email</p>
            <p className="text-sm text-ink-primary">{user.email}</p>
          </div>
          <p className="text-xs text-ink-muted max-w-[220px]">
            Used for login and submission updates. Never shown publicly.
          </p>
        </div>

        <ProfileForm
          action={updateProfile}
          profile={profile}
          hasAvatar={Boolean(profile?.avatar_path)}
          requiredFlow={Boolean(required)}
        />
        <DeleteAccountSection action={deleteOwnAccount} />
      </div>
    </div>
  );
}
