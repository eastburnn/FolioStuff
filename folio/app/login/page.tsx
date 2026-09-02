import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/directory/AuthForm";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-sm mx-auto px-4 sm:px-6 pt-16 pb-24">
        <h1 className="text-2xl font-bold text-ink-primary tracking-tight mb-2">Log in</h1>
        <p className="text-sm text-ink-secondary mb-8">
          Manage your directory submissions and listings.
        </p>
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
