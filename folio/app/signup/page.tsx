import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/directory/AuthForm";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-sm mx-auto px-4 sm:px-6 pt-16 pb-24">
        <h1 className="text-2xl font-bold text-ink-primary tracking-tight mb-2">Create an account</h1>
        <p className="text-sm text-ink-secondary mb-8">
          An account lets you submit a tool to the directory and manage your listing.
        </p>
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
