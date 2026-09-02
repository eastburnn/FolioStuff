import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/directory/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false },
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");

  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-sm mx-auto px-4 sm:px-6 pt-16 pb-24">
        <h1 className="text-2xl font-bold text-ink-primary tracking-tight mb-2">
          Choose a new password
        </h1>
        <p className="text-sm text-ink-secondary mb-8">
          Setting a new password for {user.email}.
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
